const express = require('express');
const session = require('express-session');
const app = express();
const port = 3000;

// Session configuration - add this before other middleware
app.use(session({
  secret: 'hippotech-secret-key',  // Change this to something secure in production
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ... rest of your server.js code
// Cooldown configuration
const COOLDOWN_MS = 60 * 1000; // 5 minutes cooldown
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

// Modify your users table creation to include last_booster_open
pool.query(`
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        last_booster_open TIMESTAMP
    )
`).catch(err => console.error('Error creating users table:', err));


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

        // Set user info in session
        req.session.userId = user.id;
        req.session.username = user.username;
        
        res.json({ 
            message: 'Login successful', 
            userId: user.id,
            username: user.username
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add a logout route
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ message: 'Logout successful' });
    });
});

// Add a route to check authentication status
app.get('/api/auth-check', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            authenticated: true, 
            userId: req.session.userId,
            username: req.session.username
        });
    } else {
        res.json({ authenticated: false });
    }
});

async function getRandomCard() {
    try {
        const odd = Math.random();
        console.log('Random number generated:', odd);
        let rarity = 0;
        if (odd < 0.005) {
            rarity = 3; // 0.5% chance for legendary
        } else if (odd < 0.1) {
            rarity = 2; // 9.5% chance for epic
        } else if (odd < 0.3) {
            rarity = 1; // 20% chance for rare
        }               // 70% chance for normal (0)
        const result = await pool.query('SELECT * FROM cards WHERE rarity = $1', [rarity]);
        if (result.rows.length === 0) {
            throw new Error('No cards available in the database');
        }
        const randomIndex = Math.floor(Math.random() * result.rows.length);
        console.log('Random card selected:', result.rows[randomIndex]);
        return result.rows[randomIndex];
    } catch (error) {
        console.error('Error fetching a random card:', error);
        throw error;
    }
}


// Replace your current collection handling with this:

// Authentication middleware for protected routes
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}

app.get('/api/open-booster', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const currentTime = Date.now();
    
    // Get last booster open time from database
    const cooldownResult = await pool.query(
        'SELECT last_booster_open FROM users WHERE id = $1',
        [userId]
    );
    
    const lastOpenTime = cooldownResult.rows[0]?.last_booster_open ? 
        new Date(cooldownResult.rows[0].last_booster_open).getTime() : 0;
    
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
    
    // Update the last open time in database
    await pool.query(
        'UPDATE users SET last_booster_open = NOW() WHERE id = $1',
        [userId]
    );
    
    const boosterPack = [];
    for (let i = 0; i < 5; i++) {
        const card = await getRandomCard(); // Await the result of getRandomCard
        boosterPack.push(card);
        const existingCard = await pool.query(
            'SELECT number_of_cards FROM user_collection WHERE user_id = $1 AND card_id = $2',
            [userId, card.id]
        );

        if (existingCard.rows.length > 0) {
            await pool.query(
                'UPDATE user_collection SET number_of_cards = number_of_cards + 1 WHERE user_id = $1 AND card_id = $2',
                [userId, card.id]
            );
        } else {
            await pool.query(
                'INSERT INTO user_collection (user_id, card_id, number_of_cards) VALUES ($1, $2, 1)',
                [userId, card.id]
            );
        }
    }
    
    res.json(boosterPack);
});

app.get('/api/collection', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    try {
        const result = await pool.query(
            'SELECT cards.name, user_collection.number_of_cards, cards.id FROM user_collection RIGHT JOIN cards ON cards.id = user_collection.card_id WHERE user_collection.user_id = $1',
            [userId]
        );
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching all cards:', error);
        res.status(500).json({ error: 'Failed to fetch all cards' });
    }
});

app.post('/api/reset-collection', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    
    try {
        await pool.query(
            'DELETE FROM user_collection WHERE user_id = $1',
            [userId]
        );
        res.json({ message: 'Collection reset successfully' });
    } catch (error) {
        console.error('Error resetting collection:', error);
        res.status(500).json({ error: 'Failed to reset collection' });
    }
});

// Update cooldown status endpoint
app.get('/api/cooldown-status', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    
    try {
        const result = await pool.query(
            'SELECT last_booster_open FROM users WHERE id = $1',
            [userId]
        );
        
        const lastOpenTime = result.rows[0]?.last_booster_open ? 
            new Date(result.rows[0].last_booster_open).getTime() : 0;
        
        const currentTime = Date.now();
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
    } catch (error) {
        console.error('Error checking cooldown status:', error);
        res.status(500).json({ error: 'Failed to check cooldown status' });
    }
});

app.get('/api/all-riders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cards WHERE type ORDER BY rarity DESC');

        // No need to parse `card_data` if it's already JSON
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all cards:', error);
        res.status(500).json({ error: 'Failed to fetch all cards' });
    }
});

app.get('/api/all-horses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cards WHERE NOT type ORDER BY rarity DESC');

        // No need to parse `card_data` if it's already JSON
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all cards:', error);
        res.status(500).json({ error: 'Failed to fetch all cards' });
    }
});

app.get('/api/all-cards', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM cards');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all cards:', error);
        res.status(500).json({ error: 'Failed to fetch all cards' });
    }
});

app.get('/api/get-user', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.json({ connected: false });
        }
        const result = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found', connected: false });
        }

        res.json({ ...result.rows[0], connected: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user', connected: false });
    }
});

app.use(express.static(__dirname));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});