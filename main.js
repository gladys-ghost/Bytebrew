// main.js
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
// Move the camera behind and above the player for third-person debugging
const cameraOffset = new THREE.Vector3(0, 6, 1.5); // Set behind the player for debugging

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
    console.log('Available Animations:', gltf.animations.map(clip => clip.name));

    if (gltf.animations && gltf.animations.length) {
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'npc_walk_pistol');
      if (walkClip) {
        walkAction = mixer.clipAction(walkClip);
        walkAction.play();
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
        walkAction.paused = true;
      } else {
        walkAction = mixer.clipAction(gltf.animations[0]);
        walkAction.play();
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
        walkAction.paused = true;
      }
    }
  },
  function (xhr) {
    console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
  },
  function (error) {
    console.error('An error occurred while loading the GLB model:', error);
  }
);

// === Clock for Animation Mixer ===
const clock = new THREE.Clock();

// === Menu Handling ===
const startMenu = document.getElementById('startMenu');
const optionsScreen = document.getElementById('optionsScreen');
const creditsScreen = document.getElementById('creditsScreen');

const startButton = document.getElementById('startButton');
const optionsButton = document.getElementById('optionsButton');
const creditsButton = document.getElementById('creditsButton');
const saveOptionsButton = document.getElementById('saveOptionsButton');
const closeCreditsButton = document.getElementById('closeCreditsButton');

let gameStarted = false;

// Start the game
startButton.addEventListener('click', () => {
  startMenu.style.display = 'none';
  gameStarted = true;
});

// Show options screen
optionsButton.addEventListener('click', () => {
  startMenu.style.display = 'none';
  optionsScreen.style.display = 'flex';
});

// Show credits screen
creditsButton.addEventListener('click', () => {
  startMenu.style.display = 'none';
  creditsScreen.style.display = 'flex';
});

// Save options and return to main menu
saveOptionsButton.addEventListener('click', () => {
  // Here you would typically save the options to local storage or a config file
  console.log('Options saved');
  optionsScreen.style.display = 'none';
  startMenu.style.display = 'flex';
});

// Close credits and return to main menu
closeCreditsButton.addEventListener('click', () => {
  creditsScreen.style.display = 'none';
  startMenu.style.display = 'flex';
});

// Function to apply options (placeholder)
function applyOptions() {
  const difficulty = document.getElementById('difficulty').value;
  const mouseSensitivity = document.getElementById('mouseSensitivity').value;
  const soundVolume = document.getElementById('soundVolume').value;
  const graphicsQuality = document.getElementById('graphicsQuality').value;
  const fov = document.getElementById('fov').value;

  console.log('Applying options:', {
    difficulty,
    mouseSensitivity,
    soundVolume,
    graphicsQuality,
    fov
  });

  // Here you would typically update game settings based on these values
  // For example:
  // camera.fov = fov;
  // camera.updateProjectionMatrix();
  // updateGraphicsQuality(graphicsQuality);
  // etc.
}

// Call applyOptions when saving options
saveOptionsButton.addEventListener('click', applyOptions);

// === Movement Controls ===
const keysPressed = {};

window.addEventListener('keydown', (event) => {
  if (gameStarted) {
    keysPressed[event.key.toLowerCase()] = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (gameStarted) {
    keysPressed[event.key.toLowerCase()] = false;
  }
});

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (mixer) {
    mixer.update(delta);
  }

  if (gameStarted) {
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
      const cameraPosition = new THREE.Vector3().copy(cameraOffset).applyMatrix4(model.matrixWorld);
      camera.position.copy(cameraPosition);

      const lookDirection = new THREE.Vector3(
        Math.sin(model.rotation.y),
        0,
        Math.cos(model.rotation.y)
      );
      const cameraLookAt = new THREE.Vector3().copy(model.position).add(lookDirection);

      camera.lookAt(cameraLookAt.x, cameraPosition.y, cameraLookAt.z);
    }

    if (walkAction) {
      if (isMoving) {
        if (walkAction.paused) walkAction.paused = false;
      } else {
        if (!walkAction.paused) walkAction.paused = true;
      }
    }
  }

  renderer.render(scene, camera);
}

// Start the animation loop immediately
animate();
