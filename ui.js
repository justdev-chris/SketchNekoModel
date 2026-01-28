// ui.js - WITH BETTER PROPERTIES UI
console.log('🐱 SNM UI loading...');

// Update object list
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
        item.onclick = () => Editor.selectObject(obj);
        list.appendChild(item);
    });
}

// Update properties with BETTER UI
function updateProperties() {
    const props = document.getElementById('properties');
    if (!props) return;
    
    props.innerHTML = '';
    
    if (!SNM.selectedObject) {
        props.innerHTML = '<p style="color: #aaa; padding: 10px; text-align: center;">👈 Select an object</p>';
        return;
    }
    
    const obj = SNM.selectedObject;
    
    // Create a SIMPLE transform controller
    const transformControl = document.createElement('div');
    transformControl.className = 'transform-control';
    transformControl.innerHTML = `
        <div class="property-group">
            <h4>Transform</h4>
            <div class="transform-buttons">
                <button class="transform-btn active" onclick="Editor.setTransformMode('translate')">Move</button>
                <button class="transform-btn" onclick="Editor.setTransformMode('rotate')">Rotate</button>
                <button class="transform-btn" onclick="Editor.setTransformMode('scale')">Scale</button>
            </div>
            <p style="color: #888; font-size: 12px; margin-top: 10px;">
                Use <b>arrow keys</b> to move<br>
                Drag <b>gizmo handles</b> in viewport
            </p>
        </div>
    `;
    props.appendChild(transformControl);
    
    // Simple position display (read-only)
    const posDisplay = document.createElement('div');
    posDisplay.className = 'property-group';
    posDisplay.innerHTML = `
        <h4>Position</h4>
        <div class="position-display">
            <div>X: ${obj.position.x.toFixed(2)}</div>
            <div>Y: ${obj.position.y.toFixed(2)}</div>
            <div>Z: ${obj.position.z.toFixed(2)}</div>
        </div>
    `;
    props.appendChild(posDisplay);
    
    // Simple scale display with +/- buttons
    const scaleControl = document.createElement('div');
    scaleControl.className = 'property-group';
    scaleControl.innerHTML = `
        <h4>Scale</h4>
        <div class="scale-control">
            <button onclick="scaleObject(-0.1)">-</button>
            <span>${obj.scale.x.toFixed(2)}</span>
            <button onclick="scaleObject(0.1)">+</button>
        </div>
        <p style="color: #888; font-size: 12px;">
            Uniform scaling
        </p>
    `;
    props.appendChild(scaleControl);
    
    // Color picker
    const colorControl = document.createElement('div');
    colorControl.className = 'property-group';
    colorControl.innerHTML = `
        <h4>Color</h4>
        <input type="color" id="color-picker" value="#${obj.material.color.getHexString()}" 
               style="width: 100%; height: 40px; border: none; cursor: pointer;">
    `;
    props.appendChild(colorControl);
    
    // Setup color picker
    setTimeout(() => {
        const colorPicker = document.getElementById('color-picker');
        if (colorPicker) {
            colorPicker.oninput = (e) => {
                obj.material.color.set(e.target.value);
            };
        }
    }, 10);
}

// Scale helper function
window.scaleObject = function(amount) {
    if (!SNM.selectedObject) return;
    
    const obj = SNM.selectedObject;
    const scaleFactor = 1 + amount;
    obj.scale.multiplyScalar(scaleFactor);
    
    if (SNM.selectionBox) {
        SNM.selectionBox.update();
    }
    
    updateUI();
};

// Update keyframe visualization
function updateKeyframes() {
    const container = document.getElementById('keyframes-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!SNM.selectedObject) return;
    
    const anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (!anim || !anim.keyframes) return;
    
    anim.keyframes.forEach(kf => {
        const keyframeEl = document.createElement('div');
        keyframeEl.className = 'keyframe';
        keyframeEl.style.left = `${(kf.time / 10) * 100}%`;
        
        if (Math.abs(kf.time - SNM.currentTime) < 0.1) {
            keyframeEl.classList.add('selected');
        }
        
        keyframeEl.title = `Time: ${kf.time.toFixed(1)}s`;
        
        keyframeEl.onclick = (e) => {
            e.stopPropagation();
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
    
    const timeDisplay = document.getElementById('time-display');
    const timeSlider = document.getElementById('time-slider');
    
    if (timeDisplay) timeDisplay.textContent = SNM.currentTime.toFixed(1) + 's';
    if (timeSlider) timeSlider.value = (SNM.currentTime / 10) * 100;
}

// Setup event listeners
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
                case 'delete': Editor.deleteSelected(); break;
                case 'export': Editor.exportGLB(); break;
            }
        });
    });
    
    // Animation controls
    const playBtn = document.getElementById('play-btn');
    if (playBtn) playBtn.addEventListener('click', Editor.togglePlayback);
    
    const keyframeBtn = document.getElementById('add-keyframe');
    if (keyframeBtn) keyframeBtn.addEventListener('click', Editor.addKeyframe);
    
    const clearBtn = document.getElementById('clear-keyframes');
    if (clearBtn) clearBtn.addEventListener('click', Editor.clearKeyframes);
    
    // Timeline slider
    const timeSlider = document.getElementById('time-slider');
    if (timeSlider) {
        timeSlider.addEventListener('input', (e) => {
            SNM.currentTime = (e.target.value / 100) * 10;
            document.getElementById('time-display').textContent = SNM.currentTime.toFixed(1) + 's';
            
            if (!SNM.isPlaying) {
                SNM.updateAnimations(SNM.currentTime);
                updateKeyframes();
            }
        });
    }
    
    // Viewport click for object selection
    const viewport = document.getElementById('viewport');
    if (viewport) {
        viewport.addEventListener('click', (e) => {
            if (e.target !== viewport) return;
            
            const rect = viewport.getBoundingClientRect();
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
    }
    
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
    
    // Initialize controls
    Editor.initControls();
    
    // Add a default cube
    setTimeout(() => {
        Editor.addCube();
        console.log('✅ SNM Editor ready!');
        
        // Show help message
        setTimeout(() => {
            alert(`🎮 SNM Controls:
• Click objects to select
• Drag GIZMO arrows to move
• Use arrow keys for fine movement
• Press G/R/S for Move/Rotate/Scale
• Space to play/pause animation`);
        }, 500);
    }, 100);
});

console.log('✅ SNM UI loaded!');
