// ui.js - COMPLETE AND WORKING
console.log('🐱 SNM UI loading...');

// Update object list in hierarchy panel
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
        
        item.textContent = obj.name;
        item.onclick = () => {
            Editor.selectObject(obj);
        };
        
        list.appendChild(item);
    });
}

// Update properties panel (FIXED ROTATION)
function updateProperties() {
    const props = document.getElementById('properties');
    if (!props) return;
    
    props.innerHTML = '';
    
    if (!SNM.selectedObject) {
        props.innerHTML = '<p style="color: #aaa; padding: 10px;">Select an object to edit properties</p>';
        return;
    }
    
    const obj = SNM.selectedObject;
    
    // Position controls
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
            const value = parseFloat(e.target.value) || 0;
            obj.position.setComponent(idx, value);
            
            if (SNM.selectionBox) {
                SNM.selectionBox.update();
            }
        };
        
        row.appendChild(label);
        row.appendChild(input);
        props.appendChild(row);
    });
    
    // Rotation controls - FIXED
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        
        const label = document.createElement('label');
        label.textContent = `Rotation ${axis}:`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '1';
        
        // FIX: Get rotation correctly (Euler has x, y, z properties, not getComponent)
        const rotationValues = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
        input.value = (rotationValues[idx] * (180 / Math.PI)).toFixed(1);
        
        input.onchange = (e) => {
            const value = parseFloat(e.target.value) || 0;
            const radians = value * (Math.PI / 180);
            
            // Set rotation based on axis
            switch(axis) {
                case 'X': obj.rotation.x = radians; break;
                case 'Y': obj.rotation.y = radians; break;
                case 'Z': obj.rotation.z = radians; break;
            }
            
            if (SNM.selectionBox) {
                SNM.selectionBox.update();
            }
        };
        
        row.appendChild(label);
        row.appendChild(input);
        props.appendChild(row);
    });
    
    // Color picker
    const colorRow = document.createElement('div');
    colorRow.className = 'property-row';
    
    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Color:';
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#' + obj.material.color.getHexString();
    
    colorInput.onchange = (e) => {
        obj.material.color.set(e.target.value);
    };
    
    colorRow.appendChild(colorLabel);
    colorRow.appendChild(colorInput);
    props.appendChild(colorRow);
}

// Update keyframe visualization
function updateKeyframes() {
    const container = document.getElementById('keyframes-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!SNM.selectedObject) return;
    
    // Find animations for selected object
    const anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (!anim || !anim.keyframes) return;
    
    // Draw each keyframe
    anim.keyframes.forEach(kf => {
        const keyframeEl = document.createElement('div');
        keyframeEl.className = 'keyframe';
        keyframeEl.style.left = `${(kf.time / 10) * 100}%`; // 10 second timeline
        
        // Highlight if at current time
        if (Math.abs(kf.time - SNM.currentTime) < 0.1) {
            keyframeEl.classList.add('selected');
        }
        
        keyframeEl.title = `Time: ${kf.time.toFixed(1)}s`;
        
        keyframeEl.onclick = (e) => {
            e.stopPropagation();
            // Jump to this keyframe
            SNM.currentTime = kf.time;
            SNM.updateAnimations(kf.time);
            updateUI();
        };
        
        container.appendChild(keyframeEl);
    });
}

// Update stats
function updateStats() {
    const objectCount = document.getElementById('object-count');
    const keyframeCount = document.getElementById('keyframe-count');
    const currentTime = document.getElementById('current-time');
    
    if (objectCount) objectCount.textContent = SNM.objects.length;
    
    let totalKeyframes = 0;
    SNM.animations.forEach(anim => totalKeyframes += anim.keyframes.length);
    if (keyframeCount) keyframeCount.textContent = totalKeyframes;
    
    if (currentTime) currentTime.textContent = SNM.currentTime.toFixed(1);
}

// Update all UI elements
function updateUI() {
    updateObjectList();
    updateProperties();
    updateKeyframes();
    updateStats();
    
    // Update timeline display
    const timeDisplay = document.getElementById('time-display');
    const timeSlider = document.getElementById('time-slider');
    
    if (timeDisplay) {
        timeDisplay.textContent = SNM.currentTime.toFixed(1) + 's';
    }
    if (timeSlider) {
        timeSlider.value = (SNM.currentTime / 10) * 100;
    }
}

// Setup all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Toolbar buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tool = e.target.getAttribute('data-tool');
            console.log('Tool clicked:', tool);
            
            switch(tool) {
                case 'add-cube':
                    Editor.addCube();
                    break;
                case 'add-sphere':
                    Editor.addSphere();
                    break;
                case 'add-cylinder':
                    Editor.addCylinder();
                    break;
                case 'delete':
                    Editor.deleteSelected();
                    break;
                case 'export':
                    Editor.exportGLB();
                    break;
            }
        });
    });
    
    // Transform buttons
    document.querySelectorAll('.transform-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            Editor.setTransformMode(e.target.dataset.transform);
        });
    });
    
    // Animation controls
    document.getElementById('play-btn').addEventListener('click', Editor.togglePlayback);
    document.getElementById('add-keyframe').addEventListener('click', Editor.addKeyframe);
    document.getElementById('clear-keyframes').addEventListener('click', Editor.clearKeyframes);
    
    // Timeline slider
    document.getElementById('time-slider').addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        SNM.currentTime = (value / 100) * 10;
        
        // Update display
        document.getElementById('time-display').textContent = SNM.currentTime.toFixed(1) + 's';
        
        // Update animations if not playing
        if (!SNM.isPlaying) {
            SNM.updateAnimations(SNM.currentTime);
            updateKeyframes(); // Update keyframe highlights
        }
    });
    
    // Viewport click for object selection
    document.getElementById('viewport').addEventListener('click', (e) => {
        if (e.target !== document.getElementById('viewport')) return;
        
        const rect = e.target.getBoundingClientRect();
        const mouse = {
            x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((e.clientY - rect.top) / rect.height) * 2 + 1
        };
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), SNM.camera);
        
        const intersects = raycaster.intersectObjects(SNM.objects);
        
        if (intersects.length > 0) {
            Editor.selectObject(intersects[0].object);
        } else {
            Editor.selectObject(null);
        }
    });
    
    console.log('✅ Event listeners setup complete');
}

// Initialize when page loads
window.addEventListener('load', function() {
    console.log('🐱 SNM Editor initializing...');
    
    // Initialize Three.js scene
    SNM.init();
    
    // Setup UI
    setupEventListeners();
    updateUI();
    
    // Add a default cube to start with
    setTimeout(() => {
        Editor.addCube();
        console.log('✅ SNM Editor ready!');
    }, 100);
});

console.log('✅ SNM UI loaded!');
