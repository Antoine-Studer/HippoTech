function displayCollection(collection, cardNames) {
    const collectionDisplay = document.getElementById("collectionDisplay");
    collectionDisplay.innerHTML = "";

    const ownedCards = new Map();
    collection.forEach(card => {
        const key = `${card.name}-${card.rarity}`;
        ownedCards.set(key, (ownedCards.get(key) || 0) + 1);
    });

    cardNames.forEach(name => {
        ["common", "rare", "legendary"].forEach(rarity => {
            const key = `${name}-${rarity}`;
            const count = ownedCards.get(key) || 0;
            const cardElement = document.createElement("div");
            cardElement.classList.add("card", rarity);
            cardElement.innerHTML = `
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
        const data = await response.json();
        displayCollection(data.collection, data.cardNames);
    } catch (error) {
        console.error("Error loading collection:", error);
    }
}

document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "../index.html";
});

document.getElementById("resetBtn").addEventListener("click", async () => {
    if (confirm("Are you sure you want to reset your collection? This cannot be undone.")) {
        try {
            await fetch('/api/reset-collection', { method: 'POST' });
            loadCollection(); // Refresh display
            console.log("Collection reset");
        } catch (error) {
            console.error("Error resetting collection:", error);
        }
    }
});

// Load collection on page load
loadCollection();