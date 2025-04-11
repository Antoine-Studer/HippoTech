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

// Character statistics
const CHARACTERS = {
    "Charly": {
        name: "Charly, l'élégant",
        horseSkill: 130,
        maxSpeed: 20,
        acceleration: 0,
        shieldChance: 0
    },
    "Gaston": {
        name: "Gaston, le cavalier du granit",
        horseSkill: 60,
        maxSpeed: 10,
        acceleration: 60,
        shieldChance: 0
    },
    "Maxime": {
        name: "Maxime, le cavalier de la mogette",
        horseSkill: 50,
        maxSpeed: 40,
        acceleration: 40,
        shieldChance: 0
    },
    "Guillaume": {
        name: "Guillaume, l'éclair procrastinateur",
        horseSkill: 150,
        maxSpeed: 1,
        acceleration: 1,
        shieldChance: 1
    },
    "Leo": {
        name: "Leo l'infatigable",
        horseSkill: 20,
        maxSpeed: 60,
        acceleration: 60,
        shieldChance: 0
    },
    "Theo": {
        name: "Theo, la force tranquille",
        horseSkill: 40,
        maxSpeed: 110,
        acceleration: -20,
        shieldChance: 0
    },
    "Antoine": {
        name: "Antoine, l'hybride",
        horseSkill: 90,
        maxSpeed: 0,
        acceleration: 0,
        shieldChance: 15
    },
    "Dorian": {
        name: "Dorian le fougueux",
        horseSkill: 100,
        maxSpeed: 10,
        acceleration: 30,
        shieldChance: 0
    },
    "Kilian": {
        name: "Kilian, le chevaucheur de ratels",
        horseSkill: 90,
        maxSpeed: 25,
        acceleration: 25,
        shieldChance: 0
    },
    "Nolann": {
        name: "Nolann KerCharet",
        horseSkill: 110,
        maxSpeed: -40,
        acceleration: 50,
        shieldChance: 0
    },
    "Wael": {
        name: "Wael l'inébranlable",
        horseSkill: 90,
        maxSpeed: 10,
        acceleration: 10,
        shieldChance: 5
    },
    "Hugo": {
        name: "Hugo, le cavalier-barde",
        horseSkill: 70,
        maxSpeed: 0,
        acceleration: 40,
        shieldChance: 10
    }
};

// Horse statistics
const HORSES = {
    "Tempête": {
        name: "Tempête, le cheval divin",
        horseSkill: 150,
        maxSpeed: 150,
        acceleration: 100
    },
    "RouxCarnage": {
        name: "RouxCarnage, le destrier fidèle",
        horseSkill: 130,
        maxSpeed: 100,
        acceleration: 130
    },
    "Roquefort": {
        name: "Roquefort le puissant",
        horseSkill: 110,
        maxSpeed: 130,
        acceleration: 80
    },
    "Beato": {
        name: "Beato le grand sabot",
        horseSkill: 100,
        maxSpeed: 100,
        acceleration: 100
    },
    "Mirage": {
        name: "Mirage l'intangible",
        horseSkill: 90,
        maxSpeed: 70,
        acceleration: 120
    },
    "Tytoo": {
        name: "Tytoo, le destrier fonceur",
        horseSkill: 70,
        maxSpeed: 150,
        acceleration: 20
    },
    "Honnold": {
        name: "Honnold, le casse-cou",
        horseSkill: 90,
        maxSpeed: 110,
        acceleration: 80
    },
    "Canasson1104": {
        name: "Canasson n°1104",
        horseSkill: 60,
        maxSpeed: 100,
        acceleration: 60
    },
    "Canasson1808": {
        name: "Canasson n°1808",
        horseSkill: 50,
        maxSpeed: 60,
        acceleration: 90
    },
    "Olive": {
        name: "Olive, la brise d'Egée",
        horseSkill: 40,
        maxSpeed: 70,
        acceleration: 70
    },
    "Marguerite": {
        name: "Marguerite l'incomprise",
        horseSkill: 20,
        maxSpeed: 80,
        acceleration: 40
    },
    "Volt": {
        name: "Volt, le condensateur",
        horseSkill: 80,
        maxSpeed: 40,
        acceleration: 140
    }
};

// Function to calculate combined stats
function calculateStats(characterId, horseId) {
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