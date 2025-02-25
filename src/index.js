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

document.getElementById("collectionBtn").addEventListener("click", () => {
    window.location.href = "collection.html";
});