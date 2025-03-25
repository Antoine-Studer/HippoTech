import { OrbitControls } from "three/examples/jsm/Addons.js";


export function createControls(camera, renderer){
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    return controls;
}
