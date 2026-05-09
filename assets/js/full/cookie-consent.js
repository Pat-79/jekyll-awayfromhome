/**
 * Cookie consent manager — Away From Home theme.
 *
 * Reads configuration and UI strings from data-* attributes on
 * #afh-cookie-banner, which is rendered by _includes/cookie-banner.html.
 *
 * Key responsibilities:
 *   1. Synchronously apply consent gates before widget scripts run (defer order).
 *   2. Show the bottom banner when no valid consent record exists.
 *   3. Handle Accept All / Decline All / per-category toggles / Save.
 *   4. Enable inline consent via placeholder buttons (no page reload).
 *   5. Populate and wire the preferences widget on the cookies page.
 *   6. Renew expiry on each valid visit.
 *
 * Exposes:  window.afhConsent.get(categoryId) → boolean
 * Dispatches: document event 'afh:consent-changed' when choices change.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'afh-cookie-consent';

  var banner = document.getElementById('afh-cookie-banner');
  if (!banner) return; // cookie_consent.enabled is false — nothing to do

  // ── Configuration from data attributes ─────────────────────────────────────
  var configVersion = parseInt(banner.getAttribute('data-version') || '1', 10);
  var lifetimeDays  = parseInt(banner.getAttribute('data-lifetime-days') || '365', 10);

  var categories = [];
  try { categories = JSON.parse(banner.getAttribute('data-categories') || '[]'); } catch (_) {}

  var optionalCategories = categories.filter(function (c) { return !c.required; });

  function str(key) {
    return banner.getAttribute('data-str-' + key) || '';
  }

  // ── Storage helpers ─────────────────────────────────────────────────────────
  function nowSec() { return Math.floor(Date.now() / 1000); }

  function loadRecord() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function storeRecord(choices) {
    var rec = {
      version: configVersion,
      expires: nowSec() + lifetimeDays * 86400,
      choices: choices
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rec)); } catch (_) {}
    return rec;
  }

  function isValid(rec) {
    if (!rec || rec.version !== configVersion) return false;
    if (rec.expires && rec.expires < nowSec()) return false;
    return true;
  }

  function currentChoices() {
    var rec = loadRecord();
    return isValid(rec) ? (rec.choices || {}) : null;
  }

  function isCategoryGranted(id) {
    // Required categories are always granted without asking.
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === id && categories[i].required) return true;
    }
    var ch = currentChoices();
    // No valid consent record → treat all optional as declined.
    return ch !== null && ch[id] === true;
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  window.afhConsent = {
    get: isCategoryGranted
  };

  // ── Consent gates ───────────────────────────────────────────────────────────
  //
  // Consent gate elements:  <div data-consent-gate="maps">
  //   Inside: .afh-consent-placeholder  (visible when not granted)
  //           .afh-consent-gated        (hidden when not granted, via CSS)
  //           <template class="afh-consent-deferred">  (for iframe-based widgets)
  //
  // This function runs SYNCHRONOUSLY before DOMContentLoaded (deferred script
  // ordering), so map-widget.js and video-widget.js see the correct classes
  // when they run their own initialization.

  function injectDeferredTemplate(gate) {
    var tpl = gate.querySelector('template.afh-consent-deferred');
    if (!tpl) return;
    var clone = document.importNode(tpl.content, true);
    tpl.parentNode.insertBefore(clone, tpl);
    tpl.parentNode.removeChild(tpl);
  }

  function applyGates() {
    document.querySelectorAll('[data-consent-gate]').forEach(function (gate) {
      var cat = gate.getAttribute('data-consent-gate');
      if (isCategoryGranted(cat)) {
        injectDeferredTemplate(gate);
        gate.classList.add('afh-consent-gate--granted');
      }
    });
  }

  function grantGate(categoryId) {
    document.querySelectorAll('[data-consent-gate="' + categoryId + '"]').forEach(function (gate) {
      if (!gate.classList.contains('afh-consent-gate--granted')) {
        injectDeferredTemplate(gate);
        gate.classList.add('afh-consent-gate--granted');
      }
    });
  }

  function revokeGate(categoryId) {
    document.querySelectorAll('[data-consent-gate="' + categoryId + '"]').forEach(function (gate) {
      gate.classList.remove('afh-consent-gate--granted');
    });
  }

  // ── Event dispatch ──────────────────────────────────────────────────────────
  function notifyChanged(choices) {
    try {
      document.dispatchEvent(new CustomEvent('afh:consent-changed', {
        detail: { choices: choices }
      }));
    } catch (_) {}
  }

  // ── Apply choices helper ────────────────────────────────────────────────────
  function applyAndNotify(choices) {
    storeRecord(choices);
    optionalCategories.forEach(function (c) {
      if (choices[c.id] === true) {
        grantGate(c.id);
      } else {
        revokeGate(c.id);
      }
    });
    notifyChanged(choices);
  }

  function buildAllGranted() {
    var ch = {};
    optionalCategories.forEach(function (c) { ch[c.id] = true; });
    return ch;
  }

  function buildAllDeclined() {
    var ch = {};
    optionalCategories.forEach(function (c) { ch[c.id] = false; });
    return ch;
  }

  // ── Body padding (prevent banner obscuring footer) ──────────────────────────
  var _resizeObserver = null;

  function setBodyPadding() {
    document.body.style.paddingBottom = banner.offsetHeight + 'px';
  }

  function clearBodyPadding() {
    document.body.style.paddingBottom = '';
  }

  function startObservingBannerSize() {
    if (_resizeObserver) return;
    if (typeof ResizeObserver === 'function') {
      _resizeObserver = new ResizeObserver(setBodyPadding);
      _resizeObserver.observe(banner);
    }
  }

  function stopObservingBannerSize() {
    if (_resizeObserver) {
      _resizeObserver.disconnect();
      _resizeObserver = null;
    }
  }

  // ── Banner show / hide ──────────────────────────────────────────────────────
  function showBanner() {
    banner.removeAttribute('hidden');
    void banner.offsetWidth; // force reflow so CSS transition fires
    banner.classList.add('afh-cookie-banner--visible');
    setBodyPadding();
    startObservingBannerSize();
    banner.focus();
  }

  function hideBanner() {
    banner.classList.remove('afh-cookie-banner--visible');
    stopObservingBannerSize();
    clearBodyPadding();
    banner.addEventListener('transitionend', function () {
      banner.setAttribute('hidden', '');
    }, { once: true });
  }

  // ── Manage panel ────────────────────────────────────────────────────────────
  var managePanel = document.getElementById('afh-cookie-manage-panel');

  function openManagePanel() {
    if (!managePanel) return;
    // Pre-fill toggles from stored choices (default to off for new categories).
    var choices = currentChoices() || {};
    optionalCategories.forEach(function (c) {
      var toggle = managePanel.querySelector('[data-consent-toggle="' + c.id + '"]');
      if (toggle) toggle.checked = choices[c.id] === true;
    });
    managePanel.removeAttribute('hidden');
    var manageBtn = document.getElementById('afh-cookie-manage-btn');
    if (manageBtn) manageBtn.setAttribute('aria-expanded', 'true');
  }

  function closeManagePanel() {
    if (!managePanel) return;
    managePanel.setAttribute('hidden', '');
    var manageBtn = document.getElementById('afh-cookie-manage-btn');
    if (manageBtn) manageBtn.setAttribute('aria-expanded', 'false');
  }

  function getManageChoices() {
    var ch = {};
    optionalCategories.forEach(function (c) {
      var toggle = managePanel && managePanel.querySelector('[data-consent-toggle="' + c.id + '"]');
      ch[c.id] = !!(toggle && toggle.checked);
    });
    return ch;
  }

  // ── Preferences page widget ─────────────────────────────────────────────────
  function initPrefsWidget() {
    var widget = document.getElementById('afh-cookie-preferences');
    if (!widget) return;

    // Populate toggles from current choices.
    var choices = currentChoices() || {};
    optionalCategories.forEach(function (c) {
      var toggle = widget.querySelector('[data-consent-toggle="' + c.id + '"]');
      if (toggle) toggle.checked = choices[c.id] === true;
    });

    var saveBtn = document.getElementById('afh-cookie-prefs-save');
    var status  = document.getElementById('afh-cookie-prefs-status');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', function () {
      var newChoices = {};
      optionalCategories.forEach(function (c) {
        var toggle = widget.querySelector('[data-consent-toggle="' + c.id + '"]');
        newChoices[c.id] = !!(toggle && toggle.checked);
      });
      applyAndNotify(newChoices);
      if (status) {
        status.textContent = str('saved');
        status.removeAttribute('hidden');
      }
    });
  }

  // ── Wire DOM event handlers ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {

    // Accept All
    var acceptBtn = document.getElementById('afh-cookie-accept-all');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        applyAndNotify(buildAllGranted());
        closeManagePanel();
        hideBanner();
      });
    }

    // Decline All (present in both compact bar and manage panel)
    document.querySelectorAll('[data-cookie-decline-all]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyAndNotify(buildAllDeclined());
        closeManagePanel();
        hideBanner();
      });
    });

    // Manage Cookies toggle
    var manageBtn = document.getElementById('afh-cookie-manage-btn');
    if (manageBtn) {
      manageBtn.addEventListener('click', function () {
        if (managePanel && !managePanel.hasAttribute('hidden')) {
          closeManagePanel();
        } else {
          openManagePanel();
        }
      });
    }

    // Save selected (from manage panel)
    var saveSelBtn = document.getElementById('afh-cookie-save-selected');
    if (saveSelBtn) {
      saveSelBtn.addEventListener('click', function () {
        applyAndNotify(getManageChoices());
        closeManagePanel();
        hideBanner();
      });
    }

    // Inline placeholder "Enable X Cookies" buttons — event delegation.
    // Clicking grants only that single category and activates its widgets inline.
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent-enable]');
      if (!btn) return;
      var catId = btn.getAttribute('data-consent-enable');
      if (!catId) return;
      var ch = currentChoices() || {};
      ch[catId] = true;
      storeRecord(ch);
      grantGate(catId);
      notifyChanged(ch);
    });

    // Preferences widget on the cookies page
    initPrefsWidget();

    // Show banner if no valid consent exists and there are optional categories
    if (optionalCategories.length > 0 && !isValid(loadRecord())) {
      showBanner();
    }
  });

  // ── Startup: synchronous gate application ───────────────────────────────────
  // Runs before DOMContentLoaded (deferred script order), so widget scripts
  // that also run before DOMContentLoaded see the correct gate classes.
  applyGates();

  // Renew expiry on every valid visit
  (function () {
    var rec = loadRecord();
    if (!isValid(rec)) return;
    rec.expires = nowSec() + lifetimeDays * 86400;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rec)); } catch (_) {}
  }());

}());
