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
    loadModels(scene, cards.map(card => card.glb_path));

}

function animate() {
    requestAnimationFrame(animate);
    if (renderer && controls && scene && camera) {
        controls.update();
        renderer.render(scene, camera);
    }
}

document.getElementById('openBoosterBtn').addEventListener('click', function() {
    document.getElementById('cardDisplay').classList.remove('hidden');
    document.getElementById('cardDisplay').classList.add('show');
    getBoosterCards().then(cards => {
        if (cards.canOpen !== false) {
            createBooster(cards);
            animate();
        }
        else {
            console.log('Cannot open booster:', cards);
        }
            
    }).catch(error => {
        console.error('Error fetching booster cards:', error);
    });
});
