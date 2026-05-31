/**
 * Language preference persistence.
 *
 * Stores the user's preferred language in localStorage ("afh-lang").
 * When arriving on a fallback page (no translation exists in the preferred lang),
 * applies the preferred language's UI chrome strings so the site chrome stays in
 * the user's chosen language while the post content remains in the source language.
 * When a real translation exists, redirects to it automatically.
 *
 * On first visit (no stored preference), auto-detects the best matching language
 * using: (1) browser language list, (2) timezone hint list injected at build time.
 */

var STORAGE_KEY = 'afh-lang';

function afhReadMetaJson(metaEl) {
  if (!metaEl) return null;

  var raw = '';
  if (metaEl.content && typeof metaEl.content.textContent === 'string') {
    raw = metaEl.content.textContent;
  }
  if (!raw && typeof metaEl.innerHTML === 'string') {
    raw = metaEl.innerHTML;
  }
  if (!raw && typeof metaEl.textContent === 'string') {
    raw = metaEl.textContent;
  }

  raw = raw ? raw.trim() : '';
  if (!raw) return null;

  return JSON.parse(raw);
}

function afhReadStoredLang() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    return null;
  }
}

function afhClearStoredLang() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}
}

function afhUpdateLangSelect(select, lang, isAuto) {
  if (!select) return;

  for (var i = 0; i < select.options.length; i++) {
    var opt = select.options[i];
    var optIsAuto = opt.getAttribute('data-auto') === 'true';
    opt.selected = isAuto ? optIsAuto : (opt.getAttribute('data-lang') === lang);
  }
}

// Expose lang-change handler for the language selector's onchange attribute.
// Defined at top level so it is immediately available as a global.
window.afhLangChange = function (select) {
  var opt = select.options[select.selectedIndex];
  var lang = opt ? opt.getAttribute('data-lang') : null;
  var isAuto = opt && opt.getAttribute('data-auto') === 'true';
  if (isAuto) {
    afhClearStoredLang();
  } else if (lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {}
  }
  var target = new URL(select.value, window.location.origin);
  if (window.location.search) {
    target.search = window.location.search;
  }
  if (!target.hash && window.location.hash) {
    target.hash = window.location.hash;
  }
  window.location.href = target.toString();
};

/**
 * Detect the best matching site language for this visitor.
 *
 * Strategy (priority order):
 *   1. navigator.languages — BCP 47 list, user's explicit browser preference.
 *      For each entry: try exact match, then strip region subtag (nl-BE → nl).
 *   2. Timezone hint list — weak geographic signal as tiebreaker.
 *
 * @param {string[]} available  Language codes configured for this site.
 * @param {string}   fallback   Default language code to return if nothing matches.
 * @returns {string}
 */
function afhDetectLang(available, fallback, timezoneHints) {
  // 1. Browser language preferences
  var navLangs = [];
  try {
    navLangs = (navigator.languages && navigator.languages.length)
      ? Array.prototype.slice.call(navigator.languages)
      : (navigator.language ? [navigator.language] : []);
  } catch (e) {}

  for (var i = 0; i < navLangs.length; i++) {
    var tag = navLangs[i];
    // Exact match first (e.g. nl-BE if nl-BE is a configured language)
    if (available.indexOf(tag) >= 0) return tag;
    // Base language fallback (nl-BE → nl)
    var base = tag.split('-')[0].toLowerCase();
    if (base !== tag && available.indexOf(base) >= 0) return base;
  }

  // 2. Timezone hint (ordered list per timezone). Missing or empty lists
  // fall back to the site default language passed in as `fallback`.
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    var tzCandidates = timezoneHints ? timezoneHints[tz] : null;

    if (typeof tzCandidates === 'string') {
      tzCandidates = [tzCandidates];
    }

    if (Array.isArray(tzCandidates)) {
      for (var j = 0; j < tzCandidates.length; j++) {
        var tzLang = tzCandidates[j];
        if (available.indexOf(tzLang) >= 0) return tzLang;
      }
    }
  } catch (e) {}

  return fallback;
}

/**
 * Toggle language selector labels between full and short variants.
 * Uses data-label-full and data-label-short attributes on <option> elements.
 */
function afhApplyResponsiveLangLabels() {
  var select = document.querySelector('.lang-select');
  if (!select) return;

  var shortBreakpoint = parseInt(select.getAttribute('data-short-breakpoint') || '900', 10);
  if (!shortBreakpoint || shortBreakpoint < 320) shortBreakpoint = 900;
  var mediaQuery = '(max-width: ' + shortBreakpoint + 'px)';

  var useShort = false;
  try {
    useShort = window.matchMedia(mediaQuery).matches;
  } catch (e) {}

  for (var i = 0; i < select.options.length; i++) {
    var opt = select.options[i];
    var fullLabel = opt.getAttribute('data-label-full') || opt.text;
    var shortLabel = opt.getAttribute('data-label-short') || fullLabel;
    var nextLabel = useShort ? shortLabel : fullLabel;
    if (opt.text !== nextLabel) opt.text = nextLabel;
  }
}

(function () {
  // Keep language selector compact on narrow screens.
  afhApplyResponsiveLangLabels();
  try {
    var shortBreakpoint = 900;
    var selectEl = document.querySelector('.lang-select');
    if (selectEl) {
      var parsed = parseInt(selectEl.getAttribute('data-short-breakpoint') || '900', 10);
      if (parsed && parsed >= 320) shortBreakpoint = parsed;
    }
    var mql = window.matchMedia('(max-width: ' + shortBreakpoint + 'px)');
    if (mql.addEventListener) {
      mql.addEventListener('change', afhApplyResponsiveLangLabels);
    } else if (mql.addListener) {
      mql.addListener(afhApplyResponsiveLangLabels);
    }
  } catch (e) {}

  var metaEl = document.getElementById('afh-page-meta');
  if (!metaEl) return;

  var meta;
  try {
    meta = afhReadMetaJson(metaEl);
  } catch (e) { return; }
  if (!meta) return;

  var pageLang    = meta.currentLang  || 'en';
  var defaultLang = meta.defaultLang  || 'en';
  var translations = meta.translations || {};
  var i18nBasePath = (meta.i18nBasePath || '/assets/data/i18n').replace(/\/+$/, '');
  var timezoneHintsPath = meta.timezoneHintsPath || null;
  var availableLangs = (meta.availableLangs && meta.availableLangs.length)
    ? meta.availableLangs
    : [defaultLang];
  var langSelect = document.querySelector('.lang-select');
  var i18nCache = {};

  window.afhI18nGetLoaded = function (lang) {
    return i18nCache[lang] || null;
  };

  function loadLangI18n(lang) {
    lang = (lang || '').trim();
    if (!lang) return Promise.resolve(null);
    if (i18nCache[lang]) return Promise.resolve(i18nCache[lang]);

    var url = i18nBasePath + '/' + encodeURIComponent(lang) + '.json';
    return fetch(url, { credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (payload) {
        if (payload && typeof payload === 'object') {
          i18nCache[lang] = payload;
          return payload;
        }
        return null;
      })
      .catch(function () { return null; });
  }

  // Check for an explicit stored preference set only via the language selector.
  var storedLang = afhReadStoredLang();
  if (storedLang && availableLangs.indexOf(storedLang) < 0) {
    storedLang = null;
    afhClearStoredLang();
  }

  // Keep the selector aligned with preference state: explicit preference wins,
  // otherwise show the automatic mode entry.
  afhUpdateLangSelect(langSelect, storedLang, !storedLang);

  // In automatic mode, a visitor who directly opens a translated URL should stay
  // there. Auto-detection only redirects from the default-language page.
  if (!storedLang && pageLang !== defaultLang) return;

  // No explicit preference — detect from browser on every visit (not saved).
  var targetLang = storedLang;
  if (!targetLang) {
    // Try browser languages first (synchronous, no network round-trip needed).
    var detected = afhDetectLang(availableLangs, defaultLang, {});
    if (detected && detected !== defaultLang) {
      targetLang = detected;
    } else if (timezoneHintsPath) {
      // Browser languages gave no match — fall back to timezone hints (async).
      fetch(timezoneHintsPath, { credentials: 'same-origin' })
        .then(function (res) { return res.ok ? res.json() : {}; })
        .then(function (hints) {
          var tzDetected = afhDetectLang(availableLangs, defaultLang, hints);
          if (tzDetected && tzDetected !== defaultLang) {
            dispatchToTargetLang(tzDetected);
          }
        })
        .catch(function () {});
      return;
    }
  }

  // If an explicit preference already matches the current page, no redirect is needed.
  if (storedLang && storedLang === pageLang) return;

  if (!targetLang || targetLang === pageLang) return;

  dispatchToTargetLang(targetLang);

  function dispatchToTargetLang(lang) {
    if (!lang || lang === pageLang) return;
    if (translations[lang]) {
      // A real translation exists — redirect to it, preserving query string and hash.
      var target = translations[lang];
      if (window.location.search) target += window.location.search;
      if (window.location.hash) target += window.location.hash;
      window.location.replace(target);
      return;
    }
    // No translation available — apply preferred lang's chrome strings.
    loadLangI18n(lang).then(function (strings) {
      if (strings) applyLangOverride(lang, strings);
    });
  }

  function applyLangOverride(lang, strings) {
    if (!strings) return;

    var rtlLangs = ['ar', 'he', 'fa', 'ur', 'dv', 'ku', 'ps', 'sd', 'ug', 'yi'];
    var base = lang.split('-')[0].toLowerCase();
    var overrideDir = rtlLangs.indexOf(base) >= 0 ? 'rtl' : 'ltr';

    // Set preferred lang/dir on <html> so chrome (header, sidebar, footer)
    // inherits it. The <main> element has its own lang/dir attributes (set at
    // build time) that override this for the post content area.
    var html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', overrideDir);

    // Restore <main> to the page's actual language/direction so post content
    // is not affected by the chrome override above.
    var mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.setAttribute('lang', pageLang);
      mainEl.setAttribute('dir', rtlLangs.indexOf(pageLang.split('-')[0].toLowerCase()) >= 0 ? 'rtl' : 'ltr');
    }

    // Swap textContent for all [data-i18n] elements.
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var key = el.getAttribute('data-i18n');
      var val = getNestedKey(strings, key);
      if (!val) continue;
      if (el.hasAttribute('data-i18n-upcase')) val = val.toUpperCase();
      el.textContent = val;
    }

    // Swap placeholder attribute for [data-i18n-placeholder] elements.
    var placeholderEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var k = 0; k < placeholderEls.length; k++) {
      var pEl = placeholderEls[k];
      var pVal = getNestedKey(strings, pEl.getAttribute('data-i18n-placeholder'));
      if (pVal) pEl.placeholder = pVal;
    }

    // Update language selector: keep Auto if there is no stored preference,
    // otherwise reflect the explicit stored language.
    afhUpdateLangSelect(document.querySelector('.lang-select'), lang, !storedLang);
  }

  function getNestedKey(obj, keyPath) {
    var parts = keyPath.split('.');
    var val = obj;
    for (var i = 0; i < parts.length; i++) {
      if (val == null || typeof val !== 'object') return null;
      val = val[parts[i]];
    }
    return typeof val === 'string' ? val : null;
  }
}());
