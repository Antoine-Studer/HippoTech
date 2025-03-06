let cooldownInterval;
const cooldownDisplay = document.getElementById("cooldownDisplay");
const cooldownTimer = document.getElementById("cooldownTimer");
const openBoosterBtn = document.getElementById("openBoosterBtn");

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
    const cardDisplay = document.getElementById("cardDisplay");
    cardDisplay.innerHTML = "";
    cards.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card", card.rarity);
        cardElement.innerHTML = `
            <div class="img-div"> <img class="card-image" src="${card.img}" /> </div>
            <div class="card-name">${card.name}</div>
            <div class="card-rarity">${card.rarity.toUpperCase()}</div>
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
        displayCards(booster);
        
        // After opening a booster, check cooldown status
        checkCooldownStatus();
    } catch (error) {
        console.error("Error opening booster:", error);
    }
});


function openBooster() {
    const cardDisplay = document.getElementById("cardDisplay");
    cardDisplay.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        const card = getRandomCard();
        saveToCollection(card);
        const cardElement = document.createElement("div");
        cardElement.classList.add("card", card.rarity);
        cardElement.innerHTML = `
            <div class="card-name">${card.name}</div>
            <div class="card-rarity">${card.rarity.toUpperCase()}</div>
        `;
        cardDisplay.appendChild(cardElement);
    }
}

// Event listeners
document.getElementById("openBoosterBtn").addEventListener("click", openBooster);
document.getElementById('openBoosterBtn').addEventListener('click', function() {
    const mainContent = document.querySelectorAll('body > :not(#cardDisplay):not(#continueBtn)');
    const cardDisplay = document.getElementById('cardDisplay');
    const continueBtn = document.getElementById('continueBtn') || document.createElement('button');
    
    if (!continueBtn.id) {
        continueBtn.id = 'continueBtn';
        continueBtn.textContent = 'Continue';
        document.body.appendChild(continueBtn);
    }

    mainContent.forEach(element => element.classList.add('hidden'));
    cardDisplay.classList.add('show');

    setTimeout(() => {
        continueBtn.style.display = 'block';
    }, 2000);

    continueBtn.addEventListener('click', function() {
        mainContent.forEach(element => element.classList.remove('hidden'));
        cardDisplay.classList.remove('show');
        continueBtn.style.display = 'none';
    });
});

document.getElementById("collectionBtn").addEventListener("click", () => {
    window.location.href = "collection.html";
});

// Check cooldown status when the page loads
document.addEventListener('DOMContentLoaded', checkCooldownStatus);