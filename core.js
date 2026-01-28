// core.js - Three.js setup and render loop

let scene, camera, renderer, controls;
let objects = [];
let selectedObject = null;
let clock = new THREE.Clock();
let isPlaying = false;
let currentTime = 0;
let animations = [];

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1e);
    
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
        document.getElementById('time-slider').value = currentTime * 10;
        document.getElementById('time-display').textContent = currentTime.toFixed(1) + 's';
    }
    
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    const viewport = document.getElementById('viewport');
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
}

function updateAnimations(time) {
    animations.forEach(anim => {
        if (anim.object && anim.keyframes) {
            // Simple linear interpolation
            for (let i = 0; i < anim.keyframes.length - 1; i++) {
                const kf1 = anim.keyframes[i];
                const kf2 = anim.keyframes[i + 1];
                
                if (time >= kf1.time && time <= kf2.time) {
                    const t = (time - kf1.time) / (kf2.time - kf1.time);
                    
                    anim.object.position.lerpVectors(kf1.position, kf2.position, t);
                    anim.object.rotation.set(
                        THREE.MathUtils.lerp(kf1.rotation.x, kf2.rotation.x, t),
                        THREE.MathUtils.lerp(kf1.rotation.y, kf2.rotation.y, t),
                        THREE.MathUtils.lerp(kf1.rotation.z, kf2.rotation.z, t)
                    );
                    break;
                }
            }
        }
    });
}

// Make variables globally accessible
window.SNM = {
    scene, camera, renderer, controls,
    objects, selectedObject,
    animations, currentTime, isPlaying,
    init, animate, updateAnimations
};