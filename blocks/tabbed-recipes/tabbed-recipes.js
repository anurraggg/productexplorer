import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Decorates the tabbed-recipes block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length < 1) return; // Need at least tabs row

  // Extract tabs from first row, first cell (handles <br> as \n via textContent)
  const tabsCell = rows[0].querySelector(':scope > div:first-child');
  let tabText = tabsCell ? tabsCell.textContent.trim() : '';
  // Normalize line breaks (handles spaces or \n from <br>)
  const tabNames = tabText
    .split(/\n|\r\n| /) // Split on newlines or spaces if no <br>
    .map(name => name.trim())
    .filter(Boolean)
    .slice(0, 10); // Limit to reasonable number, e.g., 10 tabs

  if (tabNames.length === 0) {
    console.warn('No tabs defined in tabbed-recipes block');
    return;
  }

  // Group cards by tab
  const cardsByTab = new Map();
  tabNames.forEach(tab => cardsByTab.set(tab, []));

  // Parse first card from row 0 (tabs row) if extra columns present
  const firstRowCols = [...rows[0].querySelectorAll(':scope > div')];
  if (firstRowCols.length >= 6) {
    const imageSrc = firstRowCols[1].textContent.trim();
    const title = firstRowCols[2].textContent.trim();
    const description = firstRowCols[3].textContent.trim();
    const time = firstRowCols[4].textContent.trim();
    const difficulty = firstRowCols[5].textContent.trim();
    if (imageSrc && title && tabNames.length > 0) {
      cardsByTab.get(tabNames[0]).push({ imageSrc, title, description, time, difficulty });
      console.log(`Added first card "${title}" to tab "${tabNames[0]}"`);
    }
  }

  // Parse additional cards from row 1+
  for (let i = 1; i < rows.length; i += 1) {
    const cols = [...rows[i].querySelectorAll(':scope > div')];
    if (cols.length >= 6) {
      const tabName = cols[0].textContent.trim();
      const imageSrc = cols[1].textContent.trim();
      const title = cols[2].textContent.trim();
      const description = cols[3].textContent.trim();
      const time = cols[4].textContent.trim();
      const difficulty = cols[5].textContent.trim();
      if (cardsByTab.has(tabName) && imageSrc && title) {
        cardsByTab.get(tabName).push({ imageSrc, title, description, time, difficulty });
        console.log(`Added card "${title}" to tab "${tabName}"`);
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
    tabButton.setAttribute('aria-selected', index === 0);
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
    cards.forEach(cardData => {
      const card = document.createElement('div');
      card.className = 'card';

      const picture = createOptimizedPicture(cardData.imageSrc, cardData.title, false);
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
      // TODO: Add href if 7th column added
      btn.addEventListener('click', () => {
        // Placeholder: Navigate to recipe or open modal
        console.log(`Cooking ${cardData.title}`);
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
  const tabButtons = tabsContainer.querySelectorAll('.tab-button');
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      // Remove active from all
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      [...contentDiv.querySelectorAll('.tab-pane')].forEach(pane => pane.classList.remove('active'));

      // Activate clicked
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');
      contentDiv.querySelector(`#tab-pane-${index}`).classList.add('active');
    });
  });

  block.dataset.blockStatus = 'loaded';
}