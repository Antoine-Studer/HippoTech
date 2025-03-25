import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadModels(scene) {
    loadCard(scene);
}

function loadCard(scene){
    const loader = new GLTFLoader();
    
    // Show a loading message in console
    console.log('Loading 3D model...');
    
    loader.load(
        './assets/pokemon_card_3d.glb', // Updated path - ensure this file exists
        function(gltf){
            const card = gltf.scene;
            
            // Scale the model if needed (uncomment if model is too small/large)
            // card.scale.set(0.5, 0.5, 0.5);
            
            card.position.set(0, 0, 0);
            scene.add(card);
            
            // Success message
            console.log('Model successfully loaded and added to scene!');

        },
        // called while loading is progressing
        function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.error('ERROR LOADING MODEL:', error);
            // Add a visible error indicator to the scene
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const errorCube = new THREE.Mesh(geometry, material);
            scene.add(errorCube);
        }
    );
}