// search-highlight.js
// When a visitor arrives from a search result click, highlights the searched
// terms in the page content, then immediately removes them from localStorage
// so a reload or any subsequent page load starts clean.

(function () {
  function readMetaJson(metaEl) {
    if (!metaEl) return null;

    let raw = '';
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
    return raw ? JSON.parse(raw) : null;
  }

  const STORAGE_KEY = 'afh-highlight-terms';

  let query = '';
  try {
    query = localStorage.getItem(STORAGE_KEY) || '';
    if (query) localStorage.removeItem(STORAGE_KEY);
  } catch (e) {}

  if (!query) return;

  // ── Language-specific config loaded lazily from /assets/data/i18n/{lang}.json ─
  // word_regex: pattern matching a single "word" token (no capturing group, no flags)
  // stopwords:  comma-separated list of words to exclude from highlighting

  const FALLBACK_WORD_REGEX = "[A-Za-zÀ-ÖØ-öø-ÿ0-9''\-]+";
  const FALLBACK_STOPWORDS  = 'a,about,above,after,again,against,all,also,am,an,and,any,are,around,as,at,be,because,been,before,being,below,between,both,but,by,can,could,day,days,did,do,does,doing,down,during,each,few,first,for,from,further,had,has,have,having,he,her,here,hers,herself,him,himself,his,how,i,if,in,into,is,it,its,itself,just,last,like,more,most,my,myself,no,nor,not,now,of,off,on,once,one,only,or,other,our,ours,ourselves,out,over,own,really,same,she,should,so,some,such,than,that,the,their,theirs,them,themselves,then,there,these,they,this,those,through,to,too,under,until,up,very,was,we,well,were,what,when,where,which,while,who,whom,why,will,with,without,would,you,your,yours,yourself,yourselves';

  // Read only routing info from meta; search config is fetched from the i18n endpoint.
  const metaEl = document.getElementById('afh-page-meta');
  let i18nBasePath = '/assets/data/i18n';
  let pageLang = 'en';
  let defaultLang = 'en';
  if (metaEl) {
    try {
      const meta = readMetaJson(metaEl);
      if (meta) {
        if (meta.i18nBasePath) i18nBasePath = meta.i18nBasePath.replace(/\/+$/, '');
        if (meta.currentLang) pageLang = meta.currentLang;
        if (meta.defaultLang) defaultLang = meta.defaultLang;
      }
    } catch (e) {}
  }

  // ── Levenshtein helpers (identical to search-worker.js) ─────────────────────

  function getMaxEditDistance(term) {
    const len = (term || '').length;
    if (len < 3) return 0;
    if (len <= 4) return 1;
    return 2;
  }

  function isFuzzyCandidate(word, term, maxDistance) {
    if (!word || !term) return false;
    if (Math.abs(word.length - term.length) > maxDistance) return false;
    if (term.length >= 3 && word[0] !== term[0]) return false;
    return true;
  }

  function levenshteinDistanceWithin(a, b, maxDistance) {
    if (a === b) return 0;
    const aLen = a.length;
    const bLen = b.length;
    if (Math.abs(aLen - bLen) > maxDistance) return -1;

    const prev = new Array(bLen + 1);
    const curr = new Array(bLen + 1);
    for (let j = 0; j <= bLen; j++) prev[j] = j;

    for (let i = 1; i <= aLen; i++) {
      curr[0] = i;
      let rowMin = curr[0];
      for (let j = 1; j <= bLen; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
        if (curr[j] < rowMin) rowMin = curr[j];
      }
      if (rowMin > maxDistance) return -1;
      for (let j = 0; j <= bLen; j++) prev[j] = curr[j];
    }
    return prev[bLen] <= maxDistance ? prev[bLen] : -1;
  }

  // ── Matching ─────────────────────────────────────────────────────────────────

  // Returns true if a page word matches a query term.
  // Mirrors the search-worker scoring logic:
  //   exact     → word === term
  //   prefix    → word starts with term ("traveled" matches "travel")
  //   fuzzy     → Levenshtein distance within tolerance, same first letter
  function wordMatchesTerm(word, term) {
    if (word === term) return true;
    if (word.startsWith(term)) return true;
    const maxDist = getMaxEditDistance(term);
    if (maxDist > 0 && isFuzzyCandidate(word, term, maxDist)) {
      return levenshteinDistanceWithin(term, word, maxDist) >= 0;
    }
    return false;
  }

  // ── Fetch search config lazily, then run ────────────────────────────────────

  function fetchLangJson(lang) {
    return fetch(i18nBasePath + '/' + encodeURIComponent(lang) + '.json', { credentials: 'same-origin' })
      .then((res) => res.ok ? res.json() : null)
      .catch(() => null);
  }

  const fetches = pageLang !== defaultLang
    ? [fetchLangJson(pageLang), fetchLangJson(defaultLang)]
    : [fetchLangJson(pageLang)];

  Promise.all(fetches).then(([pageI18n, defaultI18n = pageI18n]) => {
    let wordRegexStr = FALLBACK_WORD_REGEX;
    let stopwordsStr = FALLBACK_STOPWORDS;

    if (pageI18n && pageI18n.search) {
      if (pageI18n.search.word_regex) wordRegexStr = pageI18n.search.word_regex;
      if (pageI18n.search.stopwords) stopwordsStr = pageI18n.search.stopwords;
    }

    // Also include the default language's word pattern so that content in the
    // default language embedded in a translated page is tokenised correctly.
    if (defaultI18n && defaultI18n.search && defaultI18n.search.word_regex) {
      const defaultRegexStr = defaultI18n.search.word_regex;
      if (defaultRegexStr !== wordRegexStr) {
        wordRegexStr = wordRegexStr + '|' + defaultRegexStr;
      }
    }

    // Build the split regex: capturing group keeps matched tokens in the result array.
    let wordRegex;
    try {
      wordRegex = new RegExp('(' + wordRegexStr + ')');
    } catch (e) {
      wordRegex = new RegExp('(' + FALLBACK_WORD_REGEX + ')');
    }

    const STOPWORDS = new Set(stopwordsStr.split(',').map((s) => s.trim()).filter(Boolean));

    // Parse + filter query terms (same rules: length > 2, not a stopword)
    const terms = [...new Set(query.toLowerCase().trim().split(/\s+/).filter(Boolean))].filter(
      (t) => t.length > 2 && !STOPWORDS.has(t)
    );

    if (!terms.length) return;

    function wordMatchesAnyTerm(rawWord) {
      // Strip leading/trailing punctuation before comparing
      const word = rawWord.toLowerCase().replace(/^['''\-]+|['''\-]+$/g, '');
      if (word.length < 3) return false;
      for (const term of terms) {
        if (wordMatchesTerm(word, term)) return true;
      }
      return false;
    }

    // ── DOM highlighting ────────────────────────────────────────────────────────

    function escapeHtml(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    // Split text into alternating non-word / word segments and wrap matches.
    // Returns null when nothing matched (avoids unnecessary DOM mutations).
    function buildHighlightedHtml(text) {
      // wordRegex has a capturing group so split() keeps matched tokens at odd indices.
      const parts = text.split(wordRegex);
      let hasMatch = false;
      let result = '';

      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1 && wordMatchesAnyTerm(parts[i])) {
          hasMatch = true;
          result += `<mark class="afh-search-highlight">${escapeHtml(parts[i])}</mark>`;
        } else {
          result += escapeHtml(parts[i]);
        }
      }

      return hasMatch ? result : null;
    }

    // Tags whose entire subtree should be skipped
    const SKIP_TAGS = new Set([
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'MARK',
      'INPUT', 'TEXTAREA', 'SELECT',
      'IFRAME', 'CANVAS', 'SVG', 'MATH',
      'CODE', 'PRE',
    ]);

    // Target only the main content area — naturally excludes header, sidebar,
    // footer, and nav without any additional selector filtering.
    const root = document.getElementById('main-content') || document.body;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            return SKIP_TAGS.has(node.tagName)
              ? NodeFilter.FILTER_REJECT  // skip subtree entirely
              : NodeFilter.FILTER_SKIP;   // visit children but not this element node
          }
          // Text node: accept only if it contains non-whitespace
          return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        },
      }
    );

    // Collect first — mutating text nodes while walking can confuse the iterator
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    const template = document.createElement('template');

    for (const textNode of textNodes) {
      if (!textNode.parentNode) continue; // already detached (e.g. replaced earlier)
      const html = buildHighlightedHtml(textNode.textContent);
      if (!html) continue;
      template.innerHTML = html;
      textNode.parentNode.replaceChild(template.content, textNode);
    }
  });
}());
