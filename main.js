import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Level1 from "./World/Level1"; // Assuming Level1 class handles wall creation
import {animate} from './playerModel';
import {scene} from './playerModel';
import { model } from "./playerModel";

animate();


// === Ground Plane ===
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const loaderGround = new THREE.TextureLoader();

const baseColorTexture = loaderGround.load('./public/old-plank-flooring4-bl/old-plank-flooring4_basecolor.png');
const normalTexture = loaderGround.load('./public/old-plank-flooring4-bl/old-plank-flooring4_normal.png');
const roughnessTexture = loaderGround.load('./public/old-plank-flooring4-bl/old-plank-flooring4_roughness.png');

[baseColorTexture, normalTexture, roughnessTexture].forEach((texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);
});

const groundMaterial = new THREE.MeshStandardMaterial({
  map: baseColorTexture,
  normalMap: normalTexture,
  roughnessMap: roughnessTexture,
});

const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// === Movement Controls ===
const keysPressed = {};

window.addEventListener("keydown", (event) => {
  keysPressed[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
  keysPressed[event.key.toLowerCase()] = false;
});

// === Setup Level ===

// Add these variables near the top with other declarations
const BULLET_SPEED = 50; // Increased bullet speed
const SHOOT_COOLDOWN = 250; // 250ms cooldown between shots
let lastShootTime = 0;

// Replace the existing triggerShooting function
function triggerShooting() {
  const currentTime = Date.now();
  if (currentTime - lastShootTime < SHOOT_COOLDOWN) {
    return; // Still in cooldown
  }
  
  lastShootTime = currentTime;

  if (!shootAction || shootAction.isRunning()) return;

  if (walkAction && walkAction.isRunning()) {
    walkAction.paused = true;
  }

  // Add screen shake effect
  camera.position.y += 0.05;
  setTimeout(() => {
    camera.position.y -= 0.05;
  }, 50);

  shootAction.reset();
  shootAction.play();
  
  // Add muzzle flash effect
  if (gunModel) {
    const flash = createMuzzleFlash();
    gunModel.add(flash);
    setTimeout(() => gunModel.remove(flash), 50);
  }

  window.singletons.shootSound.playbackRate = 1;
  window.singletons.shootSound
    .play()
    .then(() => console.log("Sound is playing"))
    .catch((e) => console.log("Error playing sound: ", e));

  mixer.addEventListener("finished", onShootAnimationFinished);
  createBullet();
}

// Add this new function for muzzle flash
function createMuzzleFlash() {
  const flashGeometry = new THREE.SphereGeometry(0.05, 8, 8);
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.8
  });
  const flash = new THREE.Mesh(flashGeometry, flashMaterial);
  flash.position.z = 1.5; // Adjust based on your gun model
  return flash;
}

// Update the createBullet function
function createBullet() {
  if (!bulletModel) return;

  const bullet = bulletModel.clone();
  const gunPosition = new THREE.Vector3();
  gunModel.getWorldPosition(gunPosition);
  
  // Add slight random spread
  const spread = 0.02;
  const randomSpreadX = (Math.random() - 0.5) * spread;
  const randomSpreadY = (Math.random() - 0.5) * spread;
  
  const forwardDirection = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(model.quaternion)
    .add(new THREE.Vector3(randomSpreadX, randomSpreadY, 0))
    .normalize();

  bullet.position.copy(gunPosition);
  bullet.quaternion.copy(model.quaternion);

  // Add trail effect
  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.LineBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.5
  });
  const trail = new THREE.Line(trailGeometry, trailMaterial);
  bullet.add(trail);

  bullet.userData = { 
    velocity: forwardDirection.multiplyScalar(BULLET_SPEED),
    trail: trail,
    trailPoints: []
  };

  scene.add(bullet);
  bullets.push(bullet);
}

// Add this to your animation loop
function updateBulletTrails() {
  bullets.forEach(bullet => {
    if (bullet.userData.trail && bullet.userData.trailPoints) {
      bullet.userData.trailPoints.unshift(bullet.position.clone());
      if (bullet.userData.trailPoints.length > 10) {
        bullet.userData.trailPoints.pop();
      }
      
      const positions = new Float32Array(bullet.userData.trailPoints.length * 3);
      bullet.userData.trailPoints.forEach((point, i) => {
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      });
      
      bullet.userData.trail.geometry.setAttribute('position', 
        new THREE.BufferAttribute(positions, 3));
    }
  });
}

// Update the checkAndResolveCollision function
function checkAndResolveCollision(deltaX, deltaZ) {
  const originalPosition = new THREE.Vector3().copy(model.position);
  let modelBoundingBox = new THREE.Box3().setFromObject(model);

  // Test wall collisions
  let collidedX = false;
  let collidedZ = false;

  // Move X
  model.position.x += deltaX;
  modelBoundingBox.setFromObject(model);

  // Check walls
  for (const wallBoundingBox of wallBoundingBoxes) {
    if (modelBoundingBox.intersectsBox(wallBoundingBox)) {
      collidedX = true;
      model.position.x = originalPosition.x;
      break;
    }
  }

  // Check furniture
  if (level.getColliderSystem().checkCollision(model)) {
    collidedX = true;
    model.position.x = originalPosition.x;
  }

  // Move Z
  model.position.z += deltaZ;
  modelBoundingBox.setFromObject(model);

  // Check walls
  for (const wallBoundingBox of wallBoundingBoxes) {
    if (modelBoundingBox.intersectsBox(wallBoundingBox)) {
      collidedZ = true;
      model.position.z = originalPosition.z;
      break;
    }
  }

  // Check furniture
  if (level.getColliderSystem().checkCollision(model)) {
    collidedZ = true;
    model.position.z = originalPosition.z;
  }

  return { collidedX, collidedZ };
}

// In your animate function, add:
function animate() {
  // ... existing code ...
  
  updateBulletTrails();
  level.getColliderSystem().updateColliders();
  
  // ... rest of animate function ...
}