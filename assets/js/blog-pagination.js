(function () {
  var list = document.querySelector('[data-blog-list]');
  if (!list) return;

  var items = Array.prototype.slice.call(list.querySelectorAll('[data-blog-item]'));
  if (!items.length) return;

  var perPage = parseInt(list.getAttribute('data-blog-per-page'), 10) || 10;
  var totalPages = Math.ceil(items.length / perPage);

  // No pagination needed if everything fits on one page
  if (totalPages <= 1) return;

  var nav = list.querySelector('[data-blog-pagination]');
  var prevBtn = list.querySelector('[data-blog-prev]');
  var nextBtn = list.querySelector('[data-blog-next]');
  var meta = list.querySelector('[data-blog-page-meta]');

  // Restore page from URL hash (#page-2) so browser back/forward works
  var currentPage = 1;
  var hashMatch = window.location.hash.match(/^#page-(\d+)$/);
  if (hashMatch) {
    var parsed = parseInt(hashMatch[1], 10);
    if (parsed >= 1 && parsed <= totalPages) currentPage = parsed;
  }

  function render(page) {
    currentPage = page;
    var start = (page - 1) * perPage;
    var end = start + perPage;

    items.forEach(function (item, i) {
      item.classList.toggle('is-pagination-hidden', i < start || i >= end);
    });

    prevBtn.disabled = page === 1;
    nextBtn.disabled = page === totalPages;
    meta.textContent = 'Page ' + page + ' of ' + totalPages;

    // Update URL hash without scrolling
    history.replaceState(null, '', page === 1 ? window.location.pathname : '#page-' + page);
  }

  prevBtn.addEventListener('click', function () {
    if (currentPage > 1) {
      render(currentPage - 1);
      list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  nextBtn.addEventListener('click', function () {
    if (currentPage < totalPages) {
      render(currentPage + 1);
      list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Keyboard shortcuts: J / [ = previous, K / ] = next
  // Only fires when the pagination is visible and the user is not typing
  document.addEventListener('keydown', function (e) {
    if (nav.classList.contains('blog-pagination--hidden')) return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (document.activeElement && document.activeElement.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'j' || e.key === 'J' || e.key === '[') {
      if (currentPage > 1) {
        render(currentPage - 1);
        list.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else if (e.key === 'k' || e.key === 'K' || e.key === ']') {
      if (currentPage < totalPages) {
        render(currentPage + 1);
        list.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  nav.classList.remove('blog-pagination--hidden');
  render(currentPage);
}());
