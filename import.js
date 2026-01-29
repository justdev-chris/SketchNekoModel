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
        if (typeof THREE !== 'undefined' && THREE.GLTFLoader) {
            this.loaders.gltf = new THREE.GLTFLoader();
            this.loaders.glb = new THREE.GLTFLoader();
            console.log('✅ GLTFLoader loaded');
        } else {
            console.warn('❌ GLTFLoader not available');
        }
        
        // OBJ loader
        if (typeof THREE !== 'undefined' && THREE.OBJLoader) {
            this.loaders.obj = new THREE.OBJLoader();
            console.log('✅ OBJLoader loaded');
        } else {
            console.warn('❌ OBJLoader not available');
        }
        
        // STL loader
        if (typeof THREE !== 'undefined' && THREE.STLLoader) {
            this.loaders.stl = new THREE.STLLoader();
            console.log('✅ STLLoader loaded');
        } else {
            console.warn('❌ STLLoader not available');
        }
    }
    
    importFile(file) {
        return new Promise((resolve, reject) => {
            const extension = file.name.split('.').pop().toLowerCase();
            
            console.log('Importing:', file.name, 'format:', extension);
            
            if (!this.supportedFormats.includes(extension)) {
                reject(`Unsupported format: .${extension}. Use: ${this.supportedFormats.join(', ')}`);
                return;
            }
            
            if (!this.loaders[extension]) {
                reject(`Loader for .${extension} not available. Check console.`);
                return;
            }
            
            const reader = new FileReader();
            
            if (extension === 'glb' || extension === 'gltf') {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsText(file);
            }
            
            reader.onload = (e) => {
                try {
                    this.parseFile(e.target.result, extension, file.name)
                        .then(resolve)
                        .catch(reject);
                } catch (error) {
                    reject('Parse error: ' + error.message);
                }
            };
            
            reader.onerror = () => reject('Failed to read file');
        });
    }
    
    parseFile(data, format, filename) {
        return new Promise((resolve, reject) => {
            const loader = this.loaders[format];
            if (!loader) {
                reject(`No loader for ${format}`);
                return;
            }
            
            try {
                if (format === 'glb' || format === 'gltf') {
                    // Binary data for GLB/GLTF
                    loader.parse(data, '', (gltf) => {
                        const model = this.processGLTF(gltf, filename);
                        resolve(model);
                    }, reject);
                } else if (format === 'obj') {
                    // Text data for OBJ
                    const model = loader.parse(data);
                    this.processImportedModel(model, filename);
                    resolve(model);
                } else if (format === 'stl') {
                    // Binary or text for STL
                    const geometry = loader.parse(data);
                    const material = new THREE.MeshStandardMaterial({ 
                        color: 0x888888,
                        metalness: 0.2,
                        roughness: 0.8
                    });
                    const model = new THREE.Mesh(geometry, material);
                    this.processImportedModel(model, filename);
                    resolve(model);
                }
            } catch (error) {
                reject('Parse failed: ' + error.message);
            }
        });
    }
    
    processGLTF(gltf, filename) {
        const model = gltf.scene || gltf;
        model.name = filename.replace(/\.[^/.]+$/, '');
        
        // Scale and center
        this.normalizeModel(model);
        
        // Add to scene
        if (window.SNM && SNM.scene) {
            SNM.scene.add(model);
            SNM.objects.push(model);
            
            // Select it
            if (window.Editor && Editor.selectObject) {
                Editor.selectObject(model);
            }
        }
        
        console.log(`✅ Imported GLTF: ${filename}`);
        return model;
    }
    
    processImportedModel(model, filename) {
        model.name = filename.replace(/\.[^/.]+$/, '');
        model.userData = { type: 'imported', source: filename };
        
        // Scale and center
        this.normalizeModel(model);
        
        // Add to scene
        if (window.SNM && SNM.scene) {
            SNM.scene.add(model);
            SNM.objects.push(model);
            
            // Select it
            if (window.Editor && Editor.selectObject) {
                Editor.selectObject(model);
            }
        }
        
        console.log(`✅ Imported model: ${filename}`);
        return model;
    }
    
    normalizeModel(model) {
        // Calculate bounding box
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Scale to reasonable size
        const maxSize = Math.max(size.x, size.y, size.z);
        if (maxSize > 0) {
            const scale = 2 / maxSize;
            model.scale.setScalar(scale);
            
            // Center the model
            model.position.sub(center.multiplyScalar(scale));
        }
        
        model.position.y = 0;
    }
    
    // SIMPLE FILE PICKER - NO PROMISE BULLSHIT
    openFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.gltf,.glb,.obj,.stl';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importFile(file)
                    .then(() => {
                        // Update UI after successful import
                        if (window.UI && UI.updateUI) {
                            UI.updateUI();
                        }
                        alert(`✅ Successfully imported: ${file.name}`);
                    })
                    .catch(error => {
                        alert(`❌ Import failed: ${error}`);
                    });
            }
        };
        
        input.click();
        return true; // Simple return, no Promise
    }
}

// Create global instance IMMEDIATELY
if (typeof window !== 'undefined') {
    window.ModelImporter = new ModelImporter();
    
    // Simple global function
    window.importModel = function() {
        if (window.ModelImporter) {
            return ModelImporter.openFilePicker();
        } else {
            alert('ModelImporter not loaded');
            return false;
        }
    };
}

console.log('✅ SNM Import loaded - ModelImporter ready');
