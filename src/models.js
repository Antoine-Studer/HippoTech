import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { vertexShader, fragmentShader } from './shaders.js';

// Create a shared clock for all shaders
export const shaderClock = new THREE.Clock();

// Array to store all shader materials that need time updates
export const shaderMaterials = [];

export function loadModels(scene, models, cardModelsArray = []) {
    console.log(models);
    for (let i = 0; i < models.length; i++) {
        loadCard(scene, models[i], { x: 0, y: 0, z: - i * 0.05 }, cardModelsArray);
    }
}

export function loadCard(scene, model, position = { x: 0, y: 0, z: 0 }, cardModelsArray = [], holographic = false) {
    const loader = new GLTFLoader();
    
    // Show a loading message in console
    console.log('Loading 3D model:', model);
    
    
    loader.load(
        './assets/' + model,
        function(gltf) {
            const card = gltf.scene;
            if (holographic) {
                applyHolographism(card);
            }
            
            card.position.set(position.x, position.y, position.z);
            scene.add(card);
            
            if (cardModelsArray) cardModelsArray.push(card);
            
            console.log('Model successfully loaded and added to scene!');
        },
        function (xhr) {
            console.log(`${model}: ${(xhr.loaded / xhr.total * 100).toFixed(2)}% loaded`);
        },
        function (error) {
            console.error('ERROR LOADING MODEL:', model, error);
            // Add a visible error indicator to the scene
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const errorCube = new THREE.Mesh(geometry, material);
            scene.add(errorCube);
            
            if (cardModelsArray) cardModelsArray.push(errorCube);
        }
    );
}

function applyHolographism(card) {
    // Apply the shader material only to the front face of the card
    let frontFaceFound = false;
    card.traverse((node) => {
        if (node.isMesh) {
            console.log('Found mesh:', node.name);
            
            if (node.name.toLowerCase().includes('front')) {
                // Store the original material/texture
                const originalMaterial = node.material;
                const originalTexture = originalMaterial.map || 
                                       originalMaterial.baseColorMap || 
                                       new THREE.Texture();
                
                // Create a custom shader material that uses the original texture
                const holoMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        baseTexture: { value: originalTexture },
                        iTime: { value: 0 },
                        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
                    },
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    transparent: originalMaterial.transparent || false,
                    side: originalMaterial.side || THREE.FrontSide
                });
                
                // Store the material for animation updates
                shaderMaterials.push(holoMaterial);
                
                // Apply the new material
                node.material = holoMaterial;
                frontFaceFound = true;
                console.log('Applied holographic effect to front face:', node.name);
            }
        }
    });
    
    // If no front face was found, try to apply to the first mesh
    if (!frontFaceFound) {
        card.traverse((node) => {
            if (node.isMesh && !frontFaceFound) {
                // Same approach for the first found mesh
                const originalMaterial = node.material;
                const originalTexture = originalMaterial.map || 
                                       originalMaterial.baseColorMap || 
                                       new THREE.Texture();
                
                const holoMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        baseTexture: { value: originalTexture },
                        iTime: { value: 0 },
                        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
                    },
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    transparent: originalMaterial.transparent || false,
                    side: originalMaterial.side || THREE.FrontSide
                });
                
                // Store the material for animation updates
                shaderMaterials.push(holoMaterial);
                
                node.material = holoMaterial;
                frontFaceFound = true;
                console.log('No front face found. Applied holographic effect to first mesh:', node.name);
            }
        });
    }
}