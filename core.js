// core.js - COMPLETE WITH ALL FEATURES
console.log('SNM Core loading...');

// Initialize everything properly
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1e);

const objects = [];
let selectedObject = null;
const clock = new THREE.Clock();
let isPlaying = false;
let currentTime = 0;
const animations = [];
let selectionBox = null;

// Expose immediately
window.SNM = { 
    scene, 
    objects, selectedObject, isPlaying, currentTime, animations, selectionBox,
    camera: null, renderer: null, controls: null, transformControls: null,
    clock: clock,
    init: null, animate: null, updateAnimations: null, updateTimelineUI: null
};

SNM.init = function() {
    console.log('Initializing SNM...');
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(5, 5, 5);
    
    // Renderer
    const viewport = document.getElementById('viewport');
    this.renderer = new THREE.WebGLRenderer({ 
        canvas: viewport, 
        antialias: true,
        alpha: true
    });
    this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    
    // Orbit Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    
    // Transform Controls (GIZMO)
    this.transformControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.addEventListener('dragging-changed', (event) => {
        this.controls.enabled = !event.value;
    });
    this.scene.add(this.transformControls);
    
    // Set default mode
    this.transformControls.setMode('translate');
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.scene.add(gridHelper);
    
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
    
    // Start animation loop
    this.animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        const viewport = document.getElementById('viewport');
        if (this.camera && viewport) {
            this.camera.aspect = viewport.clientWidth / viewport.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
        }
    });
    
    console.log('✅ SNM initialized with TransformControls');
};

SNM.animate = function() {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    // Update animations if playing
    if (this.isPlaying) {
        this.currentTime += delta;
        if (this.currentTime > 10) this.currentTime = 0;
        this.updateAnimations(this.currentTime);
        this.updateTimelineUI();
    }
    
    if (this.controls) this.controls.update();
    if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
    }
};

SNM.updateAnimations = function(time) {
    this.animations.forEach(anim => {
        if (anim.object && anim.keyframes && anim.keyframes.length > 0) {
            // Find surrounding keyframes
            let prev = null, next = null;
            
            for (let i = 0; i < anim.keyframes.length; i++) {
                if (anim.keyframes[i].time <= time) {
                    prev = anim.keyframes[i];
                }
                if (anim.keyframes[i].time >= time) {
                    next = anim.keyframes[i];
                    break;
                }
            }
            
            if (!next && prev) next = prev;
            if (!prev && next) prev = next;
            
            if (prev && next) {
                const t = (time - prev.time) / (next.time - prev.time || 1);
                
                // Interpolate
                anim.object.position.lerpVectors(prev.position, next.position, t);
                
                // Quaternion rotation
                const q1 = new THREE.Quaternion().setFromEuler(prev.rotation);
                const q2 = new THREE.Quaternion().setFromEuler(next.rotation);
                anim.object.quaternion.slerpQuaternions(q1, q2, t);
                
                anim.object.scale.lerpVectors(prev.scale, next.scale, t);
            }
        }
    });
    
    // Update UI
    if (window.UI && window.UI.updateTimelineUI) {
        window.UI.updateTimelineUI();
    }
};

SNM.updateTimelineUI = function() {
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    
    if (slider) {
        slider.value = (this.currentTime / 10) * 100;
    }
    if (display) {
        display.textContent = this.currentTime.toFixed(2) + 's';
    }
    
    // Update keyframe highlights
    if (window.UI && window.UI.updateKeyframes) {
        window.UI.updateKeyframes();
    }
};

console.log('✅ SNM Core loaded. Scene ready:', !!window.SNM.scene);
