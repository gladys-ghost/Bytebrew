import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

class GhostManager {
    constructor(scene) {
        this.scene = scene;
        this.ghosts = [];
        this.loader = new GLTFLoader();
        this.targetPosition = new THREE.Vector3(0, 0, 0);
        this.spawnInterval = null;
        this.boundingBox = {
            minX: -100,
            maxX: 100,
            minZ: -100,
            maxZ: 100
        };
        this.hitSound = new Audio('/shot.mp3');
        this.deathSound = new Audio('/die.mp3');
    }


    setTarget(target) {
        this.targetPosition = target;
    }

    getTargetPosition() {
        if (this.targetPosition instanceof THREE.Object3D) {
            return this.targetPosition.position;
        }
        return this.targetPosition;
    }

    getRandomPosition() {
        return [
            Math.random() * (this.boundingBox.maxX - this.boundingBox.minX) + this.boundingBox.minX,
            5,
            Math.random() * (this.boundingBox.maxZ - this.boundingBox.minZ) + this.boundingBox.minZ
        ];
    }

    createGhost(position) {
        this.loader.load('./scp-096_original/scene.gltf', (gltf) => {
            const ghostModel = gltf.scene;
            const ghostData = {
                model: ghostModel,
                mixer: new THREE.AnimationMixer(ghostModel),
                animations: gltf.animations,
                hitCount: 0,
                health: 100,
                isHit: false,
                isDying: false
            };

            // Setup ghost model
            ghostModel.position.set(position[0], 0, position[2]);
            ghostModel.scale.set(1.1, 1.1, 1.1);
            ghostModel.rotation.set(0, Math.random() * Math.PI * 2, 0);
            
            // Add shadow casting
            ghostModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(ghostModel);

            // Start walk animation
            if (gltf.animations && gltf.animations.length > 0) {
                const walkAction = ghostData.mixer.clipAction(gltf.animations[5]);
                walkAction.play();
            }

            this.ghosts.push(ghostData);
        }, 
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('An error happened while loading the ghost model:', error);
        });
    }

    playHitAnimation(ghost) {
        if (!ghost.mixer || !ghost.animations || ghost.isDying) return;

        ghost.isHit = true;
        ghost.health -= 34;

        // Play hit sound
        this.hitSound.currentTime = 0;
        this.hitSound.play().catch(e => console.log("Error playing hit sound:", e));

        // Stop current animations and play hit animation
        ghost.mixer.stopAllAction();
        const hitAction = ghost.mixer.clipAction(ghost.animations[4]);
        console.log(ghost.animations);
        hitAction.setLoop(THREE.LoopOnce);
        hitAction.clampWhenFinished = true;
        hitAction.reset().play();

        if (ghost.health <= 0) {
            this.playDeathAnimation(ghost);
            return;
        }

        // Resume movement after hit animation
        setTimeout(() => {
            ghost.isHit = false;
            ghost.mixer.stopAllAction();
            const walkAction = ghost.mixer.clipAction(ghost.animations[5]);
            walkAction.reset().play();
        }, 1000);
    }

    playDeathAnimation(ghost) {
        if (!ghost.mixer || !ghost.animations || ghost.isDying) return;

        ghost.isDying = true;
        
        // Play death sound
        this.deathSound.currentTime = 0;
        this.deathSound.play().catch(e => console.log("Error playing death sound:", e));

        // Play death animation
        ghost.mixer.stopAllAction();
        const deathAction = ghost.mixer.clipAction(ghost.animations[1]);
        deathAction.setLoop(THREE.LoopOnce);
        deathAction.clampWhenFinished = true;
        deathAction.reset().play();

        setTimeout(() => {
            const index = this.ghosts.findIndex(g => g === ghost);
            if (index !== -1) {
                this.removeGhost(index);
            }
        }, 2000);
    }

    moveGhosts(delta) {
        const targetPos = this.getTargetPosition();
        
        this.ghosts.forEach(ghost => {
            if (!ghost.model || !ghost.mixer || ghost.isHit || ghost.isDying) {
                if (ghost.mixer) {
                    ghost.mixer.update(delta);
                }
                return;
            }
            
            const ghostPosition = ghost.model.position;
            const distance = ghostPosition.distanceTo(targetPos);
            const speed = 0.03;

            // Calculate direction to target
            const direction = new THREE.Vector3()
                .subVectors(targetPos, ghostPosition)
                .normalize();

            // Move ghost
            ghost.model.position.add(direction.multiplyScalar(speed));
            
            // Make ghost face movement direction
            ghost.model.lookAt(targetPos.x, ghostPosition.y, targetPos.z);

            // Update animation
            ghost.mixer.update(delta);

            if (ghost.animations && ghost.animations.length > 0) {
                const walkAction = ghost.mixer.clipAction(ghost.animations[5]);
                if (!walkAction.isRunning()) {
                    walkAction.reset().play();
                }
            }
        });
    }

    startSpawning(interval = 5000, maxGhosts = 10) {
        this.stopSpawning();
        
        this.spawnInterval = setInterval(() => {
            if (this.ghosts.length < maxGhosts) {
                const position = this.getRandomPosition();
                this.createGhost(position);
            }
        }, interval);
    }

    stopSpawning() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
    }

    removeGhost(index) {
        const ghost = this.ghosts[index];
        if (ghost && ghost.model) {
            this.scene.remove(ghost.model);
            if (ghost.mixer) {
                ghost.mixer.stopAllAction();
            }
            this.ghosts.splice(index, 1);
        }
    }

    removeAllGhosts() {
        [...this.ghosts].forEach((ghost, index) => {
            this.removeGhost(index);
        });
        this.ghosts = [];
    }

    getActiveGhosts() {
        return this.ghosts.filter(ghost => !ghost.isDying);
    }

    handleBulletCollision(bullet, bulletIndex, bullets, scene) {
        for (let i = 0; i < this.ghosts.length; i++) {
            const ghost = this.ghosts[i];
            if (!ghost.model || ghost.isDying) continue;

            const ghostBox = new THREE.Box3().setFromObject(ghost.model);
            const bulletBox = new THREE.Box3().setFromObject(bullet);

            if (ghostBox.intersectsBox(bulletBox)) {
                // Remove bullet
                scene.remove(bullet);
                bullets.splice(bulletIndex, 1);

                // Handle ghost hit
                this.playHitAnimation(ghost);
                return true;
            }
        }
        return false;
    }
}

export function createGhostManager(scene) {
    return new GhostManager(scene);
}

export function updateGhosts(ghostManager, delta) {
    ghostManager.moveGhosts(delta);
}