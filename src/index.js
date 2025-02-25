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
    const cards = [];
    for (let i = 0; i < 5; i++) {
        const card = getRandomCard();
        saveToCollection(card);
        cards.push(card);
    }

    let currentIndex = 0;
    let startX = 0;
    let endX = 0;

    function showCard(index) {
        const card = cards[index];
        const cardElement = document.createElement("div");
        cardElement.classList.add("card", card.rarity);
        cardElement.innerHTML = `
            <div class="card-name">${card.name}</div>
            <div class="card-rarity">${card.rarity.toUpperCase()}</div>
        `;
        cardDisplay.innerHTML = "";
        cardDisplay.appendChild(cardElement);
    }

    function handleSwipe() {
        const currentCard = cardDisplay.querySelector(".card");
        if (startX - endX > 50) {
            currentIndex = (currentIndex + 1) % cards.length;
            currentCard.style.transform = 'translateX(-100%)';
            currentCard.style.opacity = '0';
        } else if (endX - startX > 50) {
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
            currentCard.style.transform = 'translateX(100%)';
            currentCard.style.opacity = '0';
        }

        currentCard.addEventListener('transitionend', () => {
            showCard(currentIndex);
        }, { once: true });
    }

    cardDisplay.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
    });

    cardDisplay.addEventListener("touchmove", (e) => {
        endX = e.touches[0].clientX;
    });

    cardDisplay.addEventListener("touchend", () => {
        handleSwipe();
    });

    showCard(currentIndex);
}

// Event listeners
document.getElementById("openBoosterBtn").addEventListener("click", openBooster);
document.getElementById("collectionBtn").addEventListener("click", () => {
    window.location.href = "collection.html";
});