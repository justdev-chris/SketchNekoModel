// ui.js - UI updates, event listeners, and interface management

function updateUI() {
    updateObjectList();
    updateProperties();
    updateTimeline();
    updateStats();
}

function updateObjectList() {
    const list = document.getElementById('object-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    SNM.objects.forEach((obj, index) => {
        const item = document.createElement('div');
        item.className = 'object-item';
        if (obj === SNM.selectedObject) {
            item.classList.add('selected');
        }
        
        // Object icon based on type
        const icon = document.createElement('div');
        icon.className = 'object-icon';
        icon.style.background = obj.userData?.type === 'cat' ? '#ff66b2' : 
                               obj.isGroup ? '#9966ff' : '#66aaff';
        
        // Object name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = obj.name;
        
        // Visibility toggle
        const eyeBtn = document.createElement('button');
        eyeBtn.className = 'eye-btn';
        eyeBtn.textContent = obj.visible ? '👁️' : '👁️‍🗨️';
        eyeBtn.style.background = 'none';
        eyeBtn.style.border = 'none';
        eyeBtn.style.cursor = 'pointer';
        eyeBtn.style.fontSize = '16px';
        eyeBtn.onclick = (e) => {
            e.stopPropagation();
            obj.visible = !obj.visible;
            updateUI();
        };
        
        item.appendChild(icon);
        item.appendChild(nameSpan);
        item.appendChild(eyeBtn);
        
        item.onclick = () => Editor.selectObject(obj);
        list.appendChild(item);
    });
}

function updateProperties() {
    const props = document.getElementById('properties');
    const materialProps = document.getElementById('material-props');
    if (!props || !materialProps) return;
    
    props.innerHTML = '';
    materialProps.innerHTML = '';
    
    if (!SNM.selectedObject) {
        props.innerHTML = '<p style="color: #aaa; text-align: center;">Select an object</p>';
        return;
    }
    
    const obj = SNM.selectedObject;
    
    // Transform Properties
    const transformGroup = document.createElement('div');
    transformGroup.className = 'property-group';
    transformGroup.innerHTML = '<h4>Transform</h4>';
    
    // Position
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        
        const label = document.createElement('label');
        label.textContent = `Pos ${axis}:`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.value = obj.position.getComponent(idx).toFixed(2);
        input.onchange = (e) => {
            obj.position.setComponent(idx, parseFloat(e.target.value) || 0);
            if (obj.userData.selectionHelper) {
                obj.userData.selectionHelper.update();
            }
            SNM.updateCoordinates(obj.position);
        };
        
        row.appendChild(label);
        row.appendChild(input);
        transformGroup.appendChild(row);
    });
    
    // Rotation
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        
        const label = document.createElement('label');
        label.textContent = `Rot ${axis}:`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.value = (obj.rotation.getComponent(idx) * (180 / Math.PI)).toFixed(1);
        input.onchange = (e) => {
            obj.rotation.setComponent(idx, (parseFloat(e.target.value) || 0) * (Math.PI / 180));
            if (obj.userData.selectionHelper) {
                obj.userData.selectionHelper.update();
            }
        };
        
        row.appendChild(label);
        row.appendChild(input);
        transformGroup.appendChild(row);
    });
    
    // Scale
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        
        const label = document.createElement('label');
        label.textContent = `Scale ${axis}:`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.min = '0.1';
        input.value = obj.scale.getComponent(idx).toFixed(2);
        input.onchange = (e) => {
            const val = parseFloat(e.target.value) || 1;
            obj.scale.setComponent(idx, val);
            if (obj.userData.selectionHelper) {
                obj.userData.selectionHelper.update();
            }
        };
        
        row.appendChild(label);
        row.appendChild(input);
        transformGroup.appendChild(row);
    });
    
    props.appendChild(transformGroup);
    
    // Material Properties (if it's a mesh)
    if (obj.isMesh) {
        const materialGroup = document.createElement('div');
        materialGroup.className = 'property-group';
        materialGroup.innerHTML = '<h4>Material</h4>';
        
        // Color picker
        const colorRow = document.createElement('div');
        colorRow.className = 'property-row';
        colorRow.innerHTML = '<label>Color:</label>';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = '#' + obj.material.color.getHexString();
        colorInput.style.width = '60px';
        colorInput.onchange = (e) => {
            obj.material.color.set(e.target.value);
        };
        colorRow.appendChild(colorInput);
        materialGroup.appendChild(colorRow);
        
        // Metalness
        const metalRow = document.createElement('div');
        metalRow.className = 'property-row';
        metalRow.innerHTML = '<label>Metalness:</label>';
        
        const metalInput = document.createElement('input');
        metalInput.type = 'range';
        metalInput.min = '0';
        metalInput.max = '1';
        metalInput.step = '0.1';
        metalInput.value = obj.material.metalness;
        metalInput.onchange = (e) => {
            obj.material.metalness = parseFloat(e.target.value);
        };
        metalRow.appendChild(metalInput);
        materialGroup.appendChild(metalRow);
        
        // Roughness
        const roughRow = document.createElement('div');
        roughRow.className = 'property-row';
        roughRow.innerHTML = '<label>Roughness:</label>';
        
        const roughInput = document.createElement('input');
        roughInput.type = 'range';
        roughInput.min = '0';
        roughInput.max = '1';
        roughInput.step = '0.1';
        roughInput.value = obj.material.roughness;
        roughInput.onchange = (e) => {
            obj.material.roughness = parseFloat(e.target.value);
        };
        roughRow.appendChild(roughInput);
        materialGroup.appendChild(roughRow);
        
        materialProps.appendChild(materialGroup);
        
        // Material Presets
        const presetGroup = document.createElement('div');
        presetGroup.className = 'property-group';
        presetGroup.innerHTML = '<h4>Presets</h4>';
        
        const presets = ['plastic', 'metal', 'rubber', 'glass', 'gold', 'silver'];
        presets.forEach(preset => {
            const btn = document.createElement('button');
            btn.className = 'tool-btn';
            btn.textContent = preset.charAt(0).toUpperCase() + preset.slice(1);
            btn.style.margin = '2px';
            btn.style.padding = '5px';
            btn.onclick = () => {
                const presetData = Editor.materialPresets[preset];
                obj.material.color.set(presetData.color);
                obj.material.metalness = presetData.metalness;
                obj.material.roughness = presetData.roughness;
                if (presetData.transparent) {
                    obj.material.transparent = true;
                    obj.material.opacity = presetData.opacity;
                }
                updateProperties();
            };
            presetGroup.appendChild(btn);
        });
        
        materialProps.appendChild(presetGroup);
    }
}

function updateTimeline() {
    const container = document.getElementById('keyframes-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Set container width based on max time
    container.style.width = `${SNM.maxTime * 100}px`;
    
    // Draw time markers
    for (let i = 0; i <= SNM.maxTime; i++) {
        const marker = document.createElement('div');
        marker.style.position = 'absolute';
        marker.style.left = `${i * 100}px`;
        marker.style.width = '1px';
        marker.style.height = i % 1 === 0 ? '20px' : '10px';
        marker.style.background = i % 1 === 0 ? '#666' : '#444';
        marker.style.top = '40px';
        container.appendChild(marker);
        
        if (i % 1 === 0) {
            const label = document.createElement('div');
            label.textContent = `${i}s`;
            label.style.position = 'absolute';
            label.style.left = `${i * 100 + 2}px`;
            label.style.top = '20px';
            label.style.color = '#888';
            label.style.fontSize = '10px';
            container.appendChild(label);
        }
    }
    
    // Draw keyframes
    SNM.animations.forEach(anim => {
        anim.keyframes.forEach(kf => {
            const keyframe = document.createElement('div');
            keyframe.className = 'keyframe';
            keyframe.style.left = `${kf.time * 100}px`;
            keyframe.title = `${anim.object?.name || 'Object'} - ${kf.time.toFixed(1)}s`;
            
            keyframe.onclick = (e) => {
                e.stopPropagation();
                // Select this keyframe
                document.querySelectorAll('.keyframe').forEach(k => k.classList.remove('selected'));
                keyframe.classList.add('selected');
                
                // Jump to this time
                SNM.setCurrentTime(kf.time);
                if (anim.object) {
                    Editor.selectObject(anim.object);
                    anim.object.position.copy(kf.position);
                    anim.object.rotation.copy(kf.rotation);
                    anim.object.scale.copy(kf.scale);
                }
            };
            
            keyframe.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm('Delete this keyframe?')) {
                    Editor.deleteKeyframe(kf.time);
                }
            };
            
            container.appendChild(keyframe);
        });
    });
    
    // Update playhead
    SNM.updateTimelineUI();
}

function updateStats() {
    const status = document.getElementById('status');
    if (status) {
        const stats = SNM.getSceneStats();
        status.textContent = `Ready | Objects: ${SNM.objects.length} | Vertices: ${stats.vertices} | Faces: ${stats.faces}`;
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Toolbar buttons
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = e.target.dataset.tool;
            console.log('Tool clicked:', tool);
            
            switch(tool) {
                // Creation
                case 'add-cube': Editor.addCube(); break;
                case 'add-sphere': Editor.addSphere(); break;
                case 'add-cylinder': Editor.addCylinder(); break;
                case 'add-cone': Editor.addCone(); break;
                case 'add-torus': Editor.addTorus(); break;
                case 'add-plane': Editor.addPlane(); break;
                case 'cat-model': Editor.addCatModel(); break;
                
                // Editing
                case 'extrude': Editor.extrudeMesh(); break;
                case 'bevel': Editor.bevelMesh(); break;
                case 'subdivide': Editor.subdivideMesh(); break;
                case 'merge': Editor.mergeMeshes(); break;
                
                // Animation
                case 'add-keyframe': Editor.addKeyframe(); break;
                case 'loop': Editor.setLooping(true); break;
                
                // File
                case 'new-scene': 
                    if (confirm('Start new scene? Unsaved changes will be lost.')) {
                        location.reload();
                    }
                    break;
                case 'import': Editor.importModel(); break;
                case 'export': exportGLB(); break;
                
                // Object manipulation
                case 'undo': SNM.undo(); break;
                case 'redo': SNM.redo(); break;
                case 'duplicate': Editor.duplicateSelected(); break;
                case 'delete': Editor.deleteSelected(); break;
            }
        });
    });
    
    // Export dropdown
    document.querySelectorAll('[data-export]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const format = e.target.dataset.export;
            switch(format) {
                case 'gltf': Editor.exportGLTF(); break;
                case 'glb': Editor.exportGLB(); break;
                case 'obj': Editor.exportOBJ(); break;
                case 'stl': Editor.exportSTL(); break;
                case 'json': Editor.exportJSON(); break;
            }
        });
    });
    
    // Transform mode buttons
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            SNM.setTransformMode(mode);
        });
    });
    
    // Neko tools
    document.querySelectorAll('.neko-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = e.target.dataset.tool;
            switch(tool) {
                case 'paw-cursor': Editor.togglePawCursor(); break;
                case 'whisker-guide': Editor.toggleWhiskerGuide(); break;
                case 'cat-model': Editor.addCatModel(); break;
            }
        });
    });
    
    // Timeline controls
    const timeSlider = document.getElementById('time-slider');
    if (timeSlider) {
        timeSlider.addEventListener('input', (e) => {
            const time = (parseFloat(e.target.value) / 100) * SNM.maxTime;
            SNM.setCurrentTime(time);
        });
        
        timeSlider.addEventListener('change', (e) => {
            const time = (parseFloat(e.target.value) / 100) * SNM.maxTime;
            SNM.setCurrentTime(time);
        });
    }
    
    // Play/Pause buttons
    const playButtons = ['play-btn', 'play-pause'];
    playButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => SNM.togglePlayback());
        }
    });
    
    // Time navigation
    document.getElementById('goto-start')?.addEventListener('click', () => SNM.setCurrentTime(0));
    document.getElementById('goto-end')?.addEventListener('click', () => SNM.setCurrentTime(SNM.maxTime));
    document.getElementById('prev-frame')?.addEventListener('click', () => {
        SNM.setCurrentTime(SNM.currentTime - (1 / SNM.fps));
    });
    document.getElementById('next-frame')?.addEventListener('click', () => {
        SNM.setCurrentTime(SNM.currentTime + (1 / SNM.fps));
    });
    
    // FPS input
    const fpsInput = document.getElementById('fps');
    if (fpsInput) {
        fpsInput.addEventListener('change', (e) => {
            SNM.fps = parseInt(e.target.value) || 24;
        });
    }
    
    // Viewport click for object selection
    const viewport = document.getElementById('viewport');
    if (viewport) {
        // Basic raycasting for object selection
        viewport.addEventListener('click', (e) => {
            // Don't select if clicking on UI elements
            if (e.target !== viewport) return;
            
            // Raycast to find clicked object
            const rect = viewport.getBoundingClientRect();
            const mouse = new THREE.Vector2();
            
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, SNM.camera);
            
            // Filter to only selectable objects (not helpers, lights, etc.)
            const selectableObjects = SNM.objects.filter(obj => 
                obj.isMesh || obj.isGroup
            );
            
            const intersects = raycaster.intersectObjects(selectableObjects, true);
            
            if (intersects.length > 0) {
                // Find the top-most object (not a child of another selected object)
                let clickedObject = intersects[0].object;
                
                // Traverse up to find the main object
                while (clickedObject.parent && clickedObject.parent !== SNM.scene) {
                    clickedObject = clickedObject.parent;
                }
                
                Editor.selectObject(clickedObject);
            } else {
                // Clicked empty space - deselect
                Editor.selectObject(null);
            }
        });
        
        // Mouse move for coordinates
        viewport.addEventListener('mousemove', (e) => {
            const rect = viewport.getBoundingClientRect();
            const mouse = new THREE.Vector2();
            
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, SNM.camera);
            
            // Create a plane at y=0 for ground intersection
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersectionPoint = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, intersectionPoint);
            
            SNM.updateCoordinates(intersectionPoint);
        });
    }
    
    // Timeline track click for time scrubbing
    const timelineTrack = document.getElementById('timeline-track');
    if (timelineTrack) {
        timelineTrack.addEventListener('click', (e) => {
            const rect = timelineTrack.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const time = (x / rect.width) * SNM.maxTime;
            SNM.setCurrentTime(time);
        });
    }
    
    // Keyboard shortcuts help
    window.addEventListener('keydown', (e) => {
        if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
            e.preventDefault();
            alert(`Keyboard Shortcuts:
G - Move tool
R - Rotate tool
S - Scale tool
Q - Toggle world/local space
Delete - Delete selected
Ctrl+D - Duplicate
Ctrl+Z - Undo
Ctrl+Shift+Z - Redo
Space - Play/Pause animation
Click + Drag - Orbit camera
Right click + Drag - Pan camera
Scroll - Zoom`);
        }
    });
    
    console.log('✅ Event listeners set up!');
}

// Initialize everything
window.onload = () => {
    console.log('🐱 SNM Editor Loading...');
    
    // Initialize core
    SNM.init();
    
    // Setup UI
    setupEventListeners();
    updateUI();
    
    // Add a default cube to start with
    setTimeout(() => {
        Editor.addCube();
        console.log('✅ SNM Editor Loaded!');
    }, 500);
};

// Expose UI functions
window.UI = { 
    updateUI, updateObjectList, updateProperties, 
    updateTimeline, updateStats, setupEventListeners 
};