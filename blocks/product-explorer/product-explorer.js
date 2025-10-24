// product-explorer.js - Dynamic tabs and cards generator for Franklin EDS
document.addEventListener('DOMContentLoaded', function() {
    const block = document.querySelector('.product-explorer');
    if (!block) return;

    const table = block.querySelector('table');
    if (!table) return;

    // Parse markdown table from Franklin (assumes <table> is rendered from markdown)
    const rows = Array.from(table.querySelectorAll('tr')).slice(1); // Skip header
    const data = rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
            tab: cells[0]?.textContent.trim(),
            image: cells[1]?.textContent.trim(),
            title: cells[2]?.textContent.trim(),
            description: cells[3]?.textContent.trim(),
            ctaText: cells[4]?.textContent.trim(),
            ctaUrl: cells[5]?.textContent.trim()
        };
    }).filter(item => item.tab && item.title); // Filter valid rows

    if (data.length === 0) return;

    // Generate unique tabs from data
    const tabs = [...new Set(data.map(item => item.tab))];

    // Create tabs container (horizontal scroll)
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'pe-tabs-container';
    tabs.forEach(tabName => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'pe-tab-btn';
        tabBtn.textContent = tabName;
        tabBtn.dataset.tab = tabName;
        tabsContainer.appendChild(tabBtn);
    });
    block.appendChild(tabsContainer);

    // Create cards container
    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'pe-cards-grid';

    // Group cards by tab
    const groupedData = {};
    data.forEach(item => {
        if (!groupedData[item.tab]) groupedData[item.tab] = [];
        groupedData[item.tab].push(item);
    });

    // Render all cards initially (filtered by JS)
    Object.keys(groupedData).forEach(tabName => {
        groupedData[tabName].forEach(item => {
            const card = document.createElement('div');
            card.className = `pe-card ${item.tab.toLowerCase().replace(/\s+/g, '-')}`;
            card.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="pe-card-image">
                <h3 class="pe-card-title">${item.title}</h3>
                <p class="pe-card-description">${item.description}</p>
                <a href="${item.ctaUrl}" class="pe-cta-btn">${item.ctaText}</a>
            `;
            cardsContainer.appendChild(card);
        });
    });
    block.appendChild(cardsContainer);

    // Tab click handler for filtering
    const tabBtns = tabsContainer.querySelectorAll('.pe-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const activeTab = this.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Filter cards
            const allCards = cardsContainer.querySelectorAll('.pe-card');
            allCards.forEach(card => {
                const cardTab = card.className.match(/(\w+)$/)[1].replace(/-/g, ' ');
                card.style.display = cardTab === activeTab ? 'block' : 'none';
            });
        });
    });

    // Activate first tab by default
    tabBtns[0]?.click();

    // Mobile swipe support for tabs (horizontal scroll)
    let startX = 0;
    let scrollLeft = 0;
    tabsContainer.addEventListener('touchstart', e => {
        startX = e.touches[0].pageX - tabsContainer.offsetLeft;
        scrollLeft = tabsContainer.scrollLeft;
    });
    tabsContainer.addEventListener('touchmove', e => {
        const x = e.touches[0].pageX - tabsContainer.offsetLeft;
        const walk = (x - startX) * 2; // Scroll speed
        tabsContainer.scrollLeft = scrollLeft - walk;
    });

    // Hide original table
    table.style.display = 'none';
});