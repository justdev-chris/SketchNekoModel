// ui.js - User interface, event handling, and UI updates

// ========== UI UPDATES ==========
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
    
    SNM.objects.forEach(obj => {
        const item = document.createElement('div');
        item.className = 'object-item';
        
        if (obj === SNM.selectedObject) {
            item.classList.add('selected');
        }
        
        // Icon based on object type
        const icon = document.createElement('div');
        icon.className = 'object-icon';
        
        let color = '#66aaff';
        let symbol = '◻';
        
        switch(obj.userData?.type) {
            case 'cube': color = '#66aaff'; symbol = '◻'; break;
            case 'sphere': color = '#ff6666'; symbol = '●'; break;
            case 'cylinder': color = '#66ff66'; symbol = '⬭'; break;
            case 'cone': color = '#ffff66'; symbol = '△'; break;
            case 'torus': color = '#ff66ff'; symbol = '⭕'; break;
            case 'neko': color = '#ff9966'; symbol = '🐱'; break;
            default: color = '#aaaaaa'; symbol = '?';
        }
        
        icon.style.background = color;
        icon.textContent = symbol;
        icon.style.fontSize = '12px';
        icon.style.textAlign = 'center';
        icon.style.lineHeight = '16px';
        
        // Name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = obj.name;
        nameSpan.style.marginLeft = '8px';
        nameSpan.style.flex = '1';
        
        // Visibility toggle
        const eyeBtn = document.createElement('button');
        eyeBtn.className = 'eye-btn';
        eyeBtn.textContent = obj.visible ? '👁️' : '👁️‍🗨️';
        eyeBtn.style.background = 'transparent';
        eyeBtn.style.border = 'none';
        eyeBtn.style.cursor = 'pointer';
        eyeBtn.style.fontSize = '16px';
        eyeBtn.style.padding = '0 5px';
        eyeBtn.onclick = (e) => {
            e.stopPropagation();
            obj.visible = !obj.visible;
            updateUI();
        };
        
        item.appendChild(icon);
        item.appendChild(nameSpan);
        item.appendChild(eyeBtn);
        
        item.onclick = () => SNM.selectObject(obj);
        list.appendChild(item);
    });
}

function updateProperties() {
    const props = document.getElementById('property-fields');
    if (!props) return;
    
    props.innerHTML = '';
    
    if (!SNM.selectedObject) {
        props.innerHTML = '<p style="color: #aaa; text-align: center; padding: 20px;">Select an object to edit properties</p>';
        return;
    }
    
    const obj = SNM.selectedObject;
    
    // Object Name
    const nameGroup = document.createElement('div');
    nameGroup.className = 'property-group';
    nameGroup.innerHTML = '<h4>Object</h4>';
    
    const nameRow = document.createElement('div');
    nameRow.className = 'property-row';
    nameRow.innerHTML = '<label>Name:</label>';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = obj.name;
    nameInput.onchange = (e) => {
        obj.name = e.target.value;
        updateUI();
    };
    nameRow.appendChild(nameInput);
    nameGroup.appendChild(nameRow);
    
    props.appendChild(nameGroup);
    
    // Transform Properties
    const transformGroup = document.createElement('div');
    transformGroup.className = 'property-group';
    transformGroup.innerHTML = '<h4>Transform</h4>';
    
    // Position
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        
        const label = document.createElement('label');
        label.textContent = `Position ${axis}:`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.value = obj.position.getComponent(idx).toFixed(2);
        input.onchange = (e) => {
            obj.position.setComponent(idx, parseFloat(e.target.value) || 0);
            if (obj.userData.helper) {
                obj.userData.helper.update();
            }
            SNM.updateCoordinates(obj.position);
        };
        
        row.appendChild(label);
        row.appendChild(input);
        transformGroup.appendChild(row);
    });
    
    // Rotation (in degrees)
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        
        const label = document.createElement('label');
        label.textContent = `Rotation ${axis}:`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '1';
        input.value = (obj.rotation.getComponent(idx) * (180 / Math.PI)).toFixed(1);
        input.onchange = (e) => {
            obj.rotation.setComponent(idx, (parseFloat(e.target.value) || 0) * (Math.PI / 180));
            if (obj.userData.helper) {
                obj.userData.helper.update();
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
            if (obj.userData.helper) {
                obj.userData.helper.update();
            }
        };
        
        row.appendChild(label);
        row.appendChild(input);
        transformGroup.appendChild(row);
    });
    
    props.appendChild(transformGroup);
    
    // Material Properties (only for meshes)
    if (obj.isMesh || (obj.isGroup && obj.children.some(child => child.isMesh))) {
        const materialGroup = document.createElement('div');
        materialGroup.className = 'property-group';
        materialGroup.innerHTML = '<h4>Material</h4>';
        
        // Color picker
        const colorRow = document.createElement('div');
        colorRow.className = 'property-row';
        colorRow.innerHTML = '<label>Color:</label>';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.id = 'color-picker';
        
        // Get color from first mesh in group or the mesh itself
        let targetMesh = obj;
        if (obj.isGroup) {
            const mesh = obj.children.find(child => child.isMesh);
            if (mesh) targetMesh = mesh;
        }
        
        if (targetMesh.isMesh) {
            colorInput.value = '#' + targetMesh.material.color.getHexString();
            colorInput.onchange = (e) => {
                targetMesh.material.color.set(e.target.value);
            };
        }
        
        colorRow.appendChild(colorInput);
        materialGroup.appendChild(colorRow);
        
        // Metalness slider
        const metalRow = document.createElement('div');
        metalRow.className = 'property-row';
        metalRow.innerHTML = '<label>Metalness:</label>';
        
        const metalInput = document.createElement('input');
        metalInput.type = 'range';
        metalInput.id = 'metal-slider';
        metalInput.min = '0';
        metalInput.max = '1';
        metalInput.step = '0.1';
        metalInput.value = targetMesh.isMesh ? targetMesh.material.metalness : 0;
        metalInput.onchange = (e) => {
            if (targetMesh.isMesh) {
                targetMesh.material.metalness = parseFloat(e.target.value);
            }
        };
        
        metalRow.appendChild(metalInput);
        materialGroup.appendChild(metalRow);
        
        // Roughness slider
        const roughRow = document.createElement('div');
        roughRow.className = 'property-row';
        roughRow.innerHTML = '<label>Roughness:</label>';
        
        const roughInput = document.createElement('input');
        roughInput.type = 'range';
        roughInput.id = 'rough-slider';
        roughInput.min = '0';
        roughInput.max = '1';
        roughInput.step = '0.1';
        roughInput.value = targetMesh.isMesh ? targetMesh.material.roughness : 0.5;
        roughInput.onchange = (e) => {
            if (targetMesh.isMesh) {
                targetMesh.material.roughness = parseFloat(e.target.value);
            }
        };
        
        roughRow.appendChild(roughInput);
        materialGroup.appendChild(roughRow);
        
        props.appendChild(materialGroup);
    }
}

function updateTimeline() {
    const track = document.getElementById('keyframe-track');
    if (!track) return;
    
    track.innerHTML = '';
    
    // Draw time markers
    for (let i = 0; i <= SNM.maxTime; i += 0.5) {
        const marker = document.createElement('div');
        marker.style.position = 'absolute';
        marker.style.left = `${(i / SNM.maxTime) * 100}%`;
        marker.style.width = '1px';
        marker.style.height = i % 1 === 0 ? '30px' : '20px';
        marker.style.background = i % 1 === 0 ? '#666' : '#444';
        marker.style.top = '50%';
        marker.style.transform = 'translateY(-50%)';
        track.appendChild(marker);
        
        if (i % 1 === 0) {
            const label = document.createElement('div');
            label.textContent = `${i}s`;
            label.style.position = 'absolute';
            label.style.left = `${(i / SNM.maxTime) * 100 + 0.5}%`;
            label.style.top = '10px';
            label.style.color = '#888';
            label.style.fontSize = '11px';
            track.appendChild(label);
        }
    }
    
    // Draw keyframes
    SNM.animations.forEach(anim => {
        anim.keyframes.forEach(kf => {
            const keyframe = document.createElement('div');
            keyframe.className = 'keyframe';
            keyframe.style.left = `${(kf.time / SNM.maxTime) * 100}%`;
            keyframe.title = `${anim.object?.name || 'Object'} - ${kf.time.toFixed(2)}s`;
            
            keyframe.onclick = (e) => {
                e.stopPropagation();
                // Select and jump to this keyframe
                SNM.currentTime = kf.time;
                SNM.updateTimelineUI();
                
                if (anim.object) {
                    SNM.selectObject(anim.object);
                    anim.object.position.copy(kf.position);
                    anim.object.rotation.copy(kf.rotation);
                    anim.object.scale.copy(kf.scale);
                    
                    if (anim.object.userData.helper) {
                        anim.object.userData.helper.update();
                    }
                }
            };
            
            keyframe.oncontextmenu = (e) => {
                e.preventDefault();
                if (confirm(`Delete keyframe at ${kf.time.toFixed(2)}s?`)) {
                    Editor.deleteKeyframe(kf.time);
                }
            };
            
            track.appendChild(keyframe);
        });
    });
    
    SNM.updateTimelineUI();
}

function updateStats() {
    const status = document.getElementById('status');
    if (status) {
        const stats = SNM.getSceneStats();
        status.textContent = `Ready | Objects: ${SNM.objects.length} | Vertices: ${stats.vertices} | Faces: ${stats.faces}`;
    }
}

// ========== EVENT HANDLERS ==========
function setupEventListeners() {
    console.log('Setting up UI event listeners...');
    
    // Toolbar buttons - Creation
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = e.target.dataset.tool;
            
            switch(tool) {
                // Primitive creation
                case 'add-cube': Editor.addCube(); break;
                case 'add-sphere': Editor.addSphere(); break;
                case 'add-cylinder': Editor.addCylinder(); break;
                case 'add-cone': Editor.addCone(); break;
                case 'add-torus': Editor.addTorus(); break;
                
                // Mesh editing
                case 'extrude': Editor.extrudeMesh(); break;
                case 'bevel': Editor.bevelMesh(); break;
                case 'subdivide': Editor.subdivideMesh(); break;
                
                // Object manipulation
                case 'duplicate': Editor.duplicateSelected(); break;
                case 'delete': Editor.deleteSelected(); break;
                case 'add-keyframe': Editor.addKeyframe(); break;
                
                // Animation
                case 'loop': Editor.setLooping(true); break;
            }
        });
    });
    
    // Export dropdown
    document.querySelectorAll('[data-export]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const format = e.target.dataset.export;
            
            switch(format) {
                case 'glb': Editor.exportGLB(); break;
                case 'gltf': Editor.exportGLTF(); break;
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
    
    // Timeline controls
    const timeSlider = document.getElementById('time-slider');
    if (timeSlider) {
        timeSlider.addEventListener('input', (e) => {
            const time = (parseFloat(e.target.value) / 100) * SNM.maxTime;
            SNM.currentTime = time;
            SNM.updateTimelineUI();
            
            if (!SNM.isPlaying) {
                SNM.updateAnimations(time);
            }
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
    document.getElementById('goto-start')?.addEventListener('click', () => {
        SNM.currentTime = 0;
        SNM.updateTimelineUI();
        SNM.updateAnimations(0);
    });
    
    document.getElementById('goto-end')?.addEventListener('click', () => {
        SNM.currentTime = SNM.maxTime;
        SNM.updateTimelineUI();
        SNM.updateAnimations(SNM.maxTime);
    });
    
    document.getElementById('prev-frame')?.addEventListener('click', () => {
        SNM.currentTime = Math.max(0, SNM.currentTime - (1 / SNM.fps));
        SNM.updateTimelineUI();
        SNM.updateAnimations(SNM.currentTime);
    });
    
    document.getElementById('next-frame')?.addEventListener('click', () => {
        SNM.currentTime = Math.min(SNM.maxTime, SNM.currentTime + (1 / SNM.fps));
        SNM.updateTimelineUI();
        SNM.updateAnimations(SNM.currentTime);
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
        viewport.addEventListener('click', (e) => {
            if (e.target !== viewport) return;
            
            const rect = viewport.getBoundingClientRect();
            const mouse = new THREE.Vector2();
            
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, SNM.camera);
            
            const intersects = raycaster.intersectObjects(SNM.objects, true);
            
            if (intersects.length > 0) {
                let clickedObject = intersects[0].object;
                
                // Find the top-level object
                while (clickedObject.parent && clickedObject.parent !== SNM.scene) {
                    clickedObject = clickedObject.parent;
                }
                
                SNM.selectObject(clickedObject);
            } else {
                // Clicked empty space - deselect
                SNM.selectObject(null);
            }
        });
        
        // Mouse move for coordinates
        viewport.addEventListener('mousemove', (e) => {
            if (!SNM.camera) return;
            
            const rect = viewport.getBoundingClientRect();
            const mouse = new THREE.Vector2();
            
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, SNM.camera);
            
            // Create ground plane at y=0
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersectionPoint = new THREE.Vector3();
            
            if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
                SNM.updateCoordinates(intersectionPoint);
            }
        });
    }
    
    // Timeline track click for scrubbing
    const timelineTrack = document.getElementById('timeline-track');
    if (timelineTrack) {
        timelineTrack.addEventListener('click', (e) => {
            const rect = timelineTrack.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const time = (x / rect.width) * SNM.maxTime;
            
            SNM.currentTime = Math.max(0, Math.min(time, SNM.maxTime));
            SNM.updateTimelineUI();
            SNM.updateAnimations(SNM.currentTime);
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
            e.preventDefault();
            alert(`🎮 SNM Keyboard Shortcuts:

🔄 Transform:
G - Move tool
R - Rotate tool
S - Scale tool
Q - Toggle world/local space

🎯 Selection:
Click - Select object
Delete - Delete selected
Ctrl+D - Duplicate selected

⏪ Undo/Redo:
Ctrl+Z - Undo
Ctrl+Y - Redo

🎬 Animation:
Space - Play/Pause
← → - Frame navigation

🖱️ Camera:
Left Drag - Orbit
Right Drag - Pan
Scroll - Zoom
`);
        }
    });
    
    // Neko tools (if added later)
    document.querySelectorAll('.neko-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = e.target.dataset.tool;
            switch(tool) {
                case 'paw-cursor': Editor.togglePawCursor(); break;
                case 'whisker-guide': Editor.toggleWhiskerGuide(); break;
                case 'cat-model': Editor.addNekoCat(); break;
            }
        });
    });
    
    console.log('✅ UI event listeners set up');
}

// ========== INITIALIZATION ==========
function initUI() {
    // Setup all event listeners
    setupEventListeners();
    
    // Initial UI update
    updateUI();
    
    // Add default cube to start with
    setTimeout(() => {
        Editor.addCube();
        console.log('🐱 SNM Editor Ready!');
    }, 100);
}

// Start everything when page loads
window.addEventListener('load', () => {
    // Initialize core Three.js
    SNM.init();
    
    // Initialize UI
    initUI();
});

// Expose UI functions
window.UI = {
    updateUI,
    updateObjectList,
    updateProperties,
    updateTimeline,
    updateStats,
    setupEventListeners,
    initUI
};