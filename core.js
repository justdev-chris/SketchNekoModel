// core.js - FIXED VERSION
console.log('🐱 SNM Core loading...');

// Define SNM FIRST so all files can access it
window.SNM = {
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    objects: [],
    selectedObject: null,
    selectionBox: null,
    animations: [],
    currentTime: 0,
    isPlaying: false,
    clock: new THREE.Clock(),
    
    // Functions will be added below
    init: null,
    animate: null,
    updateAnimations: null,
    updateTimelineUI: null
};

// Now define the functions
SNM.init = function() {
    console.log('Initializing SNM...');
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1e);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(5, 5, 5);
    
    // Renderer
    const viewport = document.getElementById('viewport');
    this.renderer = new THREE.WebGLRenderer({ canvas: viewport, antialias: true });
    this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    
    // Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    this.scene.add(directionalLight);
    
    // Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    this.scene.add(gridHelper);
    
    console.log('✅ SNM initialized!');
    
    // Start animation loop
    this.animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        const viewport = document.getElementById('viewport');
        this.camera.aspect = viewport.clientWidth / viewport.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    });
};

SNM.animate = function() {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    // Update animations if playing
    if (this.isPlaying) {
        this.currentTime += delta;
        this.updateAnimations(this.currentTime);
        this.updateTimelineUI();
    }
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
};

SNM.updateAnimations = function(time) {
    this.animations.forEach(anim => {
        if (anim.object && anim.keyframes && anim.keyframes.length >= 2) {
            for (let i = 0; i < anim.keyframes.length - 1; i++) {
                const kf1 = anim.keyframes[i];
                const kf2 = anim.keyframes[i + 1];
                
                if (time >= kf1.time && time <= kf2.time) {
                    const t = (time - kf1.time) / (kf2.time - kf1.time);
                    
                    anim.object.position.x = kf1.position.x + (kf2.position.x - kf1.position.x) * t;
                    anim.object.position.y = kf1.position.y + (kf2.position.y - kf1.position.y) * t;
                    anim.object.position.z = kf1.position.z + (kf2.position.z - kf1.position.z) * t;
                    
                    anim.object.rotation.x = kf1.rotation.x + (kf2.rotation.x - kf1.rotation.x) * t;
                    anim.object.rotation.y = kf1.rotation.y + (kf2.rotation.y - kf1.rotation.y) * t;
                    anim.object.rotation.z = kf1.rotation.z + (kf2.rotation.z - kf1.rotation.z) * t;
                    
                    break;
                }
            }
        }
    });
};

SNM.updateTimelineUI = function() {
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    
    if (slider) slider.value = (this.currentTime / 10) * 100;
    if (display) display.textContent = this.currentTime.toFixed(1) + 's';
};

console.log('✅ SNM Core loaded!');
