const express = require('express');
const app = express();
const port = 3000;

// Cooldown configuration
const COOLDOWN_MS = 1000; // 5 minutes cooldown
const lastBoosterOpenTime = new Map(); // Track when each user last opened a booster

// Serve static files (HTML, CSS, JS)
app.use(express.json()); // For parsing JSON requests

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'hippotech',
    password: 'admin', // Changed from empty string to null for no password
    port: 5432,
});

// Test database connection at startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Database connected successfully');
        
        // Create users table if it doesn't exist
        pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL
            )
        `).catch(err => console.error('Error creating users table:', err));
    }
});

const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

app.post('/api/signup', 
    [
        body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
        body('email').isEmail().withMessage('Invalid email address'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;
        console.log('Signup attempt:', { username, email });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await pool.query(
                'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
                [username, email, hashedPassword]
            );
            console.log('User registered successfully:', result.rows[0].id);
            res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id });
        } catch (err) {
            console.error('Signup error details:', err);
            if (err.code === '23505') { // Unique constraint violation
                res.status(400).json({ error: 'Username or email already exists' });
            } else {
                res.status(500).json({ error: 'Internal server error: ' + (err.message || 'Unknown error') });
            }
        }
    }
);

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid password' });
        }

        res.json({ message: 'Login successful', userId: user.id });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});


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
        const card = getRandomCard();
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