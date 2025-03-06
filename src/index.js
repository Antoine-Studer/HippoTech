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
        const booster = await response.json();
        displayCards(booster);
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