// import.js - Handles importing 3D models
console.log('SNM Import loading...');

class ModelImporter {
    constructor() {
        this.supportedFormats = ['gltf', 'glb', 'obj', 'stl'];
        this.loaders = {};
        this.setupLoaders();
    }
    
    setupLoaders() {
        // GLTF/GLB loader
        if (THREE.GLTFLoader) {
            this.loaders.gltf = new THREE.GLTFLoader();
            this.loaders.glb = new THREE.GLTFLoader();
        }
        
        // OBJ loader
        if (THREE.OBJLoader) {
            this.loaders.obj = new THREE.OBJLoader();
        }
        
        // FBX loader (would need FBXLoader library)
        // STL loader
        if (THREE.STLLoader) {
            this.loaders.stl = new THREE.STLLoader();
        }
    }
    
    importFile(file) {
        return new Promise((resolve, reject) => {
            const extension = file.name.split('.').pop().toLowerCase();
            const reader = new FileReader();
            
            if (!this.loaders[extension]) {
                reject(`Unsupported format: .${extension}`);
                return;
            }
            
            if (extension === 'gltf' || extension === 'glb') {
                reader.readAsArrayBuffer(file);
                reader.onload = (e) => {
                    this.loadGLTF(e.target.result, extension === 'glb', file.name)
                        .then(resolve)
                        .catch(reject);
                };
            } else {
                reader.readAsText(file);
                reader.onload = (e) => {
                    this.loadTextBased(e.target.result, extension, file.name)
                        .then(resolve)
                        .catch(reject);
                };
            }
            
            reader.onerror = () => reject('Failed to read file');
        });
    }
    
    loadGLTF(data, binary, filename) {
        return new Promise((resolve, reject) => {
            if (!this.loaders.gltf) {
                reject('GLTFLoader not available');
                return;
            }
            
            const loader = this.loaders.gltf;
            const blob = new Blob([data]);
            const url = URL.createObjectURL(blob);
            
            loader.load(url, (gltf) => {
                URL.revokeObjectURL(url);
                
                // Process imported model
                const model = this.processGLTF(gltf, filename);
                resolve(model);
            }, undefined, reject);
        });
    }
    
    loadTextBased(data, format, filename) {
        return new Promise((resolve, reject) => {
            const loader = this.loaders[format];
            if (!loader) {
                reject(`Loader for .${format} not available`);
                return;
            }
            
            try {
                let model;
                
                if (format === 'obj') {
                    model = loader.parse(data);
                } else if (format === 'stl') {
                    const geometry = loader.parse(data);
                    const material = new THREE.MeshStandardMaterial({ 
                        color: 0x888888,
                        metalness: 0.2,
                        roughness: 0.8
                    });
                    model = new THREE.Mesh(geometry, material);
                }
                
                if (model) {
                    this.processImportedModel(model, filename);
                    resolve(model);
                } else {
                    reject('Failed to parse model');
                }
            } catch (error) {
                reject(error.message);
            }
        });
    }
    
    processGLTF(gltf, filename) {
        const model = gltf.scene || gltf;
        model.name = filename.replace(/\.[^/.]+$/, ''); // Remove extension
        
        // Scale and position
        model.scale.set(1, 1, 1);
        model.position.set(0, 0, 0);
        
        // Add to scene
        SNM.scene.add(model);
        SNM.objects.push(model);
        
        // Select the model
        if (window.Editor && Editor.selectObject) {
            Editor.selectObject(model);
        }
        
        console.log(`✅ Imported: ${filename}`);
        return model;
    }
    
    processImportedModel(model, filename) {
        model.name = filename.replace(/\.[^/.]+$/, '');
        model.userData = { type: 'imported', source: filename };
        
        // Scale to reasonable size
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxSize; // Scale to fit in 2 units
        
        model.scale.setScalar(scale);
        model.position.set(0, 0, 0);
        
        // Center the model
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center.multiplyScalar(scale));
        
        // Add to scene
        SNM.scene.add(model);
        SNM.objects.push(model);
        
        // Select it
        if (window.Editor && Editor.selectObject) {
            Editor.selectObject(model);
        }
        
        console.log(`✅ Imported: ${filename}`);
        return model;
    }
    
    // Simple file picker
    openFilePicker() {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.gltf,.glb,.obj,.stl,.fbx';
            input.multiple = false;
            
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importFile(file)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject('No file selected');
                }
            };
            
            input.click();
        });
    }
    
    // Drag and drop support
    setupDragDrop(dropZone) {
        if (!dropZone) return;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.style.backgroundColor = 'rgba(0, 100, 255, 0.2)';
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.style.backgroundColor = '';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.style.backgroundColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                this.importFile(file)
                    .then(() => {
                        if (window.UI && window.UI.updateUI) {
                            window.UI.updateUI();
                        }
                        alert(`Successfully imported: ${file.name}`);
                    })
                    .catch(error => {
                        alert(`Import failed: ${error}`);
                    });
            }
        });
    }
}

// Create global instance
window.ModelImporter = new ModelImporter();

// Helper functions
window.importModel = function() {
    return ModelImporter.openFilePicker();
};

window.setupDragDrop = function(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        ModelImporter.setupDragDrop(element);
    }
};

console.log('✅ SNM Import loaded');
