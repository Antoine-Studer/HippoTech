const express = require('express');
const app = express();
const port = 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));
app.use(express.json()); // For parsing JSON requests

// Card data
const cardProperties = [
    { name: "Ganador Cel", img_path: "ganador_cel.png" },
    { name: "Imperial Cel", img_path: "imperial_cel.png" },
    { name: "Majico 6", img_path: "majico_6.png" }
]

const rarities = [
    { name: "common", chance: 0.7 },
    { name: "rare", chance: 0.25 },
    { name: "legendary", chance: 0.05 }
];

// In-memory collection (replace with database later if needed)
let collection = [];

// Generate random card
function getRandomCard() {
    const randomProperties = cardProperties[Math.floor(Math.random() * cardProperties.length)];
    cardName = randomProperties.name;
    cardImage = "images/" + randomProperties.img_path;
    console.log(cardName, cardImage);
    const randomChance = Math.random();
    let selectedRarity = "common";
    for (const rarity of rarities) {
        if (randomChance <= rarity.chance) {
            selectedRarity = rarity.name;
        }
    }
    return { name: cardName, img: cardImage, rarity: selectedRarity };
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
    res.json({ collection, cardProperties });
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