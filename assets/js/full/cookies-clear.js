/**
 * Cookies clear widget.
 *
 * Reads localized strings from data attributes on #afh-clear-data-block so
 * each translated page can supply its own strings without needing i18n keys.
 *
 * Expected markup:
 *   <div id="afh-clear-data-block"
 *        data-key-labels='{"key":"Localized label", …}'
 *        data-msg-confirm="…"
 *        data-msg-done="…"
 *        data-msg-list="…"     (use {list} as placeholder for removed key names)
 *        data-msg-nothing="…">
 *     <div id="afh-storage-summary"></div>
 *     <button id="afh-clear-data-btn" …>…</button>
 *     <p id="afh-clear-status" aria-live="polite" hidden></p>
 *   </div>
 */
(function () {
  var block = document.getElementById('afh-clear-data-block');
  if (!block) return;

  var KEYS = ['afh-lang', 'afh-theme', 'searchData', 'searchDataVersion', 'afh-highlight-terms', 'afh-cookie-consent'];

  var KEY_LABELS = {};
  try { KEY_LABELS = JSON.parse(block.getAttribute('data-key-labels') || '{}'); } catch (e) {}

  var MSG_CONFIRM = block.getAttribute('data-msg-confirm') || 'This will delete all preferences and cached data stored by this site. Continue?';
  var MSG_DONE    = block.getAttribute('data-msg-done')    || 'All site data has been cleared.';
  var MSG_LIST    = block.getAttribute('data-msg-list')    || 'Items removed: {list}.';
  var MSG_NOTHING = block.getAttribute('data-msg-nothing') || 'No site data was found in your browser.';

  var btn       = document.getElementById('afh-clear-data-btn');
  var status    = document.getElementById('afh-clear-status');
  var summaryEl = document.getElementById('afh-storage-summary');
  if (!btn || !status) return;

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + '\u00a0B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + '\u00a0KB';
    return (bytes / 1048576).toFixed(2) + '\u00a0MB';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getStoredItems() {
    var items = [];
    try {
      KEYS.forEach(function (key) {
        var val = localStorage.getItem(key);
        if (val !== null) {
          var bytes = 0;
          try { bytes = new Blob([val]).size; } catch (e) { bytes = val.length; }
          items.push({ key: key, label: KEY_LABELS[key] || key, bytes: bytes, size: formatSize(bytes) });
        }
      });
    } catch (e) {}
    return items;
  }

  function renderSummary() {
    if (!summaryEl) return;
    var items = getStoredItems();
    if (items.length === 0) {
      summaryEl.innerHTML = '<p class="cookies-summary__empty">' + escHtml(MSG_NOTHING) + '</p>';
      return;
    }
    var rows = items.map(function (item) {
      return '<tr>' +
        '<td class="cookies-summary__label">' + escHtml(item.label) +
          '<br><code class="cookies-summary__key">' + escHtml(item.key) + '</code></td>' +
        '<td class="cookies-summary__size">' + escHtml(item.size) + '</td>' +
        '</tr>';
    });
    var totalBytes = items.reduce(function (sum, item) { return sum + item.bytes; }, 0);
    var MSG_TOTAL = block.getAttribute('data-msg-total') || 'Total';
    var totalRow = '<tr class="cookies-summary__total">' +
      '<td class="cookies-summary__label"><strong>' + escHtml(MSG_TOTAL) + '</strong></td>' +
      '<td class="cookies-summary__size"><strong>' + escHtml(formatSize(totalBytes)) + '</strong></td>' +
      '</tr>';
    summaryEl.innerHTML =
      '<table class="cookies-summary__table"><tbody>' + rows.join('') + totalRow + '</tbody></table>';
  }

  renderSummary();

  btn.addEventListener('click', function () {
    if (!window.confirm(MSG_CONFIRM)) return;
    var removed = [];
    try {
      KEYS.forEach(function (key) {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          removed.push(key);
        }
      });
    } catch (e) {}

    renderSummary();
    status.removeAttribute('hidden');
    if (removed.length === 0) {
      status.textContent = MSG_NOTHING;
    } else {
      status.textContent = MSG_DONE + ' ' + MSG_LIST.replace('{list}', removed.join(', '));
    }
  });
})();
