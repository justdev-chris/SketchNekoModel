// core.js - COMPLETE, NOT SIMPLIFIED
console.log('SNM Core loading...');

// Initialize all variables
let scene = new THREE.Scene();
let camera = null;
let renderer = null;
let controls = null;
let transformControls = null;
let objects = [];
let selectedObject = null;
let clock = new THREE.Clock();
let isPlaying = false;
let currentTime = 0;
let animations = [];
let selectionBox = null;

// Scene setup
scene.background = new THREE.Color(0x1a1a1e);

function init() {
    console.log('Initializing SNM...');
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    
    // Renderer
    const viewport = document.getElementById('viewport');
    if (!viewport) {
        console.error('Viewport element not found!');
        return;
    }
    
    renderer = new THREE.WebGLRenderer({ 
        canvas: viewport, 
        antialias: true,
        alpha: true
    });
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Transform Controls (GIZMO)
    transformControls = new THREE.TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', function(event) {
        controls.enabled = !event.value;
    });
    transformControls.addEventListener('objectChange', function() {
        if (selectedObject && selectionBox) {
            selectionBox.update();
        }
    });
    scene.add(transformControls);
    
    // Default to translate mode
    transformControls.setMode('translate');
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Helpers
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);
    
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.y = 0.01;
    scene.add(axesHelper);
    
    // Start animation loop
    animate();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    console.log('✅ SNM initialized with TransformControls');
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Update animations if playing
    if (isPlaying) {
        currentTime += delta;
        if (currentTime > 10) currentTime = 0; // Loop at 10 seconds
        updateAnimations(currentTime);
        updateTimelineUI();
    }
    
    // Update controls
    if (controls) {
        controls.update();
    }
    
    // Render
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    const viewport = document.getElementById('viewport');
    if (!viewport || !camera || !renderer) return;
    
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
}

function updateAnimations(time) {
    animations.forEach(anim => {
        if (anim.object && anim.keyframes && anim.keyframes.length > 0) {
            // Find surrounding keyframes
            let prevKeyframe = null;
            let nextKeyframe = null;
            
            for (let i = 0; i < anim.keyframes.length; i++) {
                if (anim.keyframes[i].time <= time) {
                    prevKeyframe = anim.keyframes[i];
                }
                if (anim.keyframes[i].time >= time) {
                    nextKeyframe = anim.keyframes[i];
                    break;
                }
            }
            
            // If no next keyframe, use last
            if (!nextKeyframe && prevKeyframe) {
                nextKeyframe = prevKeyframe;
            }
            
            // If no prev keyframe, use first
            if (!prevKeyframe && nextKeyframe) {
                prevKeyframe = nextKeyframe;
            }
            
            if (prevKeyframe && nextKeyframe) {
                const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time || 1);
                
                // Interpolate position
                anim.object.position.lerpVectors(prevKeyframe.position, nextKeyframe.position, t);
                
                // Interpolate rotation (quaternion)
                const q1 = new THREE.Quaternion().setFromEuler(prevKeyframe.rotation);
                const q2 = new THREE.Quaternion().setFromEuler(nextKeyframe.rotation);
                anim.object.quaternion.slerpQuaternions(q1, q2, t);
                
                // Interpolate scale
                anim.object.scale.lerpVectors(prevKeyframe.scale, nextKeyframe.scale, t);
            }
        }
    });
}

function updateTimelineUI() {
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    
    if (slider) {
        slider.value = (currentTime / 10) * 100;
    }
    
    if (display) {
        display.textContent = currentTime.toFixed(2) + 's';
    }
}

// Expose everything to window
window.SNM = {
    // Scene objects
    scene: scene,
    camera: camera,
    renderer: renderer,
    controls: controls,
    transformControls: transformControls,
    
    // Data
    objects: objects,
    selectedObject: selectedObject,
    selectionBox: selectionBox,
    animations: animations,
    currentTime: currentTime,
    isPlaying: isPlaying,
    
    // Functions
    init: init,
    animate: animate,
    updateAnimations: updateAnimations,
    updateTimelineUI: updateTimelineUI,
    
    // Helper function to get scene stats
    getStats: function() {
        return {
            objects: objects.length,
            vertices: objects.reduce((sum, obj) => {
                return sum + (obj.geometry ? obj.geometry.attributes.position.count : 0);
            }, 0),
            keyframes: animations.reduce((sum, anim) => sum + anim.keyframes.length, 0)
        };
    }
};

console.log('✅ SNM Core loaded. Scene ready:', !!window.SNM.scene);
