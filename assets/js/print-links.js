/**
 * Print Links Generator
 * Extracts all links from the main content and generates a reference section for printing.
 * Links are numbered in the content and listed at the end for print media.
 */

function generatePrintLinksSection() {
  // Find the main content area - try multiple selectors to support different layouts
  let contentElement = document.querySelector('.post-content');
  
  // Fallback for other layouts
  if (!contentElement) {
    contentElement = document.querySelector('main.page-content');
  }
  
  if (!contentElement) {
    console.warn('[print-links] No suitable content area found');
    return;
  }

  // Extract all links from the content
  const linkElements = contentElement.querySelectorAll('a[href]');
  const links = [];
  const seen = new Set();

  linkElements.forEach((link) => {
    const href = link.getAttribute('href');
    // Skip gallery and map widget links (image controls / tile attribution, not document references).
    if (link.classList.contains('afh-gallery__link') || link.closest('.afh-gallery') || link.closest('.afh-map')) {
      return;
    }
    // Skip anchor-only links and javascript: links
    if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !seen.has(href)) {
      seen.add(href);
      links.push({
        text: link.textContent || href,
        url: href,
      });
    }
  });

  console.log('[print-links] Found', links.length, 'unique links');

  // Only generate section if there are links
  if (links.length === 0) {
    return;
  }

  // Check if links section already exists
  let linksSection = document.querySelector('.print-links-section');
  if (linksSection) {
    // Remove existing section to regenerate fresh
    linksSection.remove();
  }

  // Create the links section
  linksSection = document.createElement('div');
  linksSection.className = 'print-links-section';

  const title = document.createElement('h2');
  title.textContent = 'Links Referenced in This Document';
  linksSection.appendChild(title);

  const table = document.createElement('table');
  table.className = 'print-links-table';

  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  const th1 = document.createElement('th');
  th1.textContent = 'No.';
  headerRow.appendChild(th1);
  
  const th2 = document.createElement('th');
  th2.textContent = 'Description';
  headerRow.appendChild(th2);
  
  const th3 = document.createElement('th');
  th3.textContent = 'URL';
  headerRow.appendChild(th3);
  
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');

  links.forEach((link, index) => {
    const row = document.createElement('tr');
    row.className = 'print-links-row';

    // Link number cell
    const numCell = document.createElement('td');
    numCell.className = 'print-links-num';
    numCell.textContent = index + 1;
    row.appendChild(numCell);

    // Description cell
    const descCell = document.createElement('td');
    descCell.className = 'print-links-desc';
    descCell.textContent = link.text;
    row.appendChild(descCell);

    // URL cell
    const urlCell = document.createElement('td');
    urlCell.className = 'print-links-url-cell';
    
    const anchor = document.createElement('a');
    anchor.href = link.url;
    anchor.textContent = link.url;
    anchor.className = 'print-links-url';
    
    urlCell.appendChild(anchor);
    row.appendChild(urlCell);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  linksSection.appendChild(table);

  // Append the section after the main content
  const postBodyInner = document.querySelector('.post-body__inner');
  const postBody = contentElement.closest('.post-body');
  
  if (postBodyInner) {
    postBodyInner.parentElement.appendChild(linksSection);
    console.log('[print-links] Section appended after post-body__inner');
  } else if (postBody) {
    postBody.appendChild(linksSection);
    console.log('[print-links] Section appended to post-body');
  } else {
    // For other layouts, append after the content element
    contentElement.parentElement.appendChild(linksSection);
    console.log('[print-links] Section appended after main content');
  }
}

// Generate on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[print-links] DOMContentLoaded event');
    generatePrintLinksSection();
  });
} else {
  console.log('[print-links] DOM already loaded, generating immediately');
  generatePrintLinksSection();
}

// Regenerate before print (in case content has changed dynamically)
window.addEventListener('beforeprint', () => {
  console.log('[print-links] beforeprint event triggered');
  generatePrintLinksSection();
});

// Also generate on window load as fallback
window.addEventListener('load', () => {
  console.log('[print-links] window load event');
  generatePrintLinksSection();
});
