import * as THREE from 'three';
import { initScene } from './scene.js';
import { loadCard } from './models.js';
import { createControls } from './controls.js';

// Get the card name from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const cardName = urlParams.get('name');

// Update page title with card name
document.getElementById('cardTitle').textContent = cardName || 'Card Details';

// Initialize 3D rendering
let renderer, camera, scene, controls;

async function fetchCardInfo() {
    try {
        // Fetch all riders to find the specific one
        const response = await fetch('/api/all-cards');
        const allRiders = await response.json();
        
        // Find the card with matching name
        const card = allRiders.find(rider => rider.nom === cardName);
        
        if (card) {
            displayCardInfo(card);
        } else {
            document.getElementById('cardTitle').textContent = 'Card not found';
        }
    } catch (error) {
        console.error('Error fetching card information:', error);
        document.getElementById('cardTitle').textContent = 'Error loading card';
    }
}

function displayCardInfo(card) {
    // Update page title
    document.getElementById('cardTitle').textContent = card.nom;
    
    // Setup 3D rendering
    const cardDisplay = document.getElementById('cardDisplay');
    
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(300, 400);
    cardDisplay.appendChild(renderer.domElement);
    
    camera = new THREE.PerspectiveCamera(45, 300/400, 0.1, 1000);
    
    scene = initScene('cardDisplay', renderer, camera);
    controls = createControls(camera, renderer);
    
    // Load the 3D model
    loadCard(scene, card.glb_path);
    
    // Display card stats
    const statsElement = document.getElementById('cardStats');
    statsElement.innerHTML = '';
    
    // Add card name with styling
    const nameElement = document.createElement('h2');
    nameElement.textContent = card.nom;
    statsElement.appendChild(nameElement);
    
    // Add card rarity if available
    if (card.rarity) {
        const rarityElement = document.createElement('p');
        rarityElement.textContent = `Rarity: ${card.rarity}`;
        rarityElement.style.fontWeight = 'bold';
        statsElement.appendChild(rarityElement);
    }
    
    // Add other card details
    for (const [key, value] of Object.entries(card)) {
        // Skip properties we've already handled or don't want to display
        if (['nom', 'glb_path', 'rarity'].includes(key)) continue;
        
        const detailElement = document.createElement('p');
        detailElement.textContent = `${key}: ${value}`;
        statsElement.appendChild(detailElement);
    }
    
    // Start animation
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Add event listener for back button
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = 'collection.html';
});

// Initialize the page
fetchCardInfo();