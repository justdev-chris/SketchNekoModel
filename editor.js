// editor.js - ALL FUNCTIONS COMPLETE

// Primitive creation
function addCube() {
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
        SNM.selectionBox = box; // Store globally
        
        // Update UI
        updateUI();
    } else {
        // If no object selected, clear UI
        updateUI();
    }
}

// Delete function
function deleteSelected() {
    if (!SNM.selectedObject) return;
    
    // Remove from scene
    SNM.scene.remove(SNM.selectedObject);
    
    // Remove selection box
    if (SNM.selectionBox) {
        SNM.scene.remove(SNM.selectionBox);
        SNM.selectionBox = null;
    }
    
    // Remove from objects array
    const index = SNM.objects.indexOf(SNM.selectedObject);
    if (index > -1) {
        SNM.objects.splice(index, 1);
    }
    
    // Remove from animations
    SNM.animations = SNM.animations.filter(anim => anim.object !== SNM.selectedObject);
    
    // Clear selection
    SNM.selectedObject = null;
    
    // Update UI
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
        rotation: SNM.selectedObject.rotation.clone(),
        scale: SNM.selectedObject.scale.clone()
    };
    
    // Find or create animation for this object
    let anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (!anim) {
        anim = { object: SNM.selectedObject, keyframes: [] };
        SNM.animations.push(anim);
    }
    
    // Add keyframe
    anim.keyframes.push(keyframe);
    
    // Sort by time
    anim.keyframes.sort((a, b) => a.time - b.time);
    
    // Update UI
    updateUI();
}

// Export function
function exportGLB() {
    if (!SNM.scene) {
        alert('Scene not ready!');
        return;
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
        
        alert('Model exported as snm_model.glb');
    }, { binary: true });
}

// Playback control
function togglePlayback() {
    SNM.isPlaying = !SNM.isPlaying;
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.textContent = SNM.isPlaying ? '⏸ Pause' : '▶ Play';
    }
}

// Expose all functions to global scope
window.Editor = {
    addCube,
    addSphere,
    addCylinder,
    selectObject,
    deleteSelected,
    addKeyframe,
    exportGLB,
    togglePlayback
};
