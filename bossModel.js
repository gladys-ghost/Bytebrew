import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

class BossModel {
  constructor(scene) {
    this.scene = scene;
    this.model = null;
    this.mixer = null;
    this.animations = {};
    this.hasReachedTarget = false;
    this.isAttacking = false;
    this.isWalking = false;
    this.isDying = false;
    this.health = 100;
    this.audioLoader = new THREE.AudioLoader();
    this.footstepSound = new THREE.Audio(new THREE.AudioListener());
    this.roarSound = new THREE.Audio(new THREE.AudioListener());
    this.hitSound = new THREE.Audio(new THREE.AudioListener());

    // Load sounds
    this.loadSounds();
    this.loadModel();
  }

  loadSounds() {
    this.audioLoader.load("/models/sounds/monster_footsteps.mp3", (buffer) => {
      this.footstepSound.setBuffer(buffer);
      this.footstepSound.setLoop(true);
      this.footstepSound.setVolume(0.5);
    });

    this.audioLoader.load("/models/sounds/roar.mp3", (buffer) => {
      this.roarSound.setBuffer(buffer);
      this.roarSound.setVolume(1);
    });

    this.audioLoader.load("/models/sounds/monster_hit.mp3", (buffer) => {
      this.hitSound.setBuffer(buffer);
      this.hitSound.setVolume(0.7);
    });
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

  handleBulletCollision(bullet, bulletIndex, bullets, scene) {
    if (!this.model || this.isDying) return false;

    const bossBox = new THREE.Box3().setFromObject(this.model);
    const bulletBox = new THREE.Box3().setFromObject(bullet);

    if (bossBox.intersectsBox(bulletBox)) {
      // Remove bullet
      scene.remove(bullet);
      bullets.splice(bulletIndex, 1);

      // Handle boss hit
      this.handleHit();
      return true;
    }
    return false;
  }

  handleHit() {
    // Don't play hit sound if dying
    if (!this.isDying && this.hitSound && !this.hitSound.isPlaying) {
      this.hitSound.play();
    }

    // Rest of the code remains the same
    this.health -= 10;

    if (this.model) {
      this.model.traverse((child) => {
        if (child.isMesh) {
          const originalMaterial = child.material.clone();
          child.material.emissive.setHex(0xff0000);

          setTimeout(() => {
            child.material.emissive.setHex(0x000000);
          }, 200);
        }
      });
    }

    if (this.health <= 0 && !this.isDying) {
      this.die();
    }
  }

  die() {
    this.isDying = true;
    this.isAttacking = false;
    this.isWalking = false;

    // Stop all current animations and sounds
    this.mixer.stopAllAction();
    this.footstepSound.stop();
    this.roarSound.stop();

    // Play death animation if available
    if (this.animations["Death"]) {
      const deathAction = this.mixer.clipAction(this.animations["Death"]);
      deathAction.setLoop(THREE.LoopOnce);
      deathAction.clampWhenFinished = true;
      deathAction.play();

      // Remove the boss after the death animation
      deathAction.getMixer().addEventListener("finished", () => {
        setTimeout(() => {
          if (this.model && this.scene) {
            this.scene.remove(this.model);
          }
        }, 1000);
      });
    } else {
      // If no death animation, just remove the boss
      if (this.model && this.scene) {
        this.scene.remove(this.model);
      }
    }
  }

  moveTowardsTarget(target) {
    // Add early return if dying
    if (this.isDying || !this.model || !this.mixer) {
      // Make sure all sounds are stopped if we're dying
      if (this.isDying) {
        this.footstepSound.stop();
        this.roarSound.stop();
      }
      return;
    }

    const bossPosition = this.model.position;
    const targetPosition = target.position;

    const distance = bossPosition.distanceTo(targetPosition);
    const reachThreshold = 4;

    if (distance > reachThreshold) {
      const direction = new THREE.Vector3()
        .subVectors(targetPosition, bossPosition)
        .normalize();

      const speed = 0.05;
      const movement = direction.multiplyScalar(speed);

      this.model.position.add(movement);
      this.model.lookAt(targetPosition);

      // Only play walk animation and sound if not dying
      if (this.animations["Walk"] && !this.isAttacking && !this.isDying) {
        const walkAction = this.mixer.clipAction(this.animations["Walk"]);
        if (!walkAction.isRunning()) {
          this.playAnimation("Walk");
          if (!this.isWalking && !this.isDying) {
            // Extra dying check
            this.footstepSound.play();
            this.isWalking = true;
          }
        }
      }
    } else if (!this.isAttacking && !this.isDying) {
      // Add dying check
      this.hasReachedTarget = true;
      this.isAttacking = true;

      this.footstepSound.stop();
      this.isWalking = false;

      const attackAnimations = ["HookPunch", "Stab", "Attack"];
      const randomAttack =
        attackAnimations[Math.floor(Math.random() * attackAnimations.length)];

      const attackAction = this.mixer.clipAction(this.animations[randomAttack]);

      if (!attackAction.isRunning()) {
        this.playAnimation(randomAttack);
        attackAction.setLoop(THREE.LoopOnce);
        attackAction.clampWhenFinished = true;
        attackAction.play();

        // Only play roar if not dying
        if (!this.isDying) {
          this.roarSound.play();
        }

        attackAction.getMixer().addEventListener("finished", () => {
          this.isAttacking = false;
          this.footstepSound.stop();
        });
      }
    } else if (this.isWalking && this.isAttacking) {
      this.footstepSound.stop();
      this.isWalking = false;
    }
  }
}

export default BossModel;
