import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

class ArmorManager {
    constructor(scene) {
        this.scene = scene;
        this.armorPickups = [];
        this.loader = new GLTFLoader();
        this.pickupSound = new Audio('/armor-pickup.mp3');
        this.position = new THREE.Vector3();
    }

    createArmorPickup(position = this.position) {
        this.loader.load('./public/9mm_ammo_box/scene.gltf', (gltf) => {
            const armorModel = gltf.scene;
            
            const spotlight = new THREE.SpotLight(0x0088ff, 5);
            spotlight.position.copy(position).add(new THREE.Vector3(0, 5, 0));
            spotlight.target = armorModel;
            spotlight.angle = Math.PI / 6;
            spotlight.penumbra = 0.3;
            spotlight.distance = 10;
            spotlight.decay = 2;
            spotlight.castShadow = true;

            // Configure spotlight shadow
            spotlight.shadow.mapSize.width = 512;
            spotlight.shadow.mapSize.height = 512;
            spotlight.shadow.camera.near = 0.5;
            spotlight.shadow.camera.far = 15;
            spotlight.shadow.focus = 1;

            const armorData = {
                model: armorModel,
                spotlight: spotlight,
                isCollected: false,
                armorAmount: 25,
                spawnTime: Date.now(),
                position: position.clone()
            };

            // Setup armor model
            armorModel.position.copy(position);
            armorModel.scale.set(1, 1, 1);
            armorModel.rotation.set(0, 0, 0);
            
            // Add shadow casting
            armorModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Add spawn animation
            this.addSpawnAnimation(armorModel);
            
            // Add floating animation
            this.addFloatingAnimation(armorModel, spotlight);

            this.scene.add(armorModel);
            this.scene.add(spotlight);
            this.armorPickups.push(armorData);
        });
    }

    addSpawnAnimation(model) {
        model.scale.set(0, 0, 0);
        const startTime = Date.now();
        const duration = 500;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const eased = this.easeElasticOut(progress);
            model.scale.setScalar(eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    easeElasticOut(x) {
        const c4 = (2 * Math.PI) / 3;
        return x === 0
            ? 0
            : x === 1
            ? 1
            : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }

    addFloatingAnimation(model, spotlight) {
        const startY = model.position.y;
        const floatHeight = 0.5;
        const floatSpeed = 1.2; // Slightly slower than medkit
        const rotationSpeed = 0.015; // Slightly faster rotation

        model.userData.animate = (time) => {
            const newY = startY + Math.sin(time * floatSpeed) * floatHeight;
            model.position.y = newY;
            model.rotation.y += rotationSpeed;
            
            if (spotlight) {
                spotlight.position.y = newY + 5;
            }
        };
    }

    updateArmorPickups(time) {
        this.armorPickups.forEach(armor => {
            if (!armor.isCollected && armor.model) {
                armor.model.userData.animate(time);
                
                // Pulsing blue light effect
                if (armor.spotlight) {
                    armor.spotlight.intensity = 5 + Math.sin(time * 1.5) * 2;
                }
            }
        });
    }

    handlePlayerCollision(playerPosition, playerRadius = 2) {
        const playerBox = new THREE.Box3().setFromCenterAndSize(
            playerPosition,
            new THREE.Vector3(playerRadius, playerRadius, playerRadius)
        );

        for (let i = this.armorPickups.length - 1; i >= 0; i--) {
            const armor = this.armorPickups[i];
            if (!armor.model || armor.isCollected) continue;

            const armorBox = new THREE.Box3().setFromObject(armor.model);

            if (playerBox.intersectsBox(armorBox)) {
                this.collectArmorPickup(i);
                return armor.armorAmount;
            }
        }
        return 0;
    }

    collectArmorPickup(index) {
        const armor = this.armorPickups[index];
        if (!armor || armor.isCollected) return;

        armor.isCollected = true;

        this.pickupSound.currentTime = 0;
        this.pickupSound.play().catch(e => console.log("Error playing armor pickup sound:", e));

        const model = armor.model;
        const spotlight = armor.spotlight;
        const duration = 0.5;
        const startTime = Date.now();

        // Add collection effect animation
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);

            // Scale down and rotate faster during collection
            model.scale.setScalar(1 - progress);
            model.rotation.y += 0.2;
            
            if (spotlight) {
                spotlight.intensity = 5 * (1 - progress);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.removeArmorPickup(index);
            }
        };

        animate();
    }

    removeArmorPickup(index) {
        const armor = this.armorPickups[index];
        if (armor) {
            if (armor.model) {
                this.scene.remove(armor.model);
            }
            if (armor.spotlight) {
                this.scene.remove(armor.spotlight);
            }
            this.armorPickups.splice(index, 1);
        }
    }

    removeAllArmorPickups() {
        [...this.armorPickups].forEach((armor, index) => {
            this.removeArmorPickup(index);
        });
        this.armorPickups = [];
    }
}

export function createArmorManager(scene) {
    return new ArmorManager(scene);
}

export function updateArmorPickups(armorManager, time) {
    armorManager.updateArmorPickups(time);
}