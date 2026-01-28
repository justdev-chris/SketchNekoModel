// ui.js - COMPLETE UI WITH WORKING COLOR PICKER
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
        list.innerHTML = '<div style="padding: 20px; color: #aaa; text-align: center;">No objects</div>';
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
        
        switch(obj.userData?.type) {
            case 'cube': icon.textContent = '▢'; break;
            case 'sphere': icon.textContent = '●'; break;
            case 'cylinder': icon.textContent = '⬤'; break;
            case 'plane': icon.textContent = '▭'; break;
            default: icon.textContent = '?';
        }
        
        // Name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = obj.name;
        nameSpan.className = 'object-name';
        
        // Visibility toggle
        const eyeBtn = document.createElement('button');
        eyeBtn.className = 'eye-btn';
        eyeBtn.textContent = obj.visible ? '👁' : '🚫';
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

function updateProperties() {
    const props = document.getElementById('properties');
    if (!props) return;
    
    props.innerHTML = '';
    
    if (!SNM.selectedObject) {
        props.innerHTML = '<div style="padding: 40px; text-align: center; color: #666;"><div style="font-size: 48px;">👈</div><div style="margin-top: 10px;">Select an object</div></div>';
        return;
    }
    
    const obj = SNM.selectedObject;
    
    // Transform Mode Buttons
    const modeDiv = document.createElement('div');
    modeDiv.style.marginBottom = '20px';
    modeDiv.innerHTML = `
        <div style="display: flex; gap: 5px; margin-bottom: 15px;">
            <button class="mode-btn ${SNM.transformControls?.mode === 'translate' ? 'active' : ''}" 
                    onclick="Editor.setTransformMode('translate')"
                    style="flex: 1; padding: 10px; background: ${SNM.transformControls?.mode === 'translate' ? '#0066cc' : '#444'}; color: white; border: none; border-radius: 4px;">
                Move
            </button>
            <button class="mode-btn ${SNM.transformControls?.mode === 'rotate' ? 'active' : ''}" 
                    onclick="Editor.setTransformMode('rotate')"
                    style="flex: 1; padding: 10px; background: ${SNM.transformControls?.mode === 'rotate' ? '#0066cc' : '#444'}; color: white; border: none; border-radius: 4px;">
                Rotate
            </button>
            <button class="mode-btn ${SNM.transformControls?.mode === 'scale' ? 'active' : ''}" 
                    onclick="Editor.setTransformMode('scale')"
                    style="flex: 1; padding: 10px; background: ${SNM.transformControls?.mode === 'scale' ? '#0066cc' : '#444'}; color: white; border: none; border-radius: 4px;">
                Scale
            </button>
        </div>
    `;
    props.appendChild(modeDiv);
    
    // Object Name
    const nameGroup = document.createElement('div');
    nameGroup.style.background = '#2a2a2a';
    nameGroup.style.padding = '15px';
    nameGroup.style.borderRadius = '6px';
    nameGroup.style.marginBottom = '15px';
    nameGroup.innerHTML = `
        <div style="color: #aaa; font-size: 12px; margin-bottom: 5px;">Name</div>
        <input type="text" 
               value="${obj.name}"
               style="width: 100%; padding: 8px; background: #333; border: 1px solid #444; color: white; border-radius: 4px;"
               onchange="SNM.selectedObject.name = this.value; updateUI()">
    `;
    props.appendChild(nameGroup);
    
    // Position
    const posGroup = document.createElement('div');
    posGroup.style.background = '#2a2a2a';
    posGroup.style.padding = '15px';
    posGroup.style.borderRadius = '6px';
    posGroup.style.marginBottom = '15px';
    posGroup.innerHTML = '<div style="color: #aaa; font-size: 12px; margin-bottom: 10px;">Position</div>';
    
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';
        
        // Use direct properties instead of getComponent()
        const posArray = [obj.position.x, obj.position.y, obj.position.z];
        
        row.innerHTML = `
            <div style="width: 20px; color: #aaa;">${axis}</div>
            <input type="number" 
                   step="0.1"
                   value="${posArray[idx].toFixed(2)}"
                   style="flex: 1; margin-left: 10px; padding: 8px; background: #333; border: 1px solid #444; color: white; border-radius: 4px;">
        `;
        
        const input = row.querySelector('input');
        input.onchange = (e) => {
            const value = parseFloat(e.target.value) || 0;
            if (idx === 0) obj.position.x = value;
            else if (idx === 1) obj.position.y = value;
            else if (idx === 2) obj.position.z = value;
            if (SNM.selectionBox) SNM.selectionBox.update();
        };
        
        posGroup.appendChild(row);
    });
    props.appendChild(posGroup);
    
    // Rotation - FIXED SECTION
    const rotGroup = document.createElement('div');
    rotGroup.style.background = '#2a2a2a';
    rotGroup.style.padding = '15px';
    rotGroup.style.borderRadius = '6px';
    rotGroup.style.marginBottom = '15px';
    rotGroup.innerHTML = '<div style="color: #aaa; font-size: 12px; margin-bottom: 10px;">Rotation (degrees)</div>';
    
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';
        
        // Use direct rotation properties
        const rotationValues = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
        const degrees = rotationValues[idx] * (180 / Math.PI);
        
        row.innerHTML = `
            <div style="width: 20px; color: #aaa;">${axis}</div>
            <input type="number" 
                   step="1"
                   value="${degrees.toFixed(1)}"
                   style="flex: 1; margin-left: 10px; padding: 8px; background: #333; border: 1px solid #444; color: white; border-radius: 4px;">
        `;
        
        const input = row.querySelector('input');
        input.onchange = (e) => {
            const degrees = parseFloat(e.target.value) || 0;
            const radians = degrees * (Math.PI / 180);
            
            // Set rotation values directly
            if (idx === 0) obj.rotation.x = radians;
            else if (idx === 1) obj.rotation.y = radians;
            else if (idx === 2) obj.rotation.z = radians;
            
            if (SNM.selectionBox) SNM.selectionBox.update();
        };
        
        rotGroup.appendChild(row);
    });
    props.appendChild(rotGroup);
    
    // Scale - FIXED SECTION
    const scaleGroup = document.createElement('div');
    scaleGroup.style.background = '#2a2a2a';
    scaleGroup.style.padding = '15px';
    scaleGroup.style.borderRadius = '6px';
    scaleGroup.style.marginBottom = '15px';
    scaleGroup.innerHTML = '<div style="color: #aaa; font-size: 12px; margin-bottom: 10px;">Scale</div>';
    
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.marginBottom = '8px';
        
        // Use direct scale properties
        const scaleArray = [obj.scale.x, obj.scale.y, obj.scale.z];
        
        row.innerHTML = `
            <div style="width: 20px; color: #aaa;">${axis}</div>
            <input type="number" 
                   step="0.1"
                   min="0.1"
                   value="${scaleArray[idx].toFixed(2)}"
                   style="flex: 1; margin-left: 10px; padding: 8px; background: #333; border: 1px solid #444; color: white; border-radius: 4px;">
        `;
        
        const input = row.querySelector('input');
        input.onchange = (e) => {
            const value = parseFloat(e.target.value) || 1;
            if (idx === 0) obj.scale.x = value;
            else if (idx === 1) obj.scale.y = value;
            else if (idx === 2) obj.scale.z = value;
            if (SNM.selectionBox) SNM.selectionBox.update();
        };
        
        scaleGroup.appendChild(row);
    });
    props.appendChild(scaleGroup);
    
    // COLOR PICKER
    const colorGroup = document.createElement('div');
    colorGroup.style.background = '#2a2a2a';
    colorGroup.style.padding = '15px';
    colorGroup.style.borderRadius = '6px';
    colorGroup.style.marginBottom = '15px';
    
    // Get color in hex format
    const colorHex = '#' + obj.material.color.getHexString();
    
    colorGroup.innerHTML = `
        <div style="color: #aaa; font-size: 12px; margin-bottom: 10px;">Material</div>
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="width: 60px; color: #aaa;">Color:</div>
            <input type="color" 
                   id="color-picker"
                   value="${colorHex}"
                   style="width: 60px; height: 40px; border: 2px solid #555; cursor: pointer; border-radius: 4px;"
                   onchange="SNM.selectedObject.material.color.set(this.value); SNM.selectedObject.material.needsUpdate = true;">
            <div style="margin-left: 10px; color: white;">${colorHex}</div>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <div style="width: 60px; color: #aaa;">Metal:</div>
            <input type="range" 
                   min="0" max="1" step="0.1"
                   value="${obj.material.metalness}"
                   style="flex: 1;"
                   onchange="SNM.selectedObject.material.metalness = parseFloat(this.value);">
            <div style="width: 30px; text-align: center; color: #aaa; margin-left: 10px;">${obj.material.metalness.toFixed(1)}</div>
        </div>
        <div style="display: flex; align-items: center;">
            <div style="width: 60px; color: #aaa;">Rough:</div>
            <input type="range" 
                   min="0" max="1" step="0.1"
                   value="${obj.material.roughness}"
                   style="flex: 1;"
                   onchange="SNM.selectedObject.material.roughness = parseFloat(this.value);">
            <div style="width: 30px; text-align: center; color: #aaa; margin-left: 10px;">${obj.material.roughness.toFixed(1)}</div>
        </div>
    `;
    props.appendChild(colorGroup);
    
    // Animation info if exists
    const anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (anim && anim.keyframes.length > 0) {
        const animGroup = document.createElement('div');
        animGroup.style.background = '#2a2a2a';
        animGroup.style.padding = '15px';
        animGroup.style.borderRadius = '6px';
        animGroup.innerHTML = `
            <div style="color: #aaa; font-size: 12px; margin-bottom: 5px;">Animation</div>
            <div style="color: #888; font-size: 11px; margin-bottom: 10px;">
                ${anim.keyframes.length} keyframes<br>
                Last: ${anim.keyframes[anim.keyframes.length-1].time.toFixed(1)}s
            </div>
            <button onclick="Editor.clearKeyframes()" 
                    style="width: 100%; padding: 10px; background: #ff3333; color: white; border: none; border-radius: 4px; cursor: pointer;">
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
        keyframeEl.style.position = 'absolute';
        keyframeEl.style.width = '12px';
        keyframeEl.style.height = '30px';
        keyframeEl.style.background = 'linear-gradient(to bottom, #ff9900, #ff6600)';
        keyframeEl.style.borderRadius = '3px';
        keyframeEl.style.top = '50%';
        keyframeEl.style.transform = 'translateY(-50%)';
        keyframeEl.style.cursor = 'pointer';
        keyframeEl.style.border = '2px solid #ffcc00';
        keyframeEl.style.left = `${(kf.time / 10) * 100}%`;
        keyframeEl.title = `${kf.name}\nTime: ${kf.time.toFixed(2)}s`;
        
        // Highlight if at current time
        if (Math.abs(kf.time - SNM.currentTime) < 0.05) {
            keyframeEl.style.background = 'linear-gradient(to bottom, #00ffcc, #00ccff)';
            keyframeEl.style.borderColor = '#00ffff';
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
    
    if (stats) {
        let vertices = 0;
        let faces = 0;
        
        SNM.objects.forEach(obj => {
            if (obj.geometry) {
                vertices += obj.geometry.attributes.position?.count || 0;
                if (obj.geometry.index) {
                    faces += obj.geometry.index.count / 3;
                }
            }
        });
        
        stats.textContent = `Vertices: ${vertices} | Faces: ${faces}`;
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
                    if (confirm('Export as GLB?')) {
                        Editor.exportGLB();
                    } else {
                        Editor.exportJSON();
                    }
                    break;
            }
        });
    });
    
    // Transform mode buttons
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            Editor.setTransformMode(mode);
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
    }
    
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
