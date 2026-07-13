(function () {
  var body = document.body;
  var landing = document.querySelector("[data-home-landing]");
  var landingTarget = document.querySelector("[data-home-main]");
  var homeContentTarget = document.querySelector("[data-home-content]");
  var searchBarTarget = document.querySelector("[data-home-scroll-target]");
  var scrollHint = document.querySelector("[data-home-scroll]");
  var hlsVideo = document.querySelector("[data-hls-video]");
  var touchStartY = null;
  var isSnapping = false;

  function safeAutoplay(video) {
    if (!video || typeof video.play !== "function") {
      return;
    }

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        // Ignore autoplay rejections; the static poster remains visible.
      });
    }
  }

  function loadScriptOnce(src, onDone) {
    var existing = document.querySelector('script[data-dynamic-src="' + src + '"]');

    if (existing) {
      if (existing.dataset.loaded === "true") {
        onDone(true);
      } else {
        existing.addEventListener("load", function () {
          onDone(true);
        }, { once: true });
        existing.addEventListener("error", function () {
          onDone(false);
        }, { once: true });
      }
      return;
    }

    var script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset.dynamicSrc = src;
    script.addEventListener("load", function () {
      script.dataset.loaded = "true";
      onDone(true);
    }, { once: true });
    script.addEventListener("error", function () {
      onDone(false);
    }, { once: true });
    document.head.appendChild(script);
  }

  function randomiseStart(video) {
    var duration = video.duration;
    if (duration && isFinite(duration) && duration > 0) {
      video.currentTime = Math.random() * duration;
    }
  }

  function loadLandingChapters() {
    return fetch('/assets/data/home-landing-chapters.json', { cache: 'no-cache' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Failed to load chapter data');
        }
        return response.json();
      })
      .then(function (rows) {
        if (!Array.isArray(rows)) {
          return [];
        }

        return rows
          .map(function (row) {
            return {
              start:  Number(row && row.start),
              weight: Math.max(0, Number((row && row.weight) || 1)),
            };
          })
          .filter(function (item) {
            return isFinite(item.start) && item.start >= 0;
          });
      })
      .catch(function () {
        return [];
      });
  }

  function randomiseStartByChapter(video, chapters) {
    var duration = video.duration;
    if (!(duration && isFinite(duration) && duration > 0)) {
      return;
    }

    var minTailSeconds = 4;
    var valid = (chapters || []).filter(function (c) {
      return c.start < (duration - minTailSeconds) && c.weight > 0;
    });

    if (!valid.length) {
      randomiseStart(video);
      return;
    }

    var totalWeight = valid.reduce(function (sum, c) { return sum + c.weight; }, 0);
    var roll = Math.random() * totalWeight;
    var cumulative = 0;
    var selected = valid[valid.length - 1];
    for (var i = 0; i < valid.length; i++) {
      cumulative += valid[i].weight;
      if (roll < cumulative) { selected = valid[i]; break; }
    }
    video.currentTime = selected.start;
  }

  function initHlsLandingVideo() {
    if (!hlsVideo) {
      return;
    }

    var hlsSource = hlsVideo.getAttribute("data-hls-src");
    if (!hlsSource) {
      return;
    }

    var chaptersPromise = loadLandingChapters();

    // Safari and other native-HLS browsers.
    if (hlsVideo.canPlayType("application/vnd.apple.mpegurl")) {
      hlsVideo.src = hlsSource;
      hlsVideo.load();
      hlsVideo.addEventListener("loadedmetadata", function () {
        chaptersPromise.then(function (chapterStarts) {
          randomiseStartByChapter(hlsVideo, chapterStarts);
          safeAutoplay(hlsVideo);
        });
      }, { once: true });
      return;
    }

    // Chromium/Firefox via hls.js.
    loadScriptOnce("https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js", function (loaded) {
      if (!loaded || !window.Hls || !window.Hls.isSupported()) {
        return;
      }

      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        capLevelToPlayerSize: true
      });

      hls.loadSource(hlsSource);
      hls.attachMedia(hlsVideo);

      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        if (hlsVideo.readyState >= 1 && isFinite(hlsVideo.duration) && hlsVideo.duration > 0) {
          chaptersPromise.then(function (chapterStarts) {
            randomiseStartByChapter(hlsVideo, chapterStarts);
            safeAutoplay(hlsVideo);
          });
        } else {
          hlsVideo.addEventListener("loadedmetadata", function () {
            chaptersPromise.then(function (chapterStarts) {
              randomiseStartByChapter(hlsVideo, chapterStarts);
              safeAutoplay(hlsVideo);
            });
          }, { once: true });
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

  initHlsLandingVideo();

  // Pause video playback when the landing hero is fully out of view; resume when any part is visible
  if (hlsVideo && typeof IntersectionObserver !== "undefined") {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          safeAutoplay(hlsVideo);
        } else if (!hlsVideo.paused) {
          hlsVideo.pause();
        }
      });
    }, { threshold: 0 });
    videoObserver.observe(landing);
  }

  if (!landing || !landingTarget) {
    return;
  }

  function isNearTop() {
    return (window.scrollY || 0) < 24 && !body.classList.contains("menu-open");
  }

  function snapToMain() {
    if (isSnapping) {
      return;
    }

    isSnapping = true;
    // On narrow screens the search bar is visible — snap to it first.
    // Otherwise, if homepage text content exists, snap there before latest posts.
    var target = landingTarget;
    if (searchBarTarget && searchBarTarget.offsetParent !== null) {
      target = searchBarTarget;
    } else if (homeContentTarget) {
      target = homeContentTarget;
    }

    // Account for the fixed header so the target isn't hidden beneath it.
    // --header-height is in rem, so convert to px via the root font-size.
    var headerHeightRaw = getComputedStyle(document.documentElement).getPropertyValue("--header-height").trim();
    var headerHeight = 0;
    if (headerHeightRaw.endsWith("rem")) {
      var rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      headerHeight = parseFloat(headerHeightRaw) * rootFontSize;
    } else {
      headerHeight = parseFloat(headerHeightRaw) || 0;
    }
    var targetTop = target.getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({ top: targetTop, behavior: "smooth" });

    window.setTimeout(function () {
      isSnapping = false;
    }, 900);
  }

  if (scrollHint) {
    scrollHint.addEventListener("click", function (event) {
      event.preventDefault();
      snapToMain();
    });
  }

  window.addEventListener("wheel", function (event) {
    if (!isNearTop() || event.deltaY <= 8) {
      return;
    }

    event.preventDefault();
    snapToMain();
  }, { passive: false });

  window.addEventListener("touchstart", function (event) {
    if (!event.touches || event.touches.length === 0) {
      return;
    }

    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  window.addEventListener("touchmove", function (event) {
    if (!isNearTop() || touchStartY === null || !event.touches || event.touches.length === 0) {
      return;
    }

    var deltaY = touchStartY - event.touches[0].clientY;

    if (deltaY <= 18) {
      return;
    }

    event.preventDefault();
    touchStartY = null;
    snapToMain();
  }, { passive: false });

  window.addEventListener("keydown", function (event) {
    if (document.body.classList.contains("menu-open")) {
      return;
    }

    var activeElement = document.activeElement;
    var activeTag = activeElement ? activeElement.tagName : "";
    var isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT" || (activeElement && activeElement.isContentEditable);
    var shouldSnap =
      event.key === "ArrowDown" ||
      event.key === "Down" ||
      event.key === "PageDown" ||
      event.key === " " ||
      event.key === "Spacebar";

    if (!isNearTop() || isTyping || !shouldSnap) {
      return;
    }

    event.preventDefault();
    snapToMain();
  });
}());
