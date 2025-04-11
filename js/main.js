function navigateTo(page) {
    window.location.href = page;
}

// Display the selected character and horse on the main menu
document.addEventListener('DOMContentLoaded', () => {
    const selectedCharacter = localStorage.getItem('selectedCharacter') || 'None';
    const selectedHorse = localStorage.getItem('selectedHorse') || 'None';

    document.getElementById('selectedCharacter').textContent = selectedCharacter;
    document.getElementById('selectedHorse').textContent = selectedHorse;
});