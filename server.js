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

// Track last booster opening time by IP
let lastBoosterOpenTime = new Map();
// const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const COOLDOWN_MS = 10 *1000; // 10 seconds for testing

// Generate random card
function getRandomCard() {
    const randomProperties = cardProperties[Math.floor(Math.random() * cardProperties.length)];
    cardName = randomProperties.name;
    cardImage = "images/" + randomProperties.img_path;
    // console.log(cardName, cardImage);
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
    const clientIp = req.ip || req.connection.remoteAddress;
    const currentTime = Date.now();
    const lastOpenTime = lastBoosterOpenTime.get(clientIp) || 0;
    const timeElapsed = currentTime - lastOpenTime;
    
    // Check if cooldown period has passed
    if (lastOpenTime && timeElapsed < COOLDOWN_MS) {
        const remainingTime = COOLDOWN_MS - timeElapsed;
        const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
        return res.status(429).json({
            error: "Cooldown period not over",
            remainingTime: remainingTime,
            remainingMinutes: remainingMinutes,
            message: `You can open another booster in ${remainingMinutes} minutes`
        });
    }
    
    const booster = [];
    for (let i = 0; i < 5; i++) {
        const card = getRandomCard();
        booster.push(card);
        collection.push(card); // Save to collection
    }
    
    // Update last open time
    lastBoosterOpenTime.set(clientIp, currentTime);
    
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

// Get cooldown status
app.get('/api/cooldown-status', (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const currentTime = Date.now();
    const lastOpenTime = lastBoosterOpenTime.get(clientIp) || 0;
    const timeElapsed = currentTime - lastOpenTime;
    
    if (lastOpenTime && timeElapsed < COOLDOWN_MS) {
        const remainingTime = COOLDOWN_MS - timeElapsed;
        const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
        return res.json({
            canOpen: false,
            remainingTime: remainingTime,
            remainingMinutes: remainingMinutes,
            message: `You can open another booster in ${remainingMinutes} minutes`
        });
    }
    
    res.json({
        canOpen: true,
        message: "You can open a booster pack now"
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});