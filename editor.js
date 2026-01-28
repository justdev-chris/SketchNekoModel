// editor.js - WITH TRANSFORM GIZMO INTEGRATION
console.log('SNM Editor loading...');

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
}

function selectObject(object) {
    // Remove old selection box
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
        
        // ATTACH TRANSFORM CONTROLS (GIZMO)
        if (SNM.transformControls) {
            SNM.transformControls.attach(object);
        }
    } else if (SNM.transformControls) {
        // Detach gizmo if no object selected
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
        
        // Update gizmo info
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
    if (index > -1) {
        SNM.objects.splice(index, 1);
    }
    
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
    if (!SNM.scene) return;
    
    // Remove helpers before export
    const tempHelpers = [];
    SNM.scene.children.forEach(child => {
        if (child.name === 'selection_box' || child.type === 'TransformControls') {
            tempHelpers.push(child);
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
        
        alert('Model exported as snm_model.glb');
    }, { binary: true });
    
    // Restore helpers
    tempHelpers.forEach(helper => SNM.scene.add(helper));
}

function togglePlayback() {
    SNM.isPlaying = !SNM.isPlaying;
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.textContent = SNM.isPlaying ? '⏸ Pause' : '▶ Play';
    }
}

// Arrow key controls for precise movement
function setupKeyboardControls() {
    window.addEventListener('keydown', (e) => {
        if (!SNM.selectedObject) return;
        
        const obj = SNM.selectedObject;
        const moveSpeed = e.shiftKey ? 0.5 : 0.1;
        const rotateSpeed = 0.1;
        const scaleSpeed = 0.1;
        
        // Movement
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            obj.position.z -= moveSpeed;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            obj.position.z += moveSpeed;
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            obj.position.x -= moveSpeed;
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            obj.position.x += moveSpeed;
        } else if (e.key === 'PageUp') {
            e.preventDefault();
            obj.position.y += moveSpeed;
        } else if (e.key === 'PageDown') {
            e.preventDefault();
            obj.position.y -= moveSpeed;
        }
        
        // Rotation
        else if (e.key === 'q') {
            e.preventDefault();
            obj.rotation.y -= rotateSpeed;
        } else if (e.key === 'e') {
            e.preventDefault();
            obj.rotation.y += rotateSpeed;
        }
        
        // Scale
        else if (e.key === 'z') {
            e.preventDefault();
            obj.scale.multiplyScalar(1 - scaleSpeed);
        } else if (e.key === 'x') {
            e.preventDefault();
            obj.scale.multiplyScalar(1 + scaleSpeed);
        }
        
        // Update selection box
        if (SNM.selectionBox) {
            SNM.selectionBox.update();
        }
        
        updateUI();
    });
}

window.Editor = {
    addCube,
    addSphere,
    addCylinder,
    selectObject,
    deleteSelected,
    addKeyframe,
    exportGLB,
    togglePlayback,
    setTransformMode,
    setupKeyboardControls
};