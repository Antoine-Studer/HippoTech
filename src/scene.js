import * as THREE from 'three';


export function initScene(displayName, renderer, camera) {
    // Create renderer
    const scene = new THREE.Scene();
    console.log(window.innerWidth, window.innerHeight);
    // Use the card's dimensions instead of fixed window fractions
    const cardElement = document.getElementById(displayName);
    let width = cardElement.clientWidth;
    let height = cardElement.clientHeight;
    
    // Renderer settings
    renderer.setSize(width, height);
    renderer.setClearColor(0x0000ff, 0); // Set background color
    document.getElementById(displayName).appendChild(renderer.domElement);
    
    // Camera settings
    camera.fov = 75;
    camera.aspect = width / height;
    camera.near = 0.1;
    camera.far = 1000;
    camera.position.set(0.42, 0, 0); // Position camera away from the origin
    camera.lookAt(0, 0, 0); // Make camera look at the origin
    camera.updateProjectionMatrix();
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        const newWidth = cardElement.clientWidth;
        const newHeight = cardElement.clientHeight;
        
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
    return scene;
}
