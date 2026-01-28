// core.js - Fixed version
let scene, camera, renderer, controls;
let objects = [];
let selectedObject = null;
let clock = new THREE.Clock();
let isPlaying = false;
let currentTime = 0;
let animations = [];

// Initialize scene immediately
scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1e);

function init() {
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    
    // Renderer
    const viewport = document.getElementById('viewport');
    renderer = new THREE.WebGLRenderer({ canvas: viewport, antialias: true });
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.shadowMap.enabled = true;
    
    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);
    
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Start animation loop
    animate();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Update animations if playing
    if (isPlaying) {
        currentTime += delta;
        updateAnimations(currentTime);
        const slider = document.getElementById('time-slider');
        const display = document.getElementById('time-display');
        if (slider) slider.value = currentTime * 10;
        if (display) display.textContent = currentTime.toFixed(1) + 's';
    }
    
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function onWindowResize() {
    const viewport = document.getElementById('viewport');
    if (camera && viewport) {
        camera.aspect = viewport.clientWidth / viewport.clientHeight;
        camera.updateProjectionMatrix();
    }
    if (renderer && viewport) {
        renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    }
}

function updateAnimations(time) {
    animations.forEach(anim => {
        if (anim.object && anim.keyframes && anim.keyframes.length >= 2) {
            for (let i = 0; i < anim.keyframes.length - 1; i++) {
                const kf1 = anim.keyframes[i];
                const kf2 = anim.keyframes[i + 1];
                
                if (time >= kf1.time && time <= kf2.time) {
                    const t = (time - kf1.time) / (kf2.time - kf1.time);
                    
                    // Position
                    anim.object.position.x = kf1.position.x + (kf2.position.x - kf1.position.x) * t;
                    anim.object.position.y = kf1.position.y + (kf2.position.y - kf1.position.y) * t;
                    anim.object.position.z = kf1.position.z + (kf2.position.z - kf1.position.z) * t;
                    
                    // Rotation
                    anim.object.rotation.x = kf1.rotation.x + (kf2.rotation.x - kf1.rotation.x) * t;
                    anim.object.rotation.y = kf1.rotation.y + (kf2.rotation.y - kf1.rotation.y) * t;
                    anim.object.rotation.z = kf1.rotation.z + (kf2.rotation.z - kf1.rotation.z) * t;
                    
                    break;
                }
            }
        }
    });
}

// Expose everything
window.SNM = {
    scene, camera, renderer, controls,
    objects, selectedObject,
    animations, currentTime, isPlaying,
    init, animate, updateAnimations
};
