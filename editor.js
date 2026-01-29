// editor.js - COMPLETE WITH ALL FEATURES
console.log('SNM Editor loading...');

// ===== COPY/PASTE SYSTEM =====
let clipboard = null;

function copySelected() {
    if (!SNM.selectedObject) {
        console.log('No object selected to copy');
        return null;
    }
    
    const original = SNM.selectedObject;
    
    // Store object data in clipboard
    clipboard = {
        type: original.userData?.type || 'cube',
        name: original.name + ' (Copy)',
        position: original.position.clone(),
        rotation: original.rotation.clone(),
        scale: original.scale.clone(),
        material: {
            color: original.material.color.clone(),
            metalness: original.material.metalness,
            roughness: original.material.roughness
        },
        geometry: original.geometry.type,
        userData: JSON.parse(JSON.stringify(original.userData || {}))
    };
    
    console.log('📋 Copied:', clipboard.name);
    
    // Update UI to show clipboard status
    updateClipboardStatus();
    return clipboard;
}

function pasteObject() {
    if (!clipboard) {
        console.log('📋 Clipboard is empty');
        return null;
    }
    
    let newObject;
    
    // Create new object based on type
    switch(clipboard.type) {
        case 'cube':
            newObject = Editor.addCube();
            break;
        case 'sphere':
            newObject = Editor.addSphere();
            break;
        case 'cylinder':
            newObject = Editor.addCylinder();
            break;
        case 'plane':
            newObject = Editor.addPlane();
            break;
        default:
            console.error('Unknown object type:', clipboard.type);
            return null;
    }
    
    // Apply copied properties
    if (newObject) {
        newObject.name = clipboard.name;
        newObject.position.copy(clipboard.position);
        newObject.rotation.copy(clipboard.rotation);
        newObject.scale.copy(clipboard.scale);
        newObject.material.color.copy(clipboard.material.color);
        newObject.material.metalness = clipboard.material.metalness;
        newObject.material.roughness = clipboard.material.roughness;
        newObject.material.needsUpdate = true;
        
        // Offset slightly so we can see the copy
        newObject.position.x += 1;
        newObject.position.z += 1;
        
        // Copy user data
        newObject.userData = { ...clipboard.userData };
        newObject.userData.id = Date.now(); // Give it a new ID
        
        console.log('📝 Pasted:', newObject.name);
        
        // Update clipboard name for next paste
        clipboard.name = clipboard.name.replace(/ \(\d+\)$/, '') + ' (Copy)';
        updateClipboardStatus();
        
        return newObject;
    }
    
    return null;
}

function cutSelected() {
    if (!SNM.selectedObject) {
        console.log('No object selected to cut');
        return;
    }
    
    copySelected();
    deleteSelected();
    console.log('✂️ Cut and copied to clipboard');
}

function updateClipboardStatus() {
    const status = document.getElementById('clipboard-status');
    if (status) {
        if (clipboard) {
            status.textContent = `📋 ${clipboard.type}: ${clipboard.name}`;
            status.style.color = '#00ff00';
            status.title = 'Click to paste';
            status.style.cursor = 'pointer';
            
            // Click to paste
            status.onclick = pasteObject;
        } else {
            status.textContent = '📋 Empty';
            status.style.color = '#888';
            status.title = '';
            status.style.cursor = 'default';
        }
    }
}

// ===== PRIMITIVE CREATION =====
function addCube() {
    if (!SNM.scene) {
        console.error('Scene not ready');
        setTimeout(addCube, 100);
        return;
    }
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.1,
        roughness: 0.7
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 0);
    cube.name = `Cube_${SNM.objects.length + 1}`;
    cube.userData = { type: 'cube', id: Date.now() };
    
    SNM.scene.add(cube);
    SNM.objects.push(cube);
    selectObject(cube);
    updateUI();
    return cube;
}

function addSphere() {
    if (!SNM.scene) {
        setTimeout(addSphere, 100);
        return;
    }
    
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.3,
        roughness: 0.2
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(2, 0.5, 0);
    sphere.name = `Sphere_${SNM.objects.length + 1}`;
    sphere.userData = { type: 'sphere', id: Date.now() };
    
    SNM.scene.add(sphere);
    SNM.objects.push(sphere);
    selectObject(sphere);
    updateUI();
    return sphere;
}

function addCylinder() {
    if (!SNM.scene) {
        setTimeout(addCylinder, 100);
        return;
    }
    
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.2,
        roughness: 0.5
    });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(-2, 0.5, 0);
    cylinder.name = `Cylinder_${SNM.objects.length + 1}`;
    cylinder.userData = { type: 'cylinder', id: Date.now() };
    
    SNM.scene.add(cylinder);
    SNM.objects.push(cylinder);
    selectObject(cylinder);
    updateUI();
    return cylinder;
}

function addPlane() {
    if (!SNM.scene) {
        setTimeout(addPlane, 100);
        return;
    }
    
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        metalness: 0.1,
        roughness: 0.8,
        side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 0, 0);
    plane.rotation.x = -Math.PI / 2;
    plane.name = `Plane_${SNM.objects.length + 1}`;
    plane.userData = { type: 'plane', id: Date.now() };
    
    SNM.scene.add(plane);
    SNM.objects.push(plane);
    selectObject(plane);
    updateUI();
    return plane;
}

// ===== SELECTION & TRANSFORM =====
function selectObject(object) {
    // Remove old selection
    if (SNM.selectionBox) {
        SNM.scene.remove(SNM.selectionBox);
        SNM.selectionBox = null;
    }
    
    SNM.selectedObject = object;
    
    if (object) {
        // Create selection box
        const box = new THREE.BoxHelper(object, 0x00ff00);
        box.name = 'selection_box';
        SNM.scene.add(box);
        SNM.selectionBox = box;
        
        // Attach transform controls (GIZMO)
        if (SNM.transformControls) {
            SNM.transformControls.attach(object);
        }
    } else if (SNM.transformControls) {
        SNM.transformControls.detach();
    }
    
    updateUI();
}

function setTransformMode(mode) {
    if (SNM.transformControls) {
        SNM.transformControls.setMode(mode);
        
        // Update UI buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        // Update info text
        const info = document.getElementById('gizmo-mode');
        if (info) {
            if (mode === 'translate') {
                info.textContent = 'Move: Red=X Green=Y Blue=Z';
            } else if (mode === 'rotate') {
                info.textContent = 'Rotate: Drag colored rings';
            } else if (mode === 'scale') {
                info.textContent = 'Scale: Drag colored boxes';
            }
        }
    }
}

function deleteSelected() {
    if (!SNM.selectedObject) {
        alert('No object selected!');
        return;
    }
    
    SNM.scene.remove(SNM.selectedObject);
    
    if (SNM.selectionBox) {
        SNM.scene.remove(SNM.selectionBox);
        SNM.selectionBox = null;
    }
    
    if (SNM.transformControls) {
        SNM.transformControls.detach();
    }
    
    const index = SNM.objects.indexOf(SNM.selectedObject);
    if (index > -1) SNM.objects.splice(index, 1);
    
    SNM.animations = SNM.animations.filter(anim => anim.object !== SNM.selectedObject);
    SNM.selectedObject = null;
    updateUI();
}

function duplicateSelected() {
    if (!SNM.selectedObject) {
        alert('No object selected!');
        return;
    }
    
    const original = SNM.selectedObject;
    let duplicate;
    
    // Clone the mesh
    duplicate = original.clone();
    duplicate.material = original.material.clone();
    duplicate.position.x += 1; // Offset from original
    
    // Generate new name
    const baseName = original.name.replace(/_\d+$/, '');
    let counter = 1;
    let newName = `${baseName}_${counter}`;
    
    while (SNM.objects.some(obj => obj.name === newName)) {
        counter++;
        newName = `${baseName}_${counter}`;
    }
    
    duplicate.name = newName;
    duplicate.userData = { ...original.userData, id: Date.now() };
    
    SNM.scene.add(duplicate);
    SNM.objects.push(duplicate);
    selectObject(duplicate);
    updateUI();
}

// ===== ANIMATION FUNCTIONS =====
function addKeyframe() {
    if (!SNM.selectedObject) {
        alert('Select an object first!');
        return;
    }
    
    const keyframe = {
        time: SNM.currentTime,
        position: SNM.selectedObject.position.clone(),
        rotation: SNM.selectedObject.rotation.clone(),
        scale: SNM.selectedObject.scale.clone(),
        name: `Keyframe_${SNM.currentTime.toFixed(1)}s`
    };
    
    // Find or create animation
    let anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (!anim) {
        anim = { 
            object: SNM.selectedObject, 
            keyframes: [],
            name: `${SNM.selectedObject.name}_Animation`
        };
        SNM.animations.push(anim);
    }
    
    // Remove existing keyframe at this time
    anim.keyframes = anim.keyframes.filter(kf => Math.abs(kf.time - SNM.currentTime) > 0.1);
    anim.keyframes.push(keyframe);
    anim.keyframes.sort((a, b) => a.time - b.time);
    
    updateUI();
    if (window.UI && window.UI.updateKeyframes) {
        window.UI.updateKeyframes();
    }
}

function clearKeyframes() {
    if (!SNM.selectedObject) {
        alert('Select an object first!');
        return;
    }
    
    if (!confirm('Clear all keyframes for this object?')) return;
    
    SNM.animations = SNM.animations.filter(anim => anim.object !== SNM.selectedObject);
    updateUI();
    if (window.UI && window.UI.updateKeyframes) {
        window.UI.updateKeyframes();
    }
}

function togglePlayback() {
    SNM.isPlaying = !SNM.isPlaying;
    const btn = document.getElementById('play-btn');
    if (btn) {
        btn.textContent = SNM.isPlaying ? '⏸ Pause' : '▶ Play';
        btn.style.background = SNM.isPlaying ? 
            'linear-gradient(to bottom, #ff3333, #cc0000)' : 
            'linear-gradient(to bottom, #33cc33, #009900)';
    }
}

// ===== IMPORT/EXPORT =====
function importModel() {
    // Check if ModelImporter exists (from import.js)
    if (typeof ModelImporter !== 'undefined' && ModelImporter.openFilePicker) {
        // Use the proper importer
        ModelImporter.openFilePicker()
            .then(() => {
                updateUI();
            })
            .catch(error => {
                console.error('Import failed:', error);
                // Fallback to simple file picker for JSON
                importJSONOnly();
            });
    } else {
        // Fallback to simple file picker for JSON only
        importJSONOnly();
    }
}

// Simple JSON-only import (fallback)
function importJSONOnly() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.json')) {
            alert('Please select a .json file');
            return;
        }
        
        const reader = new FileReader();
        reader.readAsText(file);
        
        reader.onload = (e) => {
            try {
                const sceneData = JSON.parse(e.target.result);
                loadSceneFromJSON(sceneData);
            } catch (error) {
                alert('Failed to load JSON: ' + error.message);
            }
        };
    };
    
    input.click();
}

function loadSceneFromJSON(sceneData) {
    // Clear current scene
    SNM.objects.forEach(obj => SNM.scene.remove(obj));
    SNM.objects = [];
    SNM.animations = [];
    
    // Load objects
    if (sceneData.objects) {
        sceneData.objects.forEach(objData => {
            let geometry, material;
            
            switch(objData.type) {
                case 'cube':
                    geometry = new THREE.BoxGeometry(1, 1, 1);
                    break;
                case 'sphere':
                    geometry = new THREE.SphereGeometry(0.5, 32, 32);
                    break;
                case 'cylinder':
                    geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
                    break;
                default:
                    geometry = new THREE.BoxGeometry(1, 1, 1);
            }
            
            material = new THREE.MeshStandardMaterial({
                color: objData.material?.color || 0x888888,
                metalness: objData.material?.metalness || 0.1,
                roughness: objData.material?.roughness || 0.7
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.name = objData.name;
            mesh.position.set(...objData.position);
            mesh.rotation.set(...objData.rotation);
            mesh.scale.set(...objData.scale);
            mesh.userData = objData.userData || { type: objData.type };
            
            SNM.scene.add(mesh);
            SNM.objects.push(mesh);
        });
    }
    
    // Load animations
    if (sceneData.animations) {
        sceneData.animations.forEach(animData => {
            const object = SNM.objects.find(obj => obj.name === animData.objectName);
            if (object) {
                SNM.animations.push({
                    object: object,
                    keyframes: animData.keyframes.map(kf => ({
                        time: kf.time,
                        position: new THREE.Vector3(...kf.position),
                        rotation: new THREE.Euler(...kf.rotation),
                        scale: new THREE.Vector3(...kf.scale)
                    })),
                    name: animData.name
                });
            }
        });
    }
    
    updateUI();
}

function exportGLB() {
    if (!SNM.scene) return;
    
    // Remove helpers before export
    const helpers = [];
    SNM.scene.children.forEach(child => {
        if (child.name === 'selection_box' || child.type === 'TransformControls' || child.type === 'GridHelper' || child.type === 'AxesHelper') {
            helpers.push(child);
            SNM.scene.remove(child);
        }
    });
    
    const exporter = new THREE.GLTFExporter();
    
    exporter.parse(SNM.scene, (gltf) => {
        const output = JSON.stringify(gltf, null, 2);
        const blob = new Blob([output], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `snm_model_${Date.now()}.glb`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Model exported as GLB!');
    }, { binary: true });
    
    // Restore helpers
    helpers.forEach(helper => SNM.scene.add(helper));
}

function exportJSON() {
    const sceneData = {
        metadata: {
            version: '1.0',
            generator: 'Sketch Neko Model',
            created: new Date().toISOString()
        },
        objects: SNM.objects.map(obj => ({
            name: obj.name,
            type: obj.userData?.type || 'unknown',
            position: [obj.position.x, obj.position.y, obj.position.z],
            rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
            scale: [obj.scale.x, obj.scale.y, obj.scale.z],
            material: {
                color: obj.material.color.getHex(),
                metalness: obj.material.metalness,
                roughness: obj.material.roughness
            },
            userData: obj.userData
        })),
        animations: SNM.animations.map(anim => ({
            objectName: anim.object.name,
            name: anim.name,
            keyframes: anim.keyframes.map(kf => ({
                time: kf.time,
                position: [kf.position.x, kf.position.y, kf.position.z],
                rotation: [kf.rotation.x, kf.rotation.y, kf.rotation.z],
                scale: [kf.scale.x, kf.scale.y, kf.scale.z]
            }))
        }))
    };
    
    const output = JSON.stringify(sceneData, null, 2);
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `snm_scene_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Scene exported as JSON!');
}

// ===== CONTROLS =====
function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
        const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
        if (isInput) return;
        
        const obj = SNM.selectedObject;
        const move = e.shiftKey ? 0.5 : 0.1;
        const rotate = 0.1;
        const scale = 0.1;
        
        // Prevent default for game controls
        const gameKeys = ['w', 'a', 's', 'd', 'q', 'e', 'r', 'f', 'z', 'x', ' ', 'g', 'r', 's', 'c', 'v'];
        if (gameKeys.includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
        
        // Check for Ctrl/Cmd key combinations FIRST
        const ctrlPressed = e.ctrlKey || e.metaKey;
        
        if (ctrlPressed) {
            e.preventDefault(); // Prevent browser shortcuts
            switch(e.key.toLowerCase()) {
                case 'c': // Copy
                    copySelected();
                    break;
                case 'v': // Paste
                    pasteObject();
                    break;
                case 'x': // Cut
                    cutSelected();
                    break;
                case 'd': // Duplicate
                    duplicateSelected();
                    break;
                case 'z': // Undo (placeholder)
                    console.log('Undo - to be implemented');
                    break;
            }
        } else {
            // Original movement controls (keep these)
            if (obj) {
                switch(e.key.toLowerCase()) {
                    // WASD Movement
                    case 'w': obj.position.z -= move; break;
                    case 's': obj.position.z += move; break;
                    case 'a': obj.position.x -= move; break;
                    case 'd': obj.position.x += move; break;
                    
                    // Arrow keys (alternative)
                    case 'arrowup': obj.position.z -= move; break;
                    case 'arrowdown': obj.position.z += move; break;
                    case 'arrowleft': obj.position.x -= move; break;
                    case 'arrowright': obj.position.x += move; break;
                    
                    // Vertical movement
                    case 'q': obj.position.y -= move; break;
                    case 'e': obj.position.y += move; break;
                    case 'pageup': obj.position.y += move; break;
                    case 'pagedown': obj.position.y -= move; break;
                    
                    // Rotation
                    case 'r': obj.rotation.y += rotate; break;
                    case 'f': obj.rotation.y -= rotate; break;
                    
                    // Scale
                    case 'z': obj.scale.multiplyScalar(1 - scale); break;
                    case 'x': obj.scale.multiplyScalar(1 + scale); break;
                    
                    // Delete
                    case 'delete': 
                    case 'backspace': 
                        deleteSelected(); 
                        break;
                }
            }
            
            // Transform modes (work even without selection)
            switch(e.key.toLowerCase()) {
                case 'g': setTransformMode('translate'); break;
                case 'r': if (!ctrlPressed) setTransformMode('rotate'); break;
                case 's': if (!ctrlPressed) setTransformMode('scale'); break;
                
                // Animation
                case ' ': togglePlayback(); break;
                case 'k': addKeyframe(); break;
            }
        }
        
        // Update visual
        if (obj && SNM.selectionBox) SNM.selectionBox.update();
        
        // Update coordinates display
        updateCoordinates();
        
        // Update UI
        updateUI();
    });
}

function setupMouseControls() {
    const viewport = document.getElementById('viewport');
    if (!viewport) return;
    
    let isRightClickDragging = false;
    let lastMousePosition = { x: 0, y: 0 };
    
    // Right-click to pan
    viewport.addEventListener('mousedown', (e) => {
        if (e.button === 2) { // Right click
            isRightClickDragging = true;
            lastMousePosition = { x: e.clientX, y: e.clientY };
            viewport.style.cursor = 'move';
            e.preventDefault();
        }
    });
    
    viewport.addEventListener('mousemove', (e) => {
        // Update coordinates on mouse move
        updateMouseCoordinates(e);
        
        if (isRightClickDragging && SNM.camera && SNM.controls) {
            const deltaX = e.clientX - lastMousePosition.x;
            const deltaY = e.clientY - lastMousePosition.y;
            
            // Pan camera (simplified - using OrbitControls pan)
            const panX = -deltaX * 0.01;
            const panY = deltaY * 0.01;
            
            // Update camera position
            SNM.camera.position.x += panX;
            SNM.camera.position.y += panY;
            SNM.controls.target.x += panX;
            SNM.controls.target.y += panY;
            
            lastMousePosition = { x: e.clientX, y: e.clientY };
        }
    });
    
    viewport.addEventListener('mouseup', (e) => {
        if (e.button === 2) {
            isRightClickDragging = false;
            viewport.style.cursor = 'default';
        }
    });
    
    // Prevent context menu
    viewport.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
    
    // Mouse wheel zoom
    viewport.addEventListener('wheel', (e) => {
        if (SNM.camera) {
            const zoomSpeed = 0.001;
            const zoomDelta = e.deltaY * zoomSpeed;
            
            // Move camera forward/backward
            const direction = new THREE.Vector3();
            SNM.camera.getWorldDirection(direction);
            SNM.camera.position.addScaledVector(direction, zoomDelta);
            
            e.preventDefault();
        }
    });
}

function updateMouseCoordinates(e) {
    const coordinates = document.getElementById('coordinates');
    if (!coordinates || !SNM.camera) return;
    
    const rect = e.target.getBoundingClientRect();
    const mouse = {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1
    };
    
    // Raycast to ground plane
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), SNM.camera);
    
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    coordinates.textContent = `X: ${intersection.x.toFixed(2)} Y: ${intersection.y.toFixed(2)} Z: ${intersection.z.toFixed(2)}`;
}

function updateCoordinates() {
    const coordinates = document.getElementById('coordinates');
    if (!coordinates || !SNM.selectedObject) return;
    
    const obj = SNM.selectedObject;
    coordinates.textContent = `X: ${obj.position.x.toFixed(2)} Y: ${obj.position.y.toFixed(2)} Z: ${obj.position.z.toFixed(2)}`;
}

// ===== UTILITIES =====
function updateUI() {
    if (window.UI && window.UI.updateUI) {
        window.UI.updateUI();
    }
    updateClipboardStatus();
}

function getSceneStats() {
    let vertices = 0;
    let faces = 0;
    
    SNM.objects.forEach(obj => {
        if (obj.geometry) {
            vertices += obj.geometry.attributes.position?.count || 0;
            if (obj.geometry.index) {
                faces += obj.geometry.index.count / 3;
            }
        }
    });
    
    return { vertices, faces };
}

// ===== EXPORT =====
window.Editor = {
    // Creation
    addCube,
    addSphere,
    addCylinder,
    addPlane,
    
    // Selection & Transform
    selectObject,
    setTransformMode,
    deleteSelected,
    duplicateSelected,
    
    // Copy/Paste
    copySelected,
    pasteObject,
    cutSelected,
    
    // Animation
    addKeyframe,
    clearKeyframes,
    togglePlayback,
    
    // File Operations
    importModel,
    exportGLB,
    exportJSON,
    
    // Controls
    setupKeyboardControls,
    setupMouseControls,
    
    // Utilities
    updateUI,
    getSceneStats
};

console.log('✅ SNM Editor loaded');
