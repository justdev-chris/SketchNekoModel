// ui.js - ALL UI FUNCTIONS COMPLETE

// Update object list in hierarchy panel
function updateObjectList() {
    const list = document.getElementById('object-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    SNM.objects.forEach(obj => {
        const item = document.createElement('div');
        item.className = 'object-item';
        
        // Highlight if selected
        if (obj === SNM.selectedObject) {
            item.classList.add('selected');
        }
        
        item.textContent = obj.name;
        
        // Click to select
        item.onclick = () => {
            Editor.selectObject(obj);
        };
        
        list.appendChild(item);
    });
}

// Update properties panel
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
            
            // Update selection box
            if (SNM.selectionBox) {
                SNM.selectionBox.update();
            }
        };
        
        row.appendChild(label);
        row.appendChild(input);
        props.appendChild(row);
    });
    
    // Rotation controls
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
            const value = parseFloat(e.target.value) || 0;
            obj.rotation.setComponent(idx, value * (Math.PI / 180));
            
            // Update selection box
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

// Update all UI elements
function updateUI() {
    updateObjectList();
    updateProperties();
    
    // Update timeline display
    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) {
        timeDisplay.textContent = SNM.currentTime.toFixed(1) + 's';
    }
}

// Setup all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Toolbar buttons
    const buttons = document.querySelectorAll('.tool-btn');
    buttons.forEach(btn => {
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
            const value = parseFloat(e.target.value);
            SNM.currentTime = (value / 100) * 10; // 10 seconds max
            
            // Update display
            const display = document.getElementById('time-display');
            if (display) {
                display.textContent = SNM.currentTime.toFixed(1) + 's';
            }
            
            // Update animations if not playing
            if (!SNM.isPlaying) {
                SNM.updateAnimations(SNM.currentTime);
            }
        });
    }
    
    // Viewport click for object selection
    const viewport = document.getElementById('viewport');
    if (viewport) {
        viewport.addEventListener('click', (e) => {
            // Only select if clicking directly on canvas
            if (e.target !== viewport) return;
            
            // Calculate mouse position in normalized device coordinates
            const rect = viewport.getBoundingClientRect();
            const mouse = {
                x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
                y: -((e.clientY - rect.top) / rect.height) * 2 + 1
            };
            
            // Raycast to find clicked object
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(new THREE.Vector2(mouse.x, mouse.y), SNM.camera);
            
            const intersects = raycaster.intersectObjects(SNM.objects);
            
            if (intersects.length > 0) {
                // Select the first intersected object
                Editor.selectObject(intersects[0].object);
            } else {
                // Clicked empty space - deselect
                Editor.selectObject(null);
            }
        });
    }
    
    console.log('Event listeners setup complete');
}

// Initialize when page loads
window.onload = function() {
    console.log('SNM Editor loading...');
    
    // Initialize Three.js
    SNM.init();
    
    // Setup UI
    setupEventListeners();
    updateUI();
    
    // Add a default cube to start with
    setTimeout(() => {
        Editor.addCube();
        console.log('SNM Editor ready!');
    }, 100);
};

// Expose UI functions globally
window.UI = {
    updateUI,
    updateObjectList,
    updateProperties,
    setupEventListeners
};
