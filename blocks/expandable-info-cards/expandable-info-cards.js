/**
 * Decorates the expandable-stories block.
 * @param {Element} block The block element
 */
 export default function decorate(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (rows.length < 2) return; // Need header + at least one card row

  const grid = document.createElement('div');
  grid.className = 'stories-grid';

  for (let i = 1; i < rows.length; i += 1) { // Skip header
    const cols = [...rows[i].querySelectorAll(':scope > div')];
    if (cols.length >= 4) {
      const imageSrc = cols[0].textContent.trim();
      const title = cols[1].textContent.trim();
      const videoId = cols[2].textContent.trim();
      const description = cols[3].innerHTML.trim(); // Preserve HTML (bold, etc.)

      if (title) {
        const card = document.createElement('div');
        card.className = 'story-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-expanded', 'false');
        card.setAttribute('aria-label', `Expand ${title}`);

        const thumbnail = document.createElement('div');
        thumbnail.className = 'story-thumbnail';
        if (imageSrc) {
          thumbnail.style.backgroundImage = `url(${imageSrc})`;
        }

        const titleEl = document.createElement('div');
        titleEl.className = 'story-title';
        titleEl.textContent = title;

        const expanded = document.createElement('div');
        expanded.className = 'story-expanded';
        expanded.setAttribute('aria-hidden', 'true');

        // Video if ID present
        if (videoId) {
          const video = document.createElement('div');
          video.className = 'story-video';
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
          iframe.title = title;
          iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
          iframe.loading = 'lazy';
          video.appendChild(iframe);
          expanded.appendChild(video);
        }

        // Description
        const desc = document.createElement('div');
        desc.className = 'story-desc';
        desc.innerHTML = description || ''; // Supports HTML from Docs
        expanded.appendChild(desc);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Close');
        expanded.appendChild(closeBtn);

        card.append(thumbnail, titleEl, expanded);
        grid.appendChild(card);

        // Event listeners
        const toggleExpand = () => {
          const isExpanded = card.getAttribute('aria-expanded') === 'true';
          const allCards = grid.querySelectorAll('.story-card');
          allCards.forEach(c => {
            c.setAttribute('aria-expanded', 'false');
            c.querySelector('.story-expanded').classList.remove('active');
          });
          if (!isExpanded) {
            card.setAttribute('aria-expanded', 'true');
            card.querySelector('.story-expanded').classList.add('active');
          }
        };

        card.addEventListener('click', toggleExpand);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpand();
          }
        });

        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          card.setAttribute('aria-expanded', 'false');
          card.querySelector('.story-expanded').classList.remove('active');
        });
      }
    }
  }

  block.innerHTML = '';
  block.appendChild(grid);
  block.dataset.blockStatus = 'loaded';
}