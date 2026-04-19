(function () {
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
      status.textContent = "The requested filter does not exist.";
      return;
    }

    if (selectedType === "author") {
      status.textContent = 'Showing posts and pages by "' + label + '".';
    } else if (selectedType === "tag") {
      status.textContent = 'Showing posts and pages tagged "' + label + '".';
    } else if (selectedType === "category") {
      status.textContent = 'Showing posts and pages in category "' + label + '".';
    }
  }

  // Main UI update function
  function updateUI() {
    updateTypeSelectorStates();
    updateFilterGroupVisibility();
    var foundSection = updateResultsVisibility();
    updateFilterLinkStates();
    updateStatus();

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
