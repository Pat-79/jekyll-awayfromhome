(function () {
  var ytApiReady = false;
  var ytApiLoading = false;
  var ytApiCallbacks = [];

  function parseBoolean(value) {
    var normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return null;
    if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') return false;
    return null;
  }

  function loadScriptOnce(src, onDone) {
    var existing = document.querySelector('script[data-dynamic-src="' + src + '"]');

    if (existing) {
      if (existing.dataset.loaded === 'true') {
        onDone(true);
      } else {
        existing.addEventListener('load', function () {
          onDone(true);
        }, { once: true });
        existing.addEventListener('error', function () {
          onDone(false);
        }, { once: true });
      }
      return;
    }

    var script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.dataset.dynamicSrc = src;
    script.addEventListener('load', function () {
      script.dataset.loaded = 'true';
      onDone(true);
    }, { once: true });
    script.addEventListener('error', function () {
      onDone(false);
    }, { once: true });
    document.head.appendChild(script);
  }

  function safeAutoplay(video) {
    if (!video || typeof video.play !== 'function') {
      return;
    }

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        // Ignore autoplay rejections. The controls remain available.
      });
    }
  }

  function flushYouTubeApiCallbacks(available) {
    var callbacks = ytApiCallbacks.slice();
    ytApiCallbacks = [];
    callbacks.forEach(function (callback) {
      callback(available);
    });
  }

  function loadYouTubeApiOnce(onDone) {
    if (window.YT && typeof window.YT.Player === 'function') {
      ytApiReady = true;
      onDone(true);
      return;
    }

    ytApiCallbacks.push(onDone);
    if (ytApiLoading) {
      return;
    }

    ytApiLoading = true;

    var previousReadyHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof previousReadyHandler === 'function') {
        previousReadyHandler();
      }
      ytApiReady = true;
      ytApiLoading = false;
      flushYouTubeApiCallbacks(true);
    };

    loadScriptOnce('https://www.youtube.com/iframe_api', function (loaded) {
      if (!loaded) {
        ytApiLoading = false;
        flushYouTubeApiCallbacks(false);
        return;
      }

      // Fallback for cases where YT API is already available before callback wiring.
      if (!ytApiReady && window.YT && typeof window.YT.Player === 'function') {
        ytApiReady = true;
        ytApiLoading = false;
        flushYouTubeApiCallbacks(true);
      }
    });
  }

  function initViewportPauseResume(video) {
    if (!video || typeof window.IntersectionObserver !== 'function') {
      return;
    }

    var pausedByScript = false;
    var pausingByScript = false;

    var observer = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.target !== video) {
          return;
        }

        if (!entry.isIntersecting) {
          // Only mark as script-paused when the script actually paused playback.
          if (!video.paused) {
            pausedByScript = true;
            pausingByScript = true;
            video.pause();
          }
          return;
        }

        // Resume only if this script paused the video earlier.
        if (!pausedByScript) {
          return;
        }

        pausedByScript = false;
        safeAutoplay(video);
      });
    }, {
      threshold: 0
    });

    observer.observe(video);

    video.addEventListener('pause', function () {
      if (pausingByScript) {
        pausingByScript = false;
        return;
      }

      // If the user pauses manually, never auto-resume on re-entry.
      if (!video.ended && video.currentTime > 0) {
        pausedByScript = false;
      }
    });

    video.addEventListener('ended', function () {
      pausedByScript = false;
    });
  }

  function initHlsVideo(video) {
    var hlsSource = video.getAttribute('data-video-hls-src');
    if (!hlsSource) {
      return;
    }

    var shouldAutoplay = parseBoolean(video.getAttribute('data-video-autoplay')) === true;

    initViewportPauseResume(video);

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsSource;
      video.load();
      if (shouldAutoplay) {
        video.addEventListener('loadedmetadata', function () {
          safeAutoplay(video);
        }, { once: true });
      }
      return;
    }

    loadScriptOnce('https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js', function (loaded) {
      if (!loaded || !window.Hls || !window.Hls.isSupported()) {
        return;
      }

      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });

      hls.loadSource(hlsSource);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        if (shouldAutoplay) {
          safeAutoplay(video);
        }
      });

      hls.on(window.Hls.Events.ERROR, function (_event, data) {
        if (!data || !data.fatal) {
          return;
        }

        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          return;
        }

        if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }

        hls.destroy();
      });
    });
  }

  function initYouTubeVideo(iframe) {
    if (!iframe || typeof window.IntersectionObserver !== 'function') {
      return;
    }

    loadYouTubeApiOnce(function (available) {
      if (!available || !window.YT || typeof window.YT.Player !== 'function') {
        return;
      }

      var pausedByScript = false;
      var pausingByScript = false;
      var playerReady = false;

      var player = new window.YT.Player(iframe, {
        events: {
          onReady: function () {
            playerReady = true;
          },
          onStateChange: function (event) {
            if (!window.YT || !window.YT.PlayerState) {
              return;
            }

            if (event.data === window.YT.PlayerState.PAUSED) {
              if (pausingByScript) {
                pausingByScript = false;
                return;
              }
              // User paused manually: do not auto-resume on viewport re-entry.
              pausedByScript = false;
              return;
            }

            if (event.data === window.YT.PlayerState.ENDED) {
              pausedByScript = false;
            }
          }
        }
      });

      var observer = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target !== iframe || !playerReady || !window.YT || !window.YT.PlayerState) {
            return;
          }

          var state;
          try {
            state = player.getPlayerState();
          } catch (_error) {
            return;
          }

          if (!entry.isIntersecting) {
            if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING) {
              pausedByScript = true;
              pausingByScript = true;
              player.pauseVideo();
            }
            return;
          }

          if (!pausedByScript) {
            return;
          }

          pausedByScript = false;
          player.playVideo();
        });
      }, {
        threshold: 0
      });

      observer.observe(iframe);
    });
  }

  function initAllVideoWidgets() {
    document.querySelectorAll('[data-video-provider="hls"][data-video-hls-src]').forEach(initHlsVideo);
    document.querySelectorAll('iframe[data-video-provider="youtube"]').forEach(initYouTubeVideo);
  }

  initAllVideoWidgets();
}());