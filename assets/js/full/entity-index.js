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

  var root = document.querySelector("[data-entity-posts-page]");
  var filterGroupsContainer = document.querySelector(".entity-filter-groups");
  var typeSelectorContainer = document.querySelector(".entity-type-selector");

  if (!root || !filterGroupsContainer || !typeSelectorContainer) {
    return;
  }

  var filterGroups = Array.prototype.slice.call(
    filterGroupsContainer.querySelectorAll("[data-entity-filter-group]")
  );
  var typeSelectors = Array.prototype.slice.call(
    typeSelectorContainer.querySelectorAll("[data-entity-type-selector]")
  );
  var filterLinks = document.querySelectorAll("[data-entity-filter-link]");
  var status = document.querySelector("[data-entity-status]");
  var notFound = root.querySelector("[data-entity-not-found]");
  var resultsSection = document.getElementById("browse-results") || root;
  var sections = Array.prototype.slice.call(
    root.querySelectorAll("[data-entity-section]")
  );

  var entityPerPage = parseInt(root.getAttribute('data-entity-per-page'), 10) || 10;
  var entityPageFormat = root.getAttribute('data-pagination-format') || 'Page {page} of {total}';

  // Read i18n strings from lang-persist's lazy-loaded cache when available.
  // Fall back to data attributes on the status element, then to hardcoded English.
  var browseI18n = {};
  try {
    var lang = document.documentElement.lang || 'en';
    if (typeof window.afhI18nGetLoaded === 'function') {
      var loaded = window.afhI18nGetLoaded(lang);
      if (loaded && loaded.browse) browseI18n = loaded.browse;
    }
  } catch (e) {}

  var i18nNotFound = browseI18n.not_found_status
    || (status && status.getAttribute('data-i18n-not-found'))
    || "The requested filter does not exist.";
  var i18nShowingAuthor = browseI18n.showing_author
    || (status && status.getAttribute('data-i18n-showing-author'))
    || 'Showing posts and pages by "{label}".';
  var i18nShowingTag = browseI18n.showing_tag
    || (status && status.getAttribute('data-i18n-showing-tag'))
    || 'Showing posts and pages tagged "{label}".';
  var i18nShowingCategory = browseI18n.showing_category
    || (status && status.getAttribute('data-i18n-showing-category'))
    || 'Showing posts and pages in category "{label}".';

  function formatEntityPageMeta(page, total) {
    return entityPageFormat.replace('{page}', page).replace('{total}', total);
  }

  function paginateSection(section, page) {
    var items = Array.prototype.slice.call(section.querySelectorAll('[data-entity-item]'));
    var nav = section.querySelector('[data-entity-pagination]');
    if (!items.length) return;

    var totalPages = Math.max(1, Math.ceil(items.length / entityPerPage));
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    var start = (page - 1) * entityPerPage;
    var end = start + entityPerPage;

    items.forEach(function (item, i) {
      item.classList.toggle('is-pagination-hidden', i < start || i >= end);
    });

    section.setAttribute('data-entity-current-page', String(page));

    if (!nav) return;

    if (totalPages <= 1) {
      nav.classList.add('blog-pagination--hidden');
    } else {
      nav.classList.remove('blog-pagination--hidden');
      var prevBtn = nav.querySelector('[data-entity-prev]');
      var nextBtn = nav.querySelector('[data-entity-next]');
      var meta = nav.querySelector('[data-entity-page-meta]');
      if (prevBtn) prevBtn.disabled = page <= 1;
      if (nextBtn) nextBtn.disabled = page >= totalPages;
      if (meta) meta.textContent = formatEntityPageMeta(page, totalPages);
    }
  }

  root.addEventListener('click', function (e) {
    var target = e.target;
    var isPrev = target.hasAttribute('data-entity-prev');
    var isNext = target.hasAttribute('data-entity-next');
    if (!isPrev && !isNext) return;
    var nav = target.parentNode;
    var section = nav && nav.parentNode;
    if (!section || !section.hasAttribute('data-entity-section')) return;
    var currentPage = parseInt(section.getAttribute('data-entity-current-page'), 10) || 1;
    paginateSection(section, isPrev ? currentPage - 1 : currentPage + 1);
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });


  var params = new URLSearchParams(window.location.search);
  var authorParam = params.get("author");
  var categoryParam = params.get("category");
  var tagParam = params.get("tag");

  // Determine selected type and value
  var selectedType = null;
  var selectedValue = null;

  if (authorParam) {
    selectedType = "author";
    selectedValue = authorParam.toLowerCase();
  } else if (categoryParam) {
    selectedType = "category";
    selectedValue = categoryParam.toLowerCase();
  } else if (tagParam) {
    selectedType = "tag";
    selectedValue = tagParam.toLowerCase();
  }

  // If no selection, default to first available type
  if (!selectedType && typeSelectors.length > 0) {
    selectedType = typeSelectors[0].getAttribute("data-entity-type-selector");
  }

  // Update type selector buttons
  typeSelectors.forEach(function (button) {
    var buttonType = button.getAttribute("data-entity-type-selector");
    var isActive = buttonType === selectedType;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");

    // Handle type selector clicks
    button.addEventListener("click", function (e) {
      e.preventDefault();

      if (selectedType === buttonType && selectedValue === null) {
        return;
      }

      selectedType = buttonType;
      selectedValue = null; // Clear value when switching type

      var clearedUrl = new URL(window.location);
      clearedUrl.searchParams.delete("author");
      clearedUrl.searchParams.delete("category");
      clearedUrl.searchParams.delete("tag");
      history.replaceState(null, "", clearedUrl.pathname + clearedUrl.hash);

      updateUI();
    });
  });

  // Update filter group visibility
  function updateFilterGroupVisibility() {
    filterGroups.forEach(function (group) {
      var groupType = group.getAttribute("data-entity-filter-group");
      group.style.display = groupType === selectedType ? "" : "none";
    });
  }

  // Results section visibility
  function updateResultsVisibility() {
    var hasSelection = selectedValue !== null;
    var foundSection = null;

    sections.forEach(function (section) {
      var sectionType = (section.getAttribute("data-entity-type") || "").toLowerCase();
      var sectionValue = (section.getAttribute("data-entity-value") || "").toLowerCase();
      var matches = hasSelection && sectionType === selectedType && sectionValue === selectedValue;

      section.hidden = !matches;

      if (matches && !foundSection) {
        foundSection = section;
      }
    });

    if (notFound) {
      notFound.hidden = !(!foundSection && selectedValue !== null);
    }

    return foundSection;
  }

  // Update active state of filter links
  function updateFilterLinkStates() {
    filterLinks.forEach(function (link) {
      var linkType = (link.getAttribute("data-entity-type") || "").toLowerCase();
      var linkValue = (link.getAttribute("data-entity-value") || "").toLowerCase();
      var isActive = selectedValue !== null && linkType === selectedType && linkValue === selectedValue;

      link.classList.toggle("is-active", isActive);
      link.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  // Update type selector button states
  function updateTypeSelectorStates() {
    typeSelectors.forEach(function (button) {
      var buttonType = button.getAttribute("data-entity-type-selector");
      var isActive = buttonType === selectedType;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  // Update status message
  function updateStatus() {
    if (!status) {
      return;
    }

    if (!selectedValue) {
      status.hidden = true;
      return;
    }

    status.hidden = false;
    var label = null;

    // Find the label from sections
    sections.forEach(function (section) {
      var sectionType = (section.getAttribute("data-entity-type") || "").toLowerCase();
      var sectionValue = (section.getAttribute("data-entity-value") || "").toLowerCase();
      if (sectionType === selectedType && sectionValue === selectedValue && !section.hidden) {
        label = section.getAttribute("data-entity-label") || selectedValue;
      }
    });

    if (!label) {
      status.textContent = i18nNotFound;
      return;
    }

    if (selectedType === "author") {
      status.textContent = i18nShowingAuthor.replace('{label}', label);
    } else if (selectedType === "tag") {
      status.textContent = i18nShowingTag.replace('{label}', label);
    } else if (selectedType === "category") {
      status.textContent = i18nShowingCategory.replace('{label}', label);
    }
  }

  // Main UI update function
  function updateUI() {
    updateTypeSelectorStates();
    updateFilterGroupVisibility();
    var foundSection = updateResultsVisibility();
    updateFilterLinkStates();
    updateStatus();

    if (foundSection) {
      paginateSection(foundSection, 1);
    }

    // Keep the entire results area hidden until a filter pill is selected.
    if (resultsSection) {
      resultsSection.hidden = !selectedValue;
    }

    // Only scroll if there's a selection
    if (selectedValue && foundSection) {
      window.requestAnimationFrame(function () {
        resultsSection.scrollIntoView({ behavior: "auto", block: "start" });
      });
    }
  }

  // Handle filter link clicks - prevent default and update state
  filterLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var linkType = (link.getAttribute("data-entity-type") || "").toLowerCase();
      var linkValue = (link.getAttribute("data-entity-value") || "").toLowerCase();

      // Update selected value
      selectedValue = linkValue;
      selectedType = linkType;

      // Update URL
      var url = new URL(window.location);
      url.searchParams.delete("author");
      url.searchParams.delete("category");
      url.searchParams.delete("tag");
      url.searchParams.set(linkType, linkValue);
      history.replaceState(null, "", url);

      updateUI();
    });
  });

  // Initial UI update
  updateUI();
}());
