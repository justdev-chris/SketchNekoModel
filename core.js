// core.js - COMPLETE WITH TRANSFORM CONTROLS
console.log('🐱 SNM Core loading...');

// Define SNM object with ALL variables
window.SNM = {
    // Scene objects
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    transformControls: null,
    
    // Data
    objects: [],
    selectedObject: null,
    selectionBox: null,
    animations: [],
    
    // Animation state
    currentTime: 0,
    isPlaying: false,
    clock: new THREE.Clock(),
    
    // Functions
    init: null,
    animate: null,
    updateAnimations: null,
    updateTimelineUI: null
};

// Initialize everything
SNM.init = function() {
    console.log('Initializing SNM...');
    
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1e);
    
    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(5, 5, 5);
    this.camera.lookAt(0, 0, 0);
    
    // 3. Renderer
    const viewport = document.getElementById('viewport');
    this.renderer = new THREE.WebGLRenderer({ 
        canvas: viewport, 
        antialias: true,
        alpha: true
    });
    this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    
    // 4. Orbit Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // 5. TRANSFORM CONTROLS (GIZMO)
    this.transformControls = new THREE.TransformControls(this.camera, this.renderer.domElement);
    
    // When dragging gizmo, disable orbit controls
    this.transformControls.addEventListener('dragging-changed', (event) => {
        this.controls.enabled = !event.value;
    });
    
    // Add gizmo to scene
    this.scene.add(this.transformControls);
    
    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    // 7. Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.position.y = -0.01;
    this.scene.add(gridHelper);
    
    console.log('✅ SNM initialized!');
    
    // 8. Start animation loop
    this.animate();
    
    // 9. Handle window resize
    window.addEventListener('resize', () => {
        const viewport = document.getElementById('viewport');
        if (this.camera && viewport) {
            this.camera.aspect = viewport.clientWidth / viewport.clientHeight;
            this.camera.updateProjectionMatrix();
        }
        if (this.renderer && viewport) {
            this.renderer.setSize(viewport.clientWidth, viewport.clientHeight);
        }
    });
    
    // 10. Keyboard shortcuts for transform modes
    window.addEventListener('keydown', (event) => {
        if (!this.transformControls) return;
        
        switch(event.key.toLowerCase()) {
            case 'g':
                event.preventDefault();
                this.transformControls.setMode('translate');
                break;
            case 'r':
                event.preventDefault();
                this.transformControls.setMode('rotate');
                break;
            case 's':
                event.preventDefault();
                this.transformControls.setMode('scale');
                break;
        }
    });
};

// Animation loop
SNM.animate = function() {
    requestAnimationFrame(() => this.animate());
    
    const delta = this.clock.getDelta();
    
    // Update animations if playing
    if (this.isPlaying) {
        this.currentTime += delta;
        if (this.currentTime > 10) this.currentTime = 0; // Loop at 10 seconds
        this.updateAnimations(this.currentTime);
        this.updateTimelineUI();
    }
    
    // Update controls
    this.controls.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
};

// Update animations
SNM.updateAnimations = function(time) {
    this.animations.forEach(anim => {
        if (!anim.object || !anim.keyframes || anim.keyframes.length < 2) return;
        
        // Find surrounding keyframes
        for (let i = 0; i < anim.keyframes.length - 1; i++) {
            const kf1 = anim.keyframes[i];
            const kf2 = anim.keyframes[i + 1];
            
            if (time >= kf1.time && time <= kf2.time) {
                const t = (time - kf1.time) / (kf2.time - kf1.time);
                
                // Position
                anim.object.position.lerpVectors(kf1.position, kf2.position, t);
                
                // Rotation (quaternion for smooth interpolation)
                const q1 = new THREE.Quaternion().setFromEuler(kf1.rotation);
                const q2 = new THREE.Quaternion().setFromEuler(kf2.rotation);
                anim.object.quaternion.slerpQuaternions(q1, q2, t);
                
                // Scale
                anim.object.scale.lerpVectors(kf1.scale, kf2.scale, t);
                
                // Update selection box if exists
                if (anim.object === this.selectedObject && this.selectionBox) {
                    this.selectionBox.update();
                }
                
                break;
            }
        }
    });
};

// Update timeline UI
SNM.updateTimelineUI = function() {
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    
    if (slider) slider.value = (this.currentTime / 10) * 100;
    if (display) display.textContent = this.currentTime.toFixed(1) + 's';
};

console.log('✅ SNM Core loaded!');
