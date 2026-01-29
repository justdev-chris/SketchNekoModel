// import.js - COMPLETE WORKING IMPORT
console.log('SNM Import loading...');

const ImportManager = {
    init() {
        this.setupLoaders();
        console.log('✅ ImportManager ready');
    },
    
    setupLoaders() {
        this.loaders = {};
        if (typeof THREE !== 'undefined') {
            if (THREE.GLTFLoader) {
                this.loaders.gltf = new THREE.GLTFLoader();
                this.loaders.glb = new THREE.GLTFLoader();
            }
            if (THREE.OBJLoader) this.loaders.obj = new THREE.OBJLoader();
            if (THREE.STLLoader) this.loaders.stl = new THREE.STLLoader();
        }
    },
    
    importFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        console.log('Importing:', file.name, 'type:', extension);
        
        if (extension === 'json') return this.importJSON(file);
        else if (extension === 'glb' || extension === 'gltf') return this.importGLTF(file);
        else if (extension === 'obj') return this.importOBJ(file);
        else if (extension === 'stl') return this.importSTL(file);
        else return Promise.reject(`Unsupported: .${extension}`);
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
                    
                    // Load objects
                    if (sceneData.objects) {
                        sceneData.objects.forEach(objData => {
                            let geometry;
                            switch(objData.type) {
                                case 'cube': geometry = new THREE.BoxGeometry(1, 1, 1); break;
                                case 'sphere': geometry = new THREE.SphereGeometry(0.5, 32, 32); break;
                                case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
                                case 'plane': geometry = new THREE.PlaneGeometry(2, 2); break;
                                default: geometry = new THREE.BoxGeometry(1, 1, 1);
                            }
                            
                            const color = new THREE.Color(objData.material?.color || 0x888888);
                            const material = new THREE.MeshStandardMaterial({
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
                    const blob = new Blob([e.target.result]);
                    const url = URL.createObjectURL(blob);
                    
                    const loader = new THREE.GLTFLoader();
                    
                    loader.load(
                        url,
                        (gltf) => {
                            URL.revokeObjectURL(url);
                            
                            const scene = gltf.scene || gltf.scenes?.[0] || gltf;
                            if (!scene) {
                                reject('No scene found');
                                return;
                            }
                            
                            let meshCount = 0;
                            
                            if (scene.traverse) {
                                scene.traverse((child) => {
                                    if (child.isMesh) {
                                        meshCount++;
                                        SNM.scene.add(child);
                                        SNM.objects.push(child);
                                        child.userData = { type: 'imported', source: file.name };
                                    }
                                });
                            } else if (scene.isMesh) {
                                meshCount = 1;
                                SNM.scene.add(scene);
                                SNM.objects.push(scene);
                                scene.userData = { type: 'imported', source: file.name };
                            }
                            
                            if (meshCount > 0) {
                                if (window.UI && UI.updateUI) UI.updateUI();
                                resolve(`✅ Imported ${meshCount} mesh(es)`);
                            } else {
                                reject('No meshes found');
                            }
                        },
                        undefined,
                        (error) => {
                            URL.revokeObjectURL(url);
                            reject(`Failed: ${error.message}`);
                        }
                    );
                    
                } catch (error) {
                    reject(`Failed to process: ${error.message}`);
                }
            };
            
            reader.onerror = () => reject('Failed to read file');
        });
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
                    reject(`Failed: ${error.message}`);
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
                    reject(`Failed: ${error.message}`);
                }
            };
            
            reader.onerror = () => reject('Failed to read file');
        });
    },
    
    addToScene(object, filename) {
        object.name = filename.replace(/\.[^/.]+$/, '');
        object.userData = { type: 'imported', source: filename };
        this.normalizeModel(object);
        
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
    
    openFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.glb,.gltf,.obj,.stl';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importFile(file)
                    .then(msg => alert(msg))
                    .catch(err => alert(`❌ ${err}`));
            }
        };
        
        input.click();
    }
};

ImportManager.init();
window.ImportManager = ImportManager;
window.importModel = () => ImportManager.openFilePicker();

console.log('✅ SNM Import loaded');
