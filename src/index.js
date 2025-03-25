let cooldownInterval;
const cooldownDisplay = document.getElementById("cooldownDisplay");
const cooldownTimer = document.getElementById("cooldownTimer");
const openBoosterBtn = document.getElementById("openBoosterBtn");
const cardDisplay = document.getElementById("cardDisplay");

// Format remaining time as HH:MM:SS
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

// Update the cooldown timer display
function updateCooldownTimer(remainingTime) {
    if (remainingTime <= 0) {
        cooldownDisplay.classList.add("cooldown-hidden");
        openBoosterBtn.disabled = false;
        clearInterval(cooldownInterval);
        return;
    }
    
    cooldownDisplay.classList.remove("cooldown-hidden");
    openBoosterBtn.disabled = true;
    cooldownTimer.textContent = formatTime(remainingTime);
}

// Check cooldown status from the server
async function checkCooldownStatus() {
    try {
        const response = await fetch('/api/cooldown-status');
        const data = await response.json();
        
        if (!data.canOpen) {
            let remainingTime = data.remainingTime;
            updateCooldownTimer(remainingTime);
            
            // Clear any existing interval
            if (cooldownInterval) clearInterval(cooldownInterval);
            
            // Start countdown timer that updates every second
            cooldownInterval = setInterval(() => {
                remainingTime -= 1000;
                updateCooldownTimer(remainingTime);
            }, 1000);
        } else {
            updateCooldownTimer(0); // Reset the display
        }
    } catch (error) {
        console.error("Error checking cooldown status:", error);
    }
}

function displayCards(cards) {
    cardDisplay.innerHTML = "";
    cards.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card", card.rarity);
        
        // Create the HTML for stats bars
        let statsHTML = '';
        for (const [stat, value] of Object.entries(card.stats)) {
            const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
            statsHTML += `
                <div class="stat-row">
                    <span class="stat-name">${statName}</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar" style="width: ${value}%"></div>
                    </div>
                    <span class="stat-value">${value}</span>
                </div>
            `;
        }
        
        cardElement.innerHTML = `
            <div class="img-div"> <img class="card-image" src="${card.img}" /> </div>
            <div class="card-name">${card.name}</div>
            <div class="card-type">${card.type}</div>
            <div class="card-rarity">${card.rarity.toUpperCase()}</div>
            <div class="card-stats">
                ${statsHTML}
            </div>
        `;
        cardDisplay.appendChild(cardElement);
    });
}

document.getElementById("openBoosterBtn").addEventListener("click", async () => {
    try {
        const response = await fetch('/api/open-booster');
        if (response.status === 429) {
            // If we hit the rate limit, check and display cooldown
            checkCooldownStatus();
            return;
        }
        
        const booster = await response.json();
        
        // Show cards and hide other elements
        const mainContent = document.querySelectorAll('body > :not(#cardDisplay):not(#continueBtn):not(#cooldownDisplay)');
        mainContent.forEach(element => element.classList.add('hidden'));
        
        // Display cards
        displayCards(booster);
        cardDisplay.classList.remove('hidden');
        cardDisplay.classList.add('show');
        
        // Show continue button
        const continueBtn = document.getElementById('continueBtn') || document.createElement('button');
        if (!continueBtn.id) {
            continueBtn.id = 'continueBtn';
            continueBtn.textContent = 'Continue';
            document.body.appendChild(continueBtn);
        }
        
        setTimeout(() => {
            continueBtn.style.display = 'block';
        }, 500);
        
        // After opening a booster, check cooldown status
        checkCooldownStatus();
    } catch (error) {
        console.error("Error opening booster:", error);
    }
});

// Create and add continue button if it doesn't exist
function ensureContinueButtonExists() {
    if (!document.getElementById('continueBtn')) {
        const continueBtn = document.createElement('button');
        continueBtn.id = 'continueBtn';
        continueBtn.textContent = 'Continue';
        continueBtn.style.display = 'none';
        document.body.appendChild(continueBtn);
        
        // Add event listener
        continueBtn.addEventListener('click', function() {
            // Unhide main content
            const mainContent = document.querySelectorAll('body > .hidden:not(#cardDisplay):not(#continueBtn)');
            mainContent.forEach(element => element.classList.remove('hidden'));
            
            // Hide cards and continue button
            cardDisplay.classList.remove('show');
            cardDisplay.classList.add('hidden');
            continueBtn.style.display = 'none';
        });
    }
}

document.getElementById("collectionBtn").addEventListener("click", () => {
    window.location.href = "collection.html";
});

// Check cooldown status and ensure continue button exists when the page loads
document.addEventListener('DOMContentLoaded', () => {
    checkCooldownStatus();
    ensureContinueButtonExists();
});