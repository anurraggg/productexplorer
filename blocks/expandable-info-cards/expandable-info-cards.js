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
      let thumbnail = cells[0]?.textContent.trim() || ''; // For expanded only
      const title = cells[1]?.textContent.trim() || '';
      const description = cells[2]?.textContent.trim() || '';
      const videoUrl = cells[3]?.textContent.trim() || '';

      // Validate thumbnail: Must be a plausible URL
      if (thumbnail && !thumbnail.startsWith('/') && !thumbnail.startsWith('http') && !thumbnail.includes('.')) {
        console.warn(`Invalid thumbnail URL in row ${i}: "${thumbnail}". Skipping image. Use e.g., /media/card1.jpg`);
        thumbnail = '';
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
  let heightTimeout; // Debounce for sync
  let currentObserver = null; // Track single observer

  cardsData.forEach((data, index) => {
    // Create card element
    const card = document.createElement('article');
    card.className = `exp-card ${index === activeIndex ? 'expanded' : 'collapsed'}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-expanded', index === activeIndex ? 'true' : 'false');
    card.setAttribute('aria-label', data.title);
    card.dataset.index = index.toString();

    // Header (title + desc, always; style toggles)
    const header = document.createElement('div');
    header.className = 'exp-card-header';
    const h3 = document.createElement('h3');
    h3.textContent = data.title;

    // SINGLE DESC ELEMENT
    const desc = document.createElement('p');
    desc.className = 'card-desc'; // FIXED: No collapsed/full; always full text
    desc.textContent = data.description;

    header.appendChild(h3);
    header.appendChild(desc);
    card.appendChild(header);

    // Body (expanded only: video + optional thumbnail)
    const body = document.createElement('div');
    body.className = 'exp-card-body';
    // Video placeholder (loaded on expand)
    const videoPlaceholder = document.createElement('div');
    videoPlaceholder.className = 'video-wrapper';
    body.appendChild(videoPlaceholder);

    // Thumbnail (only if provided, in body for expand visibility)
    if (data.thumbnail) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'card-thumbnail-wrapper';
      const img = document.createElement('img');
      img.src = data.thumbnail;
      img.alt = `${data.title} thumbnail`;
      img.loading = 'lazy'; // Lazy since expand-only
      imgWrapper.appendChild(img);
      body.appendChild(imgWrapper); // Append after video
    }

    card.appendChild(body);
    wrapper.appendChild(card);
  });

  block.appendChild(wrapper);

  // Declare allCards BEFORE initial reorderCards call
  const allCards = block.querySelectorAll('.exp-card');

  // Initial layout: Reorder DOM for left | right stack
  reorderCards(activeIndex);

  // FIXED: Debounced initial sync
  clearTimeout(heightTimeout);
  heightTimeout = setTimeout(() => syncHeights(wrapper, allCards, activeIndex), 100);

  // FIXED: Load initial video for expanded card on first load
  loadVideo(allCards[activeIndex], cardsData[activeIndex].video);

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
    // FIXED: Disconnect previous observer
    if (currentObserver) {
      currentObserver.disconnect();
      currentObserver = null;
    }

    // Trigger animation class
    block.classList.add('reordering');

    // Update classes/ARIA
    allCards.forEach((c, idx) => {
      const isActive = idx === newActive;
      c.classList.toggle('expanded', isActive);
      c.classList.toggle('collapsed', !isActive);
      c.setAttribute('aria-expanded', isActive ? 'true' : 'false');

      // FIXED: Toggle body display for no white space
      const body = c.querySelector('.exp-card-body');
      if (body) {
        body.style.display = isActive ? 'block' : 'none';
      }

      // Load video if expanding
      if (isActive) {
        loadVideo(c, cardsData[newActive].video);
      } else {
        // Clear video if collapsing
        const videoEl = c.querySelector('.video-wrapper');
        if (videoEl) videoEl.innerHTML = '';
        // FIXED: Reset body maxHeight on collapse
        body.style.maxHeight = 'none';
      }
    });

    // Temporarily position absolute for smooth slide
    allCards.forEach(c => {
      c.style.position = 'absolute';
      c.style.transition = 'transform 0.6s ease, opacity 0.6s ease';
    });

    // Reorder DOM: Active first, then others in order (for stack top: next, prev)
    const nextIdx = (newActive + 1) % 3;
    const prevIdx = (newActive + 2) % 3;
    reorderCards(newActive, [nextIdx, prevIdx]);

    // FIXED: Reset minHeight to auto post-reorder, then debounced sync
    wrapper.style.minHeight = 'auto';
    const rightStack = wrapper.querySelector('.right-stack');
    if (rightStack) rightStack.style.minHeight = 'auto';

    // Sync heights after anim + video load
    setTimeout(() => {
      allCards.forEach(c => {
        c.style.position = '';
        c.style.transform = '';
        c.style.opacity = '';
      });
      block.classList.remove('reordering');
      clearTimeout(heightTimeout);
      heightTimeout = setTimeout(() => syncHeights(wrapper, allCards, newActive), 700); // Debounced
    }, 600); // Match slide duration
  }

  // FIXED: Debounced sync heights with cap
  function syncHeights(wrapper, cards, activeIdx) {
    const expandedCard = cards[activeIdx];
    if (!expandedCard) return;
    let expandedHeight = expandedCard.getBoundingClientRect().height || 400; // FIXED: Use getBoundingClientRect for precise
    // FIXED: Cap to prevent creep (e.g., 80% viewport)
    const maxCap = window.innerHeight * 0.8;
    expandedHeight = Math.min(expandedHeight, maxCap);
    wrapper.style.minHeight = `${expandedHeight}px`;
    const rightStack = wrapper.querySelector('.right-stack');
    if (rightStack) {
      rightStack.style.minHeight = `${expandedHeight}px`;
    }
  }

  function reorderCards(activeIdx, rightOrder = null) {
    const wrapper = block.querySelector('.eic-wrapper');
    const existingRightStack = wrapper.querySelector('.right-stack');
    if (existingRightStack) existingRightStack.remove(); // Clear old stack

    // Create new right-stack for vertical
    const rightStack = document.createElement('div');
    rightStack.className = 'right-stack';

    // Append active first (left)
    const activeCard = allCards[activeIdx];
    wrapper.appendChild(activeCard);

    // Append right stack in order (top to bottom: next, prev)
    if (!rightOrder) {
      rightOrder = cardsData.map((_, i) => i).filter(i => i !== activeIdx);
    }
    rightOrder.forEach(idx => {
      rightStack.appendChild(allCards[idx]);
    });
    wrapper.appendChild(rightStack);
  }

  function loadVideo(cardEl, videoId) {
    if (!videoId) return;
    try {
      const videoWrapper = cardEl.querySelector('.video-wrapper');
      videoWrapper.innerHTML = ''; // Clear placeholder

      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1&widgetid=1`;
      iframe.frameBorder = '0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'eager'; // FIXED: Eager for initial load to avoid grey
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      videoWrapper.appendChild(iframe);

      // FIXED: Single ResizeObserver per load (no stacking)
      currentObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === iframe) {
            clearTimeout(heightTimeout);
            heightTimeout = setTimeout(() => syncHeights(wrapper, allCards, activeIndex), 100); // Debounced
          }
        }
      });
      currentObserver.observe(iframe);

      // FIXED: Post-load, set maxHeight none after transition
      setTimeout(() => {
        const body = cardEl.querySelector('.exp-card-body');
        if (body) body.style.maxHeight = 'none';
      }, 800);
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