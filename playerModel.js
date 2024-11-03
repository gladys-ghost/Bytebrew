import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Level1 from "./World/Level1";
import Level2 from "./World/Level2";
import { createGhostManager, updateGhosts } from './ghostManager';
import listener from "./World/audioListener"
import camera from "./camera";
import { FBXLoader } from "three/examples/jsm/Addons.js";
import { mod } from "three/webgpu";

let playerHealth = 10000000000000;
const maxPlayerHealth = 100;

const healthDisplay = document.createElement('div');
healthDisplay.style.position = 'fixed';
healthDisplay.style.top = '20px';
healthDisplay.style.left = '20px';
healthDisplay.style.padding = '10px';
healthDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
healthDisplay.style.color = 'white';
healthDisplay.style.fontFamily = 'Arial, sans-serif';
healthDisplay.style.borderRadius = '5px';
document.body.appendChild(healthDisplay);

function updateHealthDisplay() {
    healthDisplay.textContent = `Health: ${playerHealth}/${maxPlayerHealth}`;
    if (playerHealth < 25) {
        healthDisplay.style.color = '#ff4444';
    } else if (playerHealth < 50) {
        healthDisplay.style.color = '#ffaa44';
    } else {
        healthDisplay.style.color = '#ffffff';
    }
}

function addHealth(amount) {
    playerHealth = Math.min(playerHealth + amount, maxPlayerHealth);
    updateHealthDisplay();
}

function damagePlayer(amount) {
    playerHealth = Math.max(0, playerHealth - amount);
    updateHealthDisplay();
    
    if (playerHealth <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameStarted = false;
    const gameOverScreen = document.createElement('div');
    gameOverScreen.style.position = 'fixed';
    gameOverScreen.style.top = '50%';
    gameOverScreen.style.left = '50%';
    gameOverScreen.style.transform = 'translate(-50%, -50%)';
    gameOverScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverScreen.style.color = 'white';
    gameOverScreen.style.padding = '20px';
    gameOverScreen.style.textAlign = 'center';
    gameOverScreen.style.borderRadius = '10px';
    gameOverScreen.innerHTML = `
        <h2>Game Over</h2>
        <button onclick="window.location.reload()">Retry</button>
    `;
    document.body.appendChild(gameOverScreen);
}

// Initialize health display
updateHealthDisplay();

const audio = document.getElementById("myAudio");
audio.volume = 0.05;

// === Scene Setup ===
const scene = new THREE.Scene();
let level = new Level1(scene);

let wallBoundingBoxes = level.getWallBoundingBoxes();
const ghostManager = createGhostManager(scene);

// === Renderer Setup ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// === Handle Window Resize ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Lighting Setup ===
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const targetCube = new THREE.Mesh(
  new THREE.BoxGeometry(5, 5, 5),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
targetCube.position.set(0, 2.5, 0);
// const ghostLight = new THREE.SpotLight(0xaaaaee, 1.0, 100, Math.PI / 8, 0.5, 1);
// ghostLight.position.set(5, 20, 5);
// ghostLight.castShadow = true;
// scene.add(ghostLight);

// const directionalLight = new THREE.DirectionalLight(0x666666, 1);
// directionalLight.position.set(0, 20, 0);
// directionalLight.castShadow = true;
// scene.add(directionalLight);

// === Ceiling Setup ===
function createCeiling(width, height, depth, texture) {
  const ceilingGeometry = new THREE.PlaneGeometry(width, depth);
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
  });

  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height; // Set ceiling at the same height as the walls
  ceiling.receiveShadow = true;
  ceiling.castShadow = true;
  scene.add(ceiling);
}


// === GLTF Loader ===
const loader = new GLTFLoader();

let mixer;
let model;
let modelBoundingBox;
let walkAction;
let shootAction;
let gunModel;
let bulletModel;

const clock = new THREE.Clock();

// === Movement Controls ===
const keysPressed = {};

window.addEventListener("keydown", (event) => {
  if (gameStarted) {
    keysPressed[event.key.toLowerCase()] = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (gameStarted) {
    keysPressed[event.key.toLowerCase()] = false;
  }
});

// === Mouse Controls ===
// let mouseSensitivity = 0.002;
// let previousMouseX = window.innerWidth / 2;
// let previousMouseY = window.innerHeight / 2;
// let pitch = 0;
// let maxPitch = Math.PI / 2;

// document.body.requestPointerLock =
//   document.body.requestPointerLock ||
//   document.body.mozRequestPointerLock ||
//   document.body.webkitRequestPointerLock;

// document.body.onclick = () => {
//   document.body.requestPointerLock();
// };

// window.addEventListener("mousemove", (event) => {
//   const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
//   const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

//   if (model) {
//     model.rotation.y -= deltaX * mouseSensitivity;
//     pitch -= deltaY * mouseSensitivity;
//     pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
//     camera.rotation.x = pitch;
//   }

//   previousMouseX += deltaX;
//   previousMouseY += deltaY;
// });

// === Shooting Input ===
window.addEventListener("mousedown", (event) => {
  if (event.button === 0) {
    triggerShooting();
  }
});

// === Raycaster and Shooting Setup ===
const raycaster = new THREE.Raycaster();
const shootDirection = new THREE.Vector3();
const shootOrigin = new THREE.Vector3();
const bullets = [];

window.singletons = {
  audio: document.getElementById("myAudio"),
  shootSound: new Audio("./public/shot.mp3"),
};

function triggerShooting() {
  if (!shootAction || shootAction.isRunning()) return;

  if (walkAction && walkAction.isRunning()) {
    walkAction.paused = true;
  }

  shootAction.reset();
  shootAction.play();
  window.singletons.shootSound.playbackRate = 1;
  window.singletons.shootSound
    .play()
    .then(() => console.log("Sound is playing"))
    .catch((e) => console.log("Error playing sound: ", e));

  mixer.addEventListener("finished", onShootAnimationFinished);
  createBullet();
}

function onShootAnimationFinished(event) {
  if (event.action === shootAction) {
    mixer.removeEventListener("finished", onShootAnimationFinished);
    if (keysPressed["w"] || keysPressed["arrowup"] || keysPressed["s"] || keysPressed["arrowdown"]) {
      if (walkAction) {
        walkAction.paused = false;
      }
    }
  }
}

// === Game Objects Setup ===
const objects = [];
const objectHitCount = {};

for (let i = 0; i < 3; i++) {
  const geometry = new THREE.BoxGeometry(3, 3, 3);
  const material = new THREE.MeshStandardMaterial({
    color: Math.random() * 0xffffff,
  });
  const object = new THREE.Mesh(geometry, material);
  object.position.set(i * 5 - 5, 0.5, -10);
  object.castShadow = true;
  object.receiveShadow = true;

  objects.push(object);
  objectHitCount[object.uuid] = 0;
  scene.add(object);
}

var crosshair;

// === Load Player Model ===
loader.load(
  "/models/animations/animated_fps_hands_rifle_animation_pack.glb",
  function (gltf) {
    model = gltf.scene;
    modelBoundingBox = new THREE.Box3().setFromObject(model);
    model.scale.set(0.3, 0.3, 0.3);
    // model.rotation.y = Math.PI;

    crosshair = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(model);
    level.setPlayer(model);

    ghostManager.setTarget(model.position);
    ghostManager.startSpawning(5000, 5);

    mixer = new THREE.AnimationMixer(model);

    console.log("Animations:", gltf.animations);

    if (gltf.animations && gltf.animations.length) {
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, "Armature|Arms_FPS_Anim_Walks");
      if (walkClip) {
        walkAction = mixer.clipAction(walkClip);
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
        walkAction.play();
        walkAction.paused = true;
      } else {
        walkAction = mixer.clipAction(gltf.animations[7]);
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
        walkAction.play();
        walkAction.paused = true;
      }

      const shootClip = THREE.AnimationClip.findByName(gltf.animations, "Armature|Arms_FPS_Anim_Shoot");
      if (shootClip) {
        shootAction = mixer.clipAction(shootClip);
        shootAction.setLoop(THREE.LoopOnce, 1);
        shootAction.clampWhenFinished = true;
        shootAction.stop();
      }
    }

    // loadGun();
    loadBulletModel();
  },
  (xhr) => console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`),
  (error) => console.error("An error occurred while loading the player model:", error)
);

camera.add(listener);
// === Load Gun and Bullet Models ===
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('./public/sounds/creepy.mp3', (buffer) => {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.5);
  sound.play();
});

// createCeiling(50, 5, 50, baseColorTexture); // Adjust dimensions as per the building

// // Add ceiling lights


// // Create multiple ceiling lights
// createCeilingLight(15, 5, 10,true);
// createCeilingLight(-13, 5, 12);
// createCeilingLight(-20, 5, 20);
// createCeilingLight(-5, 5, -5);
// createCeilingLight(20, 5, -15,true);
// createCeilingLight(13, 5, -10);
// === Sliding Collision Detection ===

function loadGun() {
  loader.load(
    "./public/gun.glb",
    function (gltf) {
      gunModel = gltf.scene;
      gunModel.scale.set(3.5, 3.5, 3.5);

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      const handBone = model.getObjectByName("mixamorigRightHand");
      if (handBone) {
        handBone.add(gunModel);
        gunModel.position.set(0.1, 0.6, 0.35);
        const lookDirection = new THREE.Vector3(
          Math.sin(model.rotation.y),
          0,
          Math.cos(model.rotation.y)
        ).normalize();
        const gunRotation = new THREE.Quaternion();
        gunRotation.setFromUnitVectors(new THREE.Vector3(-4.5, 5, -0.4), lookDirection);
        gunModel.quaternion.copy(gunRotation);
      } else {
        gunModel.position.set(0.5, 1.2, 0.3);
        model.add(gunModel);
      }
      loadBulletModel();
    },
    null,
    (error) => console.error("An error occurred while loading the gun model:", error)
  );
}

function loadBulletModel() {
  // loader.load("./public/bullet.glb", (gltf) => {
  //   bulletModel = gltf.scene;
  //   bulletModel.scale.set(0.05, 0.05, 0.05);
  // });
  const bulletGeometry = new THREE.SphereGeometry(0.01, 0.01, 0.01); // Adjust the size as needed
  const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black color

  bulletModel = new THREE.Mesh(bulletGeometry, bulletMaterial);
}

// === Update Bullets and Collisions ===
function updateBullets(delta) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(delta));

    if (bullet.position.length() > 100) {
      scene.remove(bullet);
      bullets.splice(i, 1);
      continue;
    }

    objects.forEach((obj, index) => {
      const objBox = new THREE.Box3().setFromObject(obj);
      const bulletBox = new THREE.Box3().setFromObject(bullet);

      if (objBox.intersectsBox(bulletBox)) {
        if (!objectHitCount[obj.uuid]) {
          objectHitCount[obj.uuid] = 0;
        }
        objectHitCount[obj.uuid]++;
        
        if (objectHitCount[obj.uuid] >= 2) {
          scene.remove(obj);
          objects.splice(index, 1);
        }

        scene.remove(bullet);
        bullets.splice(i, 1);
      }
    });
// Function to trigger red flash
function triggerHitFlash() {
    hitFlash.style.opacity = '1'; // Show overlay
    setTimeout(() => {
        hitFlash.style.opacity = '0'; // Fade out after a short duration
    }, 100); // 100ms duration for a quick flash
}

    ghostManager.ghosts.forEach((ghost, index) => {
      if (!ghost.model) return;
      
      const ghostBox = new THREE.Box3().setFromObject(ghost.model);
      const bulletBox = new THREE.Box3().setFromObject(bullet);

      if (ghostBox.intersectsBox(bulletBox)) {
        if (!ghost.hitCount) {
          ghost.hitCount = 0;
        }
        ghost.hitCount++;
        triggerHitFlash();

        ghostManager.playHitAnimation(ghost);

        if (ghost.hitCount >= 2) {
          ghostManager.removeGhost(index);
        }

        scene.remove(bullet);
        bullets.splice(i, 1);
        
      }
      
    });
  }
}
// === Red Flash Overlay Setup ===
const hitFlash = document.createElement('div');
hitFlash.style.position = 'fixed';
hitFlash.style.top = '0';
hitFlash.style.left = '0';
hitFlash.style.width = '100vw';
hitFlash.style.height = '100vh';
hitFlash.style.backgroundColor = 'rgba(255, 0, 0, 0.5)'; // Red with transparency
hitFlash.style.pointerEvents = 'none';
hitFlash.style.opacity = '0'; // Start hidden
hitFlash.style.transition = 'opacity 0.2s ease'; // Smooth fade out
document.body.appendChild(hitFlash);

function checkGhostCollisions() {
    if (!model) return;
    
    const playerBox = new THREE.Box3().setFromObject(model);
    
    ghostManager.ghosts.forEach(ghost => {
        if (!ghost.model) return;
        
        // console.log(ghost.model.position)


        let x =  Math.abs(ghost.model.position.x  - model.position.x)
        let y = Math.abs(ghost.model.position.y  - model.position.y)
        // console.log(x+y<5)
        if (x+y<5) {
            damagePlayer(0.05);
        }
    });
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
    gunPosition.copy(model.position);
    bullet.position.copy(gunPosition.add(new THREE.Vector3(0, 0, 0.02))); // Adjust offset as needed
  
    // Get the player's current forward direction
    const forwardDirection = new THREE.Vector3(0, 0, 1); // Assuming -Z is the forward direction
    forwardDirection.applyQuaternion(model.quaternion).normalize(); // Apply player's rotation and normalize
  
    // Set the bullet's position slightly in front of the gun
    const bulletOffset = forwardDirection.clone().multiplyScalar(0.2); // Adjust offset as needed
    bullet.position.add(bulletOffset);
  
    // Set bullet's rotation to match the player's forward direction
    bullet.quaternion.copy(model.quaternion);
  
    // Set the bullet's velocity based on the forward direction and desired speed
    const bulletSpeed = 100; // Adjust the bullet speed as necessary
    bullet.userData = { velocity: forwardDirection.clone().multiplyScalar(bulletSpeed) };
  
    // Add the bullet to the scene and track it
    scene.add(bullet);
    bullets.push(bullet);
  }
  

// === Menu Handling ===
const startMenu = document.getElementById("startMenu");
const optionsScreen = document.getElementById("optionsScreen");
const creditsScreen = document.getElementById("creditsScreen");

const startButton = document.getElementById("startButton");
const optionsButton = document.getElementById("optionsButton");
const creditsButton = document.getElementById("creditsButton");
const saveOptionsButton = document.getElementById("saveOptionsButton");
const closeCreditsButton = document.getElementById("closeCreditsButton");

let gameStarted = false;

// Start the game
startButton.addEventListener("click", () => {
  startMenu.style.display = "none";
  gameStarted = true;
});

// Show options screen
optionsButton.addEventListener("click", () => {
  startMenu.style.display = "none";
  optionsScreen.style.display = "flex";
});

// Show credits screen
creditsButton.addEventListener("click", () => {
  startMenu.style.display = "none";
  creditsScreen.style.display = "flex";
});

// Save options and return to main menu
saveOptionsButton.addEventListener("click", () => {
  // Here you would typically save the options to local storage or a config file
  console.log("Options saved");
  optionsScreen.style.display = "none";
  startMenu.style.display = "flex";
});

// Close credits and return to main menu
closeCreditsButton.addEventListener("click", () => {
  creditsScreen.style.display = "none";
  startMenu.style.display = "flex";
});

// Function to apply options (placeholder)
function applyOptions() {
  const difficulty = document.getElementById("difficulty").value;
  const mouseSensitivity = document.getElementById("mouseSensitivity").value;
  const soundVolume = document.getElementById("soundVolume").value;
  const graphicsQuality = document.getElementById("graphicsQuality").value;
  const fov = document.getElementById("fov").value;

  console.log("Applying options:", {
    difficulty,
    mouseSensitivity,
    soundVolume,
    graphicsQuality,
    fov,
  });

  // Here you would typically update game settings based on these values
  // For example:
  // camera.fov = fov;
  // camera.updateProjectionMatrix();
  // updateGraphicsQuality(graphicsQuality);
  // etc.
}

// Call applyOptions when saving options
saveOptionsButton.addEventListener("click", applyOptions);





function checkAndResolveCollision(deltaX, deltaZ) {
  const originalPosition = new THREE.Vector3().copy(model.position);
  const modelBoundingBox = new THREE.Box3().setFromObject(model);
  const modelRadius = (modelBoundingBox.max.x - modelBoundingBox.min.x) / 2; // Approximate player radius
  let collidedX = false;
  let collidedZ = false;

  // Calculate movement direction and magnitude
  const moveDirection = new THREE.Vector3(deltaX, 0, deltaZ).normalize();
  const moveDistance = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ); // Use Euclidean distance

  // Temporarily move the model for collision checking
  model.position.x += deltaX;
  model.position.z += deltaZ;

  try {
    // Define gun offset (you may need to adjust these values)
    const gunOffset = new THREE.Vector3(0, 1.4, -0.6); // Example offset for gun position
    const gunPosition = model.position.clone().add(gunOffset); // Calculate gun position

    // Create raycaster in the direction of intended movement for X direction
    const frontRayX = new THREE.Raycaster(
      gunPosition, // Use gun position for the raycaster origin
      new THREE.Vector3(deltaX, 0, 0).normalize(), // Direction only in X
      0,
      Math.abs(deltaX) + modelRadius // Use the length of the X movement
    );

    // Create raycaster in the direction of intended movement for Z direction
    const frontRayZ = new THREE.Raycaster(
      gunPosition, // Use gun position for the raycaster origin
      new THREE.Vector3(0, 0, deltaZ).normalize(), // Direction only in Z
      0,
      Math.abs(deltaZ) + modelRadius // Use the length of the Z movement
    );

    // Detect obstacles in the X direction
    const obstaclesX = frontRayX.intersectObjects(wallBoundingBoxes, true);
    // console.log("X Direction Obstacles:", obstaclesX);

    if (obstaclesX.length > 0 && obstaclesX[0].distance < Math.abs(deltaX) + modelRadius) {
      const obstacleNormalX = obstaclesX[0].face.normal.clone();

      // Calculate overlap for X direction
      const overlapX = Math.abs(deltaX) + modelRadius - obstaclesX[0].distance;

      // Push back along the normal direction of the obstacle
      model.position.addScaledVector(obstacleNormalX, overlapX);
      collidedX = true;
    } 

    // Detect obstacles in the Z direction
    const obstaclesZ = frontRayZ.intersectObjects(wallBoundingBoxes, true);
    // console.log("Z Direction Obstacles:", obstaclesZ);

    if (obstaclesZ.length > 0 && obstaclesZ[0].distance < Math.abs(deltaZ) + modelRadius) {
      const obstacleNormalZ = obstaclesZ[0].face.normal.clone();

      // Calculate overlap for Z direction
      const overlapZ = Math.abs(deltaZ) + modelRadius - obstaclesZ[0].distance;

      // Push back along the normal direction of the obstacle
      model.position.addScaledVector(obstacleNormalZ, overlapZ);
      collidedZ = true;
    } 
  } catch (error) {
    console.error("Collision check error:", error);
    // Optional: revert to original position if an error occurs
    model.position.copy(originalPosition);
  }

  // Reset to original position if there were collisions
  if (collidedX) {
    model.position.x = originalPosition.x;
  }
  if (collidedZ) {
    model.position.z = originalPosition.z;
  }

  return { collidedX, collidedZ };
}


let popup;
function checkPlayerDistance(player, door) {
  const distance = player.distanceTo(door);
  const interactionDistance = 3.0; // Adjust this value as needed

  // If the player is within the interaction range
  if (distance <= interactionDistance) {
    showPopup();  // Show the interaction popup

    if (keysPressed["e"]) {
      // Check if all enemies are defeated
      if (objects.length === 0) {
        // Display a loading screen while transitioning to Level 2
        showLoadingScreen();

        // Remove Level 1 from the scene
        level.clearScene();
        wallBoundingBoxes = [];

        // Load Level 2 after a slight delay to simulate loading
        loadLevel2();
        setTimeout(() => {
          hideLoadingScreen();  // Hide the loading screen once Level 2 is ready
        }, 3000);

      } else {
        // If monsters are still present, show a message to the player
        popup = document.getElementById("door-popup");
        popup.style.display = "block";
        popup.innerHTML = "Defeat all Monsters to open the door";
      }
    }
  } else {
    hidePopup();  // Hide the interaction popup if the player is too far
  }
}

// Function to load Level 2 into the scene
function loadLevel2() {
  level = new Level2(scene, model);  // Initialize and load Level 2
  wallBoundingBoxes = level.getWallBoundingBoxes();
  console.log("Level 2 loaded!");
}

// Function to show a loading screen (could be a simple overlay)
function showLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  loadingScreen.style.display = "block";
}

// Function to hide the loading screen
function hideLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  loadingScreen.style.display = "none";
}
function showPopup() {
  popup = document.getElementById("door-popup");
  popup.style.display = "block";
  popup.innerHTML = "Press E to open the door";
}

function hidePopup() {
  const popup = document.getElementById("door-popup");
  popup.style.display = "none";
}
// === Animation Loop ===
// Variables for jumping and mouse controls
let velocityY = 0;
const gravity = -14.8;
const jumpStrength = 9;
let isGrounded = false;

let yaw = 0;  // Horizontal rotation
let pitch = 0; // Vertical rotation (limited for FPS)

document.addEventListener('click', () => {
  // Request pointer lock for mouse movement control
  if (!document.pointerLockElement) {
    document.body.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) {
    // Pointer locked, listen to mouse movements
    document.addEventListener('mousemove', onMouseMove);
  } else {
    // Pointer unlocked, stop listening to mouse movements
    document.removeEventListener('mousemove', onMouseMove);
  }
});

// Function to handle mouse movement
function onMouseMove(event) {
  const sensitivity = 0.002;
  yaw -= event.movementX * sensitivity;
  pitch -= event.movementY * sensitivity;

  // Clamp pitch to prevent flipping
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const walkSpeed = 5 * delta;
  const smoothFactor = 0.1;
  const targetPosition = new THREE.Vector3();
  const targetQuaternion = new THREE.Quaternion();

  checkGhostCollisions();
  if (mixer) mixer.update(delta);

  // Rotate target cube for visual effect
  targetCube.rotation.y += 0.01;

  updateGhosts(ghostManager, delta);
  updateBullets(delta);
  if (model) {
    let moveX = 0;
    let moveZ = 0;
    let isMoving = false;

    // Handle forward/backward movement
    if (keysPressed["w"] || keysPressed["arrowup"]) {
      moveZ += walkSpeed;
      isMoving = true;
    }
    if (keysPressed["s"] || keysPressed["arrowdown"]) {
      moveZ -= walkSpeed;
      isMoving = true;
    }

    // Handle strafing
    if (keysPressed["a"] || keysPressed["arrowleft"]) {
      moveX -= walkSpeed;
      isMoving = true;
    }
    if (keysPressed["d"] || keysPressed["arrowright"]) {
      moveX += walkSpeed;
      isMoving = true;
    }

    // Handle jumping
    if (keysPressed[" "] && isGrounded) {
      velocityY = jumpStrength;
      isGrounded = false;
    }

    // Apply gravity
    velocityY += gravity * delta;
    const moveY = velocityY * delta;

    // Check ground collision to reset jump
    if (checkGroundCollision(model.position, moveY)) {
      velocityY = 0;
      isGrounded = true;
      console.log("Grounded");
    }

    // Calculate movement based on camera direction
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

    const deltaX = forward.x * moveZ + right.x * moveX;
    const deltaZ = forward.z * moveZ + right.z * moveX;

    // Resolve collisions and apply movement
    const { collidedX, collidedZ } = checkAndResolveCollision(deltaX, deltaZ);
    // if (!collidedX) model.position.x += deltaX;
    // if (!collidedZ) model.position.z += deltaZ;
    model.position.y += moveY;

    targetPosition.set(model.position.x + deltaX, model.position.y + moveY, model.position.z + deltaZ);
    model.position.lerp(targetPosition, smoothFactor);

    // Align model with yaw direction for realistic orientation
    // model.rotation.y = yaw;
    // model.rotation.x = pitch;

    const modelDirection = new THREE.Vector3(Math.sin(yaw), Math.sin(pitch), Math.cos(yaw)).normalize();
    model.lookAt(new THREE.Vector3().copy(model.position).add(modelDirection));

    // Camera positioning and following
    const cameraOffset = new THREE.Vector3(0, 0.3, -0.07);
    const cameraPosition = new THREE.Vector3()
      .copy(cameraOffset)
      .applyMatrix4(model.matrixWorld);
    camera.position.copy(cameraPosition);

    // Set camera look direction based on yaw and pitch
    const lookDirection = new THREE.Vector3(
      Math.sin(yaw),
      Math.sin(pitch),
      Math.cos(yaw)
    ).normalize();

    const cameraLookAt = new THREE.Vector3()
      .copy(camera.position)
      .add(lookDirection);
    camera.lookAt(cameraLookAt);

    // camera.rotateY(0.2);

    // model.lookAt(new THREE.Vector3().copy(model.position).add(lookDirection));

    // Handle walk animation
    if (walkAction) {
      walkAction.paused = !isMoving;
    }
  }

  // Update bullets and render the scene
  
  renderer.render(scene, camera);
}

// Ground collision check for jumping
function checkGroundCollision(position, moveY) {
  // Check if moving downward and near ground level, simulating a basic ground check
  if (position.y + moveY <= 2) { // Adjust ground level as needed
    position.y = 2;
    return true;
  }
  return false;
}



export  { animate, scene, model };
