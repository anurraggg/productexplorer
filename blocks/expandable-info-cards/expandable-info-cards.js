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
      let thumbnail = cells[0]?.textContent.trim() || ''; // Now validated
      const title = cells[1]?.textContent.trim() || '';
      const description = cells[2]?.textContent.trim() || '';
      const videoUrl = cells[3]?.textContent.trim() || '';

      // Validate thumbnail: Must be a plausible URL (starts with / or http, ends with image ext)
      if (thumbnail && !thumbnail.startsWith('/') && !thumbnail.startsWith('http') && !thumbnail.includes('.')) {
        console.warn(`Invalid thumbnail URL in row ${i}: "${thumbnail}". Skipping image. Use e.g., /media/card1.jpg`);
        thumbnail = ''; // Fallback to no image
      }

      if (title && description) {
        cardsData.push({
          thumbnail,
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

  // Assume exactly 3 cards for layout; warn if not
  if (cardsData.length !== 3) {
    console.warn(`Expected 3 cards, got ${cardsData.length}; layout may break`);
  }

  // Clear block
  block.innerHTML = '';

  // Create wrapper for layout
  const wrapper = document.createElement('div');
  wrapper.className = 'eic-wrapper';

  let activeIndex = 0; // First expanded by default

  cardsData.forEach((data, index) => {
    // Create card element
    const card = document.createElement('article');
    card.className = `exp-card ${index === activeIndex ? 'expanded' : 'collapsed'}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-expanded', index === activeIndex ? 'true' : 'false');
    card.setAttribute('aria-label', data.title);
    card.dataset.index = index.toString(); // Ensure string for parseInt

    // Thumbnail (square, only if valid)
    if (data.thumbnail) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'card-thumbnail-wrapper';
      const img = document.createElement('img');
      img.src = data.thumbnail;
      img.alt = data.title;
      img.loading = index < 3 ? 'eager' : 'lazy';
      imgWrapper.appendChild(img);
      card.appendChild(imgWrapper);
    }

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

    // Body (expanded only)
    const body = document.createElement('div');
    body.className = 'exp-card-body';
    const bodyDesc = document.createElement('p');
    bodyDesc.textContent = data.description;
    body.appendChild(bodyDesc);
    // Video placeholder (loaded on expand)
    const videoPlaceholder = document.createElement('div');
    videoPlaceholder.className = 'video-wrapper';
    body.appendChild(videoPlaceholder);
    card.appendChild(body);

    wrapper.appendChild(card);
  });

  block.appendChild(wrapper);

  // FIXED: Declare allCards BEFORE initial reorderCards call
  const allCards = block.querySelectorAll('.exp-card');

  // Initial layout: Reorder DOM for left | right stack
  reorderCards(activeIndex);

  // Add interaction logic
  allCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      // Prevent clicks on iframe
      if (e.target.closest('iframe')) return;
      const newIndex = parseInt(card.dataset.index, 10);
      if (newIndex !== activeIndex) {
        activeIndex = newIndex;
        animateReorder(activeIndex);
      }
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const newIndex = parseInt(card.dataset.index, 10);
        if (newIndex !== activeIndex) {
          activeIndex = newIndex;
          animateReorder(activeIndex);
        }
      }
    });
  });

  function animateReorder(newActive) {
    // Trigger animation class
    block.classList.add('reordering');

    // Update classes/ARIA
    allCards.forEach((c, idx) => {
      const isActive = idx === newActive;
      c.classList.toggle('expanded', isActive);
      c.classList.toggle('collapsed', !isActive);
      c.setAttribute('aria-expanded', isActive ? 'true' : 'false');

      // Load video if expanding
      if (isActive) {
        loadVideo(c, cardsData[newActive].video);
      } else {
        // Clear video if collapsing
        const videoEl = c.querySelector('.video-wrapper');
        if (videoEl) videoEl.innerHTML = '';
      }
    });

    // Reorder DOM: Active first, then others in clockwise order (e.g., next then prev)
    const otherIndices = cardsData.map((_, i) => i).filter(i => i !== newActive);
    // Clockwise sim: Assume order 0->1->2->0; place next after active, prev last
    const nextIdx = (newActive + 1) % 3;
    const prevIdx = (newActive + 2) % 3; // Or otherIndices[0/1] sorted
    reorderCards(newActive, [nextIdx, prevIdx]);

    // End animation after transition
    setTimeout(() => {
      block.classList.remove('reordering');
    }, 600); // Match CSS transition duration
  }

  function reorderCards(activeIdx, rightOrder = null) {
    const wrapper = block.querySelector('.eic-wrapper');
    wrapper.innerHTML = ''; // Clear and rebuild order

    // Append active first
    const activeCard = allCards[activeIdx];
    wrapper.appendChild(activeCard);

    // Append right stack in order (default: remaining in original seq)
    if (!rightOrder) {
      rightOrder = cardsData.map((_, i) => i).filter(i => i !== activeIdx);
    }
    rightOrder.forEach(idx => wrapper.appendChild(allCards[idx]));
  }

  function loadVideo(cardEl, videoId) {
    if (!videoId) return;
    try {
      const videoWrapper = cardEl.querySelector('.video-wrapper');
      videoWrapper.innerHTML = ''; // Clear placeholder

      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0`;
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      videoWrapper.appendChild(iframe);
    } catch (error) {
      console.warn('Failed to load YouTube video:', error);
    }
  }

  // Focus initial
  allCards[activeIndex].focus();

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
  return url; // Assume direct ID
}