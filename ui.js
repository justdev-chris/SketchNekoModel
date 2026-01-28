// ui.js - UI updates and event listeners

function updateUI() {
    updateObjectList();
    updateProperties();
    updateTimeline();
}

function updateObjectList() {
    const list = document.getElementById('object-list');
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
    props.innerHTML = '';
    
    if (!SNM.selectedObject) {
        props.innerHTML = '<p>Select an object to edit properties</p>';
        return;
    }
    
    // Position controls
    const posGroup = document.createElement('div');
    posGroup.className = 'property-group';
    posGroup.innerHTML = '<h4>Transform</h4>';
    
    ['X', 'Y', 'Z'].forEach((axis, idx) => {
        const row = document.createElement('div');
        row.className = 'property-row';
        
        const label = document.createElement('label');
        label.textContent = `Pos ${axis}:`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '0.1';
        input.value = SNM.selectedObject.position.getComponent(idx).toFixed(2);
        input.oninput = (e) => {
            SNM.selectedObject.position.setComponent(idx, parseFloat(e.target.value));
            if (SNM.selectedObject.userData.boxHelper) {
                SNM.selectedObject.userData.boxHelper.update();
            }
        };
        
        row.appendChild(label);
        row.appendChild(input);
        posGroup.appendChild(row);
    });
    
    props.appendChild(posGroup);
    
    // Color picker
    const colorGroup = document.createElement('div');
    colorGroup.className = 'property-group';
    colorGroup.innerHTML = '<h4>Material</h4>';
    
    const colorRow = document.createElement('div');
    colorRow.className = 'property-row';
    
    const colorLabel = document.createElement('label');
    colorLabel.textContent = 'Color:';
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = '#' + SNM.selectedObject.material.color.getHexString();
    colorInput.oninput = (e) => {
        SNM.selectedObject.material.color.set(e.target.value);
    };
    
    colorRow.appendChild(colorLabel);
    colorRow.appendChild(colorInput);
    colorGroup.appendChild(colorRow);
    props.appendChild(colorGroup);
}

function updateTimeline() {
    const track = document.getElementById('keyframe-track');
    track.innerHTML = '';
    
    if (SNM.selectedObject) {
        const anim = SNM.animations.find(a => a.object === SNM.selectedObject);
        if (anim) {
            anim.keyframes.forEach(kf => {
                const keyframe = document.createElement('div');
                keyframe.className = 'keyframe';
                keyframe.style.left = `${kf.time * 10}%`;
                keyframe.title = `Time: ${kf.time.toFixed(1)}s`;
                track.appendChild(keyframe);
            });
        }
    }
}

function setupEventListeners() {
    // Toolbar buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.onclick = (e) => {
            const tool = e.target.dataset.tool;
            
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
        };
    });
    
    // Timeline controls
    document.getElementById('play').onclick = Editor.togglePlayback;
    document.getElementById('add-keyframe').onclick = Editor.addKeyframe;
    
    document.getElementById('time-slider').oninput = (e) => {
        const time = parseFloat(e.target.value) / 10;
        SNM.currentTime = time;
        document.getElementById('time-display').textContent = time.toFixed(1) + 's';
        
        if (!SNM.isPlaying) {
            SNM.updateAnimations(time);
        }
    };
    
    // Click on viewport to select/deselect
    document.getElementById('viewport').onclick = (e) => {
        // Basic raycasting for object selection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        const rect = e.target.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, SNM.camera);
        const intersects = raycaster.intersectObjects(SNM.objects);
        
        if (intersects.length > 0) {
            Editor.selectObject(intersects[0].object);
        } else if (e.target.id === 'viewport') {
            // Clicked empty space - deselect
            if (SNM.selectedObject && SNM.selectedObject.userData.boxHelper) {
                SNM.scene.remove(SNM.selectedObject.userData.boxHelper);
                SNM.selectedObject = null;
                updateUI();
            }
        }
    };
}

// Initialize everything when page loads
window.onload = () => {
    SNM.init();
    setupEventListeners();
    updateUI();
};

// Make UI functions available
window.UI = { updateUI, updateObjectList, updateProperties, updateTimeline };