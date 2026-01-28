// editor.js - WITH REAL TRANSFORM GIZMO
console.log('🐱 SNM Editor loading...');

// Primitive creation
function addCube() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.1,
        roughness: 0.7
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0.5, 0);
    cube.name = `Cube_${SNM.objects.length + 1}`;
    cube.userData = { type: 'cube' };
    
    SNM.scene.add(cube);
    SNM.objects.push(cube);
    selectObject(cube);
    updateUI();
    return cube;
}

function addSphere() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.3,
        roughness: 0.2
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(2, 0.5, 0);
    sphere.name = `Sphere_${SNM.objects.length + 1}`;
    sphere.userData = { type: 'sphere' };
    
    SNM.scene.add(sphere);
    SNM.objects.push(sphere);
    selectObject(sphere);
    updateUI();
    return sphere;
}

function addCylinder() {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.2,
        roughness: 0.5
    });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set(-2, 0.5, 0);
    cylinder.name = `Cylinder_${SNM.objects.length + 1}`;
    cylinder.userData = { type: 'cylinder' };
    
    SNM.scene.add(cylinder);
    SNM.objects.push(cylinder);
    selectObject(cylinder);
    updateUI();
    return cylinder;
}

// Selection with Transform Gizmo
function selectObject(object) {
    console.log('Selecting:', object?.name || 'none');
    
    // Remove old selection box
    if (SNM.selectionBox) {
        SNM.scene.remove(SNM.selectionBox);
        SNM.selectionBox = null;
    }
    
    // Update selected object
    SNM.selectedObject = object;
    
    if (object) {
        // Create selection box
        const box = new THREE.BoxHelper(object, 0x00ff00);
        box.name = 'selection_box';
        SNM.scene.add(box);
        SNM.selectionBox = box;
        
        // Attach transform gizmo to object
        if (window.transformControls) {
            window.transformControls.attach(object);
        }
    } else {
        // Detach transform gizmo if no object
        if (window.transformControls) {
            window.transformControls.detach();
        }
    }
    
    updateUI();
}

// Set Transform Mode (Move/Rotate/Scale)
function setTransformMode(mode) {
    if (!window.transformControls) return;
    
    window.transformControls.setMode(mode);
    currentTransformMode = mode;
    
    // Update UI buttons
    document.querySelectorAll('.transform-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.transform === mode);
    });
    
    // Show visual feedback
    const modeNames = { translate: 'Move', rotate: 'Rotate', scale: 'Scale' };
    console.log(`Transform: ${modeNames[mode]} (${mode})`);
}

// Simple transform with arrow keys (alternative to gizmo)
function setupArrowKeyControls() {
    window.addEventListener('keydown', (e) => {
        if (!SNM.selectedObject) return;
        
        const speed = e.shiftKey ? 0.5 : 0.1;
        const obj = SNM.selectedObject;
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                obj.position.z -= speed;
                break;
            case 'ArrowDown':
                e.preventDefault();
                obj.position.z += speed;
                break;
            case 'ArrowLeft':
                e.preventDefault();
                obj.position.x -= speed;
                break;
            case 'ArrowRight':
                e.preventDefault();
                obj.position.x += speed;
                break;
            case 'PageUp':
                e.preventDefault();
                obj.position.y += speed;
                break;
            case 'PageDown':
                e.preventDefault();
                obj.position.y -= speed;
                break;
            case '[':
                e.preventDefault();
                obj.rotation.y += 0.1;
                break;
            case ']':
                e.preventDefault();
                obj.rotation.y -= 0.1;
                break;
            case '-':
                e.preventDefault();
                obj.scale.multiplyScalar(0.9);
                break;
            case '=':
                e.preventDefault();
                obj.scale.multiplyScalar(1.1);
                break;
        }
        
        // Update selection box
        if (SNM.selectionBox) {
            SNM.selectionBox.update();
        }
        
        updateUI();
    });
}

// Delete function
function deleteSelected() {
    if (!SNM.selectedObject) return;
    
    SNM.scene.remove(SNM.selectedObject);
    
    if (SNM.selectionBox) {
        SNM.scene.remove(SNM.selectionBox);
        SNM.selectionBox = null;
    }
    
    if (window.transformControls) {
        window.transformControls.detach();
    }
    
    const index = SNM.objects.indexOf(SNM.selectedObject);
    if (index > -1) SNM.objects.splice(index, 1);
    
    SNM.animations = SNM.animations.filter(anim => anim.object !== SNM.selectedObject);
    SNM.selectedObject = null;
    updateUI();
}

// Animation functions
function addKeyframe() {
    if (!SNM.selectedObject) {
        alert('Select an object first!');
        return;
    }
    
    const keyframe = {
        time: SNM.currentTime,
        position: SNM.selectedObject.position.clone(),
        rotation: new THREE.Euler().copy(SNM.selectedObject.rotation),
        scale: SNM.selectedObject.scale.clone()
    };
    
    let anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (!anim) {
        anim = { object: SNM.selectedObject, keyframes: [] };
        SNM.animations.push(anim);
    }
    
    anim.keyframes = anim.keyframes.filter(kf => Math.abs(kf.time - SNM.currentTime) > 0.1);
    anim.keyframes.push(keyframe);
    anim.keyframes.sort((a, b) => a.time - b.time);
    
    updateUI();
}

function clearKeyframes() {
    if (!SNM.selectedObject) {
        alert('Select an object first!');
        return;
    }
    
    SNM.animations = SNM.animations.filter(anim => anim.object !== SNM.selectedObject);
    updateUI();
}

// Export function
function exportGLB() {
    if (!SNM.scene) return;
    
    // Remove helpers before export
    const helpers = [];
    SNM.scene.children.forEach(child => {
        if (child.name.includes('selection_box') || child.name.includes('transform')) {
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
        link.download = 'snm_model.glb';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        alert('Model exported!');
    }, { binary: true });
    
    // Restore helpers
    helpers.forEach(helper => SNM.scene.add(helper));
}

// Playback control
function togglePlayback() {
    SNM.isPlaying = !SNM.isPlaying;
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.textContent = SNM.isPlaying ? '⏸ Pause' : '▶ Play';
    }
}

// Initialize controls
function initControls() {
    setupArrowKeyControls();
    
    // Default to move mode
    setTimeout(() => setTransformMode('translate'), 100);
}

// Expose all functions
window.Editor = {
    addCube,
    addSphere,
    addCylinder,
    selectObject,
    deleteSelected,
    addKeyframe,
    clearKeyframes,
    exportGLB,
    togglePlayback,
    setTransformMode,
    initControls
};

console.log('✅ SNM Editor loaded!');
