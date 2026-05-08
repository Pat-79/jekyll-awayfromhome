(function () {
  function readMetaJson(metaEl) {
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
    return raw ? JSON.parse(raw) : null;
  }

  var tagPostsPage = document.querySelector("[data-tag-posts-page]");

  if (!tagPostsPage) {
    return;
  }

  var filterLinks = document.querySelectorAll("[data-tag-filter-link]");
  var status = document.querySelector("[data-tag-status]");
  var notFound = tagPostsPage.querySelector("[data-tag-not-found]");
  var sections = Array.prototype.slice.call(
    tagPostsPage.querySelectorAll("[data-tag-section]")
  );
  var params = new URLSearchParams(window.location.search);
  var selectedTag = params.get("tag");
  var normalizedTag = selectedTag ? selectedTag.toLowerCase() : "all";
  var showAll = !selectedTag || normalizedTag === "all" || normalizedTag === "*";
  var foundSection = null;

  sections.forEach(function (section) {
    var matches = showAll || section.getAttribute("data-tag-value") === normalizedTag;

    section.hidden = !matches;

    if (matches && !foundSection) {
      foundSection = section;
    }
  });

  if (notFound) {
    notFound.hidden = showAll || !!foundSection;
  }

  filterLinks.forEach(function (link) {
    var value = (link.getAttribute("data-tag-value") || "all").toLowerCase();
    var isActive = showAll ? value === "all" : value === normalizedTag;
    link.classList.toggle("is-active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  if (!status) {
    return;
  }

  // Read i18n strings from afh-page-meta. Fall back to data attributes, then hardcoded English.
  var tagsI18n = {};
  var metaEl = document.getElementById('afh-page-meta');
  if (metaEl) {
    try {
      var meta = readMetaJson(metaEl);
      var lang = document.documentElement.lang || (meta && meta.currentLang) || 'en';
      var langI18n = meta.i18n && (meta.i18n[lang] || meta.i18n[meta.currentLang]);
      if (langI18n && langI18n.tags) tagsI18n = langI18n.tags;
    } catch (e) {}
  }

  var i18nShowingAll = tagsI18n.showing_all
    || status.getAttribute('data-i18n-showing-all')
    || "Showing posts for all tags.";
  var i18nShowingTagged = tagsI18n.showing_tagged
    || status.getAttribute('data-i18n-showing-tagged')
    || 'Showing posts tagged "{label}".';
  var i18nNotFound = tagsI18n.not_found
    || status.getAttribute('data-i18n-not-found')
    || "The requested tag does not exist.";

  if (showAll) {
    status.hidden = false;
    status.textContent = i18nShowingAll;
    return;
  }

  if (foundSection) {
    status.hidden = false;
    status.textContent = i18nShowingTagged.replace('{label}', foundSection.getAttribute("data-tag-label"));

    window.requestAnimationFrame(function () {
      foundSection.scrollIntoView({ behavior: "auto", block: "start" });
    });
    return;
  }

  status.hidden = false;
  status.textContent = i18nNotFound;
}());
