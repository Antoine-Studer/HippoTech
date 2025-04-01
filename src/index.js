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
    const response = await fetch('/api/cooldown-status');
    console.log(await response);
    try {
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