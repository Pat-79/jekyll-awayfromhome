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
 * using: (1) browser language list, (2) timezone hint.
 */

var STORAGE_KEY = 'afh-lang';

// Expose lang-change handler for the language selector's onchange attribute.
// Defined at top level so it is immediately available as a global.
window.afhLangChange = function (select) {
  var opt = select.options[select.selectedIndex];
  var lang = opt ? opt.getAttribute('data-lang') : null;
  if (lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }
  window.location.href = select.value;
};

// ── Timezone → language hint map ─────────────────────────────────────────────
// Only covers languages that this theme supports. English is the default fallback
// and does not need to be listed here.
var AFH_TZ_LANG = {
  // Dutch
  'Europe/Amsterdam': 'nl',
  'Europe/Brussels':  'nl',
  // German
  'Europe/Berlin':    'de',
  'Europe/Vienna':    'de',
  'Europe/Zurich':    'de',
  'Europe/Vaduz':     'de',
  // Arabic
  'Asia/Riyadh':      'ar',
  'Asia/Dubai':       'ar',
  'Asia/Baghdad':     'ar',
  'Asia/Beirut':      'ar',
  'Asia/Amman':       'ar',
  'Asia/Kuwait':      'ar',
  'Asia/Qatar':       'ar',
  'Asia/Aden':        'ar',
  'Asia/Bahrain':     'ar',
  'Asia/Muscat':      'ar',
  'Asia/Damascus':    'ar',
  'Asia/Gaza':        'ar',
  'Asia/Hebron':      'ar',
  'Asia/Sanaa':       'ar',
  'Africa/Cairo':     'ar',
  'Africa/Tunis':     'ar',
  'Africa/Algiers':   'ar',
  'Africa/Tripoli':   'ar',
  'Africa/Khartoum':  'ar',
  'Africa/Casablanca':'ar',
  'Africa/Nouakchott':'ar',
};

/**
 * Detect the best matching site language for this visitor.
 *
 * Strategy (priority order):
 *   1. navigator.languages — BCP 47 list, user's explicit browser preference.
 *      For each entry: try exact match, then strip region subtag (nl-BE → nl).
 *   2. Timezone hint — weak geographic signal as tiebreaker.
 *
 * @param {string[]} available  Language codes configured for this site.
 * @param {string}   fallback   Default language code to return if nothing matches.
 * @returns {string}
 */
function afhDetectLang(available, fallback) {
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

  // 2. Timezone hint
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    var tzLang = AFH_TZ_LANG[tz];
    if (tzLang && available.indexOf(tzLang) >= 0) return tzLang;
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
  try { meta = JSON.parse(metaEl.textContent); } catch (e) { return; }

  var pageLang    = meta.currentLang  || 'en';
  var defaultLang = meta.defaultLang  || 'en';
  var translations = meta.translations || {};
  var i18n         = meta.i18n         || {};

  // Pages served under a non-default language prefix are already in the right
  // language — nothing to do. Do NOT save to localStorage here; only an explicit
  // dropdown selection should persist a language preference.
  if (pageLang !== defaultLang) {
    return;
  }

  // Page is in the default language. Check for an explicit stored preference
  // (set only via the language selector dropdown).
  var storedLang;
  try { storedLang = localStorage.getItem(STORAGE_KEY); } catch (e) {}

  // No explicit preference — detect from browser on every visit (not saved).
  var targetLang = storedLang;
  if (!targetLang) {
    var available = Object.keys(i18n);
    var detected  = afhDetectLang(available, defaultLang);
    console.log('[afh] auto-detected language:', detected);
    if (detected && detected !== defaultLang) {
      targetLang = detected;
    }
  }

  if (!targetLang || targetLang === pageLang) return;

  // Target language differs from page language.
  if (translations[targetLang]) {
    // A real translation exists — redirect to it, preserving query string and hash.
    var target = translations[targetLang];
    if (window.location.search) target += window.location.search;
    if (window.location.hash) target += window.location.hash;
    window.location.replace(target);
    return;
  }

  // No translation available — apply preferred lang's chrome strings.
  applyLangOverride(targetLang, i18n);

  function applyLangOverride(lang, i18nData) {
    var strings = i18nData[lang];
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

    // Update language selector to visually reflect the override lang.
    var langSelect = document.querySelector('.lang-select');
    if (langSelect) {
      for (var j = 0; j < langSelect.options.length; j++) {
        var opt = langSelect.options[j];
        opt.selected = (opt.getAttribute('data-lang') === lang);
      }
    }
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
