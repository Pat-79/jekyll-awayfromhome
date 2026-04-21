(function () {
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

  function initHlsVideo(video) {
    var hlsSource = video.getAttribute('data-video-hls-src');
    if (!hlsSource) {
      return;
    }

    var shouldAutoplay = parseBoolean(video.getAttribute('data-video-autoplay')) === true;

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

  function initAllVideoWidgets() {
    document.querySelectorAll('[data-video-provider="hls"][data-video-hls-src]').forEach(initHlsVideo);
  }

  initAllVideoWidgets();
}());