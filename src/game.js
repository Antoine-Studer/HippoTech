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

// Scaling factor to apply to all game elements
const SCALE_FACTOR = 1.7;

// Update the ground level padding throughout the code
const GROUND_PADDING = 55 * SCALE_FACTOR; // Increase from 20 to 35

// Update player dimensions
const player = {
    x: 50,
    y: 0, // Will be set dynamically based on canvas height
    width: 35 * SCALE_FACTOR, // Scale up the width
    height: 50 * SCALE_FACTOR, // Scale up the height
    color: 'blue',
    dy: 0,
    gravity: 0.26 * SCALE_FACTOR, // Reduced from 0.5 to make jumps longer
    jumpStrength: 6* SCALE_FACTOR, // Reduced from 12 to make jumps less high
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
let collisionNotificationTime = 0; // Add collision notification variable

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

// Replace the horse sprite sheet loading and animation settings with this new implementation

// Define the total number of animation frames
const TOTAL_ANIMATION_FRAMES = 10;

// Create an array to hold all the animation frame images
const horseFrames = [];

// Load all the individual frame images
for (let i = 1; i <= TOTAL_ANIMATION_FRAMES; i++) {
    const frameImage = new Image();
    frameImage.src = `assets/horse_animation_nobg_${i}.png`;
    horseFrames.push(frameImage);
}

// Add a specific jump animation image
const jumpFrame = new Image();
jumpFrame.src = 'assets/horse_animation_nobg_jump.png';

// Simplified animation object
const animation = {
    currentFrameIndex: 0,    // Current frame index in the array
    frameCount: 0,           // Counter for timing
    frameDuration: 5,        // How many game loops before changing frames
    totalFrames: TOTAL_ANIMATION_FRAMES
};

// Variables for scrolling background
let backgroundX1 = 0; // X position of the first background image
let backgroundX2 = canvas.width; // X position of the second background image

// Resize the canvas to fit the full screen
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Position the player higher on the screen
    player.y = canvas.height - player.height - GROUND_PADDING;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial resize

const OBSTACLE_POSITIONS = [
    700, 1200, 1500, 1900, 2300, 2600, 3000, 3400, 3800,
    4200, 4600, 5000, 5400, 5700, 6100, 6500, 6900, 7300, 7800,
    8200, 8600, 9000, 9500, 10000, 10500, 11000, 11600, 12000
];

// Keep track of the next obstacle to be created
let nextObstacleIndex = 0;
let distanceTraveled = 0;

// Modify the createObstacles function to create larger obstacles
function createObstacles() {
    // Reset obstacle tracking for a new game
    nextObstacleIndex = 0;
    obstacles = [];
    
    // Pre-populate initial visible obstacles
    while (nextObstacleIndex < OBSTACLE_POSITIONS.length && 
           OBSTACLE_POSITIONS[nextObstacleIndex] < canvas.width + 200) {
        const obstacle = {
            x: OBSTACLE_POSITIONS[nextObstacleIndex],
            y: canvas.height - (80 * SCALE_FACTOR), // Scale the y position
            width: 30 * SCALE_FACTOR, // Scale the width
            height: 60 * SCALE_FACTOR, // Scale the height
            imageWidth: 50 * SCALE_FACTOR, // Scale image width
            imageHeight: 50 * SCALE_FACTOR, // Scale image height
            color: 'red',
            jumped: false
        };
        obstacles.push(obstacle);
        nextObstacleIndex++;
    }
}

// Modify the update function animation logic
function update(timestamp) {
    if (gameOver || isPaused || hasWon) return;
    
    // Calculate delta time in seconds
    const deltaTime = (timestamp - lastTimestamp) / 1000 || 0.016;
    lastTimestamp = timestamp;
    
    // Update animation with jump frame detection
    if (player.isJumping) {
        // When jumping, we'll use a specific jump frame
        // We don't need to cycle through the animation frames
        // Just keep the frame count going for smooth transition when landing
        animation.frameCount++;
    } else {
        // Normal running animation when on the ground
        animation.frameCount++;
        if (animation.frameCount >= animation.frameDuration) {
            animation.frameCount = 0;
            
            // Only update the frame index when not jumping
            animation.currentFrameIndex = (animation.currentFrameIndex + 1) % TOTAL_ANIMATION_FRAMES;
        }
    }
    
    // Adjust animation speed based on player speed
    animation.frameDuration = Math.max(2, 7 - Math.floor(player.currentSpeed));
    
    // Update the background position
    updateBackground();
    
    // Check if we're approaching the finish line
    if (score >= FINISH_SCORE && !finishLine.visible) {
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
        if (player.y >= canvas.height - player.height - GROUND_PADDING) {
            player.y = canvas.height - player.height - GROUND_PADDING;
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
                // Use the shield instead of slowing down
                player.hasShield = false;
                shieldUsedNotificationTime = Date.now();
                
                // Mark this obstacle as "passed through" to prevent future collisions
                obstacle.passedThrough = true;
            } else if (!obstacle.passedThrough) { // Only slow down if not already passed through
                // Set speed to exactly 1 instead of a percentage of max speed
                player.currentSpeed = 2.5; // Fixed value instead of player.maxSpeed * 0.3
                
                // Mark this obstacle as collided so we don't hit it again
                obstacle.passedThrough = true;
                
                // Display collision notification
                collisionNotificationTime = Date.now();
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
    
    // Increase distance traveled based on player speed
    distanceTraveled += player.currentSpeed;
    
    // Check if we need to spawn the next obstacle from our pattern
    if (nextObstacleIndex < OBSTACLE_POSITIONS.length && 
        OBSTACLE_POSITIONS[nextObstacleIndex] <= distanceTraveled + canvas.width) {
        const obstacle = {
            x: OBSTACLE_POSITIONS[nextObstacleIndex] - distanceTraveled + canvas.width,
            y: canvas.height - (80 * SCALE_FACTOR), // Scale the y position
            width: 30 * SCALE_FACTOR, // Scale the width
            height: 60 * SCALE_FACTOR, // Scale the height
            imageWidth: 50 * SCALE_FACTOR, // Scale image width
            imageHeight: 50 * SCALE_FACTOR, // Scale image height
            color: 'red',
            jumped: false
        };
        obstacles.push(obstacle);
        nextObstacleIndex++;
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
    
    // Draw the current horse frame or jump frame
    if (player.isJumping && jumpFrame.complete && jumpFrame.naturalHeight !== 0) {
        // Use jump frame when in the air
        const dx = player.x - (player.width * 0.75);
        const dy = player.y - (player.height * 0.6);
        const dw = player.width * 3.0;
        const dh = player.height * 2.5;
        
        ctx.drawImage(jumpFrame, dx, dy, dw, dh);
    } else if (horseFrames[animation.currentFrameIndex] && 
               horseFrames[animation.currentFrameIndex].complete && 
               horseFrames[animation.currentFrameIndex].naturalHeight !== 0) {
        // Use running animation frames when on the ground
        const dx = player.x - (player.width * 0.75);
        const dy = player.y - (player.height * 0.6);
        const dw = player.width * 3.0;
        const dh = player.height * 2.5;
        
        ctx.drawImage(horseFrames[animation.currentFrameIndex], dx, dy, dw, dh);
    } else {
        // Fallback to the blue rectangle if images aren't loaded yet
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
    
    // Display collision notification if recently happened
    if (collisionNotificationTime > 0) {
        const notificationDuration = 2000; // 2 seconds
        if (Date.now() - collisionNotificationTime < notificationDuration) {
            ctx.fillStyle = 'red';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("COLLISION!", canvas.width / 2, 200);
            ctx.textAlign = 'left';
        } else {
            collisionNotificationTime = 0; // Reset collision notification time
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
// Update the startGame function to properly position the player
function startGame() {
    // Reset everything
    obstacles = [];
    score = 0;
    jumpCount = 0;
    gameOver = false;
    hasWon = false;
    player.y = canvas.height - player.height - GROUND_PADDING;
    player.dy = 0;
    player.isJumping = false;
    player.maxSpeed = 5;
    player.currentSpeed = 5;
    player.hasShield = false; // Reset shield status
    shieldNotificationTime = 0; // Reset notification time
    shieldUsedNotificationTime = 0; // Reset shield used notification
    collisionNotificationTime = 0; // Reset collision notification
    finishLine.visible = false;
    distanceTraveled = 0; // Reset distance traveled
    
    // Create the fixed pattern of obstacles
    createObstacles();
    
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
    window.location.href = 'home.html';
});

mainMenuButtonGameOver.addEventListener('click', () => {
    window.location.href = 'home.html';
});

// Restart the game
restartButton.addEventListener('click', restartGame);

// Update the jump event listener to reduce speed on jump
document.addEventListener('keydown', event => {
    if (event.code === 'Space' && !player.isJumping && !gameOver) {
        player.isJumping = true;
        player.dy = -player.jumpStrength; // Apply upward velocity
        jumpCount++; // Increment jump count
        
        // Reduce speed by 20% when jumping (was 40% before)
        player.currentSpeed *= 0.8;
    }
});

// Add event listeners for the winning screen buttons
restartButtonWin.addEventListener('click', restartGame);
mainMenuButtonWin.addEventListener('click', () => {
    window.location.href = 'home.html';
});

// Start the game loop with timestamp
startGame();

