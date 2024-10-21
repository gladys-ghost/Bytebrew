import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Level1 from "./World/Level1"; // Assuming Level1 class handles wall creation

// === Scene Setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// === Camera Setup ===
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);
const cameraOffset = new THREE.Vector3(0, 6, 1.5); // Offset for third-person view

// === Renderer Setup ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// === Handle Window Resize ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Lighting Setup ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
scene.add(directionalLight);

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

// === GLTF Loader ===
const loader = new GLTFLoader();
let mixer, model, walkAction;
let modelBoundingBox;

loader.load(
  "./public/obn_2.glb",
  (gltf) => {
    model = gltf.scene;
    model.scale.set(0.3, 0.3, 0.3);
    model.position.set(-2, 0, 0);
    model.rotation.y = Math.PI; // Rotate 180 degrees

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(model);

    // Bounding box for collision detection
    
    
    console.log(modelBoundingBox);

    mixer = new THREE.AnimationMixer(model);

    if (gltf.animations && gltf.animations.length) {
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, "npc_walk_pistol") || gltf.animations[0];
      walkAction = mixer.clipAction(walkClip);
      walkAction.setLoop(THREE.LoopRepeat, Infinity);
      walkAction.play();
      walkAction.paused = true;
    }
  },
  (xhr) => console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`),
  (error) => console.error("An error occurred while loading the GLB model:", error)
);

// === Clock for Animation Mixer ===
const clock = new THREE.Clock();

// === Movement Controls ===
const keysPressed = {};

window.addEventListener("keydown", (event) => {
  keysPressed[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
  keysPressed[event.key.toLowerCase()] = false;
});

// === Setup Level ===
const level = new Level1(scene); // This will add walls and other level details
const wallBoundingBoxes = level.getWallBoundingBoxes(); // Get wall bounding boxes from Level1

// === Sliding Collision Detection ===
function checkAndResolveCollision(deltaX, deltaZ) {
  const originalPosition = new THREE.Vector3().copy(model.position);
  modelBoundingBox = new THREE.Box3().setFromObject(model);

  let collidedX = false;
  let collidedZ = false;

  // Attempt to move along the X-axis
  model.position.x += deltaX;
  modelBoundingBox.setFromObject(model);
  
  for (const wallBoundingBox of wallBoundingBoxes) {
    if (modelBoundingBox.intersectsBox(wallBoundingBox)) {
      collidedX = true;
      model.position.x = originalPosition.x; // Revert X movement on collision
      break;
    }
  }

  // Attempt to move along the Z-axis
  model.position.z += deltaZ;
  modelBoundingBox.setFromObject(model);

  for (const wallBoundingBox of wallBoundingBoxes) {
    if (modelBoundingBox.intersectsBox(wallBoundingBox)) {
      collidedZ = true;
      model.position.z = originalPosition.z; // Revert Z movement on collision
      break;
    }
  }

  // If collision happens on X, allow sliding along Z
  if (collidedX && !collidedZ) {
    model.position.z = originalPosition.z + deltaZ;
  }
  // If collision happens on Z, allow sliding along X
  if (collidedZ && !collidedX) {
    model.position.x = originalPosition.x + deltaX;
  }

  return { collidedX, collidedZ };
}

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (mixer) mixer.update(delta);

  const walkSpeed = 5 * delta;
  const rotateSpeed = Math.PI * delta;

  let isMoving = false;

  if (model) {
    let deltaX = 0;
    let deltaZ = 0;

    if (keysPressed["w"] || keysPressed["arrowup"]) {
      deltaZ = walkSpeed * Math.cos(model.rotation.y);
      deltaX = walkSpeed * Math.sin(model.rotation.y);
      isMoving = true;
    }
    if (keysPressed["s"] || keysPressed["arrowdown"]) {
      deltaZ = -walkSpeed * Math.cos(model.rotation.y);
      deltaX = -walkSpeed * Math.sin(model.rotation.y);
      isMoving = true;
    }

    // Resolve collisions
    const { collidedX, collidedZ } = checkAndResolveCollision(deltaX, deltaZ);

    if (keysPressed["a"] || keysPressed["arrowleft"]) {
      model.rotation.y += rotateSpeed;
    }
    if (keysPressed["d"] || keysPressed["arrowright"]) {
      model.rotation.y -= rotateSpeed;
    }

    // Adjust the camera position to follow the player
    const cameraPosition = new THREE.Vector3()
      .copy(cameraOffset)
      .applyMatrix4(model.matrixWorld);
    camera.position.copy(cameraPosition);

    // Ensure the camera always looks in the direction the player is facing
    const lookDirection = new THREE.Vector3(
      Math.sin(model.rotation.y), // Forward direction in X
      0, // Keep the camera level
      Math.cos(model.rotation.y) // Forward direction in Z
    );
    const cameraLookAt = new THREE.Vector3()
      .copy(model.position)
      .add(lookDirection);

    camera.lookAt(cameraLookAt.x, cameraPosition.y, cameraLookAt.z);
  }

  if (walkAction) {
    walkAction.paused = !isMoving; // Play or pause animation based on movement
  }

  renderer.render(scene, camera);
}

import {animate} from './playerModel';
animate();
