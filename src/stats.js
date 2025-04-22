// Base statistics (user-facing values)
const BASE_STATS = {
    maxSpeed: 100,
    acceleration: 100,
    shieldChance: 25
};

// In-game base values
const BASE_GAME_STATS = {
    maxSpeed: 2.5,
    acceleration: 20,
    shieldChance: 0.25
};

// Initialize empty objects for characters and horses
let CHARACTERS = {};
let HORSES = {};
let dataLoaded = false;

// Function to load all card data and organize into CHARACTERS and HORSES
async function loadCardData() {
    try {
        let allCards = await getAllCards();
        const collection = await getCollection();
        
        // Reset the objects
        CHARACTERS = {};
        HORSES = {};
        // Filter cards based on collection
        const collectionIds = new Set(collection.map(item => item.id));
        allCards = allCards.filter(card => collectionIds.has(card.id));
        // Populate characters and horses based on type
        allCards.forEach(card => {
            const cardData = {
                name: `${card.name}, ${card.title}`,
                horseSkill: card.charisma,
                maxSpeed: card.speed,
                acceleration: card.acceleration,
                shieldChance: card.hability || 0,
                // Additional properties that could be useful
                id: card.id,
                description: card.description,
                nationality: card.nationality,
                rarity: card.rarity,
                imagePath: card.image_path,
                glbPath: card.glb_path
            };
            
            // Add to appropriate collection based on type
        
            if (card.type === true) {
                // It's a rider/character
                CHARACTERS[card.name] = cardData;
            } else {
                // It's a horse
                HORSES[card.name] = cardData;
            }
        });
        
        dataLoaded = true;
        console.log('Card data loaded successfully');
        console.log(`Loaded ${Object.keys(CHARACTERS).length} characters and ${Object.keys(HORSES).length} horses`);
        
        return { success: true };
    } catch (error) {
        console.error('Failed to load card data:', error);
        return { success: false, error };
    }
}

// Function to check if data is loaded
function isDataLoaded() {
    return dataLoaded;
}

// Load data at startup
loadCardData();

async function getCollection() {
    return fetch('/api/collection')
        .then(response => response.json())
        .catch(error => console.error('Error fetching collection:', error));
}

async function getAllCards() {
    return fetch('/api/all-cards')
        .then(response => response.json())
        .catch(error => console.error('Error fetching all cards:', error));
}

// Function to calculate combined stats
function calculateStats(characterId, horseId) {
    // If data isn't loaded yet, return default stats
    if (!dataLoaded) {
        console.warn('Card data not yet loaded, using default values');
    }
    
    // Default to using base stats only
    let result = {
        compatible: true,
        message: "",
        display: {
            maxSpeed: BASE_STATS.maxSpeed,
            acceleration: BASE_STATS.acceleration,
            shieldChance: BASE_STATS.shieldChance
        },
        game: {
            maxSpeed: BASE_GAME_STATS.maxSpeed,
            acceleration: BASE_GAME_STATS.acceleration,
            shieldChance: BASE_GAME_STATS.shieldChance
        },
        calculations: {
            maxSpeed: `Base: ${BASE_STATS.maxSpeed}`,
            acceleration: `Base: ${BASE_STATS.acceleration}`,
            shieldChance: `Base: ${BASE_STATS.shieldChance}%`
        }
    };
    
    // Rest of function remains the same...
    // Add character bonuses if selected
    if (characterId && CHARACTERS[characterId]) {
        const character = CHARACTERS[characterId];
        result.display.maxSpeed += character.maxSpeed;
        result.display.acceleration += character.acceleration;
        result.display.shieldChance += character.shieldChance;
        
        result.calculations.maxSpeed += ` + ${character.name}: ${character.maxSpeed > 0 ? '+' : ''}${character.maxSpeed}`;
        result.calculations.acceleration += ` + ${character.name}: ${character.acceleration > 0 ? '+' : ''}${character.acceleration}`;
        result.calculations.shieldChance += ` + ${character.name}: ${character.shieldChance > 0 ? '+' : ''}${character.shieldChance}%`;
    }
    
    // Add horse bonuses if selected
    if (horseId && HORSES[horseId]) {
        const horse = HORSES[horseId];
        
        // Check for compatibility
        if (characterId && CHARACTERS[characterId] && 
            CHARACTERS[characterId].horseSkill < horse.horseSkill) {
            result.compatible = false;
            result.message = `${CHARACTERS[characterId].name} n'a pas assez d'expérience pour monter ${horse.name}!`;
        } else {
            result.display.maxSpeed += horse.maxSpeed;
            result.display.acceleration += horse.acceleration;
            
            result.calculations.maxSpeed += ` + ${horse.name}: ${horse.maxSpeed > 0 ? '+' : ''}${horse.maxSpeed}`;
            result.calculations.acceleration += ` + ${horse.name}: ${horse.acceleration > 0 ? '+' : ''}${horse.acceleration}`;
        }
    }
    
    // Ensure values don't go below 1
    result.display.maxSpeed = Math.max(1, result.display.maxSpeed);
    result.display.acceleration = Math.max(1, result.display.acceleration);
    result.display.shieldChance = Math.max(0, result.display.shieldChance);
    
    // Convert display values to game values
    result.game.maxSpeed = (result.display.maxSpeed / BASE_STATS.maxSpeed) * BASE_GAME_STATS.maxSpeed;
    result.game.acceleration = (result.display.acceleration / BASE_STATS.acceleration) * BASE_GAME_STATS.acceleration;
    result.game.shieldChance = result.display.shieldChance / 100;
    
    // Add final results to calculations
    result.calculations.maxSpeed += ` = ${result.display.maxSpeed.toFixed(1)}`;
    result.calculations.acceleration += ` = ${result.display.acceleration.toFixed(1)}`;
    result.calculations.shieldChance += ` = ${result.display.shieldChance.toFixed(1)}%`;
    
    return result;
}

