document.addEventListener("DOMContentLoaded", () => {
    const block = document.querySelector(".product-explorer");
    if (!block) return;
  
    const table = block.querySelector("table");
    if (!table) return;
  
    // Parse table into data array
    const data = [];
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      data.push({
        tab: cells[0].innerText.trim(),
        image: cells[1].innerText.trim(),
        title: cells[2].innerText.trim(),
        description: cells[3].innerText.trim(),
        ctaText: cells[4].innerText.trim(),
        ctaUrl: cells[5].innerText.trim()
      });
    });
  
    // Get unique tabs
    const tabs = [...new Set(data.map(d => d.tab))];
  
    // Create tab menu
    const tabMenu = document.createElement("div");
    tabMenu.className = "product-explorer-tabs";
    tabs.forEach((tabName, i) => {
      const tabBtn = document.createElement("button");
      tabBtn.innerText = tabName;
      tabBtn.className = i === 0 ? "active" : "";
      tabBtn.addEventListener("click", () => {
        // Remove active class from all buttons
        tabMenu.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        tabBtn.classList.add("active");
        // Filter cards
        renderCards(tabName);
      });
      tabMenu.appendChild(tabBtn);
    });
    block.prepend(tabMenu);
  
    // Card container
    const cardContainer = document.createElement("div");
    cardContainer.className = "product-explorer-cards";
    block.appendChild(cardContainer);
  
    function renderCards(selectedTab) {
      cardContainer.innerHTML = "";
      const filtered = data.filter(d => d.tab === selectedTab);
      filtered.forEach(card => {
        const cardEl = document.createElement("div");
        cardEl.className = "product-card";
        cardEl.innerHTML = `
          <img src="${card.image}" alt="${card.title}" />
          <h3>${card.title}</h3>
          <p>${card.description}</p>
          <a href="${card.ctaUrl}" class="cta-btn">${card.ctaText}</a>
        `;
        cardContainer.appendChild(cardEl);
      });
    }
  
    // Render first tab by default
    renderCards(tabs[0]);
  });
  