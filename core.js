// core.js - Three.js setup with official TransformControls

let scene, camera, renderer, controls, transformControls;
let objects = [];
let selectedObject = null;
let clock = new THREE.Clock();
let isPlaying = false;
let currentTime = 0;
let maxTime = 10;
let animations = [];
let undoStack = [];
let redoStack = [];
let transformMode = 'translate';
let fps = 24;
let currentFPS = 60;
let frameCount = 0;
let lastTime = performance.now();

// Initialize immediately
scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1e);

function init() {
    console.log('🐱 SNM Editor Initializing...');
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    
    // Renderer
    const canvas = document.getElementById('viewport');
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    
    // TRANSFORM CONTROLS (OFFICIAL THREE.JS)
    transformControls = new THREE.TransformControls(camera, renderer.domElement);
    
    // Transform Controls Events
    transformControls.addEventListener('dragging-changed', (event) => {
        controls.enabled = !event.value;
        if (!event.value && selectedObject) {
            saveState();
            updateUI();
        }
    });
    
    transformControls.addEventListener('change', () => {
        if (selectedObject) {
            updateCoordinates(selectedObject.position);
            updateUI();
        }
    });
    
    scene.add(transformControls);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-10, 10, -10);
    scene.add(fillLight);
    
    // Helpers
    const gridHelper = new THREE.GridHelper(30, 30, 0x444444, 0x222222);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);
    
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    // Set initial transform mode
    setTransformMode('translate');
    
    // Start animation loop
    animate();
    
    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
    
    console.log('✅ SNM Core Initialized');
}

function animate() {
    requestAnimationFrame(animate);
    
    // Calculate FPS
    const now = performance.now();
    frameCount++;
    if (now >= lastTime + 1000) {
        currentFPS = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
        
        if (document.getElementById('fps-counter')) {
            document.getElementById('fps-counter').textContent = `FPS: ${currentFPS}`;
        }
    }
    
    const delta = clock.getDelta();
    
    // Update animations
    if (isPlaying) {
        currentTime += delta;
        if (currentTime > maxTime) currentTime = 0;
        updateAnimations(currentTime);
        updateTimelineUI();
    }
    
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize() {
    const canvas = document.getElementById('viewport');
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}

function onKeyDown(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
    
    switch(event.key.toLowerCase()) {
        case 'g':
            event.preventDefault();
            setTransformMode('translate');
            break;
        case 'r':
            event.preventDefault();
            setTransformMode('rotate');
            break;
        case 's':
            event.preventDefault();
            setTransformMode('scale');
            break;
        case 'delete':
        case 'backspace':
            deleteSelected();
            break;
        case ' ':
            event.preventDefault();
            togglePlayback();
            break;
        case 'z':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                undo();
            }
            break;
        case 'y':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                redo();
            }
            break;
        case 'd':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                duplicateSelected();
            }
            break;
    }
}

function setTransformMode(mode) {
    transformMode = mode;
    if (transformControls) {
        transformControls.setMode(mode);
    }
    
    // Update UI buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function selectObject(object) {
    if (selectedObject && selectedObject.userData.helper) {
        scene.remove(selectedObject.userData.helper);
    }
    
    selectedObject = object;
    
    if (object) {
        // Add selection helper
        const helper = new THREE.BoxHelper(object, 0x00ff00);
        scene.add(helper);
        object.userData.helper = helper;
        
        // Attach transform controls
        transformControls.attach(object);
        
        updateCoordinates(object.position);
    } else {
        transformControls.detach();
    }
    
    updateUI();
}

function saveState() {
    const state = {
        objects: objects.map(obj => ({
            uuid: obj.uuid,
            type: obj.userData.type,
            name: obj.name,
            position: obj.position.toArray(),
            rotation: obj.rotation.toArray(),
            scale: obj.scale.toArray(),
            material: {
                color: obj.material.color.getHex(),
                metalness: obj.material.metalness,
                roughness: obj.material.roughness
            }
        }))
    };
    
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > 20) undoStack.shift();
    redoStack = [];
}

function undo() {
    if (undoStack.length > 0) {
        const stateStr = undoStack.pop();
        redoStack.push(stateStr);
        restoreState(JSON.parse(stateStr));
    }
}

function redo() {
    if (redoStack.length > 0) {
        const stateStr = redoStack.pop();
        undoStack.push(stateStr);
        restoreState(JSON.parse(stateStr));
    }
}

function restoreState(state) {
    // Clear scene
    objects.forEach(obj => scene.remove(obj));
    objects = [];
    
    // Restore objects
    state.objects.forEach(objData => {
        let geometry;
        switch(objData.type) {
            case 'cube': geometry = new THREE.BoxGeometry(1, 1, 1); break;
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 32, 32); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
            case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 32); break;
            case 'torus': geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100); break;
            default: geometry = new THREE.BoxGeometry(1, 1, 1);
        }
        
        const material = new THREE.MeshStandardMaterial({
            color: objData.material.color,
            metalness: objData.material.metalness,
            roughness: objData.material.roughness
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = objData.name;
        mesh.position.fromArray(objData.position);
        mesh.rotation.fromArray(objData.rotation);
        mesh.scale.fromArray(objData.scale);
        mesh.userData = { type: objData.type };
        
        scene.add(mesh);
        objects.push(mesh);
    });
    
    updateUI();
}

function updateAnimations(time) {
    animations.forEach(anim => {
        if (anim.object && anim.keyframes.length >= 2) {
            for (let i = 0; i < anim.keyframes.length - 1; i++) {
                const kf1 = anim.keyframes[i];
                const kf2 = anim.keyframes[i + 1];
                
                if (time >= kf1.time && time <= kf2.time) {
                    const t = (time - kf1.time) / (kf2.time - kf1.time);
                    
                    anim.object.position.lerpVectors(kf1.position, kf2.position, t);
                    
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
    
    if (slider) slider.value = (currentTime / maxTime) * 100;
    if (display) display.textContent = `${currentTime.toFixed(2)}s`;
}

function togglePlayback() {
    isPlaying = !isPlaying;
    const btn = document.getElementById('play-btn') || document.getElementById('play-pause');
    if (btn) btn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
}

function updateCoordinates(pos) {
    const coords = document.getElementById('coordinates');
    if (coords) coords.textContent = `X: ${pos.x.toFixed(2)} Y: ${pos.y.toFixed(2)} Z: ${pos.z.toFixed(2)}`;
}

function getSceneStats() {
    let vertices = 0, faces = 0;
    objects.forEach(obj => {
        if (obj.geometry) {
            vertices += obj.geometry.attributes.position?.count || 0;
            faces += obj.geometry.index ? obj.geometry.index.count / 3 : obj.geometry.attributes.position.count / 3;
        }
    });
    return { vertices, faces };
}

// Expose to global scope
window.SNM = {
    scene, camera, renderer, controls, transformControls,
    objects, selectedObject, animations, currentTime, maxTime,
    isPlaying, undoStack, redoStack, transformMode, fps,
    
    init, animate, setTransformMode, selectObject,
    saveState, undo, redo, updateAnimations,
    togglePlayback, updateCoordinates, getSceneStats,
    updateTimelineUI
};