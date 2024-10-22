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
        this.hitSound = new Audio('/shot.mp3'); // Add appropriate sound file
        this.deathSound = new Audio('/shot.mp3'); // Add appropriate sound file
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
                hasReachedTarget: false,
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
        ghost.health -= 34; // Decrease health by ~1/3

        // Play hit sound
        this.hitSound.currentTime = 0;
        this.hitSound.play().catch(e => console.log("Error playing hit sound:", e));

        // Stop current animations and play hit animation
        ghost.mixer.stopAllAction();
        const hitAction = ghost.mixer.clipAction(ghost.animations[0]);
        hitAction.setLoop(THREE.LoopOnce);
        hitAction.clampWhenFinished = true;
        hitAction.reset().play();

        // Check if ghost should die
        if (ghost.health <= 0) {
            this.playDeathAnimation(ghost);
            return;
        }

        // Resume normal behavior after hit animation
        setTimeout(() => {
            ghost.isHit = false;
            const targetPos = this.getTargetPosition();
            const distance = ghost.model.position.distanceTo(targetPos);
            
            ghost.mixer.stopAllAction();
            
            if (distance > 5) {
                ghost.hasReachedTarget = false;
                const walkAction = ghost.mixer.clipAction(ghost.animations[5]);
                walkAction.reset().play();
            } else {
                const idleAction = ghost.mixer.clipAction(ghost.animations[2]);
                idleAction.reset().play();
            }
        }, 1000); // Adjust based on hit animation length
    }

    playDeathAnimation(ghost) {
        if (!ghost.mixer || !ghost.animations || ghost.isDying) return;

        ghost.isDying = true;
        
        // Play death sound
        this.deathSound.currentTime = 0;
        this.deathSound.play().catch(e => console.log("Error playing death sound:", e));

        // Play death animation
        ghost.mixer.stopAllAction();
        const deathAction = ghost.mixer.clipAction(ghost.animations[1]); // Assuming death is animation 1
        deathAction.setLoop(THREE.LoopOnce);
        deathAction.clampWhenFinished = true;
        deathAction.reset().play();

        // Remove ghost after death animation
        setTimeout(() => {
            const index = this.ghosts.findIndex(g => g === ghost);
            if (index !== -1) {
                this.removeGhost(index);
            }
        }, 2000); // Adjust based on death animation length
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
            
            if (!ghost.hasReachedTarget) {
                const ghostPosition = ghost.model.position;
                const distance = ghostPosition.distanceTo(targetPos);
                const reachThreshold = 5;

                if (distance > reachThreshold) {
                    // Calculate direction to target
                    const direction = new THREE.Vector3()
                        .subVectors(targetPos, ghostPosition)
                        .normalize();

                    // Move ghost
                    const speed = 0.05;
                    ghost.model.position.add(direction.multiplyScalar(speed));
                    
                    // Make ghost face movement direction
                    ghost.model.lookAt(targetPos.x, ghostPosition.y, targetPos.z);

                    // Update animation
                    ghost.mixer.update(delta);
                } else {
                    // Ghost has reached target
                    ghost.hasReachedTarget = true;
                    ghost.mixer.stopAllAction();
                    
                    if (ghost.animations && ghost.animations.length > 0) {
                        const idleAction = ghost.mixer.clipAction(ghost.animations[2]);
                        idleAction.play();
                    }
                }
            }
        });
    }

    startSpawning(interval = 5000, maxGhosts = 10) {
        this.stopSpawning(); // Clear any existing interval
        
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

    // Utility method to get all active ghosts
    getActiveGhosts() {
        return this.ghosts.filter(ghost => !ghost.isDying);
    }

    // Method to handle ghost hit detection
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
                return true; // Collision detected
            }
        }
        return false; // No collision
    }
}

// Export functions
export function createGhostManager(scene) {
    return new GhostManager(scene);
}

export function updateGhosts(ghostManager, delta) {
    ghostManager.moveGhosts(delta);
}