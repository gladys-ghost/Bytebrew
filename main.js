import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// === Scene Setup ===
const scene = new THREE.Scene();

// === Camera Setup ===
const camera = new THREE.PerspectiveCamera(
  75, // Field of view
  window.innerWidth / window.innerHeight, // Aspect ratio
  0.1, // Near clipping plane
  1000 // Far clipping plane
);


// === Renderer Setup ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// === Handle Window Resize ===
window.addEventListener('resize', () => {
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
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;

scene.add(directionalLight);

// === Ground Plane ===
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, depthWrite: false });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// === GLTF Loader ===
const loader = new GLTFLoader();

let mixer;
let model;
let walkAction;
let shootAction; // Will store the shooting animation
let gunModel; // Will store the gun model

// === Clock for Animation Mixer ===
const clock = new THREE.Clock();

// === Movement Controls ===
const keysPressed = {};

window.addEventListener('keydown', (event) => {
  keysPressed[event.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (event) => {
  keysPressed[event.key.toLowerCase()] = false;
});

// === Mouse Controls ===
let mouseSensitivity = 0.002;
let previousMouseX = 0;

window.addEventListener('mousemove', (event) => {
  const mouseX = event.clientX;
  const deltaX = mouseX - previousMouseX;

  if (model) {
    model.rotation.y -= deltaX * mouseSensitivity;
  }

  previousMouseX = mouseX;
});

// === Shooting Input ===
window.addEventListener('mousedown', (event) => {
  if (event.button === 0) { // Left mouse button
    triggerShooting();
  }
});

// === Raycaster for Shooting Mechanics (Optional) ===
const raycaster = new THREE.Raycaster();
const shootDirection = new THREE.Vector3();
const shootOrigin = new THREE.Vector3();

// === Trigger Shooting Function ===
function triggerShooting() {
  if (!shootAction) {
    console.warn('Shooting action is not available.');
    return;
  }

  // If the shooting animation is already playing, do not trigger again
  if (shootAction.isRunning()) return;

  // Pause walking animation if it's playing
  if (walkAction && walkAction.isRunning()) {
    walkAction.paused = true;
  }

  // Play shooting animation
  shootAction.reset();
  shootAction.play();

  // Listen for the shooting animation to finish
  mixer.addEventListener('finished', onShootAnimationFinished);
}

function onShootAnimationFinished(event) {
  if (event.action === shootAction) {
    // Remove the event listener to prevent multiple triggers
    mixer.removeEventListener('finished', onShootAnimationFinished);

    // Resume walking animation if movement keys are pressed
    if (keysPressed['w'] || keysPressed['arrowup'] || keysPressed['s'] || keysPressed['arrowdown']) {
      if (walkAction) {
        walkAction.paused = false;
      }
    }
  }
}

// === Load Player Model ===
loader.load(
  './public/obn_2.glb',
  function (gltf) {
    model = gltf.scene;
    model.scale.set(0.3, 0.3, 0.3);
    model.rotation.y = Math.PI; // Rotate 180 degrees to face forward
    model.position.set(0, 0, 0);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(model);

    mixer = new THREE.AnimationMixer(model);

    if (gltf.animations && gltf.animations.length) {
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'npc_walk_pistol');
      if (walkClip) {
        walkAction = mixer.clipAction(walkClip);
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
        walkAction.play();
        walkAction.paused = true; // Start in a paused state
      } else {
        // If 'npc_walk_pistol' not found, use the first animation as a fallback
        walkAction = mixer.clipAction(gltf.animations[0]);
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
        walkAction.play();
        walkAction.paused = true;
        console.warn('Walk animation "npc_walk_pistol" not found. Using the first available animation.');
      }

      // === Shooting Animation Setup ===
      const shootClip = THREE.AnimationClip.findByName(gltf.animations, 'npc_shooting_pistol');
      if (shootClip) {
        shootAction = mixer.clipAction(shootClip);
        shootAction.setLoop(THREE.LoopOnce, 1);
        shootAction.clampWhenFinished = true; // Keeps the last frame when finished
        shootAction.stop(); // Ensure it's not playing initially
      } else {
        console.warn('Shooting animation "npc_shooting_pistol" not found.');
      }
    }

    // Load the gun model and attach it to the player's hand
    loadGun();
  },
  function (xhr) {
    console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
  },
  function (error) {
    console.error('An error occurred while loading the player model:', error);
  }
);

// === Load Gun and Attach to Player ===
function loadGun() {
  loader.load(
    './public/gun.glb', // Path to the gun model
    function (gltf) {
      gunModel = gltf.scene;
      gunModel.scale.set(3.5, 3.5, 3.5); // Adjust gun size as necessary

      model.traverse((child) => {
        if (child.isBone) {
          console.log('Bone:', child.name); // Logs the bone name
        } else if (child.isMesh) {
          console.log('Mesh:', child.name); // Logs mesh names
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Attach the gun to the player's hand (assuming the hand bone is known or manually positioning it)
      // Replace 'mixamorigRightHand' with the correct bone name if different
      const handBone = model.getObjectByName('mixamorigRightHand'); // Replace with actual bone name if different
      if (handBone) {
        handBone.add(gunModel);
        gunModel.position.set(0.1, 0.6, 0.35); // Adjust gun position
        const lookDirection = new THREE.Vector3(
          Math.sin(model.rotation.y), // Forward direction in X
          0,                          // No vertical rotation
          Math.cos(model.rotation.y)   // Forward direction in Z
        ).normalize();
        const gunRotation = new THREE.Quaternion();
  
        // Set the rotation of the gun to point in the look direction
        gunRotation.setFromUnitVectors(new THREE.Vector3(-4.5, 5,-0.4), lookDirection); // Assuming gun's forward is in the -Z direction
        gunModel.quaternion.copy(gunRotation); // Apply the calculated rotation to the gun
        console.log("Gun attached to player's hand");
      } else {
        // If no bone, position manually near the player's hand area
        gunModel.position.set(0.5, 1.2, 0.3); // Adjust this to match where the hand is located
        model.add(gunModel); // Add gun to the player model
        console.log("Gun attached to the player model manually");
      }
    },
    function (xhr) {
      console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    function (error) {
      console.error('An error occurred while loading the gun model:', error);
    }
  );
}

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) {
    mixer.update(delta);
  }

  const walkSpeed = 3;
  const rotateSpeed = Math.PI;

  let isMoving = false;

  if (model) {
    // Movement handling
    if (keysPressed['w'] || keysPressed['arrowup']) {
      model.position.z += walkSpeed * delta * Math.cos(model.rotation.y);
      model.position.x += walkSpeed * delta * Math.sin(model.rotation.y);
      isMoving = true;
    }

    if (keysPressed['s'] || keysPressed['arrowdown']) {
      model.position.z -= walkSpeed * delta * Math.cos(model.rotation.y);
      model.position.x -= walkSpeed * delta * Math.sin(model.rotation.y);
      isMoving = true;
    }

    if (keysPressed['a'] || keysPressed['arrowleft']) {
      model.rotation.y += rotateSpeed * delta;
    }

    if (keysPressed['d'] || keysPressed['arrowright']) {
      model.rotation.y -= rotateSpeed * delta;
    }

    // Adjust the camera position and rotation to follow the player
    const cameraOffset = new THREE.Vector3(0, 6, 1.5); // Adjust the offset as needed
    const cameraPosition = new THREE.Vector3().copy(cameraOffset).applyMatrix4(model.matrixWorld); // Move camera relative to player

    camera.position.copy(cameraPosition);

    // Make the camera look in the direction the player is facing
    const lookDirection = new THREE.Vector3(
      Math.sin(model.rotation.y),
      0,
      Math.cos(model.rotation.y)
    ).normalize();
    
    const cameraLookAt = new THREE.Vector3().copy(model.position).add(lookDirection);
    camera.lookAt(cameraLookAt.x, model.position.y + 1.5, cameraLookAt.z); // Adjust the Y axis for smoother camera angle
  }

  // Handle animation state for walk
  if (walkAction) {
    if (isMoving) {
      if (walkAction.paused) walkAction.paused = false;
    } else {
      if (!walkAction.paused) walkAction.paused = true;
    }
  }

  renderer.render(scene, camera);
}

animate();
