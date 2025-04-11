const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const pauseMenu = document.getElementById('pauseMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const resumeButton = document.getElementById('resumeButton');
const mainMenuButton = document.getElementById('mainMenuButton');
const restartButton = document.getElementById('restartButton');
const mainMenuButtonGameOver = document.getElementById('mainMenuButtonGameOver');
const finalScore = document.getElementById('finalScore');
const jumpCountDisplay = document.getElementById('jumpCount');

const winMenu = document.getElementById('winMenu');
const finishTimeDisplay = document.getElementById('finishTime');
const finalScoreWin = document.getElementById('finalScoreWin');
const restartButtonWin = document.getElementById('restartButtonWin');
const mainMenuButtonWin = document.getElementById('mainMenuButtonWin');
let gameStartTime = 0;
let hasWon = false;
const FINISH_SCORE = 2500;
let finishLine = {
    x: 0,
    visible: false
};

// Update the player initialization with stored stats from localStorage
const selectedCharacter = localStorage.getItem('selectedCharacter') || 'None';
const selectedHorse = localStorage.getItem('selectedHorse') || 'None';

// Get saved player stats or use defaults
let savedStats = {};
try {
    savedStats = JSON.parse(localStorage.getItem('playerStats')) || {};
} catch (e) {
    console.error("Could not parse player stats", e);
    savedStats = {};
}

console.log(`Character: ${selectedCharacter}, Horse: ${selectedHorse}`);
console.log("Stats:", savedStats);

const player = {
    x: 50,
    y: 0, // Will be set dynamically based on canvas height
    width: 35, // Reduced from 50 to 35 for a narrower hitbox
    height: 50,
    color: 'blue',
    dy: 0,
    gravity: 0.5,
    jumpStrength: 12,
    isJumping: false,
    // Use saved stats or default values
    maxSpeed: savedStats.maxSpeed || 2.5,  
    currentSpeed: 0, // Start at 0 and accelerate
    acceleration: savedStats.acceleration || 20,
    hasShield: false, // Track if player has a shield
    shieldChance: savedStats.shieldChance || 0.25 // Chance to get shield from obstacle
};

// Add these variables at the top with your other variables
let shieldNotificationTime = 0;
let shieldIconImage = new Image();
shieldIconImage.src = 'assets/shield.png'; // Create a shield icon image or use an existing one

// Add this variable near your other notification variables
let shieldUsedNotificationTime = 0;

let obstacles = [];
let score = 0;
let gameOver = false;
let isPaused = false;
let jumpCount = 0;
let lastTimestamp = 0; // For calculating deltaTime

// Load the fence image
const fenceImage = new Image();
fenceImage.src = 'assets/fence.png'; // Ensure the image has a transparent background

// Load the background image
const backgroundImage = new Image();
backgroundImage.src = 'assets/background.png'; // Ensure the image is in the correct path

// Load the horse sprite sheet
const horseSprite = new Image();
horseSprite.src = 'assets/horse_animation_nobg.png';

// Animation settings
const animation = {
    frameWidth: 0,      // Will be set after image loads
    frameHeight: 0,     // Will be set after image loads
    totalFrames: 0,     // Will be set after image loads
    currentFrame: 0,
    frameCount: 0,
    frameDuration: 5,   // Frames to wait before advancing animation
    spriteRows: 1,      // Typically 1 row for a running animation
    spriteColumns: 0    // Will be determined after image loads
};

// Analyze sprite sheet when loaded
horseSprite.onload = function() {
    // Simple sprite analyzer - assumes equal-sized frames in a single row
    // If your sprite sheet has multiple rows, you'll need to adjust this
    animation.frameHeight = horseSprite.height;
    animation.spriteColumns = Math.floor(horseSprite.width / animation.frameHeight);
    animation.frameWidth = horseSprite.width / animation.spriteColumns;
    animation.totalFrames = animation.spriteColumns;
    
    console.log(`Sprite sheet analyzed: ${animation.totalFrames} frames detected`);
    console.log(`Each frame is ${animation.frameWidth}x${animation.frameHeight} pixels`);
};

// Variables for scrolling background
let backgroundX1 = 0; // X position of the first background image
let backgroundX2 = canvas.width; // X position of the second background image

// Resize the canvas to fit the full screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Position the player at the bottom of the screen
    player.y = canvas.height - player.height - 20; // 20px padding from the bottom
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial resize

// When creating obstacles, update to add a 'jumped' property
function createObstacle() {
    if (obstacles.length > 0) {
        const lastObstacle = obstacles[obstacles.length - 1];
        if (lastObstacle.x > canvas.width - 200) {
            return; // Do not create a new obstacle yet
        }
    }

    const obstacle = {
        x: canvas.width,
        y: canvas.height - 80, // Position near the bottom of the screen
        width: 30, // Hitbox width
        height: 60, // Hitbox height
        imageWidth: 50, // Image width (independent of hitbox)
        imageHeight: 50, // Image height (independent of hitbox)
        color: 'red', // Invisible rectangle for collision detection
        jumped: false // Track if this obstacle has been jumped over
    };
    obstacles.push(obstacle);
}

// Update the update function to check for jumping over obstacles
function update(timestamp) {
    if (gameOver || isPaused || hasWon) return;
    
    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastTimestamp) / 1000 || 0.016; // Fallback to ~60fps if no timestamp
    lastTimestamp = timestamp;
    
    // Update animation
    animation.frameCount++;
    if (animation.frameCount >= animation.frameDuration) {
        animation.frameCount = 0;
        animation.currentFrame = (animation.currentFrame + 1) % animation.totalFrames;
    }
    
    // Adjust animation speed based on player speed
    // Faster player speed = faster animation
    animation.frameDuration = Math.max(3, 8 - Math.floor(player.currentSpeed));
    
    // Change animation based on player state
    if (player.isJumping) {
        // Use jumping frame (if your sprite sheet has one)
        // This assumes a specific frame for jumping
        animation.currentFrame = 3; // Adjust to your jumping frame number
        animation.frameCount = 0; // Hold this frame
    } else {
        // Normal running animation - cycle through frames
        if (animation.frameCount >= animation.frameDuration) {
            animation.frameCount = 0;
            animation.currentFrame = (animation.currentFrame + 1) % animation.totalFrames;
        }
    }
    
    // Update the background position
    updateBackground();
    
    // Check if we're approaching the finish line
    if (score >= FINISH_SCORE - 500 && !finishLine.visible) {
        finishLine.visible = true;
        finishLine.x = canvas.width + 100; // Start off-screen
    }
    
    // Move finish line if visible
    if (finishLine.visible) {
        finishLine.x -= player.currentSpeed;
        
        // Check if player reached finish line
        if (finishLine.x <= player.x) {
            winGame();
            return;
        }
    }
    
    // Player jump logic
    if (player.isJumping) {
        // Normal jump physics - apply full gravity
        player.dy += player.gravity;
        
        // Move player based on vertical velocity
        player.y += player.dy;
        
        // Clamp the player's position to prevent falling below the ground
        if (player.y >= canvas.height - player.height - 20) {
            player.y = canvas.height - player.height - 20;
            player.dy = 0;
            player.isJumping = false;
        }
        
        // Prevent the player from going above the canvas
        if (player.y < 0) {
            player.y = 0;
            player.dy = 0;
        }
    }
    
    // Acceleration logic - add a proportion of max speed each frame
    if (player.currentSpeed < player.maxSpeed) {
        // Calculate speed increase: (acceleration percentage / 100) * maxSpeed * deltaTime
        const speedIncrease = (player.acceleration / 100) * player.maxSpeed * deltaTime;
        player.currentSpeed = Math.min(player.currentSpeed + speedIncrease, player.maxSpeed);
    }
    
    // Move obstacles based on current speed
    obstacles.forEach(obstacle => {
        obstacle.x -= player.currentSpeed;
        
        // Check if player has successfully jumped over this obstacle
        if (!obstacle.jumped && obstacle.x + obstacle.width < player.x) {
            obstacle.jumped = true;
            
            // Use the player's shield chance from stats
            if (Math.random() < player.shieldChance && !player.hasShield) {
                player.hasShield = true;
                shieldNotificationTime = Date.now();
            }
        }
    });
    
    // Remove off-screen obstacles
    obstacles = obstacles.filter(obstacle => obstacle.x + obstacle.width > 0);
    
    // Adjust collision detection to allow passing through obstacles with shield

    // Collision detection
    obstacles.forEach(obstacle => {
        if (
            player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y
        ) {
            if (player.hasShield) {
                // Use the shield instead of ending the game
                player.hasShield = false;
                shieldUsedNotificationTime = Date.now(); // Set the time when shield was used
                
                // Mark this obstacle as "passed through" to prevent future collisions
                obstacle.passedThrough = true;
                
                // Move the obstacle slightly to avoid getting stuck in it
                obstacle.x = player.x + player.width; // Position it just past the player
            } else if (!obstacle.passedThrough) { // Only end game if not already passed through
                endGame();
            }
        }
    });
    
    // Increase score
    score += 1;
    
    // Check for win condition
    if (score >= FINISH_SCORE) {
        winGame();
        return;
    }
    
    // Create new obstacles
    if (Math.random() < 0.02 && !finishLine.visible) {
        createObstacle();
    }
}

// Add this function to draw the background
function drawBackground() {
    // Draw the two background images side by side
    ctx.drawImage(backgroundImage, backgroundX1, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, backgroundX2, 0, canvas.width, canvas.height);
}

// Update the background scrolling function to use player's current speed
function updateBackground() {
    // Move the background images to the left based on player's current speed
    backgroundX1 -= player.currentSpeed;
    backgroundX2 -= player.currentSpeed;
    
    // Reset the position of the background images when they go off-screen
    if (backgroundX1 + canvas.width <= 0) {
        backgroundX1 = backgroundX2 + canvas.width;
    }
    if (backgroundX2 + canvas.width <= 0) {
        backgroundX2 = backgroundX1 + canvas.width;
    }
}

// Update your draw function
function draw() {
    // Draw the scrolling background
    drawBackground();
    
    // Draw player hitbox (invisible) for collision detection
    ctx.fillStyle = 'transparent'; // Make the hitbox invisible
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw the animated horse sprite on top of the hitbox
    if (animation.totalFrames > 0) {
        // Calculate the source rectangle in the sprite sheet
        const sx = animation.currentFrame * animation.frameWidth;
        const sy = 0; // Assuming single row sprite sheet
        const sw = animation.frameWidth;
        const sh = animation.frameHeight;
        
        // Calculate the destination rectangle on the canvas
        // Position the horse sprite to align with the hitbox
        const dx = player.x - 17.5; // Adjusted offset to center sprite on narrower hitbox
        const dy = player.y - 20; // Offset to better align with hitbox
        const dw = player.width * 2.2; // Slightly increased multiplier to maintain visual size
        const dh = player.height * 1.8; // Adjust size as needed
        
        // Draw the current frame
        ctx.drawImage(horseSprite, sx, sy, sw, sh, dx, dy, dw, dh);
        
        // For debugging: uncomment to see the hitbox
        // ctx.strokeStyle = 'blue';
        // ctx.lineWidth = 2;
        // ctx.strokeRect(player.x, player.y, player.width, player.height);
    } else {
        // Fallback to the blue rectangle if sprite isn't loaded yet
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Draw finish line if visible
    if (finishLine.visible) {
        ctx.fillStyle = 'gold';
        ctx.fillRect(finishLine.x, 0, 10, canvas.height);
        
        // Draw checkered pattern
        ctx.fillStyle = 'black';
        const checkerSize = 20;
        for (let y = 0; y < canvas.height; y += checkerSize * 2) {
            for (let i = 0; i < 2; i++) {
                ctx.fillRect(finishLine.x, y + i * checkerSize, 10, checkerSize);
            }
        }
        
        // Draw "FINISH" text
        ctx.save();
        ctx.translate(finishLine.x - 15, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = 'red';
        ctx.font = 'bold 30px Arial';
        ctx.fillText('FINISH', 0, 0);
        ctx.restore();
    }
    
    // Draw obstacles
    obstacles.forEach(obstacle => {
        // Make the hitbox invisible by setting fillStyle to transparent
        ctx.fillStyle = 'transparent';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw the fence image at the exact same position and size as the hitbox
        ctx.drawImage(
            fenceImage,
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
        );
    });
    
    // Display score
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    
    // Display timer under the score
    const currentTime = (Date.now() - gameStartTime) / 1000;
    ctx.fillText(`Time: ${currentTime.toFixed(1)}s`, 10, 50);
    
    // Display shield notification if recently obtained
    if (shieldNotificationTime > 0) {
        const notificationDuration = 3000; // 3 seconds
        if (Date.now() - shieldNotificationTime < notificationDuration) {
            ctx.fillStyle = 'green';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("SHIELD OBTAINED!!!!", canvas.width / 2, 100);
            ctx.textAlign = 'left';
        } else {
            shieldNotificationTime = 0; // Reset notification time
        }
    }
    
    // Display shield icon if player has a shield
    if (player.hasShield) {
        // Draw shield icon under the timer
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(25, 85, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(25, 75);
        ctx.lineTo(25, 95);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(15, 85);
        ctx.lineTo(35, 85);
        ctx.stroke();
    }
    
    // Display shield used notification if recently happened
    if (shieldUsedNotificationTime > 0) {
        const notificationDuration = 2000; // 2 seconds
        if (Date.now() - shieldUsedNotificationTime < notificationDuration) {
            ctx.fillStyle = 'orange';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("SHIELD USED!", canvas.width / 2, 150);
            ctx.textAlign = 'left';
        } else {
            shieldUsedNotificationTime = 0; // Reset shield used notification time
        }
    }
    
    // Display current speed in the top right corner
    ctx.textAlign = 'right';
    
    // Change color to red when at max speed, black otherwise
    const speedDifference = player.maxSpeed - player.currentSpeed;
    if (speedDifference < 0.1) { // Using a small threshold to account for floating point precision
        ctx.fillStyle = 'red';
    } else {
        ctx.fillStyle = 'black';
    }
    
    ctx.fillText(`Speed: ${player.currentSpeed.toFixed(1)}`, canvas.width - 10, 30);
    ctx.textAlign = 'left'; // Reset text alignment
    ctx.fillStyle = 'black'; // Reset fill style
}

// Update the game loop to pass timestamp
function gameLoop(timestamp) {
    if (!isPaused && !gameOver && !hasWon) {
        update(timestamp);
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Pause the game
function togglePause() {
    if (gameOver) return; // Do not allow pausing when the game is over
    isPaused = !isPaused;
    pauseMenu.style.display = isPaused ? 'block' : 'none';
}

// End the game
function endGame() {
    gameOver = true;
    gameOverMenu.style.display = 'block';
    finalScore.textContent = `Score: ${score}`;
    jumpCountDisplay.textContent = `Jumps: ${jumpCount}`;
}

// Add the win game function
function winGame() {
    hasWon = true;
    isPaused = true; // Stop the game
    
    // Calculate finish time
    const finishTime = (Date.now() - gameStartTime) / 1000;
    
    // Display the winning screen
    winMenu.style.display = 'block';
    finishTimeDisplay.textContent = `Time: ${finishTime.toFixed(2)}s`;
    finalScoreWin.textContent = `Score: ${score}`;
}

// Update restart function to reset speed
function restartGame() {
    startGame();
}

// Update the game loop initialization
// Update the startGame function to reset shield status
function startGame() {
    // Reset everything
    obstacles = [];
    score = 0;
    jumpCount = 0;
    gameOver = false;
    hasWon = false;
    player.y = canvas.height - player.height - 20;
    player.dy = 0;
    player.isJumping = false;
    player.maxSpeed = 5;
    player.currentSpeed = 5;
    player.hasShield = false; // Reset shield status
    shieldNotificationTime = 0; // Reset notification time
    shieldUsedNotificationTime = 0; // Reset shield used notification
    finishLine.visible = false;
    
    // Record the start time
    gameStartTime = Date.now();
    
    // Make sure menus are hidden
    if (gameOverMenu) {
        gameOverMenu.style.display = 'none';
    }
    if (winMenu) {
        winMenu.style.display = 'none';
    }
    
    // Start the game loop with a proper timestamp
    lastTimestamp = performance.now();
    requestAnimationFrame(gameLoop);
}

// Event listener for pausing the game
document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
        if (isPaused) {
            togglePause(); // Resume the game if already paused
            gameLoop();
        } else {
            togglePause(); // Pause the game
        }
    }

    // Restart the game with Enter key on the game-over screen
    if (event.code === 'Enter' && gameOver) {
        restartGame();
    }
});

// Resume the game
resumeButton.addEventListener('click', () => {
    togglePause();
    gameLoop();
});

// Go back to the main menu
mainMenuButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});

mainMenuButtonGameOver.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Restart the game
restartButton.addEventListener('click', restartGame);

// Update the jump event listener to reduce speed on jump
document.addEventListener('keydown', event => {
    if (event.code === 'Space' && !player.isJumping && !gameOver) {
        player.isJumping = true;
        player.dy = -player.jumpStrength; // Apply upward velocity
        jumpCount++; // Increment jump count
        
        // Reduce speed by 30% when jumping
        player.currentSpeed *= 0.6;
    }
});

// Add event listeners for the winning screen buttons
restartButtonWin.addEventListener('click', restartGame);
mainMenuButtonWin.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Start the game loop with timestamp
startGame();

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

