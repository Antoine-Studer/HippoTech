const express = require('express');
const app = express();
const port = 3000;

// Cooldown configuration
const COOLDOWN_MS = 1000; // 5 minutes cooldown
const lastBoosterOpenTime = new Map(); // Track when each user last opened a booster

// Serve static files (HTML, CSS, JS)
app.use(express.json()); // For parsing JSON requests


const testProperties = [
    ...require('./cards/test.json')
];
// Card data
const ridersProperties = [
    ...require('./cards/riders.json')
];
const horsesProperties = [
    ...require('./cards/horses.json')
];
const cardsProperties = [
    ...ridersProperties,
    ...horsesProperties
];


let collection = [];

function getRandomCard(propreties = cardsProperties) {
    const randomIndex = Math.floor(Math.random() * propreties.length);
    return propreties[randomIndex];
}

app.get('/api/open-booster', (req, res) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const currentTime = Date.now();
    const lastOpenTime = lastBoosterOpenTime.get(clientIp) || 0;
    const timeElapsed = currentTime - lastOpenTime;
    
    // Check if the cooldown period has passed
    if (lastOpenTime && timeElapsed < COOLDOWN_MS) {
        const remainingTime = COOLDOWN_MS - timeElapsed;
        return res.json({
            canOpen: false,
            error: "Rate limited",
            remainingTime: remainingTime,
            message: `Please wait before opening another booster pack`
        });
    }
    
    // Update the last open time for this client
    lastBoosterOpenTime.set(clientIp, currentTime);
    
    const boosterPack = [];
    for (let i = 0; i < 5; i++) {
        const card = getRandomCard(testProperties);
        boosterPack.push(card);
        collection.push(card);
    }
    res.json(boosterPack);
}); 

app.get('/api/collection', (req, res) => {
    res.json(collection);
});

app.post('/api/reset-collection', (req, res) => {
    collection = [];
    res.json(collection);
});

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

app.get('/api/all-riders', (req, res) => {
    res.json(ridersProperties);
});

app.get('/api/all-horses', (req, res) => {
    res.json(horsesProperties);
});

app.get('/api/all-cards', (req, res) => {
    res.json(cardsProperties);
});

app.use(express.static(__dirname));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});