// import.js - COMPLETE IMPORT HANDLER
console.log('SNM Import loading...');

// Global import manager
const ImportManager = {
    init() {
        this.setupLoaders();
        console.log('✅ ImportManager ready');
    },
    
    setupLoaders() {
        this.loaders = {};
        
        // Check what loaders are available
        if (typeof THREE !== 'undefined') {
            if (THREE.GLTFLoader) {
                this.loaders.gltf = new THREE.GLTFLoader();
                this.loaders.glb = new THREE.GLTFLoader();
                console.log('✅ GLTFLoader available');
            }
            if (THREE.OBJLoader) {
                this.loaders.obj = new THREE.OBJLoader();
                console.log('✅ OBJLoader available');
            }
            if (THREE.STLLoader) {
                this.loaders.stl = new THREE.STLLoader();
                console.log('✅ STLLoader available');
            }
        }
    },
    
    // Main import function
    importFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        console.log('Importing:', file.name, 'type:', extension);
        
        if (extension === 'json') {
            return this.importJSON(file);
        } 
        else if (extension === 'glb' || extension === 'gltf') {
            return this.importGLTF(file);
        }
        else if (extension === 'obj') {
            return this.importOBJ(file);
        }
        else if (extension === 'stl') {
            return this.importSTL(file);
        }
        else {
            return Promise.reject(`Unsupported format: .${extension}`);
        }
    },
    
    importJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            
            reader.onload = (e) => {
                try {
                    const sceneData = JSON.parse(e.target.result);
                    
                    // Clear current scene
                    SNM.objects.forEach(obj => SNM.scene.remove(obj));
                    SNM.objects = [];
                    SNM.animations = [];
                    
                    // Load objects from JSON
                    if (sceneData.objects) {
                        sceneData.objects.forEach(objData => {
                            let geometry, material;
                            
                            switch(objData.type) {
                                case 'cube':
                                    geometry = new THREE.BoxGeometry(1, 1, 1);
                                    break;
                                case 'sphere':
                                    geometry = new THREE.SphereGeometry(0.5, 32, 32);
                                    break;
                                case 'cylinder':
                                    geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
                                    break;
                                case 'plane':
                                    geometry = new THREE.PlaneGeometry(2, 2);
                                    break;
                                default:
                                    geometry = new THREE.BoxGeometry(1, 1, 1);
                            }
                            
                            const color = new THREE.Color(objData.material?.color || 0x888888);
                            material = new THREE.MeshStandardMaterial({
                                color: color,
                                metalness: objData.material?.metalness || 0.1,
                                roughness: objData.material?.roughness || 0.7
                            });
                            
                            const mesh = new THREE.Mesh(geometry, material);
                            mesh.name = objData.name;
                            if (objData.position) mesh.position.set(...objData.position);
                            if (objData.rotation) mesh.rotation.set(...objData.rotation);
                            if (objData.scale) mesh.scale.set(...objData.scale);
                            mesh.userData = objData.userData || { type: objData.type };
                            
                            SNM.scene.add(mesh);
                            SNM.objects.push(mesh);
                        });
                    }
                    
                    // Update UI
                    if (window.UI && UI.updateUI) UI.updateUI();
                    resolve(`✅ Imported: ${file.name}`);
                    
                } catch (error) {
                    reject(`Failed to load JSON: ${error.message}`);
                }
            };
            
            reader.onerror = () => reject('Failed to read file');
        });
    },
    
importGLTF(file) {
    return new Promise((resolve, reject) => {
        if (!this.loaders.gltf) {
            reject('GLTFLoader not available');
            return;
        }
        
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        
        reader.onload = (e) => {
            try {
                // FIX: Use THREE.FileLoader to handle the buffer properly
                const blob = new Blob([e.target.result]);
                const url = URL.createObjectURL(blob);
                
                // Create a manager to track loading
                const manager = new THREE.LoadingManager();
                
                manager.onProgress = (url, loaded, total) => {
                    console.log(`Loading: ${loaded}/${total} - ${url}`);
                };
                
                // Create loader with the manager
                const loader = new THREE.GLTFLoader(manager);
                
                loader.load(
                    url,
                    (gltf) => {
                        URL.revokeObjectURL(url);
                        
                        // IMPORTANT: Process ALL children, not just first level
                        this.processAllMeshes(gltf.scene, file.name);
                        
                        resolve(`✅ Imported: ${file.name}`);
                    },
                    (progress) => {
                        // Progress updates
                        console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
                    },
                    (error) => {
                        URL.revokeObjectURL(url);
                        console.error('GLTFLoader error:', error);
                        
                        // Try alternative: parse directly
                        this.tryDirectParse(e.target.result, file.name)
                            .then(resolve)
                            .catch(reject);
                    }
                );
                
            } catch (error) {
                reject(`Failed to load GLTF: ${error.message}`);
            }
        };
        
        reader.onerror = () => reject('Failed to read file');
    });
},

// Process ALL meshes in the scene hierarchy
processAllMeshes(object, filename) {
    let meshCount = 0;
    
    object.traverse((child) => {
        if (child.isMesh) {
            meshCount++;
            
            // Ensure it has a unique name
            if (!child.name || child.name === '') {
                child.name = `${filename}_mesh_${meshCount}`;
            }
            
            // Add to your scene
            SNM.scene.add(child);
            SNM.objects.push(child);
            
            // Set user data
            child.userData = child.userData || {};
            child.userData.type = 'imported';
            child.userData.source = filename;
            child.userData.originalName = child.name;
            
            // Fix: Ensure material exists
            if (!child.material) {
                child.material = new THREE.MeshStandardMaterial({ 
                    color: 0x888888 
                });
            }
        }
    });
    
    console.log(`Processed ${meshCount} meshes from ${filename}`);
    
    // Update UI
    if (window.UI && UI.updateUI) {
        UI.updateUI();
    }
},

// Alternative parsing method
tryDirectParse(arrayBuffer, filename) {
    return new Promise((resolve, reject) => {
        try {
            const loader = new THREE.GLTFLoader();
            
            loader.parse(arrayBuffer, '', (gltf) => {
                // Different approach: Add the entire scene as one object
                gltf.scene.name = filename.replace(/\.[^/.]+$/, '');
                gltf.scene.userData = { 
                    type: 'imported_group',
                    source: filename,
                    meshCount: this.countMeshes(gltf.scene)
                };
                
                // Add the whole group
                SNM.scene.add(gltf.scene);
                SNM.objects.push(gltf.scene); // Add group to objects list
                
                // Update UI
                if (window.UI && UI.updateUI) UI.updateUI();
                
                resolve(`✅ Imported as group: ${filename}`);
            }, reject);
            
        } catch (error) {
            reject(`Direct parse failed: ${error.message}`);
        }
    });
},

countMeshes(object) {
    let count = 0;
    object.traverse(child => {
        if (child.isMesh) count++;
    });
    return count;
}
    
    importOBJ(file) {
        return new Promise((resolve, reject) => {
            if (!this.loaders.obj) {
                reject('OBJLoader not available');
                return;
            }
            
            const reader = new FileReader();
            reader.readAsText(file);
            
            reader.onload = (e) => {
                try {
                    const obj = this.loaders.obj.parse(e.target.result);
                    this.addToScene(obj, file.name);
                    resolve(`✅ Imported: ${file.name}`);
                } catch (error) {
                    reject(`Failed to load OBJ: ${error.message}`);
                }
            };
            
            reader.onerror = () => reject('Failed to read file');
        });
    },
    
    importSTL(file) {
        return new Promise((resolve, reject) => {
            if (!this.loaders.stl) {
                reject('STLLoader not available');
                return;
            }
            
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            
            reader.onload = (e) => {
                try {
                    const geometry = this.loaders.stl.parse(e.target.result);
                    const material = new THREE.MeshStandardMaterial({ 
                        color: 0x888888,
                        metalness: 0.2,
                        roughness: 0.8
                    });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.name = file.name.replace(/\.[^/.]+$/, '');
                    mesh.userData = { type: 'imported', source: file.name };
                    
                    this.normalizeModel(mesh);
                    SNM.scene.add(mesh);
                    SNM.objects.push(mesh);
                    
                    if (window.UI && UI.updateUI) UI.updateUI();
                    resolve(`✅ Imported: ${file.name}`);
                    
                } catch (error) {
                    reject(`Failed to load STL: ${error.message}`);
                }
            };
            
            reader.onerror = () => reject('Failed to read file');
        });
    },
    
    addToScene(object, filename) {
        object.name = filename.replace(/\.[^/.]+$/, '');
        object.userData = { type: 'imported', source: filename };
        
        this.normalizeModel(object);
        
        // Add all meshes to scene
        object.traverse((child) => {
            if (child.isMesh) {
                SNM.scene.add(child);
                SNM.objects.push(child);
            }
        });
        
        if (window.UI && UI.updateUI) UI.updateUI();
    },
    
    normalizeModel(model) {
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const maxSize = Math.max(size.x, size.y, size.z);
        if (maxSize > 0) {
            const scale = 2 / maxSize;
            model.scale.setScalar(scale);
            model.position.sub(center.multiplyScalar(scale));
        }
        
        model.position.y = 0;
    },
    
    // Simple file picker
    openFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.glb,.gltf,.obj,.stl';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importFile(file)
                    .then(message => {
                        alert(message);
                    })
                    .catch(error => {
                        alert(`❌ ${error}`);
                    });
            }
        };
        
        input.click();
    }
};

// Initialize and expose
ImportManager.init();
window.ImportManager = ImportManager;
window.importModel = () => ImportManager.openFilePicker();

console.log('✅ SNM Import loaded');
