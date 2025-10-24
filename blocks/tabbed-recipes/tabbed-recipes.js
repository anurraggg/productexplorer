import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorates the tabbed-recipes block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length < 1) return; // Need at least tabs row

  // Extract tabs from first row, first cell (HANDLE <br> TAGS FROM GOOGLE DOCS)
  const tabsCell = rows[0].querySelector(':scope > div:first-child');
  let tabHtml = tabsCell ? tabsCell.innerHTML.trim() : '';
  console.log('Raw tab HTML:', tabHtml); // Debug: See <br> tags

  // Replace <br> with \n for proper splitting (Google Docs uses <br> for line breaks)
  let tabText = tabHtml.replace(/<br\s*\/?>/gi, '\n');
  console.log('After <br> replacement:', tabText); // Debug

  // STRIP HTML TAGS (e.g., <p>, </p>) to get clean text
  tabText = tabText.replace(/<[^>]*>/g, ''); // Simple regex to remove all tags
  console.log('Clean tab text:', tabText); // Debug: Now plain text

  // Split ONLY on actual newlines
  const rawTabNames = tabText.split(/\n|\r\n/).map(name => name.trim()).filter(Boolean);
  let tabNames = rawTabNames.length > 0 ? rawTabNames : [tabText]; // Fallback: single tab if no breaks

  console.log('Parsed tabs:', tabNames); // Debug: Confirm clean tabs

  if (tabNames.length === 0) {
    console.warn('No tabs defined in tabbed-recipes block');
    return;
  }

  // Group cards by tab (exact match required)
  const cardsByTab = new Map();
  tabNames.forEach(tab => cardsByTab.set(tab, []));

  // Parse first card from row 0 (tabs row) if extra columns present (for single-row tests)
  const firstRowCols = [...rows[0].querySelectorAll(':scope > div')];
  if (firstRowCols.length >= 6) {
    const imageSrc = firstRowCols[1]?.textContent.trim() || '';
    const title = firstRowCols[2]?.textContent.trim() || '';
    const description = firstRowCols[3]?.textContent.trim() || '';
    const time = firstRowCols[4]?.textContent.trim() || '30 mins'; // Default if missing
    const difficulty = firstRowCols[5]?.textContent.trim() || 'Beginner'; // Default if missing
    if (imageSrc && title && tabNames.length > 0) {
      cardsByTab.get(tabNames[0]).push({ imageSrc, title, description, time, difficulty });
      console.log(`Added first card "${title}" to tab "${tabNames[0]}"`);
    }
  }

  // Parse additional cards from row 1+
  for (let i = 1; i < rows.length; i += 1) {
    const cols = [...rows[i].querySelectorAll(':scope > div')];
    if (cols.length >= 6) {
      const tabName = cols[0]?.textContent.trim() || '';
      const imageSrc = cols[1]?.textContent.trim() || '';
      const title = cols[2]?.textContent.trim() || '';
      const description = cols[3]?.textContent.trim() || '';
      const time = cols[4]?.textContent.trim() || '30 mins'; // Default
      const difficulty = cols[5]?.textContent.trim() || 'Beginner'; // Default
      if (cardsByTab.has(tabName) && imageSrc && title) {
        cardsByTab.get(tabName).push({ imageSrc, title, description, time, difficulty });
        console.log(`Added card "${title}" to tab "${tabName}"`);
      } else if (imageSrc && title) {
        console.warn(`Card "${title}" skipped: No matching tab "${tabName}" (available: ${Array.from(cardsByTab.keys()).join(', ')})`);
      }
    }
  }

  // Build tabs HTML
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';
  const tabsList = document.createElement('ul');
  tabsList.className = 'tabs';
  tabsList.setAttribute('role', 'tablist');
  tabsList.setAttribute('aria-label', 'Recipe categories');

  tabNames.forEach((tabName, index) => {
    const tabItem = document.createElement('li');
    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.textContent = tabName;
    tabButton.setAttribute('role', 'tab');
    tabButton.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    tabButton.setAttribute('aria-controls', `tab-pane-${index}`);
    tabButton.setAttribute('id', `tab-${index}`);
    if (index === 0) tabButton.classList.add('active');

    tabItem.appendChild(tabButton);
    tabsList.appendChild(tabItem);
  });

  tabsContainer.appendChild(tabsList);

  // Build content
  const contentDiv = document.createElement('div');
  contentDiv.className = 'tab-content';

  const headerLine = document.createElement('div');
  headerLine.className = 'get-cooking-header';
  headerLine.innerHTML = '<hr style="border: none; border-top: 1px solid #ddd; margin: 0;">Get cooking<hr style="border: none; border-top: 1px solid #ddd; margin: 0;">';

  contentDiv.appendChild(headerLine);

  tabNames.forEach((tabName, index) => {
    const pane = document.createElement('div');
    pane.className = 'tab-pane';
    pane.id = `tab-pane-${index}`;
    pane.setAttribute('role', 'tabpanel');
    pane.setAttribute('aria-labelledby', `tab-${index}`);
    if (index === 0) pane.classList.add('active');

    const grid = document.createElement('div');
    grid.className = 'cards-grid';

    const cards = cardsByTab.get(tabName) || [];
    console.log(`Tab "${tabName}": ${cards.length} cards`); // Debug: Check card counts

    cards.forEach(cardData => {
      const card = document.createElement('div');
      card.className = 'card';

      let picture;
      // If full URL (external like Scene7), use plain <img> to avoid optimization rewrite
      if (cardData.imageSrc.startsWith('http')) {
        picture = document.createElement('picture');
        const img = document.createElement('img');
        img.src = cardData.imageSrc;
        img.alt = cardData.title;
        img.loading = 'lazy';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        picture.appendChild(img);
        console.log(`Using external image: ${cardData.imageSrc}`); // Debug
      } else {
        // Relative path: Use optimized picture
        picture = createOptimizedPicture(cardData.imageSrc, cardData.title, false, [{ width: '800', height: '600' }]);
      }
      card.appendChild(picture);

      const overlay = document.createElement('div');
      overlay.className = 'card-overlay';

      const titleEl = document.createElement('h3');
      titleEl.className = 'card-title';
      titleEl.textContent = cardData.title;
      overlay.appendChild(titleEl);

      const descEl = document.createElement('p');
      descEl.className = 'card-description';
      descEl.textContent = cardData.description;
      overlay.appendChild(descEl);

      const metaDiv = document.createElement('div');
      metaDiv.className = 'card-meta';

      const timeEl = document.createElement('span');
      timeEl.className = 'card-time';
      timeEl.textContent = cardData.time;
      metaDiv.appendChild(timeEl);

      const diffEl = document.createElement('span');
      diffEl.className = 'card-difficulty';
      diffEl.textContent = cardData.difficulty;
      metaDiv.appendChild(diffEl);

      overlay.appendChild(metaDiv);

      const elevateEl = document.createElement('div');
      elevateEl.className = 'elevate-text';
      elevateEl.textContent = 'View our recipes & elevate your culinary experience';
      overlay.appendChild(elevateEl);

      const btn = document.createElement('button');
      btn.className = 'get-cooking-btn';
      btn.textContent = 'Get cooking';
      btn.addEventListener('click', () => {
        console.log(`Start cooking ${cardData.title}!`);
      });
      overlay.appendChild(btn);

      card.appendChild(overlay);
      grid.appendChild(card);
    });

    pane.appendChild(grid);
    contentDiv.appendChild(pane);
  });

  // Clear and append new structure
  block.innerHTML = '';
  block.appendChild(tabsContainer);
  block.appendChild(contentDiv);

  // Add tab switching logic
    // Add tab switching logic
    const tabButtons = tabsContainer.querySelectorAll('.tab-button');
    tabButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => {
          btn.classList.remove('active');
          btn.setAttribute('aria-selected', 'false');
        });
        [...contentDiv.querySelectorAll('.tab-pane')].forEach(pane => pane.classList.remove('active'));
  
        button.classList.add('active');
        button.setAttribute('aria-selected', 'true');
        contentDiv.querySelector(`#tab-pane-${index}`).classList.add('active');
  
        // SMOOTH SLIDE ANIMATION: Scroll active tab into center view
        button.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center'  // Centers the tab horizontally
        });
      });
    });
  
    block.dataset.blockStatus = 'loaded';
  }