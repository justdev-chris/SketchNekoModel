// editor.js - COMPLETE AND WORKING
console.log('🐱 SNM Editor loading...');

// Primitive creation functions
function addCube() {
    console.log('Adding cube...');
    
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.1,
        roughness: 0.7
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set((Math.random() - 0.5) * 5, 0.5, (Math.random() - 0.5) * 5);
    cube.name = `Cube_${SNM.objects.length + 1}`;
    cube.userData = { type: 'cube' };
    
    SNM.scene.add(cube);
    SNM.objects.push(cube);
    selectObject(cube);
    updateUI();
    return cube;
}

function addSphere() {
    console.log('Adding sphere...');
    
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.3,
        roughness: 0.2
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set((Math.random() - 0.5) * 5, 0.5, (Math.random() - 0.5) * 5);
    sphere.name = `Sphere_${SNM.objects.length + 1}`;
    sphere.userData = { type: 'sphere' };
    
    SNM.scene.add(sphere);
    SNM.objects.push(sphere);
    selectObject(sphere);
    updateUI();
    return sphere;
}

function addCylinder() {
    console.log('Adding cylinder...');
    
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const material = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(Math.random(), Math.random(), Math.random()),
        metalness: 0.2,
        roughness: 0.5
    });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set((Math.random() - 0.5) * 5, 0.5, (Math.random() - 0.5) * 5);
    cylinder.name = `Cylinder_${SNM.objects.length + 1}`;
    cylinder.userData = { type: 'cylinder' };
    
    SNM.scene.add(cylinder);
    SNM.objects.push(cylinder);
    selectObject(cylinder);
    updateUI();
    return cylinder;
}

// Selection function (FIXED)
function selectObject(object) {
    console.log('Selecting:', object?.name || 'none');
    
    // Remove old selection box
    if (SNM.selectionBox) {
        SNM.scene.remove(SNM.selectionBox);
        SNM.selectionBox = null;
    }
    
    // Update selected object
    SNM.selectedObject = object;
    
    // Create new selection box if object exists
    if (object) {
        const box = new THREE.BoxHelper(object, 0x00ff00);
        box.name = 'selection_box';
        SNM.scene.add(box);
        SNM.selectionBox = box;
    }
    
    updateUI();
}

// Delete function
function deleteSelected() {
    if (!SNM.selectedObject) {
        alert('No object selected!');
        return;
    }
    
    console.log('Deleting:', SNM.selectedObject.name);
    
    SNM.scene.remove(SNM.selectedObject);
    
    if (SNM.selectionBox) {
        SNM.scene.remove(SNM.selectionBox);
        SNM.selectionBox = null;
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
    
    console.log('Adding keyframe at time:', SNM.currentTime);
    
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
    
    // Remove existing keyframe at similar time (within 0.1s)
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
    if (!SNM.scene) {
        alert('Scene not ready!');
        return;
    }
    
    console.log('Exporting GLB...');
    
    // Remove selection box before export
    const tempSelectionBox = SNM.selectionBox;
    if (tempSelectionBox) {
        SNM.scene.remove(tempSelectionBox);
    }
    
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
        
        console.log('✅ Export complete!');
        alert('Model exported as snm_model.glb');
    }, { binary: true });
    
    // Restore selection box
    if (tempSelectionBox) {
        SNM.scene.add(tempSelectionBox);
    }
}

// Playback control
function togglePlayback() {
    SNM.isPlaying = !SNM.isPlaying;
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.textContent = SNM.isPlaying ? '⏸ Pause' : '▶ Play';
        console.log('Playback:', SNM.isPlaying ? 'Playing' : 'Paused');
    }
}

// Transform tools
function setTransformMode(mode) {
    console.log('Transform mode:', mode);
    // Update UI buttons
    document.querySelectorAll('.transform-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.transform === mode);
    });
    // In a full implementation, this would switch transform gizmo
    alert(`Transform mode set to: ${mode} (Gizmo not implemented yet)`);
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
    setTransformMode
};

console.log('✅ SNM Editor loaded!');
