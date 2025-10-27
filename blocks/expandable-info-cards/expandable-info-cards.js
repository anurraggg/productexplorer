/**
 * Decorates the expandable-info-cards block.
 * @param {Element} block The block element
 */
 export default async function decorate(block) {
  // Parse rows as divs (AEM table structure)
  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length < 2) return; // Need header + at least one card row

  const cardsData = [];

  // Parse rows (skip header)
  for (let i = 1; i < rows.length; i += 1) {
    const cells = [...rows[i].querySelectorAll(':scope > div')];
    if (cells.length >= 4) {
      const card = cells[0]?.textContent.trim() || ''; // Unused in original, kept for future
      const title = cells[1]?.textContent.trim() || '';
      const description = cells[2]?.textContent.trim() || '';
      const videoUrl = cells[3]?.textContent.trim() || '';

      if (title && description) {
        cardsData.push({
          card,
          title,
          description,
          video: extractYouTubeId(videoUrl),
        });
      }
    }
  }

  if (cardsData.length === 0) {
    console.warn('No valid cards data in expandable-info-cards block');
    return;
  }

  // Clear block
  block.innerHTML = '';

  cardsData.forEach((data, index) => {
    // Create card element
    const card = document.createElement('div');
    card.className = `exp-card ${index === 0 ? 'expanded' : ''}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
    card.setAttribute('aria-label', data.title);

    // Header
    const header = document.createElement('div');
    header.className = 'exp-card-header';
    const h3 = document.createElement('h3');
    h3.textContent = data.title;
    const collapsedDesc = document.createElement('p');
    collapsedDesc.className = 'collapsed-desc';
    collapsedDesc.textContent = data.description;
    header.appendChild(h3);
    header.appendChild(collapsedDesc);
    card.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'exp-card-body';
    const bodyDesc = document.createElement('p');
    bodyDesc.textContent = data.description;
    body.appendChild(bodyDesc);

    if (data.video) {
      const videoWrapper = document.createElement('div');
      videoWrapper.className = 'video-wrapper';
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${data.video}?rel=0`;
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = index < 3 ? 'eager' : 'lazy'; // Lazy load after first few
      videoWrapper.appendChild(iframe);
      body.appendChild(videoWrapper);
    }

    card.appendChild(body);
    block.appendChild(card);
  });

  // Add interaction logic
  const allCards = block.querySelectorAll('.exp-card');
  allCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      // Prevent clicks on iframe
      if (e.target.closest('iframe')) return;
      toggleExpanded(card);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleExpanded(card);
      }
    });
  });

  function toggleExpanded(targetCard) {
    const isExpanded = targetCard.getAttribute('aria-expanded') === 'true';

    // Close all others
    allCards.forEach((c) => {
      if (c !== targetCard) {
        c.classList.remove('expanded');
        c.setAttribute('aria-expanded', 'false');
      }
    });

    // Toggle target
    if (!isExpanded) {
      targetCard.classList.add('expanded');
      targetCard.setAttribute('aria-expanded', 'true');
    } else {
      targetCard.classList.remove('expanded');
      targetCard.setAttribute('aria-expanded', 'false');
    }

    // Focus management
    targetCard.focus();
  }

  block.dataset.blockStatus = 'loaded';
}

/**
 * Extracts YouTube video ID from URL.
 * @param {string} url YouTube URL
 * @returns {string} Video ID or empty string
 */
function extractYouTubeId(url) {
  if (!url) return '';
  const watchMatch = url.match(/watch\?v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];
  // Assume direct ID if no match
  return url;
}