const express = require('express');
const app = express();
const port = 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));
app.use(express.json()); // For parsing JSON requests

// Card data
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

// In-memory collection (replace with database later if needed)
let collection = [];

// Generate random card
function getRandomCard() {
    const randomName = cardNames[Math.floor(Math.random() * cardNames.length)];
    const randomChance = Math.random();
    let selectedRarity = "common";
    for (const rarity of rarities) {
        if (randomChance <= rarity.chance) {
            selectedRarity = rarity.name;
        }
    }
    return { name: randomName, rarity: selectedRarity };
}

// API Endpoints
// Open a booster pack
app.get('/api/open-booster', (req, res) => {
    const booster = [];
    for (let i = 0; i < 5; i++) {
        const card = getRandomCard();
        booster.push(card);
        collection.push(card); // Save to collection
    }
    res.json(booster);
});

// Get the collection
app.get('/api/collection', (req, res) => {
    res.json({ collection, cardNames });
});

// Reset the collection
app.post('/api/reset-collection', (req, res) => {
    collection = [];
    res.json({ message: "Collection reset" });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});