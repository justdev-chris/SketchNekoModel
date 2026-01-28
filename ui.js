// ui.js - COMPLETE WITH ALL UI FEATURES
console.log('SNM UI loading...');

function updateUI() {
    updateObjectList();
    updateProperties();
    updateTimelineUI();
    updateKeyframes();
}

function updateObjectList() {
    const list = document.getElementById('object-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    SNM.objects.forEach(obj => {
        const item = document.createElement('div');
        item.className = 'object-item';
        
        // Add type class for icon
        if (obj.userData?.type) {
            item.classList.add(obj.userData.type);
        }
        
        if (obj === SNM.selectedObject) {
            item.classList.add('selected');
        }
        
        item.textContent = obj.name;
        item.onclick = () => Editor.selectObject(obj);
        list.appendChild(item);
    });
}

function updateProperties() {
    const props = document.getElementById('properties');
    if (!props) return;
    
    props.innerHTML = '';
    
    if (!SNM.selectedObject) {
        props.innerHTML = '<p style="color: #aaa; padding: 10px;">Select an object</p>';
        return;
    }
    
    const obj = SNM.selectedObject;
    
    // Transform mode buttons
    const transformDiv = document.createElement('div');
    transformDiv.className = 'transform-buttons';
    transformDiv.innerHTML = `
        <h4>Transform</h4>
        <div style="display: flex; gap: 5px; margin: 10px 0;">
            <button class="mode-btn active" data-mode="translate">Move</button>
            <button class="mode-btn" data-mode="rotate">Rotate</button>
            <button class="mode-btn" data-mode="scale">Scale</button>
        </div>
    `;
    props.appendChild(transformDiv);
    
    // Position
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        row.innerHTML = `
            <label>Position ${axis}:</label>
            <input type="number" step="0.1" value="${obj.position.getComponent(idx).toFixed(2)}">
        `;
        
        row.querySelector('input').onchange = (e) => {
            obj.position.setComponent(idx, parseFloat(e.target.value) || 0);
            if (SNM.selectionBox) SNM.selectionBox.update();
        };
        
        props.appendChild(row);
    });
    
    // Scale
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        row.innerHTML = `
            <label>Scale ${axis}:</label>
            <input type="number" step="0.1" min="0.1" value="${obj.scale.getComponent(idx).toFixed(2)}">
        `;
        
        row.querySelector('input').onchange = (e) => {
            obj.scale.setComponent(idx, parseFloat(e.target.value) || 1);
            if (SNM.selectionBox) SNM.selectionBox.update();
        };
        
        props.appendChild(row);
    });
    
    // Color
    const colorRow = document.createElement('div');
    colorRow.className = 'property-row';
    colorRow.innerHTML = `
        <label>Color:</label>
        <input type="color" value="#${obj.material.color.getHexString()}">
    `;
    
    colorRow.querySelector('input').onchange = (e) => {
        obj.material.color.set(e.target.value);
    };
    
    props.appendChild(colorRow);
    
    // Keyframe info
    const anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (anim && anim.keyframes.length > 0) {
        const keyframeInfo = document.createElement('div');
        keyframeInfo.style.marginTop = '20px';
        keyframeInfo.innerHTML = `
            <h4>Animation</h4>
            <p style="color: #aaa; font-size: 12px;">
                ${anim.keyframes.length} keyframes<br>
                Duration: ${anim.keyframes[anim.keyframes.length-1].time.toFixed(1)}s
            </p>
            <button onclick="Editor.clearKeyframes()" style="margin-top: 10px; padding: 8px; width: 100%;">
                Clear Keyframes
            </button>
        `;
        props.appendChild(keyframeInfo);
    }
}

function updateKeyframes() {
    const container = document.getElementById('keyframes-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!SNM.selectedObject) return;
    
    const anim = SNM.animations.find(a => a.object === SNM.selectedObject);
    if (!anim || !anim.keyframes) return;
    
    // Create keyframe elements
    anim.keyframes.forEach(kf => {
        const keyframeEl = document.createElement('div');
        keyframeEl.className = 'keyframe';
        keyframeEl.style.left = `${(kf.time / 10) * 100}%`;
        keyframeEl.title = `${kf.name || 'Keyframe'}\nTime: ${kf.time.toFixed(1)}s`;
        
        // Highlight if at current time
        if (Math.abs(kf.time - SNM.currentTime) < 0.1) {
            keyframeEl.classList.add('selected');
        }
        
        // Click to jump to keyframe
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
    
    if (display) {
        display.textContent = SNM.currentTime.toFixed(2) + 's';
    }
    if (slider) {
        slider.value = (SNM.currentTime / 10) * 100;
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Tool buttons
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
    
    // Transform mode buttons
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            Editor.setTransformMode(e.target.dataset.mode);
        });
    });
    
    // Animation controls
    const playBtn = document.getElementById('play-btn');
    if (playBtn) {
        playBtn.addEventListener('click', Editor.togglePlayback);
    }
    
    const keyframeBtn = document.getElementById('add-keyframe');
    if (keyframeBtn) {
        keyframeBtn.addEventListener('click', Editor.addKeyframe);
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
    
    // Viewport click for selection
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
    
    // Setup keyboard controls
    Editor.setupKeyboardControls();
    
    console.log('Event listeners setup complete');
}

// Initialize
window.addEventListener('load', () => {
    console.log('SNM initializing...');
    
    // Initialize Three.js
    SNM.init();
    
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
• Click objects to select
• Drag GIZMO arrows/rings/boxes
• G/R/S keys for Move/Rotate/Scale
• Arrow keys for precise movement
• Q/E to rotate, Z/X to scale
• Space to play/pause animation
• Click timeline to add keyframes`);
        }, 500);
    }, 100);
});

window.UI = { 
    updateUI, updateObjectList, updateProperties, 
    updateKeyframes, updateTimelineUI 
};
