import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadModels(scene, models) {
    for (let i = 0; i < models.length; i++) {
        loadCard(scene, models[i], { x: 0, y: 0, z: i * 0.04 });
    }
}

export function loadCard(scene, model, position = { x: 0, y: 0, z: 0 }) {
    const loader = new GLTFLoader();
    
    // Show a loading message in console
    console.log('Loading 3D model...');
    
    loader.load(
        './assets/' + model, // Updated path - ensure this file exists
        function(gltf){
            const card = gltf.scene;
            
            // Scale the model if needed (uncomment if model is too small/large)
            // card.scale.set(0.5, 0.5, 0.5);
            
            card.position.set(position.x, position.y, position.z);
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