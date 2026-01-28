// editor.js - COMPLETE WITH TRANSFORM GIZMO
console.log('SNM Editor loading...');

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
    cube.userData = { type: 'cube' };
    
    SNM.scene.add(cube);
    SNM.objects.push(cube);
    selectObject(cube);
    updateUI();
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
    sphere.userData = { type: 'sphere' };
    
    SNM.scene.add(sphere);
    SNM.objects.push(sphere);
    selectObject(sphere);
    updateUI();
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
    cylinder.userData = { type: 'cylinder' };
    
    SNM.scene.add(cylinder);
    SNM.objects.push(cylinder);
    selectObject(cylinder);
    updateUI();
}

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
        const info = document.getElementById('gizmo-info');
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
    if (!SNM.selectedObject) return;
    
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
    
    SNM.animations = SNM.animations.filter(anim => anim.object !== SNM.selectedObject);
    updateUI();
    if (window.UI && window.UI.updateKeyframes) {
        window.UI.updateKeyframes();
    }
}

function exportGLB() {
    if (!SNM.scene) return;
    
    // Remove helpers
    const helpers = [];
    SNM.scene.children.forEach(child => {
        if (child.name === 'selection_box' || child.type === 'TransformControls') {
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

function togglePlayback() {
    SNM.isPlaying = !SNM.isPlaying;
    const btn = document.getElementById('play-btn') || document.getElementById('play-pause');
    if (btn) {
        btn.textContent = SNM.isPlaying ? '⏸ Pause' : '▶ Play';
    }
}

// Keyboard shortcuts
function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
        if (!SNM.selectedObject || e.target.tagName === 'INPUT') return;
        
        const obj = SNM.selectedObject;
        const move = e.shiftKey ? 0.5 : 0.1;
        
        switch(e.key.toLowerCase()) {
            case 'arrowup': e.preventDefault(); obj.position.z -= move; break;
            case 'arrowdown': e.preventDefault(); obj.position.z += move; break;
            case 'arrowleft': e.preventDefault(); obj.position.x -= move; break;
            case 'arrowright': e.preventDefault(); obj.position.x += move; break;
            case 'pageup': e.preventDefault(); obj.position.y += move; break;
            case 'pagedown': e.preventDefault(); obj.position.y -= move; break;
            case 'q': e.preventDefault(); obj.rotation.y -= 0.1; break;
            case 'e': e.preventDefault(); obj.rotation.y += 0.1; break;
            case 'z': e.preventDefault(); obj.scale.multiplyScalar(0.9); break;
            case 'x': e.preventDefault(); obj.scale.multiplyScalar(1.1); break;
            case 'g': e.preventDefault(); setTransformMode('translate'); break;
            case 'r': e.preventDefault(); setTransformMode('rotate'); break;
            case 's': e.preventDefault(); setTransformMode('scale'); break;
            case ' ': e.preventDefault(); togglePlayback(); break;
        }
        
        if (SNM.selectionBox) SNM.selectionBox.update();
        updateUI();
    });
}

window.Editor = {
    addCube, addSphere, addCylinder,
    selectObject, deleteSelected,
    addKeyframe, clearKeyframes,
    exportGLB, togglePlayback,
    setTransformMode, setupKeyboardControls
};
