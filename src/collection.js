function displayCollection(collection, cardProperties) {
    const collectionDisplay = document.getElementById("collectionDisplay");
    collectionDisplay.innerHTML = "";

    // Build a map of owned cards with counts
    const ownedCards = new Map();
    const cardStatsMap = new Map(); // Store card stats for owned cards
    
    collection.forEach(card => {
        const key = card.name;
        ownedCards.set(key, (ownedCards.get(key) || 0) + 1);
        // Store the stats for this card
        if (!cardStatsMap.has(key)) {
            cardStatsMap.set(key, {
                type: card.type,
                rarity: card.rarity,
                stats: card.stats
            });
        }
    });

    // Display all possible cards with their fixed rarity
    cardProperties.forEach(prop => {
        const name = prop.name;
        const image = prop.img_path ? `images/${prop.img_path}` : "images/unknown.png";
        const type = prop.type || "Unknown";
        const rarity = prop.rarity;
        
        const key = name;
        const count = ownedCards.get(key) || 0;
        const cardElement = document.createElement("div");
        cardElement.classList.add("card", rarity);
        
        let statsHTML = '';
        if (count > 0 && cardStatsMap.has(key)) {
            const cardData = cardStatsMap.get(key);
            for (const [stat, value] of Object.entries(cardData.stats)) {
                const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
                statsHTML += `
                    <div class="stat-row">
                        <span class="stat-name">${statName}</span>
                        <div class="stat-bar-container">
                            <div class="stat-bar" style="width: ${value}%"></div>
                        </div>
                        <span class="stat-value">${value}</span>
                    </div>
                `;
            }
        }
        
        cardElement.innerHTML = `
            <div class="img-div">
                <img class="card-image" src="${count > 0 ? image : 'images/unknown.png'}" alt="${name}"/>
            </div>
            <div class="card-name">${count > 0 ? name : "???"}</div>
            ${count > 0 ? `<div class="card-type">${cardStatsMap.get(key)?.type || type}</div>` : ''}
            <div class="card-rarity">${rarity.toUpperCase()}${count > 0 ? " (x" + count + ")" : ""}</div>
            ${count > 0 ? `<div class="card-stats">${statsHTML}</div>` : ''}
        `;
        collectionDisplay.appendChild(cardElement);
    });

    // Add filters for type and rarity
    addCollectionFilters();
}

function addCollectionFilters() {
    // If filters already exist, don't create them again
    if (document.getElementById('collection-filters')) return;
    
    const filtersContainer = document.createElement('div');
    filtersContainer.id = 'collection-filters';
    filtersContainer.className = 'filters-container';
    
    filtersContainer.innerHTML = `
        <h3>Filter Cards</h3>
        <div class="filter-group">
            <label for="type-filter">Type:</label>
            <select id="type-filter">
                <option value="all">All Types</option>
                <option value="Racing">Racing</option>
                <option value="Show">Show</option>
                <option value="Draft">Draft</option>
            </select>
        </div>
        <div class="filter-group">
            <label for="rarity-filter">Rarity:</label>
            <select id="rarity-filter">
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="legendary">Legendary</option>
            </select>
        </div>
    `;
    
    // Insert after the button container, before the collection display
    const buttonContainer = document.querySelector('.button-container');
    buttonContainer.parentNode.insertBefore(filtersContainer, buttonContainer.nextSibling);
    
    // Add event listeners for the filters
    document.getElementById('type-filter').addEventListener('change', applyFilters);
    document.getElementById('rarity-filter').addEventListener('change', applyFilters);
}

function applyFilters() {
    const typeFilter = document.getElementById('type-filter').value;
    const rarityFilter = document.getElementById('rarity-filter').value;
    
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        let showCard = true;
        
        // Apply type filter
        if (typeFilter !== 'all') {
            const cardType = card.querySelector('.card-type');
            if (!cardType || cardType.textContent !== typeFilter) {
                showCard = false;
            }
        }
        
        // Apply rarity filter
        if (rarityFilter !== 'all') {
            if (!card.classList.contains(rarityFilter)) {
                showCard = false;
            }
        }
        
        card.style.display = showCard ? '' : 'none';
    });
}

async function loadCollection() {
    try {
        const response = await fetch('/api/collection');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        displayCollection(data.collection, data.cardProperties);
    } catch (error) {
        console.error("Error loading collection:", error);
    }
}

document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "index.html";
});

document.getElementById("resetBtn").addEventListener("click", async () => {
    if (confirm("Are you sure you want to reset your collection? This cannot be undone.")) {
        try {
            const response = await fetch('/api/reset-collection', { method: 'POST' });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            await loadCollection(); // Refresh display after reset
            console.log("Collection reset");
        } catch (error) {
            console.error("Error resetting collection:", error);
        }
    }
});

// Load collection on page load
loadCollection();