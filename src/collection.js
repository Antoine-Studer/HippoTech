function displayCollection(collection, cardProperties) {
    const collectionDisplay = document.getElementById("collectionDisplay");
    collectionDisplay.innerHTML = "";

    // Build a map of owned cards with counts
    const ownedCards = new Map();
    collection.forEach(card => {
        const key = `${card.name}-${card.rarity}`;
        ownedCards.set(key, (ownedCards.get(key) || 0) + 1);
    });

    // Display all possible cards
    cardProperties.forEach(prop => {
        const name = prop.name;
        const image = prop.img_path ? `images/${prop.img_path}` : "images/unknown.png";
        ["common", "rare", "legendary"].forEach(rarity => {
            const key = `${name}-${rarity}`;
            const count = ownedCards.get(key) || 0;
            const cardElement = document.createElement("div");
            cardElement.classList.add("card", rarity);
            cardElement.innerHTML = `
                <div class="img-div">
                    <img class="card-image" src="${count > 0 ? image : 'images/unknown.png'}" alt="${name}"/>
                </div>
                <div class="card-name">${count > 0 ? name : "???"}</div>
                <div class="card-rarity">${rarity.toUpperCase()}${count > 0 ? " (x" + count + ")" : ""}</div>
            `;
            collectionDisplay.appendChild(cardElement);
        });
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