import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

class BossModel {
  constructor(scene) {
    this.scene = scene;
    this.model = null;
    this.mixer = null;
    this.animations = {};
    this.hasReachedTarget = false;

    this.loadModel();
  }

  loadModel() {
    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();
      loader.load(
        "models/Mutant.fbx",
        (fbx) => {
          this.model = fbx;
          this.model.scale.set(0.015, 0.015, 0.015);
          this.mixer = new THREE.AnimationMixer(this.model);

          // Load and set up animations
          Promise.all([
            this.loadAnimation("Idle", "models/animations/idle2.fbx"),
            this.loadAnimation("Walk", "models/animations/walk.fbx"),
            this.loadAnimation("Death", "models/animations/death.fbx"),
            this.loadAnimation("HookPunch", "models/animations/hook_punch.fbx"),
            this.loadAnimation("Stab", "models/animations/stab.fbx"),
            this.loadAnimation("Attack", "models/animations/attack.fbx"),
          ]).then(() => {
            this.scene.add(this.model);
            resolve();
          });
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  loadAnimation(name, file) {
    return new Promise((resolve, reject) => {
      const loader = new FBXLoader();
      loader.load(
        file,
        (animationFBX) => {
          const animation = animationFBX.animations[0];
          this.mixer.clipAction(animation).setDuration(animation.duration);
          this.animations[name] = animation;
          resolve();
        },
        undefined,
        reject
      );
    });
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  playAnimation(name) {
    console.log("Playing animation:", name);
    console.log("Available animations:", Object.keys(this.animations));
    if (this.animations[name]) {
      this.mixer.stopAllAction();
      this.mixer.clipAction(this.animations[name]).play();
    }
  }

  moveTowardsTarget(target) {
    if (!this.model || !this.mixer) {
      console.log("Model or mixer not initialized");
      return;
    }

    const bossPosition = this.model.position;
    const targetPosition = target.position;

    const distance = bossPosition.distanceTo(targetPosition);
    const reachThreshold = 4;

    // If the boss is still moving towards the target
    if (distance > reachThreshold) {
      const direction = new THREE.Vector3()
        .subVectors(targetPosition, bossPosition)
        .normalize();

      const speed = 0.05;
      const movement = direction.multiplyScalar(speed);

      // Move the boss towards the target
      this.model.position.add(movement);
      this.model.lookAt(targetPosition);

      // Play the walk animation if it's not already playing
      if (this.animations["Walk"] && !this.isAttacking) {
        const walkAction = this.mixer.clipAction(this.animations["Walk"]);
        if (!walkAction.isRunning()) {
          this.playAnimation("Walk");
        }
      }
    } else if (!this.isAttacking) {
      // Boss has reached the target and is not already attacking
      this.hasReachedTarget = true;
      this.isAttacking = true; // Set attacking state to true

      // Randomly choose between the available attack animations
      const attackAnimations = ["HookPunch", "Stab", "Attack"]; // Add other attack animations here
      const randomAttack =
        attackAnimations[Math.floor(Math.random() * attackAnimations.length)];

      const attackAction = this.mixer.clipAction(this.animations[randomAttack]);

      // Play the random attack animation if it's not running
      if (!attackAction.isRunning()) {
        this.playAnimation(randomAttack);
        attackAction.setLoop(THREE.LoopOnce); // Play only once
        attackAction.clampWhenFinished = true; // Stop at the last frame
        attackAction.play();

        console.log(`Playing random attack animation: ${randomAttack}`);

        // Add an event listener to reset the `isAttacking` flag after the attack finishes
        attackAction.getMixer().addEventListener("finished", () => {
          this.isAttacking = false; // Reset attacking state
        });
      }
    }
  }
}

export default BossModel;
