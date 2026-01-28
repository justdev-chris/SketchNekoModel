// editor.js - Object creation, tools, animation functions

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
    cube.userData = { type: 'cube', id: Date.now() };
    
    SNM.scene.add(cube);
    SNM.objects.push(cube);
    selectObject(cube);
    updateUI();
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
    sphere.userData = { type: 'sphere', id: Date.now() };
    
    SNM.scene.add(sphere);
    SNM.objects.push(sphere);
    selectObject(sphere);
    updateUI();
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
    cylinder.userData = { type: 'cylinder', id: Date.now() };
    
    SNM.scene.add(cylinder);
    SNM.objects.push(cylinder);
    selectObject(cylinder);
    updateUI();
}

function selectObject(object) {
    // Remove previous highlight
    if (SNM.selectedObject && SNM.selectedObject.userData.boxHelper) {
        SNM.scene.remove(SNM.selectedObject.userData.boxHelper);
    }
    
    SNM.selectedObject = object;
    
    // Add highlight
    const boxHelper = new THREE.BoxHelper(object, 0x00ff00);
    boxHelper.name = 'selection_helper';
    SNM.scene.add(boxHelper);
    object.userData.boxHelper = boxHelper;
    
    updateUI();
}

function deleteSelected() {
    if (!SNM.selectedObject) return;
    
    // Remove from scene
    SNM.scene.remove(SNM.selectedObject);
    if (SNM.selectedObject.userData.boxHelper) {
        SNM.scene.remove(SNM.selectedObject.userData.boxHelper);
    }
    
    // Remove from array
    const index = SNM.objects.indexOf(SNM.selectedObject);
    if (index > -1) {
        SNM.objects.splice(index, 1);
    }
    
    // Remove animations
    SNM.animations = SNM.animations.filter(anim => anim.object !== SNM.selectedObject);
    
    SNM.selectedObject = null;
    updateUI();
}

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
    
    anim.keyframes.push(keyframe);
    anim.keyframes.sort((a, b) => a.time - b.time);
    
    updateUI();
}

function exportGLB() {
    if (!SNM.scene) {
        alert('Scene not ready yet!');
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
    }, { binary: true });
}

function togglePlayback() {
    SNM.isPlaying = !SNM.isPlaying;
    const playBtn = document.getElementById('play');
    playBtn.textContent = SNM.isPlaying ? '⏸ Pause' : '▶ Play';
}

function setCurrentTime(time) {
    SNM.currentTime = time;
    if (!SNM.isPlaying) {
        updateAnimations(time);
    }
}

// Expose functions globally
window.Editor = {
    addCube, addSphere, addCylinder,
    selectObject, deleteSelected,
    addKeyframe, exportGLB,
    togglePlayback, setCurrentTime
};
