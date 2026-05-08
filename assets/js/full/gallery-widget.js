(function () {
  // DOM contract: the gallery include renders stable data-gallery* hooks.
  // Keep behavior keyed to these hooks; styling changes should stay in SCSS.
  function parseBooleanDataset(value, fallback) {
    if (value == null || value === '') return fallback;
    var v = String(value).trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].indexOf(v) >= 0 ? true
         : ['0', 'false', 'no', 'off'].indexOf(v) >= 0 ? false : fallback;
  }

  function setHeader(root, name, description) {
    var header = root.querySelector('[data-gallery-header]');
    var nameEl = root.querySelector('[data-gallery-title]');
    var descEl = root.querySelector('[data-gallery-description-text]');

    if (nameEl) nameEl.textContent = name || '';
    if (descEl) descEl.textContent = description || '';

    if (!header) return;
    var empty = !(name && name.trim());
    header.classList.toggle('is-empty', empty);
  }

  function uniqueSources(values) {
    var seen = Object.create(null);
    var result = [];
    values.forEach(function (value) {
      if (!value || seen[value]) return;
      seen[value] = true;
      result.push(value);
    });
    return result;
  }

  function setImageWithFallback(img, candidates) {
    var list = uniqueSources(candidates);
    var index = 0;

    function applyNext() {
      if (index >= list.length) return;
      img.src = list[index];
      index += 1;
    }

    img.onerror = function () {
      applyNext();
    };

    applyNext();
  }

  function createSource(media, srcset) {
    var source = document.createElement('source');
    source.media = media;
    source.srcset = srcset;
    return source;
  }

  function parseSrcsetCandidates(srcset) {
    if (!srcset) return [];
    return String(srcset).split(',').map(function (e) {
      return e.trim().split(/\s+/)[0] || '';
    }).filter(Boolean);
  }

  function setOrRemoveDataAttr(el, attrName, value) {
    if (!el) return;
    if (value) {
      el.setAttribute(attrName, value);
    } else {
      el.removeAttribute(attrName);
    }
  }

  function updateItemCaption(node, title, description) {
    if (!node) return;
    var caption = node.querySelector('[data-gallery-item-caption]');
    var hasTitle = !!(title && title.trim());
    var hasDescription = !!(description && description.trim());

    if (!hasTitle && !hasDescription) {
      if (caption) {
        caption.remove();
      }
      return;
    }

    if (!caption) {
      caption = document.createElement('div');
      caption.className = 'afh-gallery__item-caption';
      caption.setAttribute('data-gallery-item-caption', '');
      node.appendChild(caption);
    }

    var titleEl = caption.querySelector('[data-gallery-item-title]');
    var descriptionEl = caption.querySelector('[data-gallery-item-description]');

    if (hasTitle) {
      if (!titleEl) {
        titleEl = document.createElement('p');
        titleEl.className = 'afh-gallery__item-title';
        titleEl.setAttribute('data-gallery-item-title', '');
        caption.appendChild(titleEl);
      }
      titleEl.textContent = title;
    } else if (titleEl) {
      titleEl.remove();
    }

    if (hasDescription) {
      if (!descriptionEl) {
        descriptionEl = document.createElement('p');
        descriptionEl.className = 'afh-gallery__item-description';
        descriptionEl.setAttribute('data-gallery-item-description', '');
        caption.appendChild(descriptionEl);
      }
      descriptionEl.textContent = description;
    } else if (descriptionEl) {
      descriptionEl.remove();
    }
  }

  function updateStageCaption(root, title, description, showTitle, showDescription) {
    if (!root) return;

    var caption = root.querySelector('[data-gallery-stage-caption]');
    var hasTitle = !!(showTitle && title && title.trim());
    var hasDescription = !!(showDescription && description && description.trim());

    if (!hasTitle && !hasDescription) {
      if (caption) {
        caption.remove();
      }
      return;
    }

    if (!caption) {
      caption = document.createElement('div');
      caption.className = 'afh-gallery__stage-caption';
      caption.setAttribute('data-gallery-stage-caption', '');
      root.appendChild(caption);
    }

    var titleEl = caption.querySelector('[data-gallery-stage-title]');
    var descriptionEl = caption.querySelector('[data-gallery-stage-description]');

    if (hasTitle) {
      if (!titleEl) {
        titleEl = document.createElement('p');
        titleEl.className = 'afh-gallery__stage-title';
        titleEl.setAttribute('data-gallery-stage-title', '');
        caption.appendChild(titleEl);
      }
      titleEl.textContent = title;
    } else if (titleEl) {
      titleEl.remove();
    }

    if (hasDescription) {
      if (!descriptionEl) {
        descriptionEl = document.createElement('p');
        descriptionEl.className = 'afh-gallery__stage-description';
        descriptionEl.setAttribute('data-gallery-stage-description', '');
        caption.appendChild(descriptionEl);
      }
      descriptionEl.textContent = description;
    } else if (descriptionEl) {
      descriptionEl.remove();
    }
  }

  function updateLightboxCaption(root, title, description, showTitle, showDescription) {
    if (!root) return;

    var titleEl = root.querySelector('[data-gallery-caption-title]');
    var descriptionEl = root.querySelector('[data-gallery-caption-description]');
    var counterEl = root.querySelector('[data-gallery-counter]');
    var hasTitle = !!(showTitle && title && title.trim());
    var hasDescription = !!(showDescription && description && description.trim());

    if (hasTitle) {
      if (!titleEl) {
        titleEl = document.createElement('p');
        titleEl.className = 'afh-gallery__caption-title';
        titleEl.setAttribute('data-gallery-caption-title', '');
        root.insertBefore(titleEl, root.firstChild);
      }
      titleEl.textContent = title;
    } else if (titleEl) {
      titleEl.remove();
    }

    if (hasDescription) {
      if (!descriptionEl) {
        descriptionEl = document.createElement('p');
        descriptionEl.className = 'afh-gallery__caption-description';
        descriptionEl.setAttribute('data-gallery-caption-description', '');
        root.insertBefore(descriptionEl, counterEl || null);
      }
      descriptionEl.textContent = description;
    } else if (descriptionEl) {
      descriptionEl.remove();
    }
  }

  function applyResponsivePicture(anchor, picture, image) {
    applyResponsivePictureData({
      base: anchor.dataset.galleryBase || '',
      href: anchor.getAttribute('href') || '',
      srcset: anchor.dataset.gallerySrcset || '',
      alt: anchor.dataset.galleryAlt || '',
      thumb: anchor.dataset.galleryThumb || '',
      small: anchor.dataset.gallerySmall || '',
      medium: anchor.dataset.galleryMedium || '',
      large: anchor.dataset.galleryLarge || '',
      full: anchor.dataset.galleryFull || ''
    }, picture, image);
  }

  function applyResponsivePictureData(data, picture, image) {
    var base = data.base || '';
    var href = data.href || '';
    var srcset = data.srcset || '';
    var srcsetCandidates = parseSrcsetCandidates(srcset);
    var small = data.small || '';
    var medium = data.medium || '';
    var large = data.large || '';
    var full = data.full || '';
    if (!srcsetCandidates.length) {
      srcsetCandidates = uniqueSources([data.thumb || '', small, medium, large, full]);
    }

    while (picture.firstChild) {
      picture.removeChild(picture.firstChild);
    }

    if (srcset) {
      picture.appendChild(createSource('(min-width: 1081px)', srcset));
      picture.appendChild(createSource('(max-width: 1080px)', srcset));
    } else {
      var largeCandidate = full || large || medium || small || base;
      var mediumCandidate = medium || large || small || base;
      if (largeCandidate) {
        picture.appendChild(createSource('(min-width: 1081px)', largeCandidate));
      }
      if (mediumCandidate) {
        picture.appendChild(createSource('(max-width: 1080px)', mediumCandidate));
      }
    }

    image.alt = data.alt || '';
    if (srcset) {
      image.srcset = srcset;
      image.sizes = '100vw';
    } else {
      image.removeAttribute('srcset');
      image.removeAttribute('sizes');
    }
    picture.appendChild(image);
    setImageWithFallback(image, srcsetCandidates.concat([href, base]));
  }

  function waitForImageReady(image, callback) {
    var finished = false;

    function done() {
      if (finished) return;
      finished = true;
      image.removeEventListener('load', done);
      image.removeEventListener('error', done);
      callback();
    }

    if (image.complete && image.naturalWidth > 0) {
      if (typeof image.decode === 'function') {
        Promise.resolve(image.decode()).catch(function () {
          // Ignore decode failures and continue with the loaded asset.
        }).then(done);
        return;
      }

      done();
      return;
    }

    image.addEventListener('load', done, { once: true });
    image.addEventListener('error', done, { once: true });
  }

  function updateCaptionFields(titleEl, descriptionEl, counterEl, link, index, total, showTitle, showDescription) {
    if (!link) return;
    var title = link.dataset.galleryTitle || '';
    var description = link.dataset.galleryDescription || '';
    if (titleEl) {
      titleEl.textContent = showTitle ? title : '';
      titleEl.hidden = !showTitle || !title;
    }
    if (descriptionEl) {
      descriptionEl.textContent = showDescription ? description : '';
      descriptionEl.hidden = !showDescription || !description;
    }
    if (counterEl) counterEl.textContent = (index + 1) + ' / ' + total;
  }

  function scrollItemIntoView(node) {
    if (!node) return;
    var strip = node.closest('[data-gallery-grid]');
    if (!strip || typeof strip.scrollTo !== 'function') return;

    var stripRect = strip.getBoundingClientRect();
    var nodeRect = node.getBoundingClientRect();
    var deltaX = 0;
    var margin = 10;

    if (nodeRect.left < stripRect.left + margin) {
      deltaX = nodeRect.left - stripRect.left - margin;
    } else if (nodeRect.right > stripRect.right - margin) {
      deltaX = nodeRect.right - stripRect.right + margin;
    }

    if (deltaX !== 0) {
      strip.scrollTo({
        left: strip.scrollLeft + deltaX,
        behavior: 'smooth'
      });
    }
  }

  function getToggleIconMarkup(isPlaying) {
    if (isPlaying) {
      return '' +
        '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">' +
        '<rect x="7" y="5.5" width="3.5" height="13" rx="1"></rect>' +
        '<rect x="13.5" y="5.5" width="3.5" height="13" rx="1"></rect>' +
        '</svg>';
    }

    return '' +
      '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">' +
      '<path d="M8 6.5v11l9-5.5-9-5.5z"></path>' +
      '</svg>';
  }

  function hydrateFromConfig(root, config) {
    if (!config || typeof config !== 'object') return;
    var isCarousel = (root.getAttribute('data-gallery-mode') || 'grid') === 'carousel';

    if (config.name || config.description) {
      setHeader(root, config.name || root.dataset.galleryName || '', config.description || root.dataset.galleryDescription || '');
    }

    if (!Array.isArray(config.images) || !config.images.length) {
      return;
    }

    var grid = root.querySelector('[data-gallery-grid]');
    if (!grid) return;

    var nodes = Array.prototype.slice.call(grid.querySelectorAll('[data-gallery-item]'));
    var map = Object.create(null);
    nodes.forEach(function (node) {
      var file = node.getAttribute('data-gallery-file') || '';
      map[file] = node;
    });

    var ordered = [];
    config.images.forEach(function (entry) {
      var file = '';
      var title = '';
      var description = '';
      var alt = '';

      if (typeof entry === 'string') {
        file = entry;
      } else if (entry && typeof entry === 'object') {
        file = entry.file || entry.filename || entry.image || '';
        title = entry.title || entry.name || '';
        description = entry.description || entry.caption || '';
        alt = entry.alt || '';
      }

      if (!file || !map[file]) return;

      var node = map[file];
      var link = node.querySelector('[data-gallery-source]');
      if (link) {
        setOrRemoveDataAttr(link, 'data-gallery-title', title);
        setOrRemoveDataAttr(link, 'data-gallery-description', description);
        if (alt) {
          link.setAttribute('data-gallery-alt', alt);
          var thumb = node.querySelector('.afh-gallery__thumb');
          if (thumb) thumb.alt = alt;
        }
      }

      if (isCarousel) {
        updateItemCaption(node, '', '');
      } else {
        updateItemCaption(node, title, description);
      }

      ordered.push(node);
      delete map[file];
    });

    nodes.forEach(function (node) {
      var file = node.getAttribute('data-gallery-file') || '';
      if (map[file]) {
        ordered.push(node);
      }
    });

    ordered.forEach(function (node) {
      grid.appendChild(node);
    });
  }

  function initGallery(root) {
    if (root.dataset.galleryReady === '1') return;

    var mode = root.getAttribute('data-gallery-mode') || 'grid';
    var jsonUrl = root.getAttribute('data-gallery-json') || '';
    var showImageCaption = parseBooleanDataset(root.getAttribute('data-gallery-show-image-caption'), true);
    var showImageDescription = parseBooleanDataset(root.getAttribute('data-gallery-show-image-description'), true);
    var links = Array.prototype.slice.call(root.querySelectorAll('[data-gallery-source]'));
    if (!links.length) return;

    var lightbox = root.querySelector('[data-gallery-lightbox]');
    var closeBtn = root.querySelector('[data-gallery-close]');
    var prevBtn = root.querySelector('[data-gallery-prev]');
    var nextBtn = root.querySelector('[data-gallery-next]');
    var figure = root.querySelector('.afh-gallery__figure');
    var picture = root.querySelector('[data-gallery-picture]');
    var image = root.querySelector('[data-gallery-image]');
    var counter = root.querySelector('[data-gallery-counter]');
    var stageLink = root.querySelector('[data-gallery-stage-open]');
    var stagePictures = Array.prototype.slice.call(root.querySelectorAll('[data-gallery-stage-picture]'));
    var stageImages = Array.prototype.slice.call(root.querySelectorAll('[data-gallery-stage-image]'));
    var stageCounter = root.querySelector('[data-gallery-stage-counter]');
    var stagePrevBtn = root.querySelector('[data-gallery-stage-prev]');
    var stageNextBtn = root.querySelector('[data-gallery-stage-next]');
    var stageToggleBtn = root.querySelector('[data-gallery-stage-toggle]');
    var stageToggleIcon = root.querySelector('[data-gallery-stage-toggle-icon]');
    var stageToggleText = root.querySelector('[data-gallery-stage-toggle-text]');
    var stageToggleProgressCircle = root.querySelector('[data-gallery-toggle-progress]');
    var autoplayMs = parseInt(root.getAttribute('data-gallery-autoplay-ms') || '0', 10);
    var defaultAutoplayMs = autoplayMs > 0 ? autoplayMs : 5000;

    var currentIndex = 0;
    var open = false;
    var preloadedSources = Object.create(null);
    var autoplayTimer = null;
    var autoplayProgressFrame = null;
    var autoplayProgressStartedAt = 0;
    var autoplayProgressLength = 106.82;
    var autoplayEnabled = mode === 'carousel' && links.length > 1 && autoplayMs > 0;
    var isInViewport = mode !== 'carousel' || (function () {
      var r = root.getBoundingClientRect();
      return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight || 0);
    }());
    var activeStageLayer = 0;
    var stageTransitionToken = 0;
    var viewportObserver = null;

    if (stageToggleProgressCircle && typeof stageToggleProgressCircle.getTotalLength === 'function') {
      var measuredLength = stageToggleProgressCircle.getTotalLength();
      if (measuredLength && isFinite(measuredLength)) {
        autoplayProgressLength = measuredLength;
      }
    }

    // Keep the lightbox as a top-level element so fixed positioning is always
    // relative to the viewport, not affected by transformed ancestors.
    if (lightbox && lightbox.parentNode !== document.body) {
      document.body.appendChild(lightbox);
    }

    function updateSingleState() {
      var isSingle = links.length <= 1;
      if (prevBtn) prevBtn.hidden = isSingle;
      if (nextBtn) nextBtn.hidden = isSingle;
      if (stagePrevBtn) stagePrevBtn.hidden = isSingle;
      if (stageNextBtn) stageNextBtn.hidden = isSingle;
      if (stageToggleBtn) stageToggleBtn.hidden = isSingle;
    }

    function updateAutoplayButton() {
      if (!stageToggleBtn) return;

      var isPlaying = autoplayEnabled && !open && links.length > 1;
      stageToggleBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      stageToggleBtn.setAttribute('aria-label', isPlaying ? 'Pause slideshow' : 'Play slideshow');
      stageToggleBtn.dataset.progressState = isPlaying ? 'running' : (links.length > 1 && defaultAutoplayMs > 0 ? 'paused' : 'idle');
      if (stageToggleIcon) {
        stageToggleIcon.innerHTML = getToggleIconMarkup(isPlaying);
      }
      if (stageToggleText) {
        stageToggleText.textContent = isPlaying ? 'Pause slideshow' : 'Play slideshow';
      }
    }

    function setAutoplayProgress(progress) {
      if (!stageToggleBtn) return;
      var clamped = Math.max(0, Math.min(progress || 0, 1));
      if (stageToggleProgressCircle) {
        stageToggleProgressCircle.style.strokeDasharray = autoplayProgressLength.toFixed(2);
        stageToggleProgressCircle.style.strokeDashoffset = ((1 - clamped) * autoplayProgressLength).toFixed(2);
      }
    }

    function stopAutoplayProgress() {
      if (autoplayProgressFrame) {
        window.cancelAnimationFrame(autoplayProgressFrame);
        autoplayProgressFrame = null;
      }
    }

    function startAutoplayProgress() {
      if (!stageToggleBtn) return;

      stopAutoplayProgress();
      autoplayProgressStartedAt = window.performance && typeof window.performance.now === 'function'
        ? window.performance.now()
        : Date.now();
      setAutoplayProgress(0);

      function tick(now) {
        if (!autoplayEnabled || open || links.length <= 1) {
          autoplayProgressFrame = null;
          return;
        }

        var elapsed = now - autoplayProgressStartedAt;
        var progress = elapsed / defaultAutoplayMs;
        setAutoplayProgress(progress);

        if (progress < 1) {
          autoplayProgressFrame = window.requestAnimationFrame(tick);
        } else {
          autoplayProgressFrame = null;
        }
      }

      autoplayProgressFrame = window.requestAnimationFrame(tick);
    }

    function stopAutoplay() {
      stopAutoplayProgress();
      if (!autoplayTimer) return;
      window.clearTimeout(autoplayTimer);
      autoplayTimer = null;
      updateAutoplayButton();
    }

    function startAutoplay() {
      stopAutoplay();
      if (mode !== 'carousel' || !autoplayEnabled || open || links.length <= 1 || !isInViewport) {
        updateAutoplayButton();
        return;
      }

      startAutoplayProgress();
      autoplayTimer = window.setTimeout(function () {
        setCurrent(currentIndex + 1, 'next');
        startAutoplay();
      }, defaultAutoplayMs);
      updateAutoplayButton();
    }

    var restartAutoplay = startAutoplay;

    function refreshLinks() {
      links = Array.prototype.slice.call(root.querySelectorAll('[data-gallery-source]'));
      updateSingleState();
    }

    function updateActiveThumb() {
      links.forEach(function (link, index) {
        var item = link.closest('[data-gallery-item]');
        var active = index === currentIndex;
        if (item) {
          item.classList.toggle('is-active', active);
        }
        if (active) {
          link.setAttribute('aria-current', 'true');
          if (mode === 'carousel') {
            scrollItemIntoView(item || link);
          }
        } else {
          link.removeAttribute('aria-current');
        }
      });
    }

    function updateStageLinkData(link) {
      if (!stageLink || !link) return;

      stageLink.href = link.getAttribute('href') || '';
      setOrRemoveDataAttr(stageLink, 'data-gallery-title', link.dataset.galleryTitle || '');
      setOrRemoveDataAttr(stageLink, 'data-gallery-description', link.dataset.galleryDescription || '');
      setOrRemoveDataAttr(stageLink, 'data-gallery-srcset', link.dataset.gallerySrcset || '');
      stageLink.setAttribute('data-gallery-alt', link.dataset.galleryAlt || '');
      stageLink.setAttribute('data-gallery-base', link.dataset.galleryBase || link.getAttribute('href') || '');
    }

    function applyStageLayerState(activeIndex) {
      stagePictures.forEach(function (pictureNode, index) {
        var isActive = index === activeIndex;
        pictureNode.classList.toggle('is-active', isActive);
        pictureNode.classList.toggle('is-inactive', !isActive);
        pictureNode.removeAttribute('style');
        pictureNode.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
    }

    function updateStage(link, direction) {
      if (!stageLink || !stagePictures.length || !stageImages.length || !link) return;

      var activePicture = stagePictures[activeStageLayer];
      var activeImage = stageImages[activeStageLayer];
      var nextLayer = stagePictures.length > 1 ? (activeStageLayer + 1) % stagePictures.length : activeStageLayer;
      var nextPicture = stagePictures[nextLayer];
      var nextImage = stageImages[nextLayer];

      if (!nextPicture || !nextImage || nextLayer === activeStageLayer) {
        updateStageLinkData(link);
        applyResponsivePicture(stageLink, activePicture, activeImage);
        updateCaptionFields(
          null,
          null,
          stageCounter,
          link,
          currentIndex,
          links.length,
          showImageCaption,
          showImageDescription
        );
        updateStageCaption(stageLink, link.dataset.galleryTitle || '', link.dataset.galleryDescription || '', showImageCaption, showImageDescription);
        return;
      }

      if (direction === 'initial') {
        updateStageLinkData(link);
        applyResponsivePicture(stageLink, activePicture, activeImage);
        updateCaptionFields(
          null,
          null,
          stageCounter,
          link,
          currentIndex,
          links.length,
          showImageCaption,
          showImageDescription
        );
        updateStageCaption(stageLink, link.dataset.galleryTitle || '', link.dataset.galleryDescription || '', showImageCaption, showImageDescription);
        applyStageLayerState(activeStageLayer);
        return;
      }

      stageTransitionToken += 1;
      var transitionToken = stageTransitionToken;

      applyResponsivePictureData({
        base: link.dataset.galleryBase || link.getAttribute('href') || '',
        href: link.getAttribute('href') || '',
        srcset: link.dataset.gallerySrcset || '',
        alt: link.dataset.galleryAlt || '',
        thumb: link.dataset.galleryThumb || '',
        small: link.dataset.gallerySmall || '',
        medium: link.dataset.galleryMedium || '',
        large: link.dataset.galleryLarge || '',
        full: link.dataset.galleryFull || ''
      }, nextPicture, nextImage);

      waitForImageReady(nextImage, function () {
        var fadeDuration = 240;
        if (transitionToken !== stageTransitionToken) return;

        updateStageLinkData(link);
        updateCaptionFields(
          null,
          null,
          stageCounter,
          link,
          currentIndex,
          links.length,
          showImageCaption,
          showImageDescription
        );
        updateStageCaption(stageLink, link.dataset.galleryTitle || '', link.dataset.galleryDescription || '', showImageCaption, showImageDescription);

        nextPicture.style.opacity = '0';
        nextPicture.style.zIndex = '2';
        activePicture.style.opacity = '1';
        activePicture.style.zIndex = '1';

        if (typeof nextPicture.animate === 'function' && typeof activePicture.animate === 'function') {
          nextPicture.animate(
            [
              { opacity: 0 },
              { opacity: 1 }
            ],
            {
              duration: fadeDuration,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              fill: 'forwards'
            }
          );

          activePicture.animate(
            [
              { opacity: 1 },
              { opacity: 0 }
            ],
            {
              duration: fadeDuration,
              easing: 'linear',
              fill: 'forwards'
            }
          );
        }

        window.setTimeout(function () {
          if (transitionToken !== stageTransitionToken) return;
          activeStageLayer = nextLayer;
          applyStageLayerState(activeStageLayer);
        }, fadeDuration);
      });
    }

    function setCurrent(index, direction) {
      if (!links.length) return;
      if (index < 0) index = links.length - 1;
      if (index >= links.length) index = 0;
      currentIndex = index;

      if (mode === 'carousel') {
        updateStage(links[currentIndex], direction || 'next');
        updateActiveThumb();
      }
    }

    function preloadAdjacent(index) {
      if (links.length <= 1) return;
      var n = links.length;
      [(index - 1 + n) % n, (index + 1) % n].forEach(function (i) {
        var lnk = links[i];
        var srcs = uniqueSources(
          parseSrcsetCandidates(lnk.dataset.gallerySrcset || '')
            .concat([lnk.getAttribute('href') || '', lnk.dataset.galleryBase || ''])
        );
        srcs.forEach(function (src) {
          if (!src || preloadedSources[src]) return;
          preloadedSources[src] = true;
          var img = new Image();
          img.decoding = 'async';
          img.src = src;
        });
      });
    }

    function show(index) {
      if (!links.length) return;
      updateSingleState();
      setCurrent(index);
      var link = links[currentIndex];
      updateLightboxCaption(
        figure.querySelector('.afh-gallery__caption'),
        link.dataset.galleryTitle || '',
        link.dataset.galleryDescription || '',
        showImageCaption,
        showImageDescription
      );
      updateCaptionFields(
        null,
        null,
        counter,
        link,
        currentIndex,
        links.length,
        showImageCaption,
        showImageDescription
      );
      applyResponsivePicture(link, picture, image);
      preloadAdjacent(currentIndex);

      lightbox.classList.remove('is-hidden');
      lightbox.setAttribute('aria-hidden', 'false');
      open = true;
    }

    function close() {
      if (!open) return;
      lightbox.classList.add('is-hidden');
      lightbox.setAttribute('aria-hidden', 'true');
      open = false;
    }

    root.addEventListener('click', function (event) {
      var selectTrigger = event.target.closest('[data-gallery-select]');
      if (selectTrigger && root.contains(selectTrigger)) {
        event.preventDefault();
        refreshLinks();
        var selectIndex = links.indexOf(selectTrigger);
        setCurrent(selectIndex >= 0 ? selectIndex : 0, selectIndex < currentIndex ? 'prev' : 'next');
        restartAutoplay();
        return;
      }

      var stageTrigger = event.target.closest('[data-gallery-stage-open]');
      if (stageTrigger && root.contains(stageTrigger)) {
        event.preventDefault();
        refreshLinks();
        show(currentIndex);
        return;
      }

      var trigger = event.target.closest('[data-gallery-open]');
      if (!trigger) return;

      event.preventDefault();
      refreshLinks();
      var index = links.indexOf(trigger);
      show(index >= 0 ? index : 0);
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        close();
        restartAutoplay();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        show(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        show(currentIndex + 1);
      });
    }

    if (stagePrevBtn) {
      stagePrevBtn.addEventListener('click', function () {
        refreshLinks();
        setCurrent(currentIndex - 1, 'prev');
        restartAutoplay();
      });
    }

    if (stageNextBtn) {
      stageNextBtn.addEventListener('click', function () {
        refreshLinks();
        setCurrent(currentIndex + 1, 'next');
        restartAutoplay();
      });
    }

    if (stageToggleBtn) {
      stageToggleBtn.addEventListener('click', function () {
        if (autoplayEnabled) {
          autoplayEnabled = false;
          stopAutoplay();
          updateAutoplayButton();
          return;
        }

        autoplayEnabled = true;
        startAutoplay();
      });
    }

    if (lightbox) {
      lightbox.addEventListener('click', function (event) {
        if (!figure || !figure.contains(event.target)) {
          close();
          restartAutoplay();
        }
      });
    }

    document.addEventListener('keydown', function (event) {
      if (open && event.key === 'Escape') {
        event.preventDefault();
        close();
        restartAutoplay();
        return;
      }

      if (open && event.key === 'ArrowLeft') {
        event.preventDefault();
        show(currentIndex - 1);
        return;
      }

      if (open && event.key === 'ArrowRight') {
        event.preventDefault();
        show(currentIndex + 1);
        return;
      }

      if (!open && mode === 'carousel' && root.contains(document.activeElement)) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          setCurrent(currentIndex - 1, 'prev');
          restartAutoplay();
          return;
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          setCurrent(currentIndex + 1, 'next');
          restartAutoplay();
        }
      }
    });

    if (mode === 'carousel') {
      root.addEventListener('mouseenter', stopAutoplay);
      root.addEventListener('mouseleave', startAutoplay);
      root.addEventListener('focusin', stopAutoplay);
      root.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (!root.contains(document.activeElement)) {
            startAutoplay();
          }
        }, 0);
      });

      if (typeof window.IntersectionObserver === 'function') {
        viewportObserver = new window.IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.target !== root) return;
            var nowVisible = entry.isIntersecting && entry.intersectionRatio > 0.15;
            if (isInViewport === nowVisible) return;
            isInViewport = nowVisible;
            if (isInViewport) {
              startAutoplay();
            } else {
              stopAutoplay();
            }
          });
        }, { threshold: [0, 0.15, 0.3] });
        viewportObserver.observe(root);
      }
    }

    updateSingleState();
    applyStageLayerState(activeStageLayer);
    setAutoplayProgress(0);
    setCurrent(0, 'initial');
    updateAutoplayButton();
    startAutoplay();
    root.dataset.galleryReady = '1';

    if (jsonUrl) {
      fetch(jsonUrl, { cache: 'no-store' })
        .then(function (response) {
          if (!response.ok) return null;
          return response.json();
        })
        .then(function (data) {
          if (!data) return;
          hydrateFromConfig(root, data);
          refreshLinks();
          setCurrent(Math.min(currentIndex, Math.max(links.length - 1, 0)), 'initial');
          updateAutoplayButton();
          startAutoplay();
        })
        .catch(function () {
          // Optional file; silently ignore when missing or invalid.
        });
    }
  }

  function initAll() {
    document.querySelectorAll('[data-gallery]').forEach(function (galleryRoot) {
      initGallery(galleryRoot);
    });
  }

  initAll();
  document.addEventListener('afh:gallery:init', initAll);
}());
