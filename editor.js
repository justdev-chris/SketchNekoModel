// editor.js - Object creation, editing, animation, and export functions

// Store for material presets
const materialPresets = {
    plastic: { color: 0x888888, metalness: 0.1, roughness: 0.8 },
    metal: { color: 0xaaaaaa, metalness: 0.9, roughness: 0.2 },
    glass: { color: 0xffffff, metalness: 0, roughness: 0, transparent: true, opacity: 0.7 },
    rubber: { color: 0x333333, metalness: 0, roughness: 0.9 },
    gold: { color: 0xffd700, metalness: 1, roughness: 0.2 },
    silver: { color: 0xc0c0c0, metalness: 1, roughness: 0.3 }
};

// Primitive creation functions
function addCube() {
    saveState();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ 
        ...materialPresets.plastic,
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set((Math.random() - 0.5) * 5, 0.5, (Math.random() - 0.5) * 5);
    cube.name = `Cube_${SNM.objects.length + 1}`;
    cube.userData = { type: 'cube', id: Date.now(), originalGeometry: geometry.clone() };
    
    SNM.scene.add(cube);
    SNM.objects.push(cube);
    selectObject(cube);
    updateUI();
}

function addSphere() {
    saveState();
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({ 
        ...materialPresets.rubber,
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set((Math.random() - 0.5) * 5, 0.5, (Math.random() - 0.5) * 5);
    sphere.name = `Sphere_${SNM.objects.length + 1}`;
    sphere.userData = { type: 'sphere', id: Date.now(), originalGeometry: geometry.clone() };
    
    SNM.scene.add(sphere);
    SNM.objects.push(sphere);
    selectObject(sphere);
    updateUI();
}

function addCylinder() {
    saveState();
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    const material = new THREE.MeshStandardMaterial({ 
        ...materialPresets.metal,
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.set((Math.random() - 0.5) * 5, 0.5, (Math.random() - 0.5) * 5);
    cylinder.name = `Cylinder_${SNM.objects.length + 1}`;
    cylinder.userData = { type: 'cylinder', id: Date.now(), originalGeometry: geometry.clone() };
    
    SNM.scene.add(cylinder);
    SNM.objects.push(cylinder);
    selectObject(cylinder);
    updateUI();
}

function addCone() {
    saveState();
    const geometry = new THREE.ConeGeometry(0.5, 1, 32);
    const material = new THREE.MeshStandardMaterial({ 
        ...materialPresets.rubber,
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const cone = new THREE.Mesh(geometry, material);
    cone.position.set((Math.random() - 0.5) * 5, 0.5, (Math.random() - 0.5) * 5);
    cone.name = `Cone_${SNM.objects.length + 1}`;
    cone.userData = { type: 'cone', id: Date.now(), originalGeometry: geometry.clone() };
    
    SNM.scene.add(cone);
    SNM.objects.push(cone);
    selectObject(cone);
    updateUI();
}

function addTorus() {
    saveState();
    const geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 100);
    const material = new THREE.MeshStandardMaterial({ 
        ...materialPresets.metal,
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
    });
    const torus = new THREE.Mesh(geometry, material);
    torus.position.set((Math.random() - 0.5) * 5, 0.5, (Math.random() - 0.5) * 5);
    torus.name = `Torus_${SNM.objects.length + 1}`;
    torus.userData = { type: 'torus', id: Date.now(), originalGeometry: geometry.clone() };
    
    SNM.scene.add(torus);
    SNM.objects.push(torus);
    selectObject(torus);
    updateUI();
}

function addPlane() {
    saveState();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        metalness: 0.1,
        roughness: 0.8,
        side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5);
    plane.rotation.x = -Math.PI / 2;
    plane.name = `Plane_${SNM.objects.length + 1}`;
    plane.userData = { type: 'plane', id: Date.now(), originalGeometry: geometry.clone() };
    
    SNM.scene.add(plane);
    SNM.objects.push(plane);
    selectObject(plane);
    updateUI();
}

function addCatModel() {
    saveState();
    
    // Create a simple cat model using primitives
    const group = new THREE.Group();
    group.name = `NekoCat_${SNM.objects.length + 1}`;
    
    // Body (ellipsoid)
    const bodyGeometry = new THREE.SphereGeometry(0.4, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
    const body = new THREE.Mesh(
        bodyGeometry,
        new THREE.MeshStandardMaterial({ color: 0xff9933, metalness: 0.1, roughness: 0.8 })
    );
    body.scale.set(1.2, 0.8, 0.6);
    group.add(body);
    
    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xff9933, metalness: 0.1, roughness: 0.8 })
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
    
    // Whiskers (guide lines)
    const whiskerMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    
    for (let i = 0; i < 3; i++) {
        const leftWhisker = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0.15, 0.3, 0.65),
                new THREE.Vector3(0.4, 0.3 + i * 0.05, 0.65)
            ]),
            whiskerMaterial
        );
        group.add(leftWhisker);
        
        const rightWhisker = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-0.15, 0.3, 0.65),
                new THREE.Vector3(-0.4, 0.3 + i * 0.05, 0.65)
            ]),
            whiskerMaterial
        );
        group.add(rightWhisker);
    }
    
    group.position.set((Math.random() - 0.5) * 5, 0.5, (Math.random() - 0.5) * 5);
    group.userData = { type: 'cat', id: Date.now(), isGroup: true };
    
    SNM.scene.add(group);
    SNM.objects.push(group);
    selectObject(group);
    updateUI();
}

function selectObject(object) {
    // Remove previous selection highlight
    if (SNM.selectedObject && SNM.selectedObject.userData.selectionHelper) {
        SNM.scene.remove(SNM.selectedObject.userData.selectionHelper);
    }
    
    SNM.selectedObject = object;
    
    // Add selection highlight
    if (object) {
        const helper = new THREE.BoxHelper(object, 0x00ff00);
        helper.name = 'selection_helper';
        SNM.scene.add(helper);
        object.userData.selectionHelper = helper;
        
        // Attach transform controls
        if (SNM.transformControls) {
            SNM.transformControls.attach(object);
        }
        
        // Update coordinates
        SNM.updateCoordinates(object.position);
    } else if (SNM.transformControls) {
        SNM.transformControls.detach();
    }
    
    updateUI();
}

function deleteSelected() {
    if (!SNM.selectedObject) return;
    
    saveState();
    
    // Remove from scene
    SNM.scene.remove(SNM.selectedObject);
    if (SNM.selectedObject.userData.selectionHelper) {
        SNM.scene.remove(SNM.selectedObject.userData.selectionHelper);
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
    if (!SNM.selectedObject) return;
    
    saveState();
    
    const original = SNM.selectedObject;
    let duplicate;
    
    if (original.isGroup) {
        // For groups, clone the entire group
        duplicate = original.clone();
        duplicate.traverse(child => {
            if (child.isMesh) {
                child.material = child.material.clone();
            }
        });
    } else {
        // For single meshes
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
    selectObject(duplicate);
    updateUI();
}

// Mesh Editing Functions
function extrudeMesh() {
    if (!SNM.selectedObject || !SNM.selectedObject.isMesh) {
        alert('Select a mesh to extrude!');
        return;
    }
    
    saveState();
    
    const mesh = SNM.selectedObject;
    const geometry = mesh.geometry;
    
    // Simple extrusion by scaling
    mesh.scale.y *= 1.2;
    mesh.position.y += mesh.geometry.parameters?.height ? mesh.geometry.parameters.height * 0.1 : 0.1;
    
    // Mark as modified
    mesh.userData.modified = true;
    
    updateUI();
}

function bevelMesh() {
    if (!SNM.selectedObject || !SNM.selectedObject.isMesh) {
        alert('Select a mesh to bevel!');
        return;
    }
    
    saveState();
    
    const mesh = SNM.selectedObject;
    
    // Simple bevel by rounding edges (simplified)
    if (mesh.geometry.type === 'BoxGeometry') {
        const newGeometry = new THREE.BoxGeometry(
            mesh.geometry.parameters.width,
            mesh.geometry.parameters.height,
            mesh.geometry.parameters.depth,
            2, 2, 2  // More segments for smoother edges
        );
        mesh.geometry.dispose();
        mesh.geometry = newGeometry;
    }
    
    mesh.userData.modified = true;
    updateUI();
}

function subdivideMesh() {
    if (!SNM.selectedObject || !SNM.selectedObject.isMesh) {
        alert('Select a mesh to subdivide!');
        return;
    }
    
    saveState();
    
    const mesh = SNM.selectedObject;
    const geometry = mesh.geometry;
    
    // Simple subdivision by increasing segments
    if (geometry.type === 'BoxGeometry') {
        const params = geometry.parameters;
        const newGeometry = new THREE.BoxGeometry(
            params.width, params.height, params.depth,
            params.widthSegments * 2, params.heightSegments * 2, params.depthSegments * 2
        );
        geometry.dispose();
        mesh.geometry = newGeometry;
    } else if (geometry.type === 'SphereGeometry') {
        const params = geometry.parameters;
        const newGeometry = new THREE.SphereGeometry(
            params.radius,
            params.widthSegments * 2,
            params.heightSegments * 2
        );
        geometry.dispose();
        mesh.geometry = newGeometry;
    }
    
    mesh.userData.modified = true;
    updateUI();
}

function mergeMeshes() {
    if (SNM.objects.length < 2) {
        alert('Need at least 2 objects to merge!');
        return;
    }
    
    saveState();
    
    // Simple merge: just group selected objects
    const group = new THREE.Group();
    group.name = 'Merged_Object';
    
    // Add all objects to group
    SNM.objects.forEach(obj => {
        if (obj !== SNM.selectedObject) {
            group.add(obj.clone());
        }
    });
    
    // Add the group to scene
    SNM.scene.add(group);
    SNM.objects.push(group);
    selectObject(group);
    
    updateUI();
}

// Animation Functions
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
    
    // Remove existing keyframe at this time (if any)
    anim.keyframes = anim.keyframes.filter(kf => Math.abs(kf.time - SNM.currentTime) > 0.1);
    anim.keyframes.push(keyframe);
    
    // Sort by time
    anim.keyframes.sort((a, b) => a.time - b.time);
    
    updateUI();
}

function deleteKeyframe(time) {
    SNM.animations.forEach(anim => {
        anim.keyframes = anim.keyframes.filter(kf => Math.abs(kf.time - time) > 0.1);
    });
    updateUI();
}

function setLooping(loop) {
    // Loop toggle
    const loopBtn = document.querySelector('[data-tool="loop"]');
    if (loopBtn) {
        loopBtn.classList.toggle('active', loop);
        loopBtn.textContent = loop ? '🔁 Looping' : '🔁 Loop';
    }
}

// Export Functions
function exportGLTF() {
    exportModel('gltf');
}

function exportGLB() {
    exportModel('glb');
}

function exportOBJ() {
    exportModel('obj');
}

function exportSTL() {
    exportModel('stl');
}

function exportJSON() {
    exportModel('json');
}

function exportModel(format) {
    if (!SNM.scene) {
        alert('Scene not ready!');
        return;
    }
    
    let exporter, output, blob, extension;
    
    switch(format) {
        case 'gltf':
        case 'glb':
            exporter = new THREE.GLTFExporter();
            exporter.parse(SNM.scene, (result) => {
                output = JSON.stringify(result, null, 2);
                blob = new Blob([output], { type: 'model/gltf+json' });
                extension = format === 'glb' ? 'glb' : 'gltf';
                downloadFile(blob, `snm_model.${extension}`);
            });
            break;
            
        case 'obj':
            exporter = new THREE.OBJExporter();
            output = exporter.parse(SNM.scene);
            blob = new Blob([output], { type: 'text/plain' });
            downloadFile(blob, 'snm_model.obj');
            break;
            
        case 'stl':
            exporter = new THREE.STLExporter();
            output = exporter.parse(SNM.scene);
            blob = new Blob([output], { type: 'application/sla' });
            downloadFile(blob, 'snm_model.stl');
            break;
            
        case 'json':
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
                }))
            };
            output = JSON.stringify(sceneData, null, 2);
            blob = new Blob([output], { type: 'application/json' });
            downloadFile(blob, 'snm_scene.json');
            break;
    }
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
    
    alert(`Exported: ${filename}`);
}

// Import (placeholder - would need file input)
function importModel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.gltf,.glb,.obj,.stl,.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            alert(`Importing: ${file.name}\n(Import feature needs more implementation)`);
            // TODO: Implement file reading and parsing
        }
    };
    input.click();
}

// Neko Tools
function togglePawCursor() {
    document.body.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 32 32\"><circle cx=\"16\" cy=\"16\" r=\"15\" fill=\"%23ff66b2\" opacity=\"0.8\"/><circle cx=\"10\" cy=\"10\" r=\"4\" fill=\"white\"/><circle cx=\"22\" cy=\"10\" r=\"4\" fill=\"white\"/><circle cx=\"10\" cy=\"10\" r=\"2\" fill=\"black\"/><circle cx=\"22\" cy=\"10\" r=\"2\" fill=\"black\"/></svg>'), auto";
}

function toggleWhiskerGuide() {
    // Toggle visibility of whisker guides
    const whiskers = SNM.scene.children.filter(child => 
        child.isLine && child.material.opacity === 0.5
    );
    
    if (whiskers.length > 0) {
        const visible = whiskers[0].visible;
        whiskers.forEach(w => w.visible = !visible);
        alert(`Whisker guides ${!visible ? 'shown' : 'hidden'}`);
    } else {
        alert('No whisker guides in scene');
    }
}

// Expose functions globally
window.Editor = {
    // Primitive creation
    addCube, addSphere, addCylinder, addCone, addTorus, addPlane, addCatModel,
    
    // Object manipulation
    selectObject, deleteSelected, duplicateSelected,
    
    // Mesh editing
    extrudeMesh, bevelMesh, subdivideMesh, mergeMeshes,
    
    // Animation
    addKeyframe, deleteKeyframe, setLooping,
    
    // Export/Import
    exportGLTF, exportGLB, exportOBJ, exportSTL, exportJSON, importModel,
    
    // Neko tools
    togglePawCursor, toggleWhiskerGuide,
    
    // Utilities
    saveState
};