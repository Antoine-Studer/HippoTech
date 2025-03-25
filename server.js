const express = require('express');
const app = express();
const port = 3000;

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));
app.use(express.json()); // For parsing JSON requests

// Card data
const cardProperties = [
    { 
        name: "Ganador Cel", 
        img_path: "ganador_cel.png",
        type: "Racing",
        rarity: "legendary",
        stats: {
            speed: 95,
            stamina: 87,
            agility: 75,
            strength: 55,
            loyalty: 60
        }
    },
    { 
        name: "Imperial Cel", 
        img_path: "imperial_cel.png",
        type: "Show",
        rarity: "legendary",
        stats: {
            speed: 86,
            stamina: 65,
            agility: 85,
            strength: 50,
            loyalty: 55
        }
    },
    { 
        name: "Majico 6", 
        img_path: "majico_6.png",
        type: "Draft",
        rarity: "legendary",
        stats: {
            speed: 55,
            stamina: 90,
            agility: 50,
            strength: 95,
            loyalty: 80
        }
    },
    { 
        name: "Fabulosa Cel", 
        img_path: "fabulosa_cel.png",
        type: "Racing",
        rarity: "rare",
        stats: {
            speed: 95,
            stamina: 65,
            agility: 85,
            strength: 50,
            loyalty: 55
        }
    },
    { 
        name: "Distinta Ben", 
        img_path: "distinta_ben.png",
        type: "Racing",
        rarity: "rare",
        stats: {
            speed: 90,
            stamina: 80,
            agility: 70,
            strength: 60,
            loyalty: 65
        }
    },
    { 
        name: "Habanera Gom", 
        img_path: "habanera_gom.png",
        type: "Show",
        rarity: "rare",
        stats: {
            speed: 60,
            stamina: 70,
            agility: 95,
            strength: 65,
            loyalty: 90
        }
    },
    { 
        name: "Serrada Ym", 
        img_path: "serrada_ym.png",
        type: "Draft",
        rarity: "common",
        stats: {
            speed: 50,
            stamina: 95,
            agility: 40,
            strength: 100,
            loyalty: 85
        }
    },
    { 
        name: "Hada Pg", 
        img_path: "hada_pg.png",
        type: "Show",
        rarity: "common",
        stats: {
            speed: 70,
            stamina: 65,
            agility: 90,
            strength: 60,
            loyalty: 80
        }
    },
    { 
        name: "Dansa Pm", 
        img_path: "dansa_pm.png",
        type: "Racing",
        rarity: "common",
        stats: {
            speed: 85,
            stamina: 90,
            agility: 65,
            strength: 70,
            loyalty: 60
        }
    },
    { 
        name: "Quita III", 
        img_path: "quita_iii.png",
        type: "Draft",
        rarity: "common",
        stats: {
            speed: 45,
            stamina: 85,
            agility: 40,
            strength: 95,
            loyalty: 75
        }
    }
]
// const cardProperties = JSON.parse(fs.readFileSync(path.join(__dirname, 'cards.json'), 'utf8'));
// The rarity distribution for random selection
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
const COOLDOWN_MS = 1 * 1000; // 10 seconds for testing

// Generate random card
function getRandomCard() {
    // First, select from available rarities based on chances
    const randomChance = Math.random();
    let targetRarity = "common";
    
    if (randomChance <= rarities[2].chance) {
        targetRarity = rarities[2].name; // legendary
    } else if (randomChance <= rarities[1].chance + rarities[2].chance) {
        targetRarity = rarities[1].name; // rare
    }
    
    // Filter cards by selected rarity
    const cardsOfSelectedRarity = cardProperties.filter(card => card.rarity === targetRarity);
    
    // If no cards of this rarity exist, select a random card from all properties
    let selectedCard;
    if (cardsOfSelectedRarity.length > 0) {
        selectedCard = cardsOfSelectedRarity[Math.floor(Math.random() * cardsOfSelectedRarity.length)];
    } else {
        selectedCard = cardProperties[Math.floor(Math.random() * cardProperties.length)];
    }
    
    // Apply stat multipliers based on the card's rarity
    let statMultiplier = 1.0;
    if (selectedCard.rarity === "legendary") {
        statMultiplier = 1.5;
    } else if (selectedCard.rarity === "rare") {
        statMultiplier = 1.2;
    }
    
    // Apply the stat multiplier
    const boostedStats = {};
    for (const [stat, value] of Object.entries(selectedCard.stats)) {
        boostedStats[stat] = Math.min(Math.round(value * statMultiplier), 100); // Cap at 100
    }
    
    return { 
        name: selectedCard.name, 
        img: "images/" + selectedCard.img_path, 
        rarity: selectedCard.rarity,
        type: selectedCard.type,
        stats: boostedStats 
    };
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