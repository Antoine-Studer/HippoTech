import * as THREE from 'three';
import {initScene} from './scene.js';
import {loadCard} from './models.js';
import { createControls } from './controls.js';

let nb_cards = 1;

// Arrays to store renderers, cameras, and controls
let renderers = [];
let cameras = [];
let controls_array = [];
let scenes = [];


function displayCollection(collection) {
    console.log(collection);
    const collectionDisplay = document.getElementById('collectionDisplay');
    collectionDisplay.innerHTML = '';
    for (let i = 0; i < nb_cards; i++) {
        // Create card div
        const cardDiv = document.createElement('div');
        cardDiv.id = `card-${i}`;
        cardDiv.className = 'card';
        collectionDisplay.appendChild(cardDiv);
        
        // Create renderer, camera, and initialize scene
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        renderer.setPixelRatio(window.devicePixelRatio); // Ensure crisp rendering
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
        console.log(i);
        loadCard(scene, collection[i].glb_path);
    }
}
// Create nb_cards card elements with corresponding renderers, cameras, and controls

let collection = [
    { 
        name: "Ganador Cel",
        glb_path: "ganador_right_pos.glb",
        rarity: "legendary"
    }
];

function animate() {
    requestAnimationFrame(animate);
    
    // Render all cards
    for (let i = 0; i < nb_cards; i++) {
        if (controls_array[i]) controls_array[i].update();
        renderers[i].render(scenes[i], cameras[i]);
    }
}

document.getElementById("backBtn").addEventListener("click", () => {
    window.location.href = "index.html";
});

if (window.location.pathname === '/collection.html') {
    displayCollection(collection);
    animate();
}
