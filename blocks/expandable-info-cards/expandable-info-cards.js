/**
 * Decorates the expandable-info-cards block.
 * @param {Element} block The block element
 */
 export default function decorate(block) {
    const rows = [...block.querySelectorAll(':scope > div')];
    if (rows.length < 2) return; // Need header + at least one card row
  
    const cards = [];
  
    // Parse rows (skip header if present)
    for (let i = 1; i < rows.length; i += 1) {
      const cols = [...rows[i].querySelectorAll(':scope > div')];
      if (cols.length >= 4) {
        const thumbnail = cols[0]?.textContent.trim() || '';
        const title = cols[1]?.textContent.trim() || '';
        const ytId = cols[2]?.textContent.trim() || '';
        const descHtml = cols[3]?.innerHTML.trim() || '';
  
        if (thumbnail && title) {
          cards.push({ thumbnail, title, ytId, descHtml });
        }
      }
    }
  
    if (cards.length === 0) {
      console.warn('No cards defined in expandable-info-cards block');
      return;
    }
  
    // Build grid
    const grid = document.createElement('div');
    grid.className = 'cards-grid';
  
    cards.forEach((cardData, index) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('aria-expanded', 'false');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0'); // Keyboard access
      card.setAttribute('aria-label', `Expand ${cardData.title}`);
  
      const img = document.createElement('img');
      img.className = 'card-thumbnail';
      img.src = cardData.thumbnail;
      img.alt = cardData.title;
      img.loading = index < 3 ? 'eager' : 'lazy'; // Lazy after first row
      card.appendChild(img);
  
      const titleEl = document.createElement('h3');
      titleEl.className = 'card-title';
      titleEl.textContent = cardData.title;
      card.appendChild(titleEl);
  
      const content = document.createElement('div');
      content.className = 'expanded-content';
  
      if (cardData.ytId) {
        const video = document.createElement('div');
        video.className = 'video-embed';
        video.innerHTML = `<iframe src="https://www.youtube.com/embed/${cardData.ytId}?rel=0" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
        content.appendChild(video);
      }
  
      const desc = document.createElement('div');
      desc.className = 'description';
      desc.innerHTML = cardData.descHtml;
      content.appendChild(desc);
  
      card.appendChild(content);
      grid.appendChild(card);
    });
  
    // Clear and append
    block.innerHTML = '';
    block.appendChild(grid);
  
    // Add expand/collapse logic
    const allCards = grid.querySelectorAll('.card');
    allCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('iframe')) return; // Ignore video clicks
        toggleCard(card);
      });
  
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleCard(card);
        }
      });
    });
  
    function toggleCard(targetCard) {
      const isExpanded = targetCard.getAttribute('aria-expanded') === 'true';
      const expandedContent = targetCard.querySelector('.expanded-content');
  
      // Close all
      allCards.forEach(c => {
        c.setAttribute('aria-expanded', 'false');
        c.querySelector('.expanded-content').style.maxHeight = '0';
        c.querySelector('.card-title').style.backgroundColor = '';
      });
  
      // Toggle target
      if (!isExpanded) {
        targetCard.setAttribute('aria-expanded', 'true');
        expandedContent.style.maxHeight = expandedContent.scrollHeight + 'px'; // Smooth based on content
        targetCard.querySelector('.card-title').style.backgroundColor = '#ff6b35';
        targetCard.querySelector('.card-title').style.color = 'white';
      }
  
      // Focus management
      targetCard.focus();
    }
  
    block.dataset.blockStatus = 'loaded';
  }