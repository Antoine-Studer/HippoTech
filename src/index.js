// Sample card data
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

const rarities = [
    { name: "common", chance: 0.7 },
    { name: "rare", chance: 0.25 },
    { name: "legendary", chance: 0.05 }
];

function getRandomCard() {
    const randomName = cardNames[Math.floor(Math.random() * cardNames.length)];
    const randomChance = Math.random();
    console.log("Random chance:", randomChance);
    let selectedRarity = "common";
    for (const rarity of rarities) {
        if (randomChance <= rarity.chance) {
            selectedRarity = rarity.name;
        }
    }
    return { name: randomName, rarity: selectedRarity };
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
            <div class="card-name">${card.name}</div>
            <div class="card-rarity">${card.rarity.toUpperCase()}</div>
        `;
        cardDisplay.appendChild(cardElement);
    }
}

// Event listeners
document.getElementById("openBoosterBtn").addEventListener("click", openBooster);
document.getElementById('openBoosterBtn').addEventListener('click', function() {
    const mainContent = document.querySelectorAll('body > :not(#cardDisplay):not(#continueBtn)');
    const cardDisplay = document.getElementById('cardDisplay');
    const continueBtn = document.getElementById('continueBtn') || document.createElement('button');
    
    if (!continueBtn.id) {
        continueBtn.id = 'continueBtn';
        continueBtn.textContent = 'Continue';
        document.body.appendChild(continueBtn);
    }

    mainContent.forEach(element => element.classList.add('hidden'));
    cardDisplay.classList.add('show');

    setTimeout(() => {
        continueBtn.style.display = 'block';
    }, 2000);

    continueBtn.addEventListener('click', function() {
        mainContent.forEach(element => element.classList.remove('hidden'));
        cardDisplay.classList.remove('show');
        continueBtn.style.display = 'none';
    });
});

document.getElementById("collectionBtn").addEventListener("click", () => {
    window.location.href = "collection.html";
});