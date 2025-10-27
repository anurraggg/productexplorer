/**
 * Decorates the expandable-info-cards block.
 * @param {Element} block The block element
 */
 export default async function decorate(block) {
  // Assumes cards are pre-built in HTML as .card elements within block
  const cards = [...block.querySelectorAll(':scope .card')];
  if (cards.length === 0) {
    console.warn('No .card elements found in expandable-info-cards block');
    return;
  }

  let activeIndex = 0; // First card expanded by default
  expandCard(activeIndex);

  cards.forEach((card, index) => {
    // Add A11y attributes
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
    card.setAttribute('aria-label', `Expand card ${index + 1}`);

    card.addEventListener('click', (e) => {
      // Prevent propagation if clicking inside expanded content (e.g., iframe)
      if (e.target.closest('.expanded-content, iframe')) return;
      activeIndex = index;
      expandCard(activeIndex);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activeIndex = index;
        expandCard(activeIndex);
      }
    });
  });

  function expandCard(active) {
    cards.forEach((card, index) => {
      const isActive = index === active;
      if (isActive) {
        card.classList.add('expanded');
        card.classList.remove('collapsed');
        card.setAttribute('aria-expanded', 'true');
      } else {
        card.classList.add('collapsed');
        card.classList.remove('expanded');
        card.setAttribute('aria-expanded', 'false');
      }
      // Focus management
      if (isActive) card.focus();
    });
  }

  block.dataset.blockStatus = 'loaded';
}