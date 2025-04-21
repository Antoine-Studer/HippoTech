import * as THREE from 'three';
import { loadModels } from './models';
import { createControls } from './controls';
import { initScene } from './scene.js';

async function getBoosterCards() {
    return fetch('/api/open-booster')
        .then(response => response.json())
        .catch(error => console.error('Error fetching booster cards:', error));
}

let renderer, scene, camera, controls;
let raycaster, mouse, cardModels = [];

function createBooster(cards) {
    cards.sort((a, b) => a.rarity - b.rarity); // Sort numerically by rarity
    console.log('Cards sorted by rarity:', cards);
    const cardDisplay = document.getElementById('cardDisplay');
    cardDisplay.innerHTML = ''; // Clear previous cards

    const boosterDiv = document.createElement('div');
    boosterDiv.className = 'booster-container';
    
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(window.devicePixelRatio);
    // Set the renderer DOM element as a child of cardRenderContainer instead
    cardDisplay.appendChild(renderer.domElement);
    camera = new THREE.PerspectiveCamera();
    
    cardDisplay.appendChild(boosterDiv);
    scene = initScene('cardDisplay', renderer, camera);
    controls = createControls(camera, renderer);
    
    // Initialize raycaster and mouse
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Track mouse state for differentiating drags from clicks
    let mouseDownPosition = { x: 0, y: 0 };
    let isDragging = false;
    
    // Replace click with mousedown/mouseup events
    renderer.domElement.addEventListener('mousedown', (event) => {
        mouseDownPosition.x = event.clientX;
        mouseDownPosition.y = event.clientY;
        isDragging = false;
    }, false);
    
    renderer.domElement.addEventListener('mousemove', (event) => {
        // Consider dragging if mouse moved more than 5 pixels from down position
        if (!isDragging && (
            Math.abs(event.clientX - mouseDownPosition.x) > 5 ||
            Math.abs(event.clientY - mouseDownPosition.y) > 5
        )) {
            isDragging = true;
        }
    }, false);
    
    renderer.domElement.addEventListener('mouseup', (event) => {
        if (!isDragging) {
            // Only process click if not dragging
            onCardClick(event);
        }
    }, false);
    
    // Load models and store references
    cardModels = [];
    loadModels(scene, cards.map(card => card.glb_path), cardModels);
}

function onCardClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Find intersections with card models
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        // Get the root object (card model)
        let cardObject = intersects[0].object;
        while (cardObject.parent && cardObject.parent !== scene) {
            cardObject = cardObject.parent;
        }
        
        // Reset camera position to origin
        camera.position.set(0, 0, 5);
        
        // Reset orbit controls target if needed
        if (controls && controls.target) {
            controls.target.set(0, 0, 0);
            controls.update();
        }
        
        // Animate the card to swipe left
        animateCardSwipeLeft(cardObject);
    }
}

function animateCardSwipeLeft(card) {
    // Store original position
    const originalPosition = card.position.clone();
    
    // Animate over 500ms
    const startTime = Date.now();
    const duration = 500;
    
    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Move the card 5 units to the left
        card.position.x = originalPosition.x - (5 * progress);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // Animation complete - remove the card from the scene
            scene.remove(card);
            
            // Dispose of geometries and materials to free memory
            card.traverse(object => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            
            // Remove from cardModels array if it exists there
            const index = cardModels.indexOf(card);
            if (index !== -1) {
                cardModels.splice(index, 1);
            }
        }
    }
    
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (renderer && controls && scene && camera) {
        controls.update();
        renderer.render(scene, camera);
    }
}

async function getUser() {
    return fetch('/api/get-user')
        .then(response => response.json())
        .catch(error => console.error('Error fetching user:', error));
}

document.getElementById('openBoosterBtn').addEventListener('click', async function() {
    const userObj = await getUser();
    if (userObj.connected === false) {
        alert('Please log in to open a booster pack.');
        return;
    }
    
    // Check cooldown status first
    const cooldownStatus = await window.checkCooldownStatus();
    
    if (cooldownStatus && cooldownStatus.canOpen === false) {
        // The cooldown timer will be updated by checkCooldownStatus
        return;
    }
    
    // Proceed with opening booster if cooldown allows
    document.getElementById('cardDisplay').classList.remove('hidden');
    document.getElementById('cardDisplay').classList.add('show');
    
    getBoosterCards().then(cards => {
        if (cards.canOpen !== false) {
            createBooster(cards);
            animate();
        } else {
            console.log('Cannot open booster:', cards);
            window.updateCooldownTimer(cards.remainingTime);
        }
    }).catch(error => {
        console.error('Error fetching booster cards:', error);
    });
});
