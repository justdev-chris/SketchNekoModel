// core.js - Three.js setup, render loop, and core systems

let scene, camera, renderer, controls, transformControls;
let objects = [];
let selectedObject = null;
let clock = new THREE.Clock();
let isPlaying = false;
let currentTime = 0;
let maxTime = 10; // 10 seconds default
let animations = [];
let undoStack = [];
let redoStack = [];
let transformMode = 'translate'; // translate, rotate, scale
let fps = 24;
let lastFrameTime = 0;
let frameCount = 0;
let currentFPS = 60;

// Initialize scene immediately
scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1e);

function init() {
    console.log('🐱 SNM Editor Initializing...');
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(8, 8, 8);
    
    // Renderer
    const viewport = document.getElementById('viewport');
    renderer = new THREE.WebGLRenderer({ 
        canvas: viewport, 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 15, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Helpers
    const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);
    
    const axesHelper = new THREE.AxesHelper(5);
    axesHelper.position.y = 0.01;
    scene.add(axesHelper);
    
    // Transform Controls
    transformControls = new THREE.TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', function(event) {
        controls.enabled = !event.value;
    });
    transformControls.addEventListener('change', function() {
        updateUI();
    });
    scene.add(transformControls);
    
    // Set initial mode
    setTransformMode('translate');
    
    // Start animation loop
    animate();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize);
    
    // Keyboard shortcuts
    window.addEventListener('keydown', onKeyDown);
    
    console.log('✅ SNM Editor Ready!');
}

function animate() {
    requestAnimationFrame(animate);
    
    // Calculate FPS
    const now = performance.now();
    frameCount++;
    if (now >= lastFrameTime + 1000) {
        currentFPS = (frameCount * 1000) / (now - lastFrameTime);
        frameCount = 0;
        lastFrameTime = now;
        
        // Update FPS display
        const fpsDisplay = document.getElementById('fps-counter');
        if (fpsDisplay) {
            fpsDisplay.textContent = `FPS: ${Math.round(currentFPS)}`;
        }
    }
    
    const delta = clock.getDelta();
    
    // Update animations if playing
    if (isPlaying) {
        currentTime += delta;
        if (currentTime > maxTime) {
            currentTime = 0;
        }
        updateAnimations(currentTime);
        updateTimelineUI();
    }
    
    // Update controls
    controls.update();
    
    // Update transform controls if object selected
    if (selectedObject && transformControls.object !== selectedObject) {
        transformControls.attach(selectedObject);
    }
    
    // Render
    renderer.render(scene, camera);
}

function onWindowResize() {
    const viewport = document.getElementById('viewport');
    if (camera && viewport) {
        camera.aspect = viewport.clientWidth / viewport.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    }
}

function onKeyDown(event) {
    // Don't trigger if typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    
    switch(event.key.toLowerCase()) {
        case 'g': // Move
            event.preventDefault();
            setTransformMode('translate');
            break;
        case 'r': // Rotate
            event.preventDefault();
            setTransformMode('rotate');
            break;
        case 's': // Scale
            event.preventDefault();
            setTransformMode('scale');
            break;
        case 'q': // Select
            transformControls.setSpace(transformControls.space === 'world' ? 'local' : 'world');
            break;
        case 'delete': // Delete
        case 'backspace':
            deleteSelected();
            break;
        case 'd': // Duplicate
            if (event.ctrlKey || event.metaKey) {
                duplicateSelected();
            }
            break;
        case 'z': // Undo
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                if (!event.shiftKey) {
                    undo();
                } else {
                    redo();
                }
            }
            break;
        case ' ': // Play/pause
            event.preventDefault();
            togglePlayback();
            break;
    }
}

function updateAnimations(time) {
    animations.forEach(anim => {
        if (anim.object && anim.keyframes && anim.keyframes.length >= 2) {
            // Find surrounding keyframes
            let kf1 = null, kf2 = null;
            
            for (let i = 0; i < anim.keyframes.length - 1; i++) {
                if (time >= anim.keyframes[i].time && time <= anim.keyframes[i + 1].time) {
                    kf1 = anim.keyframes[i];
                    kf2 = anim.keyframes[i + 1];
                    break;
                }
            }
            
            // If no keyframes found, use first or last
            if (!kf1 && anim.keyframes.length > 0) {
                if (time < anim.keyframes[0].time) {
                    kf1 = kf2 = anim.keyframes[0];
                } else {
                    kf1 = kf2 = anim.keyframes[anim.keyframes.length - 1];
                }
            }
            
            if (kf1 && kf2) {
                const t = (time - kf1.time) / (kf2.time - kf1.time || 1);
                
                // Interpolate position
                anim.object.position.lerpVectors(kf1.position, kf2.position, t);
                
                // Interpolate rotation (quaternion for smooth rotation)
                const q1 = new THREE.Quaternion().setFromEuler(kf1.rotation);
                const q2 = new THREE.Quaternion().setFromEuler(kf2.rotation);
                anim.object.quaternion.slerpQuaternions(q1, q2, t);
                
                // Interpolate scale
                anim.object.scale.lerpVectors(kf1.scale, kf2.scale, t);
            }
        }
    });
}

function setTransformMode(mode) {
    transformMode = mode;
    if (transformControls) {
        transformControls.setMode(mode);
    }
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    return mode;
}

function saveState() {
    const state = {
        objects: objects.map(obj => ({
            uuid: obj.uuid,
            type: obj.userData.type,
            name: obj.name,
            position: obj.position.clone(),
            rotation: obj.rotation.clone(),
            scale: obj.scale.clone(),
            material: {
                color: obj.material.color.clone(),
                metalness: obj.material.metalness,
                roughness: obj.material.roughness
            }
        }))
    };
    undoStack.push(state);
    if (undoStack.length > 20) undoStack.shift(); // Limit undo history
    redoStack = []; // Clear redo when new action
}

function undo() {
    if (undoStack.length > 0) {
        const state = undoStack.pop();
        redoStack.push(state);
        restoreState(state);
        updateUI();
    }
}

function redo() {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(state);
        restoreState(state);
        updateUI();
    }
}

function restoreState(state) {
    // Clear current scene
    objects.forEach(obj => scene.remove(obj));
    objects = [];
    
    // Restore objects
    state.objects.forEach(objData => {
        let geometry;
        switch(objData.type) {
            case 'cube': geometry = new THREE.BoxGeometry(1, 1, 1); break;
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 32, 32); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
            default: geometry = new THREE.BoxGeometry(1, 1, 1);
        }
        
        const material = new THREE.MeshStandardMaterial({
            color: objData.material.color,
            metalness: objData.material.metalness,
            roughness: objData.material.roughness
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = objData.name;
        mesh.position.copy(objData.position);
        mesh.rotation.copy(objData.rotation);
        mesh.scale.copy(objData.scale);
        mesh.userData = { type: objData.type };
        
        scene.add(mesh);
        objects.push(mesh);
    });
}

function updateTimelineUI() {
    const slider = document.getElementById('time-slider');
    const display = document.getElementById('time-display');
    const playhead = document.getElementById('playhead');
    
    if (slider) {
        slider.value = (currentTime / maxTime) * 100;
    }
    if (display) {
        display.textContent = `${currentTime.toFixed(2)} / ${maxTime.toFixed(2)}s`;
    }
    if (playhead) {
        playhead.style.left = `${(currentTime / maxTime) * 100}%`;
    }
}

function togglePlayback() {
    isPlaying = !isPlaying;
    const btn = document.getElementById('play-btn') || document.getElementById('play-pause');
    if (btn) {
        btn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    }
}

function setCurrentTime(time) {
    currentTime = Math.max(0, Math.min(time, maxTime));
    if (!isPlaying) {
        updateAnimations(currentTime);
    }
    updateTimelineUI();
}

// Calculate scene stats
function getSceneStats() {
    let vertices = 0;
    let faces = 0;
    
    objects.forEach(obj => {
        if (obj.geometry) {
            vertices += obj.geometry.attributes.position.count;
            if (obj.geometry.index) {
                faces += obj.geometry.index.count / 3;
            } else {
                faces += obj.geometry.attributes.position.count / 3;
            }
        }
    });
    
    return { vertices, faces };
}

// Update coordinates display
function updateCoordinates(pos) {
    const coords = document.getElementById('coordinates');
    if (coords) {
        coords.textContent = `X: ${pos.x.toFixed(2)} Y: ${pos.y.toFixed(2)} Z: ${pos.z.toFixed(2)}`;
    }
}

// Make everything globally accessible
window.SNM = {
    scene, camera, renderer, controls, transformControls,
    objects, selectedObject,
    animations, currentTime, maxTime, isPlaying,
    undoStack, redoStack, transformMode, fps, currentFPS,
    init, animate, updateAnimations,
    setTransformMode, saveState, undo, redo,
    togglePlayback, setCurrentTime, getSceneStats,
    updateCoordinates, updateTimelineUI
};
