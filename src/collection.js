import * as THREE from 'three';
import {initScene} from './scene.js';
import {loadCard, shaderMaterials, shaderClock} from './models.js';
import { createControls } from './controls.js';

// Arrays to store renderers, cameras, and controls
let renderers = [];
let cameras = [];
let controls_array = [];
let scenes = [];

function displayCollection(collection, all_riders) {
    const collectionDisplay = document.getElementById('collectionDisplay');
    collectionDisplay.innerHTML = '';
    for (let i = 0; i < all_riders.length; i++) {
        // Create card div
        const cardDiv = document.createElement('div');
        cardDiv.id = `card-${i}`;
        cardDiv.className = 'card';
        
        // Create card container for 3D rendering
        const cardRenderContainer = document.createElement('div');
        cardRenderContainer.className = 'card-render-container';
        cardDiv.appendChild(cardRenderContainer);
        
        // Add info button for cards that are in the collection
        if (collection.some(card => card.name === all_riders[i].name)) {
            const infoButton = document.createElement('button');
            infoButton.textContent = 'View Details';
            infoButton.className = 'info-button';
            
            // Store the card name in a data attribute to avoid closure issues
            infoButton.dataset.cardName = all_riders[i].name;
            
            // Use a more direct event handler
            infoButton.onclick = function() {
                console.log("Button clicked for:", this.dataset.cardName);
                window.location.href = `/info.html?name=${encodeURIComponent(this.dataset.cardName)}`;
            };
            
            cardDiv.appendChild(infoButton);
        }
        
        collectionDisplay.appendChild(cardDiv);
        
        // Continue with your existing renderer, camera setup...
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        renderer.setPixelRatio(window.devicePixelRatio);
        // Set the renderer DOM element as a child of cardRenderContainer instead
        cardRenderContainer.appendChild(renderer.domElement);
        const camera = new THREE.PerspectiveCamera();
        
        
        // Store in arrays
        renderers.push(renderer);
        cameras.push(camera);
        
        // Initialize scene
        const scene = initScene(`card-${i}`, renderer, camera);
        scenes.push(scene);
        // Create controls
        const control = createControls(camera, renderer);
        controls_array.push(control);
        if (collection.some(card => card.name === all_riders[i].name)) {
            console.log("in collection");
            console.log(all_riders[i].glb_path);
            loadCard(scene, all_riders[i].glb_path);
        } else {
            loadCard(scene, 'Unknown.glb');
        }
    }
}
// Create nb_cards card elements with corresponding renderers, cameras, and controls

async function getCollection() {
    return fetch('/api/collection')
        .then(response => response.json())
        .catch(error => console.error('Error fetching collection:', error));
}

async function getAllRiders() {
    return fetch('/api/all-riders')
        .then(response => response.json())
        .catch(error => console.error('Error fetching all riders:', error));
}

async function getAllHorses() {
    return fetch('/api/all-horses')
        .then(response => response.json())
        .catch(error => console.error('Error fetching all horses:', error));
}

function animate(nb_cards) {
    requestAnimationFrame(() => animate(nb_cards));

    // Update all shader materials with the current time
    const elapsedTime = shaderClock.getElapsedTime();
    for (let material of shaderMaterials) {
        material.uniforms.iTime.value = elapsedTime;
    }

    // Render all cards only if renderers are defined
    for (let i = 0; i < nb_cards; i++) {
        if (renderers[i] && controls_array[i] && scenes[i] && cameras[i]) {
            controls_array[i].update();
            renderers[i].render(scenes[i], cameras[i]);
        }
    }
}

document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "index.html";
});

document.getElementById("resetBtn").addEventListener("click", async () => {
    fetch('/api/reset-collection', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            console.log('Collection reset:', data);
            // Optionally, refresh the collection display
            displayCollection([], []);
        })
        .catch(error => console.error('Error resetting collection:', error));
});

document.getElementById("horsesBtn").addEventListener("click", () => {
    window.location.href = "collection.html?type=horses";
});

document.getElementById("ridersBtn").addEventListener("click", () => {
    window.location.href = "collection.html?type=riders";
});

if (window.location.pathname.startsWith('/collection.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    const cardType = urlParams.get('type');
    let poolFunction = getAllRiders;
    if (cardType === 'horses') {
        document.getElementById("horsesBtn").style.display = "none";
        document.getElementById("ridersBtn").style.display = "block";
        poolFunction = getAllHorses;
    }
    else if (cardType === 'riders') {
        document.getElementById("horsesBtn").style.display = "block";
        document.getElementById("ridersBtn").style.display = "none";
    } else {
        document.getElementById("horsesBtn").style.display = "block";
        document.getElementById("ridersBtn").style.display = "block";
    }
    Promise.all([getCollection(), poolFunction()])
        .then(([collection, all_riders]) => {
            let nb_cards = all_riders.length;
            
            displayCollection(collection, all_riders);
            
            // Add a small delay to ensure everything is initialized
            setTimeout(() => {
                console.log("Starting animation loop with", nb_cards, "cards");
                console.log("Shader materials to update:", shaderMaterials.length);
                animate(nb_cards);
            }, 500); // Slightly longer delay to ensure models are loaded
        })
        .catch(error => console.error('Error fetching data:', error));
}
