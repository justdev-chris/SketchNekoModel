// core.js - WITH TRANSFORM CONTROLS
console.log('SNM Core loading...');

let scene, camera, renderer, controls, transformControls;
let objects = [];
let selectedObject = null;
let clock = new THREE.Clock();
let isPlaying = false;
let currentTime = 0;
let animations = [];
let selectionBox = null;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1e);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    
    const viewport = document.getElementById('viewport');
    renderer = new THREE.WebGLRenderer({ canvas: viewport, antialias: true });
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // TRANSFORM CONTROLS (GIZMO)
    transformControls = new THREE.TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', function(event) {
        controls.enabled = !event.value;
    });
    scene.add(transformControls);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);
    
    // Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);
    
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    animate();
    
    window.addEventListener('resize', onWindowResize);
    
    // Set default mode to translate (move)
    if (transformControls) {
        transformControls.setMode('translate');
    }
    
    console.log('✅ SNM initialized with TransformControls');
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    if (isPlaying) {
        currentTime += delta;
        updateAnimations(currentTime);
        updateTimelineUI();
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
        if (anim.object && anim.keyframes && anim.keyframes.length >= 2) {
            for (let i = 0; i < anim.keyframes.length - 1; i++) {
                const kf1 = anim.keyframes[i];
                const kf2 = anim.keyframes[i + 1];
                
                if (time >= kf1.time && time <= kf2.time) {
                    const t = (time - kf1.time) / (kf2.time - kf1.time);
                    
                    anim.object.position.lerpVectors(kf1.position, kf2.position, t);
                    
                    // Use quaternion for smooth rotation
                    const q1 = new THREE.Quaternion().setFromEuler(kf1.rotation);
                    const q2 = new THREE.Quaternion().setFromEuler(kf2.rotation);
                    anim.object.quaternion.slerpQuaternions(q1, q2, t);
                    
                    anim.object.scale.lerpVectors(kf1.scale, kf2.scale, t);
                    break;
                }
            }
        }
    });
}

function updateTimelineUI() {
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    
    if (slider) slider.value = (currentTime / 10) * 100;
    if (display) display.textContent = currentTime.toFixed(1) + 's';
}

// Expose to window
window.SNM = {
    scene, camera, renderer, controls, transformControls,
    objects, selectedObject,
    animations, currentTime, isPlaying,
    selectionBox,
    init, animate, updateAnimations, updateTimelineUI
};