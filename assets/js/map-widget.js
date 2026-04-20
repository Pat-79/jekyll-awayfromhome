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

    var map = window.L.map(canvas, {
      center: [center.lat, center.lng],
      zoom: zoom,
      scrollWheelZoom: false
    });

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

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
