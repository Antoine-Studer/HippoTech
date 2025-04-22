function selectCharacter(characterName, image, stats) {
    // Save the selected character to localStorage
    localStorage.setItem('selectedCharacter', characterName);

    // Highlight the selected character button
    const buttons = document.querySelectorAll('.character-button');
    buttons.forEach(button => {
        if (button.textContent === characterName) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });

    // Show the ID card
    showIdCard(characterName, image, stats);
}

function selectHorse(horseName, image, stats) {
    // Save the selected horse to localStorage
    localStorage.setItem('selectedHorse', horseName);

    // Highlight the selected horse button
    const buttons = document.querySelectorAll('.horse-button');
    buttons.forEach(button => {
        if (button.textContent === horseName) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });

    // Show the ID card
    showIdCard(horseName, image, stats);
}

function showIdCard(name, image, stats) {
    const idCard = document.getElementById('idCard');
    const idCardImage = document.getElementById('idCardImage');
    const idCardName = document.getElementById('idCardName');
    const idCardStats = document.getElementById('idCardStats');

    idCardImage.src = `images/${image}`;
    idCardName.textContent = name;
    idCardStats.textContent = stats;

    idCard.classList.remove('hidden');
}

function closeIdCard() {
    const idCard = document.getElementById('idCard');
    idCard.classList.add('hidden');
}

function navigateTo(page) {
    window.location.href = page;
}

