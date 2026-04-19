(function () {
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

  if (showAll) {
    status.hidden = false;
    status.textContent = "Showing posts for all tags.";
    return;
  }

  if (foundSection) {
    status.hidden = false;
    status.textContent = 'Showing posts tagged "' + foundSection.getAttribute("data-tag-label") + '".';

    window.requestAnimationFrame(function () {
      foundSection.scrollIntoView({ behavior: "auto", block: "start" });
    });
    return;
  }

  status.hidden = false;
  status.textContent = "The requested tag does not exist.";
}());
