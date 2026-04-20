(function () {
  // DOM contract: the gallery include renders stable data-gallery* hooks.
  // Keep behavior keyed to these hooks; styling changes should stay in SCSS.
  function toFilename(path) {
    if (!path) return '';
    var segments = String(path).split('/');
    return segments[segments.length - 1] || '';
  }

  function normalizeDir(dir) {
    var value = String(dir || '').trim();
    if (!value) return '';
    if (value[0] !== '/') value = '/' + value;
    if (value[value.length - 1] !== '/') value += '/';
    return value;
  }

  function setHeader(root, name, description) {
    var header = root.querySelector('[data-gallery-header]');
    var nameEl = root.querySelector('[data-gallery-title]');
    var descEl = root.querySelector('[data-gallery-description-text]');

    if (nameEl) nameEl.textContent = name || '';
    if (descEl) descEl.textContent = description || '';

    if (!header) return;
    var empty = !(name && name.trim()) && !(description && description.trim());
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

  function applyResponsivePicture(anchor, picture, image) {
    var base = anchor.dataset.galleryBase || '';
    var small = anchor.dataset.gallerySmall || '';
    var medium = anchor.dataset.galleryMedium || '';
    var large = anchor.dataset.galleryLarge || '';
    var full = anchor.dataset.galleryFull || '';

    while (picture.firstChild) {
      picture.removeChild(picture.firstChild);
    }

    var largeCandidate = full || large || medium || small || base;
    var mediumCandidate = medium || large || small || base;
    var smallCandidate = small || medium || large || base;

    if (largeCandidate) {
      picture.appendChild(createSource('(min-width: 1400px)', largeCandidate));
    }
    if (mediumCandidate) {
      picture.appendChild(createSource('(min-width: 768px)', mediumCandidate));
    }

    image.alt = anchor.dataset.galleryAlt || '';
    picture.appendChild(image);
    setImageWithFallback(image, [smallCandidate, mediumCandidate, largeCandidate, base]);
  }

  function hydrateFromConfig(root, config) {
    if (!config || typeof config !== 'object') return;

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
      var link = node.querySelector('[data-gallery-open]');
      if (link) {
        if (title) link.dataset.galleryTitle = title;
        if (description) link.dataset.galleryDescription = description;
        if (alt) {
          link.dataset.galleryAlt = alt;
          var thumb = node.querySelector('[data-gallery-thumb-img]');
          if (thumb) thumb.alt = alt;
        }
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

    var dir = normalizeDir(root.dataset.galleryDir || '');
    var links = Array.prototype.slice.call(root.querySelectorAll('[data-gallery-open]'));
    if (!links.length) return;

    var lightbox = root.querySelector('[data-gallery-lightbox]');
    var closeBtn = root.querySelector('[data-gallery-close]');
    var prevBtn = root.querySelector('[data-gallery-prev]');
    var nextBtn = root.querySelector('[data-gallery-next]');
    var figure = root.querySelector('.afh-gallery__figure');
    var picture = root.querySelector('[data-gallery-picture]');
    var image = root.querySelector('[data-gallery-image]');
    var captionTitle = root.querySelector('[data-gallery-caption-title]');
    var captionDescription = root.querySelector('[data-gallery-caption-description]');
    var counter = root.querySelector('[data-gallery-counter]');

    var currentIndex = 0;
    var open = false;

    // Keep the lightbox as a top-level element so fixed positioning is always
    // relative to the viewport, not affected by transformed ancestors.
    if (lightbox && lightbox.parentNode !== document.body) {
      document.body.appendChild(lightbox);
    }

    function updateSingleState() {
      var isSingle = links.length <= 1;
      root.classList.toggle('afh-gallery--single', isSingle);
      if (prevBtn) prevBtn.hidden = isSingle;
      if (nextBtn) nextBtn.hidden = isSingle;
    }

    function refreshLinks() {
      links = Array.prototype.slice.call(root.querySelectorAll('[data-gallery-open]'));
      updateSingleState();
    }

    function updateCaption(link) {
      var title = link.dataset.galleryTitle || '';
      var description = link.dataset.galleryDescription || '';
      var fallbackTitle = toFilename(link.dataset.galleryBase || link.getAttribute('href')).replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');

      captionTitle.textContent = title || fallbackTitle;
      captionDescription.textContent = description || '';
      captionDescription.hidden = !description;
      counter.textContent = (currentIndex + 1) + ' / ' + links.length;
    }

    function show(index) {
      if (!links.length) return;
      if (index < 0) index = links.length - 1;
      if (index >= links.length) index = 0;

      currentIndex = index;
      var link = links[currentIndex];
      updateCaption(link);
      applyResponsivePicture(link, picture, image);

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
      var trigger = event.target.closest('[data-gallery-open]');
      if (!trigger) return;

      event.preventDefault();
      refreshLinks();
      var index = links.indexOf(trigger);
      show(index >= 0 ? index : 0);
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', close);
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

    if (lightbox) {
      lightbox.addEventListener('click', function (event) {
        if (!figure || !figure.contains(event.target)) {
          close();
        }
      });
    }

    document.addEventListener('keydown', function (event) {
      if (!open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        show(currentIndex - 1);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        show(currentIndex + 1);
      }
    });

    root.querySelectorAll('[data-gallery-thumb-img]').forEach(function (thumb) {
      thumb.addEventListener('error', function () {
        var fallback = thumb.getAttribute('data-gallery-fallback');
        if (!fallback || thumb.dataset.galleryFallbackApplied === '1') return;
        thumb.dataset.galleryFallbackApplied = '1';
        thumb.src = fallback;
      });
    });

    updateSingleState();
    root.dataset.galleryReady = '1';

    if (dir) {
      var jsonUrl = dir + 'gallery.json';
      fetch(jsonUrl, { cache: 'no-store' })
        .then(function (response) {
          if (!response.ok) return null;
          return response.json();
        })
        .then(function (data) {
          if (!data) return;
          hydrateFromConfig(root, data);
          refreshLinks();
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
