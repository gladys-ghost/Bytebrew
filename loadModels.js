import * as THREE from 'three';

export class ModelLoader {
    constructor(scene, ghostManager) {
        this.scene = scene;
        this.ghostManager = ghostManager;
        this.loader = new THREE.GLTFLoader();
        
        // Store loaded models and animations
        this.models = {
            player: null,
            gun: null,
            bullet: null
        };
        
        this.mixer = null;
        this.animations = {
            walk: null,
            shoot: null
        };
        
        // Event handlers
        this.onLoadComplete = null;
        this.onProgress = null;
        this.onError = null;
    }
    
    setEventHandlers(onLoadComplete, onProgress, onError) {
        this.onLoadComplete = onLoadComplete;
        this.onProgress = onProgress;
        this.onError = onError;
    }
    
    async loadAllModels() {
        try {
            await this.loadPlayerModel();
            await this.loadGunModel();
            await this.loadBulletModel();
            
            if (this.onLoadComplete) {
                this.onLoadComplete(this.models);
            }
        } catch (error) {
            if (this.onError) {
                this.onError(error);
            } else {
                console.error('Error loading models:', error);
            }
        }
    }
    
    async loadPlayerModel() {
        return new Promise((resolve, reject) => {
            this.loader.load(
                "./public/obn_2.glb",
                (gltf) => {
                    const model = gltf.scene;
                    
                    // Setup model
                    model.scale.set(0.3, 0.3, 0.3);
                    model.rotation.y = Math.PI;
                    model.position.set(0, 0, 0);
                    
                    // Setup shadows
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    this.scene.add(model);
                    this.models.player = model;
                    
                    // Setup ghost manager
                    if (this.ghostManager) {
                        this.ghostManager.setTarget(model.position);
                        this.ghostManager.startSpawning(5000, 5);
                    }
                    
                    // Setup animations
                    this.setupAnimations(gltf);
                    
                    resolve(model);
                },
                (xhr) => {
                    if (this.onProgress) {
                        this.onProgress('player', (xhr.loaded / xhr.total) * 100);
                    }
                },
                reject
            );
        });
    }
    
    async loadGunModel() {
        return new Promise((resolve, reject) => {
            this.loader.load(
                './public/gun.glb',
                (gltf) => {
                    const gunModel = gltf.scene;
                    gunModel.scale.set(3.5, 3.5, 3.5);
                    
                    // Setup shadows
                    gunModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    this.models.gun = gunModel;
                    this.attachGunToPlayer();
                    
                    resolve(gunModel);
                },
                (xhr) => {
                    if (this.onProgress) {
                        this.onProgress('gun', (xhr.loaded / xhr.total) * 100);
                    }
                },
                reject
            );
        });
    }
    
    async loadBulletModel() {
        return new Promise((resolve, reject) => {
            this.loader.load(
                "./public/bullet.glb",
                (gltf) => {
                    const bulletModel = gltf.scene;
                    bulletModel.scale.set(0.05, 0.05, 0.05);
                    this.models.bullet = bulletModel;
                    resolve(bulletModel);
                },
                (xhr) => {
                    if (this.onProgress) {
                        this.onProgress('bullet', (xhr.loaded / xhr.total) * 100);
                    }
                },
                reject
            );
        });
    }
    
    setupAnimations(gltf) {
        if (!gltf.animations || !gltf.animations.length) return;
        
        this.mixer = new THREE.AnimationMixer(this.models.player);
        
        // Setup walk animation
        const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'npc_walk_pistol');
        if (walkClip) {
            this.animations.walk = this.mixer.clipAction(walkClip);
            this.animations.walk.setLoop(THREE.LoopRepeat, Infinity);
            this.animations.walk.play();
            this.animations.walk.paused = true;
        } else {
            console.warn('Walk animation "npc_walk_pistol" not found. Using first available animation.');
            this.animations.walk = this.mixer.clipAction(gltf.animations[0]);
            this.animations.walk.setLoop(THREE.LoopRepeat, Infinity);
            this.animations.walk.play();
            this.animations.walk.paused = true;
        }
        
        // Setup shoot animation
        const shootClip = THREE.AnimationClip.findByName(gltf.animations, 'npc_shooting_pistol');
        if (shootClip) {
            this.animations.shoot = this.mixer.clipAction(shootClip);
            this.animations.shoot.setLoop(THREE.LoopOnce, 1);
            this.animations.shoot.clampWhenFinished = true;
            this.animations.shoot.stop();
        }
    }
    
    attachGunToPlayer() {
        if (!this.models.player || !this.models.gun) {
            console.warn('Cannot attach gun: player or gun model not loaded');
            return;
        }
        
        const handBone = this.models.player.getObjectByName('mixamorigRightHand');
        if (handBone) {
            handBone.add(this.models.gun);
            this.models.gun.position.set(0.1, 0.6, 0.35);
            
            const lookDirection = new THREE.Vector3(
                Math.sin(this.models.player.rotation.y),
                0,
                Math.cos(this.models.player.rotation.y)
            ).normalize();
            
            const gunRotation = new THREE.Quaternion();
            gunRotation.setFromUnitVectors(new THREE.Vector3(-4.5, 5, -0.4), lookDirection);
            this.models.gun.quaternion.copy(gunRotation);
        } else {
            console.warn('Hand bone not found, attaching gun to player body');
            this.models.gun.position.set(0.5, 1.2, 0.3);
            this.models.player.add(this.models.gun);
        }
    }
    
    // Utility methods
    getModel(modelName) {
        return this.models[modelName];
    }
    
    getAnimation(animationName) {
        return this.animations[animationName];
    }
    
    getMixer() {
        return this.mixer;
    }
    
    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
}