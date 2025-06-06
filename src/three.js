import {initScene} from './scene.js';
import {loadCard} from './models.js';
import * as THREE from 'three';
import { createControls } from './controls.js';

let nb_cards = 12;

// Arrays to store renderers, cameras, and controls
let renderers = [];
let cameras = [];
let controls_array = [];
let scenes = [];


// Create nb_cards card elements with corresponding renderers, cameras, and controls
function display(){
    // Get the card display container
    const cardDisplay = document.getElementById('cardDisplay');
    for (let i = 1; i <= nb_cards; i++) {
        // Create card div
        const cardDiv = document.createElement('div');
        cardDiv.id = `card-${i}`;
        cardDiv.className = 'card';
        cardDisplay.appendChild(cardDiv);
        
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
        loadCard(scene, 'ganador_right_pos.glb');
    }

}


function animate() {
    requestAnimationFrame(animate);
    
    // Render all cards
    for (let i = 0; i < nb_cards; i++) {
        if (controls_array[i]) controls_array[i].update();
        renderers[i].render(scenes[i], cameras[i]);
    }
}

if (window.location.pathname == '/three.html') {
    // Start the animation loop only if on the collection page
    display();
    animate();
}
