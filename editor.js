// editor.js - Object creation, editing, animation, and export functions

const materialPresets = {
    plastic: { color: 0x888888, metalness: 0.1, roughness: 0.8 },
    metal: { color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 },
    glass: { color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.7 },
    rubber: { color: 0x333333, metalness: 0, roughness: 0.9 },
    gold: { color: 0xffd700, metalness: 1, roughness: 0.2 },
    silver: { color: 0xc0c0c0, metalness: 1, roughness: 0.3 }
};

// ========== OBJECT CREATION ==========
function addCube() {
    SNM.saveState();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
        ...materialPresets.plastic,
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set((Math.random() - 0.5) * 8, 0.5, (Math.random() - 0.5) * 8);
    cube.name = `Cube_${SNM.objects.length + 1}`;
    cube.userData = { type: 'cube', id: Date.now() };
    
    SNM.scene.add(cube);
    SNM.objects.push(cube);
    SNM.selectObject(cube);
    updateUI();
}

function addSphere() {
    SNM.saveState();
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        ...materialPresets.rubber,
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set((Math.random() - 0.5) * 8, 0.5, (Math.random() - 0.5) * 8);
    sphere.name = `Sphere_${SNM.objects.length + 1}`;
    sphere.userData = { type: 'sphere', id: Date.now() };
    
    SNM.scene.add(sphere);
    SNM.objects.push(sphere);
    SNM.selectObject(sphere);
    updateUI();
}

function addCylinder() {
    SNM.saveState();
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const material = new THREE.MeshStandardMaterial({ 
        ...materialPresets.metal,
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set((Math.random() - 0.5) * 8, 0.5, (Math.random() - 0.5) * 8);
    cylinder.name = `Cylinder_${SNM.objects.length + 1}`;
    cylinder.userData = { type: 'cylinder', id: Date.now() };
    
    SNM.scene.add(cylinder);
    SNM.objects.push(cylinder);
    SNM.selectObject(cylinder);
    updateUI();
}

function addCone() {
    SNM.saveState();
    const geometry = new THREE.ConeGeometry(0.5, 1, 32);
    const material = new THREE.MeshStandardMaterial({ 
        ...materialPresets.rubber,
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const cone = new THREE.Mesh(geometry, material);
    cone.position.set((Math.random() - 0.5) * 8, 0.5, (Math.random() - 0.5) * 8);
    cone.name = `Cone_${SNM.objects.length + 1}`;
    cone.userData = { type: 'cone', id: Date.now() };
    
    SNM.scene.add(cone);
    SNM.objects.push(cone);
    SNM.selectObject(cone);
    updateUI();
}

function addTorus() {
    SNM.saveState();
    const geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
    const material = new THREE.MeshStandardMaterial({ 
        ...materialPresets.metal,
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.position.set((Math.random() - 0.5) * 8, 0.5, (Math.random() - 0.5) * 8);
    torus.name = `Torus_${SNM.objects.length + 1}`;
    torus.userData = { type: 'torus', id: Date.now() };
    
    SNM.scene.add(torus);
    SNM.objects.push(torus);
    SNM.selectObject(torus);
    updateUI();
}

function addNekoCat() {
    SNM.saveState();
    
    const group = new THREE.Group();
    group.name = `NekoCat_${SNM.objects.length + 1}`;
    
    // Body
    const bodyGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const body = new THREE.Mesh(
        bodyGeometry,
        new THREE.MeshStandardMaterial({ color: 0xff9933, metalness: 0.1, roughness: 0.8 })
    );
    body.scale.set(1.2, 0.8, 0.6);
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xff9933 })
    );
    head.position.set(0, 0.3, 0.5);
    group.add(head);
    
    // Ears
    const earGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
    const earMaterial = new THREE.MeshStandardMaterial({ color: 0xff6633 });
    
    const leftEar = new THREE.Mesh(earGeometry, earMaterial);
    leftEar.position.set(0.2, 0.5, 0.5);
    leftEar.rotation.z = -0.3;
    group.add(leftEar);
    
    const rightEar = new THREE.Mesh(earGeometry, earMaterial);
    rightEar.position.set(-0.2, 0.5, 0.5);
    rightEar.rotation.z = 0.3;
    group.add(rightEar);
    
    // Tail
    const tail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.02, 1, 8),
        new THREE.MeshStandardMaterial({ color: 0xff9933 })
    );
    tail.position.set(0, 0, -0.8);
    tail.rotation.x = Math.PI / 4;
    group.add(tail);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(0.1, 0.35, 0.7);
    group.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(-0.1, 0.35, 0.7);
    group.add(rightEye);
    
    // Nose
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xff6699 })
    );
    nose.position.set(0, 0.25, 0.75);
    group.add(nose);
    
    group.position.set((Math.random() - 0.5) * 8, 0.5, (Math.random() - 0.5) * 8);
    group.userData = { type: 'neko', id: Date.now(), isGroup: true };
    
    SNM.scene.add(group);
    SNM.objects.push(group);
    SNM.selectObject(group);
    updateUI();
}

// ========== OBJECT MANIPULATION ==========
function deleteSelected() {
    if (!SNM.selectedObject) return;
    
    SNM.saveState();
    
    // Remove from scene
    SNM.scene.remove(SNM.selectedObject);
    if (SNM.selectedObject.userData.helper) {
        SNM.scene.remove(SNM.selectedObject.userData.helper);
    }
    
    // Remove from animations
    SNM.animations = SNM.animations.filter(anim => anim.object !== SNM.selectedObject);
    
    // Remove from objects array
    const index = SNM.objects.indexOf(SNM.selectedObject);
    if (index > -1) {
        SNM.objects.splice(index, 1);
    }
    
    SNM.selectedObject = null;
    if (SNM.transformControls) {
        SNM.transformControls.detach();
    }
    
    updateUI();
}

function duplicateSelected() {
    if (!SNM.selectedObject) {
        alert('Select an object to duplicate!');
        return;
    }
    
    SNM.saveState();
    
    const original = SNM.selectedObject;
    let duplicate;
    
    if (original.isGroup) {
        duplicate = original.clone();
        duplicate.traverse(child => {
            if (child.isMesh) {
                child.material = child.material.clone();
            }
        });
    } else {
        duplicate = new THREE.Mesh(
            original.geometry.clone(),
            original.material.clone()
        );
        duplicate.position.copy(original.position).add(new THREE.Vector3(1, 0, 1));
        duplicate.rotation.copy(original.rotation);
        duplicate.scale.copy(original.scale);
        duplicate.name = original.name + '_Copy';
        duplicate.userData = { ...original.userData, id: Date.now() };
    }
    
    SNM.scene.add(duplicate);
    SNM.objects.push(duplicate);
    SNM.selectObject(duplicate);
    updateUI();
}

// ========== MESH EDITING ==========
function extrudeMesh() {
    if (!SNM.selectedObject || !SNM.selectedObject.isMesh) {
        alert('Select a mesh to extrude!');
        return;
    }
    
    SNM.saveState();
    const mesh = SNM.selectedObject;
    
    // Simple extrusion by scaling in Y
    mesh.scale.y *= 1.5;
    mesh.position.y += mesh.scale.y * 0.25;
    
    mesh.userData.modified = true;
    updateUI();
}

function bevelMesh() {
    if (!SNM.selectedObject || !SNM.selectedObject.isMesh) {
        alert('Select a mesh to bevel!');
        return;
    }
    
    SNM.saveState();
    const mesh = SNM.selectedObject;
    
    if (mesh.geometry.type === 'BoxGeometry') {
        const params = mesh.geometry.parameters;
        const newGeometry = new THREE.BoxGeometry(
            params.width,
            params.height,
            params.depth,
            Math.max(2, params.widthSegments * 2),
            Math.max(2, params.heightSegments * 2),
            Math.max(2, params.depthSegments * 2)
        );
        
        mesh.geometry.dispose();
        mesh.geometry = newGeometry;
        mesh.userData.modified = true;
    }
    
    updateUI();
}

function subdivideMesh() {
    if (!SNM.selectedObject || !SNM.selectedObject.isMesh) {
        alert('Select a mesh to subdivide!');
        return;
    }
    
    SNM.saveState();
    const mesh = SNM.selectedObject;
    const geometry = mesh.geometry;
    
    // Convert to BufferGeometry if needed
    if (!geometry.isBufferGeometry) {
        const bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry);
        mesh.geometry.dispose();
        mesh.geometry = bufferGeometry;
    }
    
    // Simple subdivision by averaging vertices
    const positionAttribute = geometry.attributes.position;
    const newPositions = [];
    
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        
        // Add slight random variation for subdivision effect
        newPositions.push(
            x + (Math.random() - 0.5) * 0.1,
            y + (Math.random() - 0.5) * 0.1,
            z + (Math.random() - 0.5) * 0.1
        );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    mesh.userData.modified = true;
    updateUI();
}

// ========== ANIMATION ==========
function addKeyframe() {
    if (!SNM.selectedObject) {
        alert('Select an object to add keyframe!');
        return;
    }
    
    const keyframe = {
        time: SNM.currentTime,
        position: SNM.selectedObject.position.clone(),
        rotation: SNM.selectedObject.rotation.clone(),
        scale: SNM.selectedObject.scale.clone(),
        name: `Keyframe_${SNM.currentTime.toFixed(1)}s`
    };
    
    // Find or create animation for this object
    let anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (!anim) {
        anim = { 
            object: SNM.selectedObject, 
            keyframes: [],
            name: `${SNM.selectedObject.name}_Anim`
        };
        SNM.animations.push(anim);
    }
    
    // Remove existing keyframe at similar time
    anim.keyframes = anim.keyframes.filter(kf => Math.abs(kf.time - SNM.currentTime) > 0.05);
    anim.keyframes.push(keyframe);
    
    // Sort by time
    anim.keyframes.sort((a, b) => a.time - b.time);
    
    updateUI();
}

function deleteKeyframe(time) {
    SNM.animations.forEach(anim => {
        const before = anim.keyframes.length;
        anim.keyframes = anim.keyframes.filter(kf => Math.abs(kf.time - time) > 0.05);
        if (before !== anim.keyframes.length) {
            console.log(`Deleted keyframe at ${time}s`);
        }
    });
    updateUI();
}

function setLooping(loop) {
    // This would control animation looping
    const loopBtn = document.querySelector('[data-tool="loop"]');
    if (loopBtn) {
        loopBtn.classList.toggle('active', loop);
        loopBtn.textContent = loop ? '🔁 Looping' : '🔁 Loop';
    }
}

// ========== EXPORT ==========
function exportGLB() {
    if (!SNM.scene) {
        alert('Scene not ready!');
        return;
    }
    
    const exporter = new THREE.GLTFExporter();
    exporter.parse(SNM.scene, (gltf) => {
        const output = JSON.stringify(gltf, null, 2);
        const blob = new Blob([output], { type: 'model/gltf-binary' });
        downloadFile(blob, 'snm_model.glb');
    }, { binary: true });
}

function exportGLTF() {
    const exporter = new THREE.GLTFExporter();
    exporter.parse(SNM.scene, (gltf) => {
        const output = JSON.stringify(gltf, null, 2);
        const blob = new Blob([output], { type: 'application/json' });
        downloadFile(blob, 'snm_model.gltf');
    });
}

function exportOBJ() {
    const exporter = new THREE.OBJExporter();
    const output = exporter.parse(SNM.scene);
    const blob = new Blob([output], { type: 'text/plain' });
    downloadFile(blob, 'snm_model.obj');
}

function exportSTL() {
    const exporter = new THREE.STLExporter();
    const output = exporter.parse(SNM.scene);
    const blob = new Blob([output], { type: 'application/sla' });
    downloadFile(blob, 'snm_model.stl');
}

function exportJSON() {
    const sceneData = {
        metadata: { version: 1.0, generator: 'SNM Editor' },
        objects: SNM.objects.map(obj => ({
            uuid: obj.uuid,
            name: obj.name,
            type: obj.userData?.type || 'unknown',
            position: obj.position.toArray(),
            rotation: obj.rotation.toArray(),
            scale: obj.scale.toArray(),
            geometry: obj.geometry?.type || 'unknown',
            material: {
                color: obj.material.color.getHex(),
                metalness: obj.material.metalness,
                roughness: obj.material.roughness
            }
        })),
        animations: SNM.animations.map(anim => ({
            object: anim.object.uuid,
            name: anim.name,
            keyframes: anim.keyframes.map(kf => ({
                time: kf.time,
                position: kf.position.toArray(),
                rotation: kf.rotation.toArray(),
                scale: kf.scale.toArray()
            }))
        })),
        camera: {
            position: SNM.camera.position.toArray(),
            rotation: SNM.camera.rotation.toArray()
        }
    };
    
    const output = JSON.stringify(sceneData, null, 2);
    const blob = new Blob([output], { type: 'application/json' });
    downloadFile(blob, 'snm_scene.json');
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert(`✅ Exported: ${filename}`);
}

function importFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.gltf,.glb,.obj,.stl,.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            alert(`Import feature coming soon! Selected: ${file.name}`);
            // TODO: Implement file import
        }
    };
    input.click();
}

// ========== NEKO TOOLS ==========
function togglePawCursor() {
    const isPaw = document.body.style.cursor.includes('paw');
    if (isPaw) {
        document.body.style.cursor = 'default';
    } else {
        document.body.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><circle cx=\"16\" cy=\"16\" r=\"15\" fill=\"%23ff66b2\" opacity=\"0.8\"/><circle cx=\"10\" cy=\"10\" r=\"4\" fill=\"white\"/><circle cx=\"22\" cy=\"10\" r=\"4\" fill=\"white\"/><circle cx=\"10\" cy=\"10\" r=\"2\" fill=\"black\"/><circle cx=\"22\" cy=\"10\" r=\"2\" fill=\"black\"/></svg>') 16 16, auto";
    }
}

function toggleWhiskerGuide() {
    // Find existing whisker guides
    const whiskers = SNM.scene.children.filter(child => 
        child.isLine && child.material?.color?.getHex() === 0xffffff
    );
    
    if (whiskers.length > 0) {
        const visible = whiskers[0].visible;
        whiskers.forEach(w => w.visible = !visible);
        alert(`Whisker guides ${!visible ? 'shown' : 'hidden'}`);
    } else {
        // Create whisker guides
        const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
        
        for (let i = 0; i < 3; i++) {
            const leftWhisker = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(-0.5, 0.5 + i * 0.1, 0),
                    new THREE.Vector3(-2, 0.5 + i * 0.1, 0)
                ]),
                material
            );
            SNM.scene.add(leftWhisker);
            
            const rightWhisker = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0.5, 0.5 + i * 0.1, 0),
                    new THREE.Vector3(2, 0.5 + i * 0.1, 0)
                ]),
                material
            );
            SNM.scene.add(rightWhisker);
        }
        alert('Whisker guides added!');
    }
}

// ========== UTILITIES ==========
function clearScene() {
    if (!confirm('Clear entire scene? This cannot be undone.')) return;
    
    SNM.saveState();
    
    SNM.objects.forEach(obj => {
        SNM.scene.remove(obj);
        if (obj.userData.helper) {
            SNM.scene.remove(obj.userData.helper);
        }
    });
    
    SNM.objects = [];
    SNM.animations = [];
    SNM.selectedObject = null;
    SNM.transformControls.detach();
    
    updateUI();
}

function centerObject() {
    if (!SNM.selectedObject) return;
    
    SNM.selectedObject.position.set(0, 0, 0);
    SNM.selectedObject.rotation.set(0, 0, 0);
    SNM.selectedObject.scale.set(1, 1, 1);
    
    if (SNM.selectedObject.userData.helper) {
        SNM.selectedObject.userData.helper.update();
    }
    
    updateUI();
}

// Expose to global scope
window.Editor = {
    // Object creation
    addCube, addSphere, addCylinder, addCone, addTorus, addNekoCat,
    
    // Object manipulation
    deleteSelected, duplicateSelected,
    
    // Mesh editing
    extrudeMesh, bevelMesh, subdivideMesh,
    
    // Animation
    addKeyframe, deleteKeyframe, setLooping,
    
    // Export/Import
    exportGLB, exportGLTF, exportOBJ, exportSTL, exportJSON, importFile,
    
    // Neko tools
    togglePawCursor, toggleWhiskerGuide,
    
    // Utilities
    clearScene, centerObject
};