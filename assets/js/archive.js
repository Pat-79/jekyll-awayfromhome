(function () {
  var list = document.querySelector('[data-archive-list]');
  if (!list) return;

  var controls = document.querySelector('[data-archive-controls]');
  if (!controls) return;

  var yearSelect = controls.querySelector('[data-archive-year]');
  var monthSelect = controls.querySelector('[data-archive-month]');
  var daySelect = controls.querySelector('[data-archive-day]');
  var resetBtn = controls.querySelector('[data-archive-reset]');

  var items = Array.prototype.slice.call(list.querySelectorAll('[data-archive-item]'));
  if (!items.length) return;

  var statusEl = document.querySelector('[data-archive-status]');
  var emptyEl = list.querySelector('[data-archive-empty]');

  var nav = list.querySelector('[data-archive-pagination]');
  var prevBtn = list.querySelector('[data-archive-prev]');
  var nextBtn = list.querySelector('[data-archive-next]');
  var pageMeta = list.querySelector('[data-archive-page-meta]');

  var perPage = parseInt(list.getAttribute('data-archive-per-page'), 10) || 10;
  var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function toInt(value) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }

  function parsePositiveParam(params, keys) {
    for (var i = 0; i < keys.length; i += 1) {
      var raw = params.get(keys[i]);
      if (!raw) continue;
      var parsed = toInt(raw);
      if (parsed && parsed > 0) return parsed;
    }
    return null;
  }

  function sortAsc(a, b) {
    return a - b;
  }

  function sortDesc(a, b) {
    return b - a;
  }

  function buildSelectOptions(select, options, placeholder, selectedValue) {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }

    var defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = placeholder;
    select.appendChild(defaultOpt);

    options.forEach(function (option) {
      var el = document.createElement('option');
      el.value = String(option.value);
      el.textContent = option.label;
      select.appendChild(el);
    });

    if (selectedValue !== null && selectedValue !== undefined && selectedValue !== '') {
      select.value = String(selectedValue);
      if (select.value !== String(selectedValue)) {
        select.value = '';
      }
    }
  }

  var records = items.map(function (item) {
    return {
      element: item,
      year: toInt(item.getAttribute('data-archive-year')),
      month: toInt(item.getAttribute('data-archive-month')),
      day: toInt(item.getAttribute('data-archive-day'))
    };
  });

  var yearsSet = Object.create(null);
  var monthsSet = Object.create(null);
  var daysSet = Object.create(null);
  var monthsByYear = Object.create(null);
  var daysByYear = Object.create(null);
  var daysByYearMonth = Object.create(null);

  records.forEach(function (record) {
    if (!record.year || !record.month || !record.day) return;

    yearsSet[record.year] = true;
    monthsSet[record.month] = true;
    daysSet[record.day] = true;

    if (!monthsByYear[record.year]) monthsByYear[record.year] = Object.create(null);
    monthsByYear[record.year][record.month] = true;

    if (!daysByYear[record.year]) daysByYear[record.year] = Object.create(null);
    daysByYear[record.year][record.day] = true;

    var ymKey = record.year + '-' + record.month;
    if (!daysByYearMonth[ymKey]) daysByYearMonth[ymKey] = Object.create(null);
    daysByYearMonth[ymKey][record.day] = true;
  });

  function objectKeysToSortedInts(map, comparator) {
    return Object.keys(map || {}).map(function (key) {
      return toInt(key);
    }).filter(function (value) {
      return value !== null;
    }).sort(comparator);
  }

  function getYearOptions() {
    return objectKeysToSortedInts(yearsSet, sortDesc).map(function (year) {
      return { value: year, label: String(year) };
    });
  }

  function getMonthOptions(year) {
    var source = year && monthsByYear[year] ? monthsByYear[year] : monthsSet;
    return objectKeysToSortedInts(source, sortAsc).map(function (month) {
      return { value: month, label: monthNames[month - 1] || String(month) };
    });
  }

  function getDayOptions(year, month) {
    var source;

    if (year && month) {
      source = daysByYearMonth[year + '-' + month] || Object.create(null);
    } else if (year) {
      source = daysByYear[year] || Object.create(null);
    } else {
      source = daysSet;
    }

    return objectKeysToSortedInts(source, sortAsc).map(function (day) {
      return { value: day, label: String(day) };
    });
  }

  function normalizeFiltersFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var year = parsePositiveParam(params, ['year', 'y']);
    var month = parsePositiveParam(params, ['month', 'm']);
    var day = parsePositiveParam(params, ['day', 'date', 'd']);
    var page = parsePositiveParam(params, ['page', 'p']) || 1;

    if (month && (month < 1 || month > 12)) month = null;
    if (day && (day < 1 || day > 31)) day = null;

    return {
      year: year,
      month: month,
      day: day,
      page: page
    };
  }

  var state = normalizeFiltersFromUrl();

  function updateSelectors() {
    buildSelectOptions(yearSelect, getYearOptions(), 'All years', state.year);
    buildSelectOptions(monthSelect, getMonthOptions(state.year), 'All months', state.month);
    buildSelectOptions(daySelect, getDayOptions(state.year, state.month), 'All days', state.day);

    state.year = toInt(yearSelect.value);
    state.month = toInt(monthSelect.value);
    state.day = toInt(daySelect.value);
  }

  function buildStatusText(count) {
    var parts = [];
    if (state.year) parts.push(String(state.year));
    if (state.month) parts.push(monthNames[state.month - 1] || String(state.month));
    if (state.day) parts.push(String(state.day));

    var prefix = parts.length ? ('Filtered by ' + parts.join(' / ')) : 'Showing all posts';
    return prefix + ' - ' + count + ' post' + (count === 1 ? '' : 's');
  }

  function matchesFilter(record) {
    if (state.year && record.year !== state.year) return false;
    if (state.month && record.month !== state.month) return false;
    if (state.day && record.day !== state.day) return false;
    return true;
  }

  function syncUrl(totalPages) {
    var params = new URLSearchParams(window.location.search);

    ['year', 'y', 'month', 'm', 'day', 'date', 'd', 'page', 'p'].forEach(function (key) {
      params.delete(key);
    });

    if (state.year) params.set('year', String(state.year));
    if (state.month) params.set('month', String(state.month));
    if (state.day) params.set('day', String(state.day));
    if (state.page > 1 && totalPages > 1) params.set('page', String(state.page));

    var nextUrl = window.location.pathname;
    var query = params.toString();
    if (query) nextUrl += '?' + query;

    window.history.replaceState(null, '', nextUrl);
  }

  function render() {
    var filtered = records.filter(matchesFilter);
    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / perPage));

    if (state.page < 1) state.page = 1;
    if (state.page > totalPages) state.page = totalPages;

    var start = (state.page - 1) * perPage;
    var end = start + perPage;

    records.forEach(function (record) {
      record.element.classList.add('is-pagination-hidden');
    });

    filtered.forEach(function (record, index) {
      var show = index >= start && index < end;
      record.element.classList.toggle('is-pagination-hidden', !show);
    });

    if (statusEl) {
      statusEl.textContent = buildStatusText(total);
    }

    if (emptyEl) {
      emptyEl.hidden = total !== 0;
    }

    if (nav && prevBtn && nextBtn && pageMeta) {
      if (totalPages <= 1 || total === 0) {
        nav.classList.add('blog-pagination--hidden');
      } else {
        nav.classList.remove('blog-pagination--hidden');
      }

      prevBtn.disabled = state.page <= 1;
      nextBtn.disabled = state.page >= totalPages;
      pageMeta.textContent = 'Page ' + state.page + ' of ' + totalPages;
    }

    syncUrl(totalPages);
  }

  function hasActiveFilters() {
    return !!(state.year || state.month || state.day);
  }

  function scrollToResults(behavior) {
    list.scrollIntoView({ behavior: behavior || 'smooth', block: 'start' });
  }

  function onFilterChange() {
    var selectedMonth = toInt(monthSelect.value);
    var selectedDay = toInt(daySelect.value);

    state.year = toInt(yearSelect.value);
    buildSelectOptions(monthSelect, getMonthOptions(state.year), 'All months', selectedMonth);
    state.month = toInt(monthSelect.value);

    buildSelectOptions(daySelect, getDayOptions(state.year, state.month), 'All days', selectedDay);
    state.day = toInt(daySelect.value);

    state.page = 1;
    render();
    if (hasActiveFilters()) {
      scrollToResults('smooth');
    }
  }

  yearSelect.addEventListener('change', onFilterChange);
  monthSelect.addEventListener('change', onFilterChange);
  daySelect.addEventListener('change', function () {
    state.day = toInt(daySelect.value);
    state.page = 1;
    render();
    if (hasActiveFilters()) {
      scrollToResults('smooth');
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      state.year = null;
      state.month = null;
      state.day = null;
      state.page = 1;
      updateSelectors();
      render();
      scrollToResults('smooth');
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (state.page > 1) {
        state.page -= 1;
        render();
        list.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      state.page += 1;
      render();
      list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  window.addEventListener('popstate', function () {
    state = normalizeFiltersFromUrl();
    updateSelectors();
    render();
    if (hasActiveFilters()) {
      scrollToResults('auto');
    }
  });

  updateSelectors();
  render();
  if (hasActiveFilters()) {
    scrollToResults('auto');
  }
}());
