import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

class MedKitManager {
    constructor(scene) {
        this.scene = scene;
        this.medkits = [];
        this.loader = new GLTFLoader();
        this.pickupSound = new Audio('/pickup.mp3');  // Add appropriate sound file
    }

    createMedKit(position) {
        this.loader.load('./medkit/scene.gltf', (gltf) => {
            const medkitModel = gltf.scene;
            const medkitData = {
                model: medkitModel,
                isCollected: false,
                healAmount: 50  // Amount of health restored when collected
            };

            // Setup medkit model
            medkitModel.position.set(position[0], position[1], position[2]);
            medkitModel.scale.set(1, 1, 1);  // Adjust scale as needed
            medkitModel.rotation.set(0, 0, 0);
            
            // Add shadow casting
            medkitModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Add floating animation
            this.addFloatingAnimation(medkitModel);

            this.scene.add(medkitModel);
            this.medkits.push(medkitData);
        }, 
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('An error happened while loading the medkit model:', error);
        });
    }

    addFloatingAnimation(model) {
        const startY = model.position.y;
        const floatHeight = 0.5;
        const floatSpeed = 1.5;

        model.userData.animate = (time) => {
            model.position.y = startY + Math.sin(time * floatSpeed) * floatHeight;
            model.rotation.y += 0.01;  // Slow rotation
        };
    }

    updateMedKits(time) {
        this.medkits.forEach(medkit => {
            if (!medkit.isCollected && medkit.model) {
                medkit.model.userData.animate(time);
            }
        });
    }

    handlePlayerCollision(playerPosition, playerRadius = 2) {
        const playerBox = new THREE.Box3().setFromCenterAndSize(
            playerPosition,
            new THREE.Vector3(playerRadius, playerRadius, playerRadius)
        );

        for (let i = this.medkits.length - 1; i >= 0; i--) {
            const medkit = this.medkits[i];
            if (!medkit.model || medkit.isCollected) continue;

            const medkitBox = new THREE.Box3().setFromObject(medkit.model);

            if (playerBox.intersectsBox(medkitBox)) {
                this.collectMedKit(i);
                return medkit.healAmount;
            }
        }
        return 0;
    }

    collectMedKit(index) {
        const medkit = this.medkits[index];
        if (!medkit || medkit.isCollected) return;

        medkit.isCollected = true;

        // Play pickup sound
        this.pickupSound.currentTime = 0;
        this.pickupSound.play().catch(e => console.log("Error playing pickup sound:", e));

        // Animate collection (scale down and fade out)
        const model = medkit.model;
        const duration = 0.5;  // seconds
        const startTime = Date.now();

        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);

            model.scale.setScalar(1 - progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.removeMedKit(index);
            }
        };

        animate();
    }

    removeMedKit(index) {
        const medkit = this.medkits[index];
        if (medkit && medkit.model) {
            this.scene.remove(medkit.model);
            this.medkits.splice(index, 1);
        }
    }

    removeAllMedKits() {
        [...this.medkits].forEach((medkit, index) => {
            this.removeMedKit(index);
        });
        this.medkits = [];
    }

    spawnMedKitAtRandomPosition(bounds = {
        minX: -100,
        maxX: 100,
        minZ: -100,
        maxZ: 100
    }) {
        const position = [
            Math.random() * (bounds.maxX - bounds.minX) + bounds.minX,
            1,  // Height above ground
            Math.random() * (bounds.maxZ - bounds.minZ) + bounds.minZ
        ];
        this.createMedKit(position);
    }
}

export function createMedKitManager(scene) {
    return new MedKitManager(scene);
}

export function updateMedKits(medKitManager, time) {
    medKitManager.updateMedKits(time);
}