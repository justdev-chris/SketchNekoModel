// ui.js - UI for Transform Controls
console.log('SNM UI loading...');

function updateUI() {
    updateObjectList();
    updateProperties();
    updateTimelineUI();
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
    
    // Simple position display
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const div = document.createElement('div');
        div.className = 'property-row';
        div.innerHTML = `
            <label>${axis}:</label>
            <input type="number" step="0.1" value="${obj.position.getComponent(idx).toFixed(2)}">
        `;
        
        const input = div.querySelector('input');
        input.onchange = (e) => {
            obj.position.setComponent(idx, parseFloat(e.target.value) || 0);
            if (SNM.selectionBox) SNM.selectionBox.update();
        };
        
        props.appendChild(div);
    });
    
    // Color picker
    const colorDiv = document.createElement('div');
    colorDiv.className = 'property-row';
    colorDiv.innerHTML = `
        <label>Color:</label>
        <input type="color" value="#${obj.material.color.getHexString()}">
    `;
    
    const colorInput = colorDiv.querySelector('input');
    colorInput.onchange = (e) => {
        obj.material.color.set(e.target.value);
    };
    
    props.appendChild(colorDiv);
}

function updateTimelineUI() {
    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) {
        timeDisplay.textContent = SNM.currentTime.toFixed(1) + 's';
    }
}

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
    
    // Transform mode buttons
    document.querySelectorAll('[data-mode]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            Editor.setTransformMode(e.target.dataset.mode);
        });
    });
    
    // Animation controls
    document.getElementById('play-btn').addEventListener('click', Editor.togglePlayback);
    document.getElementById('add-keyframe').addEventListener('click', Editor.addKeyframe);
    
    // Timeline slider
    document.getElementById('time-slider').addEventListener('input', (e) => {
        SNM.currentTime = (parseFloat(e.target.value) / 100) * 10;
        document.getElementById('time-display').textContent = SNM.currentTime.toFixed(1) + 's';
        
        if (!SNM.isPlaying) {
            SNM.updateAnimations(SNM.currentTime);
        }
    });
    
    // Viewport click for selection
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
    
    // Setup keyboard controls
    Editor.setupKeyboardControls();
    
    console.log('Event listeners setup complete');
}

window.addEventListener('load', function() {
    console.log('SNM initializing...');
    
    SNM.init();
    setupEventListeners();
    updateUI();
    
    // Add default cube
    setTimeout(() => {
        Editor.addCube();
        console.log('✅ SNM ready!');
        
        // Show controls
        setTimeout(() => {
            alert(`🎮 SNM Controls:
• Click objects to select
• Drag GIZMO arrows to move (red=X, green=Y, blue=Z)
• Use Move/Rotate/Scale buttons to switch modes
• Arrow keys for precise movement
• Q/E to rotate, Z/X to scale
• Space to play/pause animation`);
        }, 500);
    }, 100);
});

window.UI = { updateUI, updateObjectList, updateProperties };