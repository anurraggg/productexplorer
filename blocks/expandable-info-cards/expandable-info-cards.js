export default function decorate(block) {
  const rows = [...block.querySelectorAll('tr')];

  const cardsData = rows.map((row) => {
    const cells = row.querySelectorAll('td');

    return {
      card: cells[0]?.textContent.trim(),
      title: cells[1]?.textContent.trim(),
      description: cells[2]?.textContent.trim(),
      video: extractYouTubeId(cells[3]?.textContent.trim()),
    };
  });

  block.innerHTML = '';

  cardsData.forEach((data, index) => {
    const card = document.createElement('div');
    card.className = `exp-card ${index === 0 ? 'expanded' : ''}`;

    card.innerHTML = `
      <div class="exp-card-header">
        <h3>${data.title}</h3>
        <p class="collapsed-desc">${data.description}</p>
      </div>
      <div class="exp-card-body">
        <p>${data.description}</p>
        <div class="video-wrapper">
          <iframe src="https://www.youtube.com/embed/${data.video}" frameborder="0" allowfullscreen></iframe>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      document.querySelectorAll('.exp-card').forEach(c => c.classList.remove('expanded'));
      card.classList.add('expanded');
    });

    block.appendChild(card);
  });
}

function extractYouTubeId(url) {
  if (!url) return '';
  if (url.includes('watch?v=')) return url.split('watch?v=')[1];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1];
  return url; // assume direct ID
}
