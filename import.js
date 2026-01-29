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
        
        console.log('🔍 GLTF loaded structure:', {
            hasScene: !!gltf.scene,
            scenesCount: gltf.scenes ? gltf.scenes.length : 0,
            scenesArray: gltf.scenes,
            parserExists: !!gltf.parser,
            gltfObject: gltf
        });
        
        // Determine what to process
        let sceneToProcess = null;
        
        // Option 1: Direct scene property
        if (gltf.scene && gltf.scene.isObject3D) {
            console.log('✅ Using gltf.scene');
            sceneToProcess = gltf.scene;
        }
        // Option 2: Scenes array
        else if (gltf.scenes && gltf.scenes.length > 0) {
            console.log('✅ Using gltf.scenes[0]');
            sceneToProcess = gltf.scenes[0];
            
            // If first scene is not Object3D but has nodes
            if (!sceneToProcess.isObject3D && sceneToProcess.nodes) {
                sceneToProcess = this.buildSceneFromNodes(sceneToProcess.nodes);
            }
        }
        // Option 3: Parser JSON data
        else if (gltf.parser && gltf.parser.json) {
            console.log('✅ Building from parser.json');
            sceneToProcess = this.buildSceneFromGLTFJSON(gltf.parser.json);
        }
        // Option 4: GLTF might be the scene itself
        else if (gltf.isObject3D || gltf.isMesh || gltf.isGroup) {
            console.log('✅ GLTF is the scene itself');
            sceneToProcess = gltf;
        }
        // Option 5: Check for any Object3D in gltf
        else {
            // Look for any Object3D property
            for (const key in gltf) {
                if (gltf[key] && gltf[key].isObject3D) {
                    console.log(`✅ Found scene at gltf.${key}`);
                    sceneToProcess = gltf[key];
                    break;
                }
            }
        }
        
        if (sceneToProcess) {
            console.log('🎯 Processing scene:', sceneToProcess);
            const meshCount = this.processAllMeshes(sceneToProcess, file.name);
            
            if (meshCount > 0) {
                resolve(`✅ Successfully imported ${meshCount} mesh(es) from ${file.name}`);
            } else {
                // Try brute force - check all properties for meshes
                console.log('⚠️ No meshes found, searching all properties...');
                this.bruteForceFindMeshes(gltf, file.name)
                    .then(count => {
                        if (count > 0) {
                            resolve(`✅ Found ${count} mesh(es) in ${file.name}`);
                        } else {
                            reject('No 3D meshes found in file');
                        }
                    })
                    .catch(reject);
            }
        } else {
            console.error('❌ No scene found in GLTF:', gltf);
            reject('File contains no 3D scene data');
        }
    },
    // Progress callback
    (progress) => {
        if (progress.lengthComputable) {
            const percent = (progress.loaded / progress.total * 100).toFixed(1);
            console.log(`📥 Loading: ${percent}%`);
        }
    },
    // Error callback
    (error) => {
        URL.revokeObjectURL(url);
        console.error('❌ GLTFLoader failed:', error);
        
        // Try alternative method
        console.log('🔄 Trying alternative load method...');
        this.alternativeGLTFLoad(file)
            .then(resolve)
            .catch((altError) => {
                reject(`Failed to load: ${error.message || 'Unknown error'}. Alternative also failed: ${altError.message}`);
            });
    }
);

// Process ALL meshes in the scene hierarchy
processAllMeshes(object, filename) {
    // FIX: Check if object exists
    if (!object) {
        console.error('❌ Cannot process: object is null/undefined');
        return 0;
    }
    
    let meshCount = 0;
    
    // FIX: Check if object has traverse method
    if (object.traverse && typeof object.traverse === 'function') {
        object.traverse((child) => {
            if (child && child.isMesh) {
                meshCount++;
                this.addMeshToScene(child, filename, meshCount);
            }
        });
    } 
    // FIX: If no traverse, check if object itself is a mesh
    else if (object.isMesh) {
        meshCount = 1;
        this.addMeshToScene(object, filename, 1);
    }
    // FIX: If it's a Group or Object3D with children array
    else if (object.children && Array.isArray(object.children)) {
        object.children.forEach((child, index) => {
            if (child && child.isMesh) {
                meshCount++;
                this.addMeshToScene(child, filename, meshCount);
            }
        });
    }
    
    console.log(`✅ Processed ${meshCount} meshes from ${filename}`);
    
    // Update UI
    if (window.UI && UI.updateUI) {
        UI.updateUI();
    }
    
    return meshCount;
}

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
