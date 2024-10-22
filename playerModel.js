import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Level1 from "./World/Level1";
import Level2 from "./World/Level2";
import { createGhostManager, updateGhosts } from './ghostManager';

let playerHealth = 100;
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

// === Camera Setup ===
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

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

const targetCube = new THREE.Mesh(
  new THREE.BoxGeometry(5, 5, 5),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
targetCube.position.set(0, 2.5, 0);

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
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x808080,
  depthWrite: false,
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// === GLTF Loader ===
const loader = new GLTFLoader();

let mixer;
let model;
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
let mouseSensitivity = 0.002;
let previousMouseX = window.innerWidth / 2;
let previousMouseY = window.innerHeight / 2;
let pitch = 0;
let maxPitch = Math.PI / 2;

document.body.requestPointerLock =
  document.body.requestPointerLock ||
  document.body.mozRequestPointerLock ||
  document.body.webkitRequestPointerLock;

document.body.onclick = () => {
  document.body.requestPointerLock();
};

window.addEventListener("mousemove", (event) => {
  const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
  const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

  if (model) {
    model.rotation.y -= deltaX * mouseSensitivity;
    pitch -= deltaY * mouseSensitivity;
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
    camera.rotation.x = pitch;
  }

  previousMouseX += deltaX;
  previousMouseY += deltaY;
});

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

// === Load Player Model ===
loader.load(
  "./public/obn_2.glb",
  function (gltf) {
    model = gltf.scene;
    model.scale.set(0.3, 0.3, 0.3);
    model.rotation.y = Math.PI;
    model.position.set(0, 0, 0);

    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(model);

    ghostManager.setTarget(model.position);
    ghostManager.startSpawning(5000, 5);

    mixer = new THREE.AnimationMixer(model);

    if (gltf.animations && gltf.animations.length) {
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, "npc_walk_pistol");
      if (walkClip) {
        walkAction = mixer.clipAction(walkClip);
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
        walkAction.play();
        walkAction.paused = true;
      } else {
        walkAction = mixer.clipAction(gltf.animations[0]);
        walkAction.setLoop(THREE.LoopRepeat, Infinity);
        walkAction.play();
        walkAction.paused = true;
      }

      const shootClip = THREE.AnimationClip.findByName(gltf.animations, "npc_shooting_pistol");
      if (shootClip) {
        shootAction = mixer.clipAction(shootClip);
        shootAction.setLoop(THREE.LoopOnce, 1);
        shootAction.clampWhenFinished = true;
        shootAction.stop();
      }
    }

    loadGun();
  },
  (xhr) => console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`),
  (error) => console.error("An error occurred while loading the player model:", error)
);

// === Load Gun and Bullet Models ===
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
  loader.load("./public/bullet.glb", (gltf) => {
    bulletModel = gltf.scene;
    bulletModel.scale.set(0.05, 0.05, 0.05);
  });
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

    ghostManager.ghosts.forEach((ghost, index) => {
      if (!ghost.model) return;
      
      const ghostBox = new THREE.Box3().setFromObject(ghost.model);
      const bulletBox = new THREE.Box3().setFromObject(bullet);

      if (ghostBox.intersectsBox(bulletBox)) {
        if (!ghost.hitCount) {
          ghost.hitCount = 0;
        }
        ghost.hitCount++;

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

function checkGhostCollisions() {
    if (!model) return;
    
    const playerBox = new THREE.Box3().setFromObject(model);
    
    ghostManager.ghosts.forEach(ghost => {
        if (!ghost.model) return;
        
        console.log(ghost.model.position)


        let x =  Math.abs(ghost.model.position.x  - model.position.x)
        let y = Math.abs(ghost.model.position.y  - model.position.y)
        console.log(x+y<5)
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
  gunModel.getWorldPosition(gunPosition);
  bullet.position.copy(gunPosition);

  // Get the player's current forward direction (we need to flip it)
  const forwardDirection = new THREE.Vector3(0, 0, 1); // Default forward direction in gun's local space (positive Z)
  forwardDirection.applyQuaternion(model.quaternion); // Apply the player's current rotation

  // Reset the bullet's local rotation to face forward in local space
  bullet.rotation.set(0, 0, 0); // Reset rotation if needed
  bullet.quaternion.copy(model.quaternion); // Align bullet's rotation with the player's current rotation

  // Adjust the bullet's forward direction to face the movement direction
  const bulletRotation = new THREE.Quaternion();
  bulletRotation.setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    forwardDirection.normalize()
  );
  bullet.quaternion.premultiply(bulletRotation);

  // Apply an offset to move the bullet slightly in front of the gun
  const bulletOffset = new THREE.Vector3(0, 0, 0); // Offset in front of gun along its forward direction
  bulletOffset.applyQuaternion(gunModel.quaternion); // Apply gun's rotation to the offset
  bullet.position.add(bulletOffset); // Move bullet slightly forward from gun

  // Set bullet's velocity based on the player's current forward direction (flip Z)
  bullet.userData = { velocity: forwardDirection.clone().multiplyScalar(25) }; // Adjust bullet speed

  // Add the bullet to the scene
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
  let modelBoundingBox = new THREE.Box3().setFromObject(model);

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
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  checkGhostCollisions();
  if (mixer) mixer.update(delta);

  const walkSpeed = 5 * delta;
  const rotateSpeed = Math.PI * delta;

  let isMoving = false;


  
  targetCube.rotation.y += 0.01;
  
  updateGhosts(ghostManager, delta);


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

    // if closer to the door then can click e to open and a popup that says click e to open door will showup on the screen

    checkPlayerDistance(model.position, new THREE.Vector3(-23.83, 1.6, -24.9));

    // Adjust the camera position and rotation to follow the player
    const cameraOffset = new THREE.Vector3(0, 6, 1.5); // Adjust the offset as needed
    const cameraPosition = new THREE.Vector3()
      .copy(cameraOffset)
      .applyMatrix4(model.matrixWorld); // Move camera relative to player

    camera.position.copy(cameraPosition);

    // Make the camera look in the direction the player is facing
    const lookDirection = new THREE.Vector3(
      Math.sin(model.rotation.y),
      0,
      Math.cos(model.rotation.y)
    ).normalize();

    const cameraLookAt = new THREE.Vector3()
      .copy(model.position)
      .add(lookDirection);
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

export { animate, scene, model };
