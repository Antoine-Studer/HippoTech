const cardNames = [
    "Ourasi - Trotteur Français",
    "Trêve - Pur-Sang",
    "Cirrus - Selle Français",
    "Jappeloup - Anglo-Arabe",
    "Al Capone - Percheron",
    "Bold Eagle - Trotteur Français",
    "Galopin - Pur-Sang",
    "Quartz - Selle Français"
];

function displayCollection() {
    let collection;
    try {
        collection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
        console.log("Loaded collection:", collection);
    } catch (e) {
        console.error("Error loading collection:", e);
        collection = [];
    }

    const collectionDisplay = document.getElementById("collectionDisplay");
    collectionDisplay.innerHTML = "";

    const ownedCards = new Map();
    collection.forEach(card => {
        const key = `${card.name}-${card.rarity}`;
        ownedCards.set(key, (ownedCards.get(key) || 0) + 1);
    });

    const sortedRarities = ["common", "rare", "legendary"];
    sortedRarities.forEach(rarity => {
        cardNames.forEach(name => {
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

function resetCollection() {
    if (confirm("Are you sure you want to reset your collection? This cannot be undone.")) {
        localStorage.removeItem('cardCollection');
        displayCollection();
        console.log("Collection reset");
    }
}

document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "../index.html";
});

document.getElementById("resetBtn").addEventListener("click", resetCollection);

displayCollection();