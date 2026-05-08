(function () {
  function toNumber(value) {
    var parsed = Number.parseFloat(String(value || '').trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  function parseCenter(root) {
    var lat = toNumber(root.dataset.mapCenterLat);
    var lng = toNumber(root.dataset.mapCenterLng);

    if (lat !== null && lng !== null) {
      return { lat: lat, lng: lng };
    }

    var center = String(root.dataset.mapCenter || '').trim();
    if (!center) return null;

    var parts = center.split(',');
    if (parts.length < 2) return null;

    lat = toNumber(parts[0]);
    lng = toNumber(parts[1]);

    if (lat === null || lng === null) return null;
    return { lat: lat, lng: lng };
  }

  function parsePins(rawValue) {
    var raw = String(rawValue || '').trim();
    if (!raw) return [];

    if (raw[0] === '[') {
      try {
        var jsonPins = JSON.parse(raw);
        if (!Array.isArray(jsonPins)) return [];

        return jsonPins
          .map(function (pin) {
            if (!pin || typeof pin !== 'object') return null;
            var lat = toNumber(pin.lat);
            var lng = toNumber(pin.lng);
            if (lat === null || lng === null) return null;

            return {
              lat: lat,
              lng: lng,
              name: typeof pin.name === 'string' ? pin.name : ''
            };
          })
          .filter(Boolean);
      } catch (error) {
        return [];
      }
    }

    return raw
      .split('|')
      .map(function (entry) {
        var parts = entry.split(',');
        if (parts.length < 2) return null;

        var lat = toNumber(parts[0]);
        var lng = toNumber(parts[1]);
        if (lat === null || lng === null) return null;

        var name = '';
        if (parts.length > 2) {
          name = parts.slice(2).join(',').trim();
        }

        return { lat: lat, lng: lng, name: name };
      })
      .filter(Boolean);
  }

  function parseInteger(value, fallbackValue) {
    var parsed = Number.parseInt(String(value || '').trim(), 10);
    return Number.isFinite(parsed) ? parsed : fallbackValue;
  }

  function parseBoolean(value) {
    var normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return null;
    if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') return false;
    return null;
  }

  function resolveBooleanOption(value, fallbackValue) {
    var parsed = parseBoolean(value);
    return parsed === null ? fallbackValue : parsed;
  }

  function createMap(root) {
    var canvas = root.querySelector('[data-map-canvas]');
    if (!canvas) return;

    if (!window.L || typeof window.L.map !== 'function') {
      canvas.classList.add('is-unavailable');
      canvas.textContent = 'Map unavailable right now.';
      return;
    }

    var center = parseCenter(root);
    if (!center) {
      canvas.classList.add('is-unavailable');
      canvas.textContent = 'Map widget requires a valid center location.';
      return;
    }

    var zoom = Number.parseInt(root.dataset.mapZoom || '9', 10);
    if (!Number.isFinite(zoom)) zoom = 9;

    var fitPins = String(root.dataset.mapFit || 'true').toLowerCase() !== 'false';
    var pins = parsePins(root.dataset.mapPins);
    var locked = resolveBooleanOption(root.dataset.mapLocked, false);
    var scrollWheelZoom = resolveBooleanOption(root.dataset.mapScrollWheelZoom, false);
    var dragging = resolveBooleanOption(root.dataset.mapDragging, !locked);
    var touchZoom = resolveBooleanOption(root.dataset.mapTouchZoom, !locked);
    var doubleClickZoom = resolveBooleanOption(root.dataset.mapDoubleClickZoom, !locked);
    var boxZoom = resolveBooleanOption(root.dataset.mapBoxZoom, !locked);
    var keyboard = resolveBooleanOption(root.dataset.mapKeyboard, !locked);

    var map = window.L.map(canvas, {
      center: [center.lat, center.lng],
      zoom: zoom,
      scrollWheelZoom: scrollWheelZoom,
      dragging: dragging,
      touchZoom: touchZoom,
      doubleClickZoom: doubleClickZoom,
      boxZoom: boxZoom,
      keyboard: keyboard
    });

    var tileUrl = String(root.dataset.mapTileUrl || '').trim() || 'https://{s}.openstreetmap.org/{z}/{x}/{y}.png';
    var tileAttribution = String(root.dataset.mapTileAttribution || '').trim() || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    var tileSubdomains = String(root.dataset.mapTileSubdomains || '').trim() || 'tile';
    var tileMaxZoom = parseInteger(root.dataset.mapTileMaxZoom, 19);
    var tileReferrerPolicy = String(root.dataset.mapTileReferrerPolicy || '').trim();
    var tileCrossOrigin = String(root.dataset.mapTileCrossOrigin || '').trim();

    var tileOptions = {
      maxZoom: tileMaxZoom,
      attribution: tileAttribution,
      subdomains: tileSubdomains
    };

    if (tileReferrerPolicy) {
      tileOptions.referrerPolicy = tileReferrerPolicy;
    }

    if (tileCrossOrigin) {
      tileOptions.crossOrigin = tileCrossOrigin;
    }

    window.L.tileLayer(tileUrl, tileOptions).addTo(map);

    var bounds = window.L.latLngBounds([]);

    pins.forEach(function (pin) {
      var marker = window.L.marker([pin.lat, pin.lng]).addTo(map);
      if (pin.name) marker.bindPopup(pin.name);
      bounds.extend([pin.lat, pin.lng]);
    });

    if (!pins.length) {
      var centerName = String(root.dataset.mapCenterName || '').trim();
      if (centerName) {
        window.L.marker([center.lat, center.lng]).addTo(map).bindPopup(centerName);
      }
      bounds.extend([center.lat, center.lng]);
    }

    if (fitPins && bounds.isValid() && pins.length > 1) {
      map.fitBounds(bounds, { padding: [28, 28] });
    }

    requestAnimationFrame(function () {
      map.invalidateSize();
    });
  }

  function initAllMaps() {
    document.querySelectorAll('[data-map-widget]').forEach(createMap);
  }

  initAllMaps();
})();
