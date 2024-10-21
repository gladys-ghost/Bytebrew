import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const audio = document.getElementById("myAudio");
audio.volume = 0.05;
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
let bulletModel;

// === Clock for Animation Mixer ===
const clock = new THREE.Clock();

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

// === Mouse Controls ===
let mouseSensitivity = 0.002;
let previousMouseX = window.innerWidth / 2; // Centered initially
let previousMouseY = window.innerHeight / 2; // Centered initially
let pitch = 0; // For up and down (vertical rotation)
let maxPitch = Math.PI / 2; // 90 degrees limit for looking up or down

// Request pointer lock for more natural first-person movement
document.body.requestPointerLock = document.body.requestPointerLock || 
                                   document.body.mozRequestPointerLock || 
                                   document.body.webkitRequestPointerLock;

document.body.onclick = () => {
  document.body.requestPointerLock();
};

window.addEventListener('mousemove', (event) => {
  // If pointer lock is active, use movementX and movementY for relative movement
  const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
  const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

  if (model) {
    // Horizontal rotation (yaw) based on mouse X movement
    model.rotation.y -= deltaX * mouseSensitivity;

    // Vertical rotation (pitch) based on mouse Y movement
    pitch -= deltaY * mouseSensitivity;

    // Clamp pitch to avoid flipping upside down (between -90 and 90 degrees)
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));

    // Apply pitch to the camera for looking up and down
    camera.rotation.x = pitch;
  }

  // Update the previous mouse positions for the next frame (if needed outside pointer lock)
  previousMouseX += deltaX;
  previousMouseY += deltaY;
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
const bullets = [];
// === Trigger Shooting Function ===
// Create an audio listener and add it to the camera
window.singletons={
  audio: document.getElementById('myAudio'),
  shootSound: new Audio('./public/shot.mp3'),
}

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
  window.singletons.shootSound.playbackRate = 1;
  window.singletons.shootSound.play().then(() => {
    console.log("Sound is playing");
  }).catch(e => console.log("Error playing sound: ", e));



  // Listen for the shooting animation to finish
  mixer.addEventListener('finished', onShootAnimationFinished);
  createBullet();
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
// === Add 3 Objects to the Scene ===
const objects = [];
const objectHitCount = {};

// Create and add objects (cubes in this case)
for (let i = 0; i < 3; i++) {
  const geometry = new THREE.BoxGeometry(3, 3, 3);
  const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
  const object = new THREE.Mesh(geometry, material);
  object.position.set(i * 5 - 5, 0.5, -10); // Adjust positions
  object.castShadow = true;
  object.receiveShadow = true;
  
  objects.push(object);
  objectHitCount[object.uuid] = 0; // Initialize hit count for each object
  
  scene.add(object);
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
      loadBulletModel();

    },
    function (xhr) {
      console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
    },
    function (error) {
      console.error('An error occurred while loading the gun model:', error);

    }
  );
}
function loadBulletModel() {
  loader.load('./public/bullet.glb', (gltf) => {
    bulletModel = gltf.scene;
    bulletModel.scale.set(0.05, 0.05, 0.05); // Adjust bullet size
  });
}
// === Update Bullet Positions ===
function updateBullets(delta) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(delta));

    // Remove bullet if it's too far away
    if (bullet.position.length() > 100) {
      scene.remove(bullet);
      bullets.splice(i, 1);
      continue;
    }

    // Check for collisions with objects
    objects.forEach((obj) => {
      const objBox = new THREE.Box3().setFromObject(obj); // Get the object's bounding box
      const bulletBox = new THREE.Box3().setFromObject(bullet); // Get the bullet's bounding box
      
      if (objBox.intersectsBox(bulletBox)) {
        // Object has been hit, increment its hit count
        objectHitCount[obj.uuid]++;
        
        console.log(`Object hit! Total hits: ${objectHitCount[obj.uuid]}`);

        // If the object has been hit twice, remove it
        if (objectHitCount[obj.uuid] >= 2) {
          scene.remove(obj);
          console.log("Object destroyed!");
        }

        // Remove the bullet after hitting the object
        scene.remove(bullet);
        bullets.splice(i, 1);
      }
    });
  }
}
function createBullet() {
  if (!bulletModel) {
    console.error("Bullet model is not loaded.");
    return;
  }

  // Clone the bullet model to create a new instance for shooting
  const bullet = bulletModel.clone();

  // Get the gun's world position and apply it to the bullet
  const gunPosition = new THREE.Vector3();
  gunModel.getWorldPosition(gunPosition);
  bullet.position.copy(gunPosition);

  // Get the player's current forward direction (we need to flip it)
  const forwardDirection = new THREE.Vector3(0, 0, 1);  // Default forward direction in gun's local space (positive Z)
  forwardDirection.applyQuaternion(model.quaternion);   // Apply the player's current rotation

  // Reset the bullet's local rotation to face forward in local space
  bullet.rotation.set(0, 0, 0);  // Reset rotation if needed
  bullet.quaternion.copy(model.quaternion);  // Align bullet's rotation with the player's current rotation

  // Adjust the bullet's forward direction to face the movement direction
  const bulletRotation = new THREE.Quaternion();
  bulletRotation.setFromUnitVectors(new THREE.Vector3(0, 0, 1), forwardDirection.normalize());
  bullet.quaternion.premultiply(bulletRotation);

  // Apply an offset to move the bullet slightly in front of the gun
  const bulletOffset = new THREE.Vector3(0, 0, 0);  // Offset in front of gun along its forward direction
  bulletOffset.applyQuaternion(gunModel.quaternion); // Apply gun's rotation to the offset
  bullet.position.add(bulletOffset);  // Move bullet slightly forward from gun

  // Set bullet's velocity based on the player's current forward direction (flip Z)
  bullet.userData = { velocity: forwardDirection.clone().multiplyScalar(25) };  // Adjust bullet speed

  // Add the bullet to the scene
  scene.add(bullet);
  bullets.push(bullet);
}





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
  updateBullets(delta);
  renderer.render(scene, camera);
}

export{animate};
