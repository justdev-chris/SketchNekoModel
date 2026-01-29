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
                            
                            console.log('🔍 GLTF loaded:', gltf);
                            
                            // FIXED: Find scene properly
                            let scene = null;
                            
                            // Try different locations for the scene
                            if (gltf.scene) {
                                scene = gltf.scene;
                            } else if (gltf.scenes && gltf.scenes.length > 0) {
                                scene = gltf.scenes[0];
                            } else if (gltf.parser && gltf.parser.json) {
                                // Try to extract from JSON
                                console.log('Using parser JSON');
                                scene = this.extractSceneFromGLTFJSON(gltf.parser.json);
                            } else {
                                // GLTF might be the scene itself
                                scene = gltf;
                            }
                            
                            if (!scene) {
                                reject('GLTF file contains no scene data');
                                return;
                            }
                            
                            console.log('Scene to process:', scene);
                            
                            // Process all meshes
                            let meshCount = 0;
                            
                            if (scene.traverse && typeof scene.traverse === 'function') {
                                scene.traverse((child) => {
                                    if (child && child.isMesh) {
                                        meshCount++;
                                        this.addMeshToScene(child, file.name, meshCount);
                                    }
                                });
                            } else if (scene.isMesh) {
                                // Single mesh
                                meshCount = 1;
                                this.addMeshToScene(scene, file.name, 1);
                            } else if (scene.children && Array.isArray(scene.children)) {
                                // Check children array
                                scene.children.forEach((child, idx) => {
                                    if (child && child.isMesh) {
                                        meshCount++;
                                        this.addMeshToScene(child, file.name, meshCount);
                                    }
                                });
                            }
                            
                            if (meshCount > 0) {
                                console.log(`✅ Processed ${meshCount} meshes`);
                                if (window.UI && UI.updateUI) UI.updateUI();
                                resolve(`✅ Imported ${meshCount} mesh(es) from ${file.name}`);
                            } else {
                                reject('No meshes found in GLTF file');
                            }
                        },
                        (progress) => {
                            // Progress updates
                            if (progress.lengthComputable) {
                                console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
                            }
                        },
                        (error) => {
                            URL.revokeObjectURL(url);
                            console.error('GLTFLoader error:', error);
                            reject(`Failed to load GLTF: ${error.message}`);
                        }
                    );
                    
                } catch (error) {
                    reject(`Failed to process GLTF: ${error.message}`);
                }
            };
            
            reader.onerror = () => reject('Failed to read file');
        });
    },
    
    addMeshToScene(mesh, filename, index) {
        // Ensure unique name
        if (!mesh.name || mesh.name === '') {
            mesh.name = `${filename.replace(/\.[^/.]+$/, '')}_${index}`;
        }
        
        // Add to scene
        SNM.scene.add(mesh);
        SNM.objects.push(mesh);
        
        // Set user data
        mesh.userData = mesh.userData || {};
        mesh.userData.type = 'imported';
        mesh.userData.source = filename;
        mesh.userData.index = index;
        
        return mesh;
    },
    
    extractSceneFromGLTFJSON(json) {
        // Create a simple scene from GLTF JSON data
        const scene = new THREE.Scene();
        
        if (json.nodes && Array.isArray(json.nodes)) {
            json.nodes.forEach((nodeData, idx) => {
                if (nodeData.mesh !== undefined && json.meshes && json.meshes[nodeData.mesh]) {
                    // Create a placeholder mesh
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
                    const mesh = new THREE.Mesh(geometry, material);
                    mesh.name = `Node_${idx}`;
                    scene.add(mesh);
                }
            });
        }
        
        return scene;
    },
    
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
