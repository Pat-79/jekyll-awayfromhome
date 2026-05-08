import { SearchEngine, debounce } from '/assets/js/full/search.js';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, query) {
  const safeText = escapeHtml(text || '');
  const terms = [...new Set((query || '').trim().split(/\s+/).filter(Boolean))]
    .sort((a, b) => b.length - a.length);

  if (!terms.length) return safeText;

  const pattern = terms.map(escapeRegExp).join('|');
  if (!pattern) return safeText;

  return safeText.replace(new RegExp(`(${pattern})`, 'ig'), '<mark>$1</mark>');
}

function toBool(value) {
  return value !== 'false';
}

function saveHighlightTerms(query) {
  try {
    if (query && query.trim()) {
      localStorage.setItem('afh-highlight-terms', query.trim());
    }
  } catch (e) {}
}

function initSearchWidget(widget) {
  const input = widget.querySelector('[data-search-input]');
  const resultsBox = widget.querySelector('[data-search-results]');
  if (!input || !resultsBox) return;

  const isHeaderWidget = Boolean(widget.closest('.site-header'));

  function getHeaderOffset() {
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const cssVar = getComputedStyle(document.documentElement).getPropertyValue('--header-height') || '0';
    const cssHeight = Number.parseFloat(cssVar);
    const safeCssHeight = Number.isFinite(cssHeight) ? cssHeight : 0;
    return Math.max(headerHeight, safeCssHeight, 0);
  }

  function alignInputToTopIfNeeded() {
    if (isHeaderWidget) return;

    const targetTop = getHeaderOffset() + 8;
    const inputTop = input.getBoundingClientRect().top;

    // Only adjust when the field sits noticeably below the desired top anchor.
    if (inputTop <= targetTop + 2) return;

    const nextY = Math.max(0, window.scrollY + (inputTop - targetTop));
    window.scrollTo({ top: nextY, behavior: 'auto' });
  }

  const limit = Number(widget.dataset.searchLimit || 8);
  const version = widget.dataset.searchVersion || '';
  const syncQuery = toBool(widget.dataset.searchSyncQuery || 'true');

  const engine = new SearchEngine();
  let results = [];
  let active = -1;

  function syncQueryParam(query) {
    if (!syncQuery) return;

    const url = new URL(window.location);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    window.history.replaceState({}, '', url);
  }

  function clearResults() {
    results = [];
    active = -1;
    resultsBox.innerHTML = '';
  }

  function cancelSearch() {
    input.value = '';
    clearResults();
    syncQueryParam('');
  }

  function updateActiveClass() {
    resultsBox.querySelectorAll('.search-widget__item').forEach((element, index) => {
      element.classList.toggle('is-active', index === active);
    });
  }

  function render(nextResults) {
    results = nextResults;
    active = -1;

    const rtlLangs = ['ar', 'he', 'fa', 'ur', 'dv', 'ku', 'ps', 'sd', 'ug', 'yi'];
    const query = input.value;
    const rows = nextResults.slice(0, limit).map((entry) => {
      const hasImage = Boolean(entry.image);
      const itemClass = hasImage ? 'search-widget__item search-widget__item--with-thumb' : 'search-widget__item';
      const media = hasImage
        ? `<div class="search-widget__thumb-wrap"><img class="search-widget__thumb" src="${escapeHtml(entry.image)}" alt="" loading="lazy" decoding="async" /></div>`
        : '';
      const lang = entry.lang || '';
      const langBase = lang.split('-')[0].toLowerCase();
      const dir = rtlLangs.includes(langBase) ? 'rtl' : 'ltr';
      const langAttr = lang ? ` lang="${escapeHtml(lang)}"` : '';
      const dirAttr = lang ? ` dir="${dir}"` : '';

      return `<li class="${itemClass}" data-url="${entry.url}"${langAttr}${dirAttr}>
        ${media}
        <div class="search-widget__content">
          <div class="search-widget__title">${highlightText(entry.title || 'Untitled', query)}</div>
          <div class="search-widget__url">${escapeHtml(entry.url || '')}</div>
          <div class="search-widget__excerpt">${highlightText(entry.excerpt || '', query)}</div>
        </div>
      </li>`;
    });

    resultsBox.innerHTML = rows.join('');

    if (typeof window.afhWrapFlagGlyphs === 'function') {
      window.afhWrapFlagGlyphs(resultsBox);
    }

    // Auto-highlight first result if any results exist
    if (nextResults.length > 0) {
      active = 0;
      updateActiveClass();
    }
  }

  const run = debounce(async (value) => {
    const query = (value || '').trim();

    if (!query) {
      clearResults();
      syncQueryParam('');

      return;
    }

    await engine.load(version);

    const pageLang = document.documentElement.lang || 'en';
    const allResults = await engine.search(query);

    // Collect refs that have a page-language version — those take priority.
    const coveredRefs = new Set(
      allResults
        .filter(r => r.lang === pageLang && r.ref)
        .map(r => r.ref)
    );

    // Keep page-language results, plus cross-language results whose ref
    // is not already covered (no translated version exists for this page).
    const filtered = allResults.filter(r =>
      r.lang === pageLang || !r.ref || !coveredRefs.has(r.ref)
    );

    render(filtered);
    syncQueryParam(query);
  }, 120);

  input.addEventListener('input', (event) => {
    run(event.target.value);
  });

  input.addEventListener('focus', () => {
    alignInputToTopIfNeeded();
    window.setTimeout(alignInputToTopIfNeeded, 180);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      cancelSearch();
      input.blur();
      return;
    }

    if (!results.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      active = Math.min(active + 1, Math.min(results.length, limit) - 1);
      updateActiveClass();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      active = Math.max(active - 1, 0);
      updateActiveClass();
      return;
    }

    if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      saveHighlightTerms(input.value);
      window.location = results[active].url;
    }
  });

  resultsBox.addEventListener('click', (event) => {
    const item = event.target.closest('.search-widget__item');
    if (!item) return;
    saveHighlightTerms(input.value);
    window.location = item.dataset.url;
  });

  document.addEventListener('pointerdown', (event) => {
    if (widget.contains(event.target)) return;
    cancelSearch();
  });

  const queryParam = new URLSearchParams(window.location.search).get('q');
  if (queryParam) {
    input.value = queryParam;
    run(queryParam);
  }
}

function isTypingTarget(element) {
  if (!element) return false;
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
}

function findSearchInput() {
  const inputs = Array.from(document.querySelectorAll('[data-search-widget] [data-search-input]'));
  return inputs.find((input) => {
    if (!input || input.disabled) return false;
    return input.offsetParent !== null || input.getClientRects().length > 0;
  }) || null;
}

document.addEventListener('keydown', (event) => {
  const active = document.activeElement;
  const typing = isTypingTarget(active);
  const slashHotkey = event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey;

  if (!slashHotkey) return;
  if (typing) return;

  const input = findSearchInput();
  if (!input) return;

  event.preventDefault();
  input.focus();
  input.select();
});

document.querySelectorAll('[data-search-widget]').forEach((widget) => {
  initSearchWidget(widget);
});