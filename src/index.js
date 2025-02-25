// Sample card data
const cardProperties = [
    {"Majico 6 - Trotteur Français": "majico_6.png"},
    {"Imperial Cel - Pur-Sang": "imperial_cel.png"},
    {"Ganador Cel - Selle Français":  "garanor_cel.png"},
];

const rarities = [
    { name: "common", chance: 0.7 },
    { name: "rare", chance: 0.25 },
    { name: "legendary", chance: 0.05 }
];

function getRandomCard() {
    const randomProperties = cardProperties[Math.floor(Math.random() * cardProperties.length)];
    const cardName = Object.keys(randomProperties)[0];
    const cardImage = Object.values(randomProperties)[0];
    const randomChance = Math.random();
    console.log("Random chance:", randomChance);
    let selectedRarity = "common";
    for (const rarity of rarities) {
        if (randomChance <= rarity.chance) {
            selectedRarity = rarity.name;
        }
    }
    return { name: cardName, image: cardImage,  rarity: selectedRarity };
}

function saveToCollection(card) {
    try {
        let collection = JSON.parse(localStorage.getItem('cardCollection') || '[]');
        if (!Array.isArray(collection)) collection = [];
        collection.push(card);
        localStorage.setItem('cardCollection', JSON.stringify(collection));
        console.log("Card saved:", card, "Total cards:", collection.length);
    } catch (e) {
        console.error("Error saving to localStorage:", e);
    }
}

function openBooster() {
    const cardDisplay = document.getElementById("cardDisplay");
    cardDisplay.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        const card = getRandomCard();
        saveToCollection(card);
        const cardElement = document.createElement("div");
        cardElement.classList.add("card", card.rarity);
        cardElement.innerHTML = `
            <div class="img-div"> <img class="card-image" src="images/${card.image}" /> </div>
            <div class="card-name">${card.name}</div>
            <div class="card-rarity">${card.rarity.toUpperCase()}</div>
        `;
        cardDisplay.appendChild(cardElement);
    }
}

// Event listeners
document.getElementById("openBoosterBtn").addEventListener("click", openBooster);
document.getElementById("collectionBtn").addEventListener("click", () => {
    window.location.href = "collection.html";
});