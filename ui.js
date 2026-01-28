// ui.js - COMPLETE UI MANAGEMENT
console.log('SNM UI loading...');

// ===== UI UPDATE FUNCTIONS =====
function updateUI() {
    updateObjectList();
    updateProperties();
    updateTimelineUI();
    updateKeyframes();
    updateStats();
    updateSelectedName();
}

function updateObjectList() {
    const list = document.getElementById('object-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (SNM.objects.length === 0) {
        list.innerHTML = '<div class="empty-state">No objects</div>';
        return;
    }
    
    SNM.objects.forEach(obj => {
        const item = document.createElement('div');
        item.className = 'object-item';
        
        // Add type class
        if (obj.userData?.type) {
            item.classList.add(obj.userData.type);
        }
        
        // Highlight selected
        if (obj === SNM.selectedObject) {
            item.classList.add('selected');
        }
        
        // Icon based on type
        const icon = document.createElement('span');
        icon.className = 'object-icon';
        icon.textContent = getObjectIcon(obj.userData?.type);
        
        // Name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = obj.name;
        nameSpan.className = 'object-name';
        
        // Visibility toggle
        const eyeBtn = document.createElement('button');
        eyeBtn.className = 'eye-btn';
        eyeBtn.textContent = obj.visible ? '👁️' : '👁️‍🗨️';
        eyeBtn.title = obj.visible ? 'Hide' : 'Show';
        eyeBtn.onclick = (e) => {
            e.stopPropagation();
            obj.visible = !obj.visible;
            updateObjectList();
        };
        
        item.appendChild(icon);
        item.appendChild(nameSpan);
        item.appendChild(eyeBtn);
        
        // Click to select
        item.onclick = (e) => {
            if (e.target !== eyeBtn) {
                Editor.selectObject(obj);
            }
        };
        
        list.appendChild(item);
    });
}

function getObjectIcon(type) {
    switch(type) {
        case 'cube': return '⬜';
        case 'sphere': return '⚪';
        case 'cylinder': return '🛢️';
        case 'plane': return '📄';
        default: return '❓';
    }
}

function updateProperties() {
    const props = document.getElementById('properties');
    if (!props) return;
    
    props.innerHTML = '';
    
    if (!SNM.selectedObject) {
        props.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 48px;">👈</div>
                <div style="margin-top: 10px; color: #aaa;">Select an object</div>
            </div>
        `;
        return;
    }
    
    const obj = SNM.selectedObject;
    
    // Object Info
    const infoGroup = document.createElement('div');
    infoGroup.className = 'property-group';
    infoGroup.innerHTML = `
        <h4>Object Info</h4>
        <div class="property-row">
            <label>Name:</label>
            <input type="text" id="object-name-input" value="${obj.name}">
        </div>
        <div class="property-row">
            <label>Type:</label>
            <span style="color: #aaa;">${obj.userData?.type || 'Unknown'}</span>
        </div>
    `;
    props.appendChild(infoGroup);
    
    // Name input handler
    const nameInput = infoGroup.querySelector('#object-name-input');
    nameInput.onchange = (e) => {
        obj.name = e.target.value || `Object_${Date.now()}`;
        updateUI();
    };
    
    // Transform Controls
    const transformGroup = document.createElement('div');
    transformGroup.className = 'property-group';
    transformGroup.innerHTML = `
        <h4>Transform</h4>
        <div style="display: flex; gap: 5px; margin-bottom: 15px;">
            <button class="mode-btn ${SNM.transformControls?.mode === 'translate' ? 'active' : ''}" 
                    onclick="Editor.setTransformMode('translate')">Move</button>
            <button class="mode-btn ${SNM.transformControls?.mode === 'rotate' ? 'active' : ''}" 
                    onclick="Editor.setTransformMode('rotate')">Rotate</button>
            <button class="mode-btn ${SNM.transformControls?.mode === 'scale' ? 'active' : ''}" 
                    onclick="Editor.setTransformMode('scale')">Scale</button>
        </div>
    `;
    props.appendChild(transformGroup);
    
    // Position
    const posGroup = document.createElement('div');
    posGroup.className = 'property-group';
    posGroup.innerHTML = '<h4>Position</h4>';
    
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        row.innerHTML = `
            <label>${axis}:</label>
            <input type="number" step="0.01" class="pos-input" data-axis="${idx}" 
                   value="${obj.position.getComponent(idx).toFixed(2)}">
        `;
        
        const input = row.querySelector('input');
        input.onchange = (e) => {
            const value = parseFloat(e.target.value) || 0;
            obj.position.setComponent(idx, value);
            if (SNM.selectionBox) SNM.selectionBox.update();
        };
        
        input.oninput = (e) => {
            const value = parseFloat(e.target.value) || 0;
            obj.position.setComponent(idx, value);
            if (SNM.selectionBox) SNM.selectionBox.update();
        };
        
        posGroup.appendChild(row);
    });
    props.appendChild(posGroup);
    
    // Rotation
    const rotGroup = document.createElement('div');
    rotGroup.className = 'property-group';
    rotGroup.innerHTML = '<h4>Rotation (degrees)</h4>';
    
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        
        const degrees = obj.rotation.getComponent(idx) * (180 / Math.PI);
        row.innerHTML = `
            <label>${axis}:</label>
            <input type="number" step="1" class="rot-input" data-axis="${idx}" 
                   value="${degrees.toFixed(1)}">
        `;
        
        const input = row.querySelector('input');
        input.onchange = (e) => {
            const degrees = parseFloat(e.target.value) || 0;
            const radians = degrees * (Math.PI / 180);
            obj.rotation.setComponent(idx, radians);
            if (SNM.selectionBox) SNM.selectionBox.update();
        };
        
        rotGroup.appendChild(row);
    });
    props.appendChild(rotGroup);
    
    // Scale
    const scaleGroup = document.createElement('div');
    scaleGroup.className = 'property-group';
    scaleGroup.innerHTML = '<h4>Scale</h4>';
    
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        row.innerHTML = `
            <label>${axis}:</label>
            <input type="number" step="0.1" min="0.1" class="scale-input" data-axis="${idx}" 
                   value="${obj.scale.getComponent(idx).toFixed(2)}">
        `;
        
        const input = row.querySelector('input');
        input.onchange = (e) => {
            const value = parseFloat(e.target.value) || 1;
            obj.scale.setComponent(idx, value);
            if (SNM.selectionBox) SNM.selectionBox.update();
        };
        
        scaleGroup.appendChild(row);
    });
    props.appendChild(scaleGroup);
    
    // Material
    const matGroup = document.createElement('div');
    matGroup.className = 'property-group';
    matGroup.innerHTML = `
        <h4>Material</h4>
        <div class="property-row">
            <label>Color:</label>
            <input type="color" id="color-input" value="#${obj.material.color.getHexString()}">
        </div>
        <div class="property-row">
            <label>Metalness:</label>
            <input type="range" min="0" max="1" step="0.1" id="metalness-input" 
                   value="${obj.material.metalness}">
            <span style="width: 30px; text-align: center;">${obj.material.metalness.toFixed(1)}</span>
        </div>
        <div class="property-row">
            <label>Roughness:</label>
            <input type="range" min="0" max="1" step="0.1" id="roughness-input" 
                   value="${obj.material.roughness}">
            <span style="width: 30px; text-align: center;">${obj.material.roughness.toFixed(1)}</span>
        </div>
    `;
    props.appendChild(matGroup);
    
    // Material handlers
    const colorInput = matGroup.querySelector('#color-input');
    colorInput.onchange = (e) => {
        obj.material.color.set(e.target.value);
    };
    
    const metalInput = matGroup.querySelector('#metalness-input');
    metalInput.onchange = (e) => {
        obj.material.metalness = parseFloat(e.target.value);
        matGroup.querySelector('span:nth-child(2)').textContent = obj.material.metalness.toFixed(1);
    };
    
    const roughInput = matGroup.querySelector('#roughness-input');
    roughInput.onchange = (e) => {
        obj.material.roughness = parseFloat(e.target.value);
        matGroup.querySelector('span:nth-child(3)').textContent = obj.material.roughness.toFixed(1);
    };
    
    // Animation controls
    const anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (anim && anim.keyframes.length > 0) {
        const animGroup = document.createElement('div');
        animGroup.className = 'property-group';
        animGroup.innerHTML = `
            <h4>Animation</h4>
            <div style="color: #aaa; margin-bottom: 10px;">
                ${anim.keyframes.length} keyframes<br>
                Duration: ${anim.keyframes[anim.keyframes.length-1].time.toFixed(1)}s
            </div>
            <button onclick="Editor.clearKeyframes()" style="width: 100%; padding: 10px; margin-top: 5px;">
                Clear Keyframes
            </button>
        `;
        props.appendChild(animGroup);
    }
}

function updateKeyframes() {
    const container = document.getElementById('keyframes-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!SNM.selectedObject) return;
    
    const anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (!anim || !anim.keyframes || anim.keyframes.length === 0) {
        return;
    }
    
    // Draw timeline background
    for (let i = 0; i <= 10; i += 1) {
        const marker = document.createElement('div');
        marker.style.position = 'absolute';
        marker.style.left = `${(i / 10) * 100}%`;
        marker.style.width = '1px';
        marker.style.height = '100%';
        marker.style.background = i % 2 === 0 ? '#444' : '#333';
        marker.style.top = '0';
        container.appendChild(marker);
        
        if (i % 2 === 0) {
            const label = document.createElement('div');
            label.textContent = `${i}s`;
            label.style.position = 'absolute';
            label.style.left = `${(i / 10) * 100}%`;
            label.style.top = '-20px';
            label.style.color = '#888';
            label.style.fontSize = '11px';
            label.style.transform = 'translateX(-50%)';
            container.appendChild(label);
        }
    }
    
    // Draw keyframes
    anim.keyframes.forEach(kf => {
        const keyframeEl = document.createElement('div');
        keyframeEl.className = 'keyframe';
        keyframeEl.style.left = `${(kf.time / 10) * 100}%`;
        keyframeEl.title = `${kf.name}\nTime: ${kf.time.toFixed(2)}s`;
        
        // Highlight if at current time
        if (Math.abs(kf.time - SNM.currentTime) < 0.05) {
            keyframeEl.classList.add('selected');
        }
        
        // Click to jump
        keyframeEl.onclick = (e) => {
            e.stopPropagation();
            SNM.currentTime = kf.time;
            SNM.updateAnimations(kf.time);
            updateTimelineUI();
            updateKeyframes();
        };
        
        // Right-click to delete
        keyframeEl.oncontextmenu = (e) => {
            e.preventDefault();
            if (confirm('Delete this keyframe?')) {
                anim.keyframes = anim.keyframes.filter(k => k !== kf);
                updateUI();
            }
        };
        
        container.appendChild(keyframeEl);
    });
}

function updateTimelineUI() {
    const display = document.getElementById('time-display');
    const slider = document.getElementById('time-slider');
    const playhead = document.getElementById('playhead');
    
    if (display) {
        display.textContent = SNM.currentTime.toFixed(2) + 's';
    }
    
    if (slider) {
        slider.value = (SNM.currentTime / 10) * 100;
    }
    
    if (playhead) {
        playhead.style.left = `${(SNM.currentTime / 10) * 100}%`;
    }
}

function updateStats() {
    const objectCount = document.getElementById('object-count');
    const stats = document.getElementById('stats');
    const status = document.getElementById('status');
    
    if (objectCount) {
        objectCount.textContent = `${SNM.objects.length} object${SNM.objects.length !== 1 ? 's' : ''}`;
    }
    
    if (stats && Editor.getSceneStats) {
        const sceneStats = Editor.getSceneStats();
        stats.textContent = `Vertices: ${sceneStats.vertices} | Faces: ${sceneStats.faces}`;
    }
    
    if (status) {
        if (SNM.isPlaying) {
            status.textContent = 'Playing';
            status.style.color = '#00ff00';
        } else if (SNM.selectedObject) {
            status.textContent = 'Selected: ' + SNM.selectedObject.name;
            status.style.color = '#00aaff';
        } else {
            status.textContent = 'Ready';
            status.style.color = '#00ff00';
        }
    }
}

function updateSelectedName() {
    const selectedName = document.getElementById('selected-name');
    if (selectedName) {
        if (SNM.selectedObject) {
            selectedName.textContent = SNM.selectedObject.name;
            selectedName.style.color = '#00aaff';
        } else {
            selectedName.textContent = 'None';
            selectedName.style.color = '#888';
        }
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Toolbar buttons
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = e.target.dataset.tool;
            
            switch(tool) {
                case 'add-cube': Editor.addCube(); break;
                case 'add-sphere': Editor.addSphere(); break;
                case 'add-cylinder': Editor.addCylinder(); break;
                case 'add-plane': Editor.addPlane(); break;
                case 'delete': Editor.deleteSelected(); break;
                case 'import': Editor.importModel(); break;
                case 'export': 
                    if (confirm('Export as GLB (binary) or JSON (scene data)?')) {
                        Editor.exportGLB();
                    } else {
                        Editor.exportJSON();
                    }
                    break;
            }
        });
    });
    
    // Animation controls
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', Editor.togglePlayback);
    }
    
    const addKeyframeBtn = document.getElementById('add-keyframe');
    if (addKeyframeBtn) {
        addKeyframeBtn.addEventListener('click', Editor.addKeyframe);
    }
    
    const clearKeyframesBtn = document.getElementById('clear-keyframes');
    if (clearKeyframesBtn) {
        clearKeyframesBtn.addEventListener('click', Editor.clearKeyframes);
    }
    
    // Timeline slider
    const timeSlider = document.getElementById('time-slider');
    if (timeSlider) {
        timeSlider.addEventListener('input', (e) => {
            const time = (parseFloat(e.target.value) / 100) * 10;
            SNM.currentTime = time;
            
            if (!SNM.isPlaying) {
                SNM.updateAnimations(time);
                updateTimelineUI();
                updateKeyframes();
            }
        });
    });
    
    // Viewport selection
    const viewport = document.getElementById('viewport');
    if (viewport) {
        viewport.addEventListener('click', (e) => {
            if (e.target !== viewport) return;
            
            const rect = viewport.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, SNM.camera);
            
            const intersects = raycaster.intersectObjects(SNM.objects);
            
            if (intersects.length > 0) {
                Editor.selectObject(intersects[0].object);
            } else {
                Editor.selectObject(null);
            }
        });
    }
    
    // Setup controls
    Editor.setupKeyboardControls();
    Editor.setupMouseControls();
    
    // FPS counter
    let frameCount = 0;
    let lastTime = performance.now();
    
    function updateFPS() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime >= lastTime + 1000) {
            const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.textContent = `FPS: ${fps}`;
                fpsElement.style.color = fps >= 50 ? '#00ff00' : fps >= 30 ? '#ffff00' : '#ff0000';
            }
            
            frameCount = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(updateFPS);
    }
    
    updateFPS();
    
    console.log('✅ Event listeners setup complete');
}

// ===== INITIALIZATION =====
window.addEventListener('load', () => {
    console.log('SNM initializing...');
    
    // Initialize Three.js
    if (typeof SNM !== 'undefined' && typeof SNM.init === 'function') {
        SNM.init();
    } else {
        console.error('SNM not loaded! Check core.js');
        alert('Error: SNM core not loaded. Check browser console.');
        return;
    }
    
    // Setup UI
    setupEventListeners();
    updateUI();
    
    // Add default cube
    setTimeout(() => {
        Editor.addCube();
        console.log('✅ SNM ready!');
        
        // Show help
        setTimeout(() => {
            alert(`🎮 SNM Controls:
            
OBJECT CONTROLS:
• Click objects to select
• Drag GIZMO arrows/rings/boxes
• WASD: Move selected object
• Q/E: Move up/down
• R/F: Rotate
• Z/X: Scale
• G/R/S: Switch transform mode
• Ctrl+D: Duplicate
• Delete: Remove object

CAMERA CONTROLS:
• Left-click drag: Orbit
• Right-click drag: Pan
• Mouse wheel: Zoom
• Arrow keys: Fine movement

ANIMATION:
• Space: Play/Pause
• K: Add keyframe
• Click timeline: Add/jump
• Right-click keyframe: Delete

FILE:
• Import: GLTF/GLB/OBJ/STL/JSON
• Export: GLB or JSON format`);
        }, 1000);
    }, 100);
});

// ===== EXPORT =====
window.UI = { 
    updateUI,
    updateObjectList,
    updateProperties,
    updateKeyframes,
    updateTimelineUI,
    updateStats,
    updateSelectedName
};

console.log('✅ SNM UI loaded');
