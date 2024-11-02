import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import BossModel from "./bossModel";
import Level1 from "./World/Level1";
import Level2 from "./World/Level2";
import { createGhostManager, updateGhosts } from './ghostManager';
import { HealthBar } from "./utils/health";
import { AmmoDisplay } from "./utils/amo";
import { LoadingScreen } from "./utils/loadingScreen";
import { InventorySystem } from "./utils/inventorySystem";
import { KillCounterSystem } from "./utils/killCounter";
import { FlickeringLightSystem } from "./utils/lights";
import { createMedKitManager, updateMedKits } from "./utils/medkit";
import { createArmorManager, updateArmorPickups } from "./utils/amobox";
let kills = 0;

let animationFrameId = null;

function pauseAnimation() {
  cancelAnimationFrame(animationFrameId); // Stop the animation

  setTimeout(() => {
    startAnimation(); // Restart the animation
  }, 20000);
}

pauseAnimation();



let gameStarted = false;
let playerHealth = 100;
const maxPlayerHealth = 100;

const gameStates = ["loading", "playing", "gameover"];
let initialGameState = gameStates[0]

const healthBar = new HealthBar(100, 100, {
  position: { top: '50px', left: '50px' },
  width: '300px',
  barHeight: '25px',
  barColors: {
      high: '#00ff00',
      medium: '#ffff00',
      low: '#ff0000'
  }
});

const loadingScreen = new LoadingScreen('Amazing Game', {
  backgroundColor: '#1a1a1a',
  titleColor: '#ffffff',
  loadingColor: '#cccccc',
  dotColors: ['#ff3366', '#33ff66', '#3366ff'],
  fontSize: {
      title: '64px',
      loading: '32px'
  }
});


loadingScreen.mount();


const killCounter = new KillCounterSystem({
  totalEnemies: 3 
});


const inventory = new InventorySystem({
  maxHealth: 100,
  medkitHealAmount: 25,
  initialMedkits: 3,
  gunDamage: 20,
  fireRate: 0.5
});

inventory.initializeUI();


const flickeringLights = new FlickeringLightSystem();

const customLights = new FlickeringLightSystem({
    intensity: 0.7,         // How strong the effect is (0-1)
    flickerSpeed: 1.5,      // How fast it flickers
    minOpacity: 0.1,        // Minimum opacity of the red overlay
    maxOpacity: 0.3         // Maximum opacity of the red overlay
});

// You can control the effect:
flickeringLights.setIntensity(0.8);     // Change intensity
flickeringLights.setFlickerSpeed(2);     // Change speed
flickeringLights.stop();                 // Stop the effect
flickeringLights.start();                // Resume the effect
flickeringLights.destroy();              // Remove completely

healthBar.mount();

healthBar.setHealth(100);

// Custom game over handler
healthBar.onGameOver = () => {
  gameOver();
};


const ammoDisplay = new AmmoDisplay(30, 30, {
  position: { top: '100px', left: '20px' },
  reloadTime: 1500, 
  barColors: {
      full: '#00ff00',
      medium: '#ffff00',
      low: '#ff0000',
      reloading: '#0088ff'
  }
});

ammoDisplay.mount();



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
// Create manager




function Loading() {
  gameStarted = false;
  const loadingScreen = document.createElement('div');
  loadingScreen.style.position = 'fixed';
  loadingScreen.style.top = '50%';
  loadingScreen.style.left = '50%';
  loadingScreen.style.transform = 'translate(-50%, -50%)';
  loadingScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  loadingScreen.style.color = 'white';
  loadingScreen.style.padding = '20px';
  loadingScreen.style.textAlign = 'center';
  loadingScreen.style.borderRadius = '10px';
  loadingScreen.innerHTML = `
      <h2>Loading...</h2>
  `;
  document.body.appendChild(loadingScreen);
}



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
const ambientLight = new THREE.AmbientLight(0xf00000, 0.1);
//scene.add(ambientLight);

const targetCube = new THREE.Mesh(
  new THREE.BoxGeometry(5, 5, 5),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
targetCube.position.set(0, 2.5, 0);

const directionalLight = new THREE.DirectionalLight(0xffff00, 0.2);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;

scene.add(directionalLight);

//
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

//===== Boss Model ===

const medKitManager = createMedKitManager(scene);
const armorManager = createArmorManager(scene);

// Spawn a medkit at specific position

// Or spawn at random position

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
let mouseSensitivity = 0.002; // Sensitivity for mouse movement
let pitch = 0; // Vertical rotation (up and down)
const maxPitch = Math.PI / 2; // Maximum pitch limit (90 degrees)

// Request pointer lock for more natural first-person movement
document.body.requestPointerLock = document.body.requestPointerLock || 
                                   document.body.mozRequestPointerLock || 
                                   document.body.webkitRequestPointerLock;

document.body.onclick = () => {
  document.body.requestPointerLock(); // Request pointer lock on click
};

window.addEventListener('mousemove', (event) => {
  // Calculate mouse movement
  const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
  const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

  if (model) {
    // Rotate model based on mouse movement
    model.rotation.y -= deltaX * mouseSensitivity; // Yaw (left/right)
    pitch -= deltaY * mouseSensitivity; // Pitch (up/down)

    // Clamp the pitch to prevent flipping
    pitch = Math.max(-maxPitch, Math.min(maxPitch, pitch));
    camera.rotation.x = pitch; // Apply pitch to the camera
  }
});

// Optionally handle pointer lock change events for better UX
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === document.body) {
    // Pointer lock is active
    console.log('Pointer lock activated');
  } else {
    // Pointer lock is not active
    console.log('Pointer lock deactivated');
  }
});


// === Shooting Input ===
window.addEventListener('mousedown', (event) => {
  if (event.button === 0) { // Left mouse button
    if(ammoDisplay.currentAmmo == 0){
      ammoDisplay.reload();
    }else{
      triggerShooting();
    }
  

  }
});

// === Raycaster and Shooting Setup ===
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

  if (walkAction && walkAction.isRunning()) {
    walkAction.paused = true;
  }

  shootAction.reset();
  shootAction.play();
  ammoDisplay.useAmmo();

  window.singletons.shootSound.playbackRate = 1;
  window.singletons.shootSound.play().then(() => {
    console.log("Sound is playing");
  }).catch(e => console.log("Error playing sound: ", e));

  // Add muzzle flash and flare
  showMuzzleFlash();

  // Listen for the shooting animation to finish
  mixer.addEventListener('finished', onShootAnimationFinished);
  createBullet();
}

function showMuzzleFlash() {
  // Load a texture for the muzzle flash
  const textureLoader = new THREE.TextureLoader();
  const muzzleFlashTexture = textureLoader.load('./path/to/muzzle_flash_texture.png'); // Replace with your texture path

  // Create a custom shader material for the muzzle flash
  const muzzleFlashMaterial = new THREE.ShaderMaterial({
    uniforms: {
      texture: { value: muzzleFlashTexture },
      time: { value: 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D texture;
      uniform float time;
      varying vec2 vUv;
      void main() {
        vec4 texColor = texture2D(texture, vUv);
        float intensity = sin(time * 10.0) * 0.5 + 0.5;
        gl_FragColor = vec4(texColor.rgb * intensity, texColor.a);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  // Create a muzzle flash mesh
  const muzzleFlashGeometry = new THREE.PlaneGeometry(1.0, 1.0); // Larger size for more impact
  const muzzleFlash = new THREE.Mesh(muzzleFlashGeometry, muzzleFlashMaterial);

  // Position the muzzle flash at the gun's muzzle
  const muzzlePosition = new THREE.Vector3();
  gunModel.getWorldPosition(muzzlePosition);
  muzzleFlash.position.copy(muzzlePosition);
  muzzleFlash.lookAt(camera.position); // Face the camera

  // Add the muzzle flash to the scene
  scene.add(muzzleFlash);

  // Create a spotlight for the flare effect
  const flareLight = new THREE.SpotLight(0xffaa00, 5, 20, Math.PI / 4, 0.5, 1);
  flareLight.position.copy(muzzlePosition);
  flareLight.target.position.set(
    muzzlePosition.x + Math.sin(model.rotation.y),
    muzzlePosition.y,
    muzzlePosition.z + Math.cos(model.rotation.y)
  );
  scene.add(flareLight);
  scene.add(flareLight.target);

  // Animate the muzzle flash and light
  const startTime = performance.now();
  const animate = () => {
    const elapsedTime = (performance.now() - startTime) / 1000;
    muzzleFlashMaterial.uniforms.time.value = elapsedTime;

    if (elapsedTime < 0.1) { // Duration of the effect
      requestAnimationFrame(animate);
    } else {
      scene.remove(muzzleFlash);
      scene.remove(flareLight);
      scene.remove(flareLight.target);
    }
  };
  animate();
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
  objectHitCount[object.uuid] = 0; // Initialize hit count for each object
  
  //scene.add(object);
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
      const walkClip = THREE.AnimationClip.findByName(gltf.animations, 'npc_walk_pistol');
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
        console.warn('Walk animation "npc_walk_pistol" not found. Using the first available animation.');
      }

      // === Shooting Animation Setup ===
      const shootClip = THREE.AnimationClip.findByName(gltf.animations, 'npc_shooting_pistol');
      if (shootClip) {
        shootAction = mixer.clipAction(shootClip);
        shootAction.setLoop(THREE.LoopOnce, 1);
        shootAction.clampWhenFinished = true;
        shootAction.stop();
      }
    }

    loadGun();
  },
  function (xhr) {
    console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
  },
  function (error) {
    console.error('An error occurred while loading the player model:', error);
  }
);

function loadGun() {
  loader.load(
    './public/gun.glb',
    function (gltf) {
      gunModel = gltf.scene;
      gunModel.scale.set(3.5, 3.5, 3.5);

      // Log the gun model structure to help with positioning
      console.log('Gun model structure:', gunModel);

      model.traverse((child) => {
        if (child.isBone) {
          console.log('Bone:', child.name);
        } else if (child.isMesh) {
          console.log('Mesh:', child.name);
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Add flashlight before attaching to hand
      const flashlightSystem = addFlashlight(gunModel);

      const handBone = model.getObjectByName('mixamorigRightHand');
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
        console.log("Gun attached to player's hand");
      } else {
        gunModel.position.set(0.5, 1.2, 0.3);
        model.add(gunModel);
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

function addFlashlight(gunModel) {
  // Create a group to hold all flashlight components
  const flashlightGroup = new THREE.Group();
  
  // Create spotlight for flashlight effect
  const flashlight = new THREE.SpotLight(0xffffff, 100); // Increased intensity
  flashlight.angle = Math.PI / 12; // Narrower beam for better visibility
  flashlight.penumbra = 0.2;
  flashlight.decay = 0.2;
  flashlight.distance = 100; // Increased range
  flashlight.castShadow = true;

  // Configure shadow properties
  flashlight.shadow.mapSize.width = 1024;
  flashlight.shadow.mapSize.height = 1024;
  flashlight.shadow.camera.near = 0.1;
  flashlight.shadow.camera.far = 150;
  flashlight.shadow.focus = 1;

  // Create a visual representation of the flashlight lens
  const flashlightLens = new THREE.Mesh(
    new THREE.CircleGeometry(0.03, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 1
    })
  );

  // Create a target for the spotlight
  const flashlightTarget = new THREE.Object3D();
  
  // Position components properly
  // Adjust these values based on your gun model
  flashlight.position.copy(gunModel.position);


  flashlightTarget.position.set(15, -3, 0);

  // Add helper to visualize light direction (remove in production)
  const spotlightHelper = new THREE.SpotLightHelper(flashlight);
//  scene.add(spotlightHelper); // Add to scene for debugging

  // Add everything to the flashlight group
  flashlightGroup.add(flashlight);
  flashlightGroup.add(flashlightTarget);
  
  // Add the group to the gun model
  gunModel.add(flashlightGroup);
  flashlight.target = flashlightTarget;

  // Store references
  gunModel.userData.flashlight = flashlight;
  gunModel.userData.flashlightLens = flashlightLens;
  gunModel.userData.flashlightTarget = flashlightTarget;
  gunModel.userData.flashlightHelper = spotlightHelper;

  // Update helper in animation loop
  function updateHelper() {
    if (spotlightHelper) {
      spotlightHelper.update();
    }
    requestAnimationFrame(updateHelper);
  }
  updateHelper();

  // Add subtle flicker effect
  function updateFlashlight() {
    if (flashlight.intensity > 0) {
      const baseIntensity = 5;
      const flicker = Math.random() * 0.2 - 0.1;
      flashlight.intensity = baseIntensity + flicker;
      flashlightLens.material.emissiveIntensity = 0.8 + flicker;
    }
    requestAnimationFrame(updateFlashlight);
  }
  updateFlashlight();

  // Toggle function with debug logging
  gunModel.userData.toggleFlashlight = function() {
    console.log('Toggling flashlight');
    const isOn = flashlight.intensity > 0;
    
    if (isOn) {
      console.log('Turning flashlight off');
      flashlight.intensity = 0;
      flashlightLens.material.emissiveIntensity = 0;
    } else {
      console.log('Turning flashlight on');
      flashlight.intensity = 10;
      flashlightLens.material.emissiveIntensity = 1;
    }
  };

  // Add toggle key listener
  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'f') {
      console.log('F key pressed');
      gunModel.userData.toggleFlashlight();
    }
  });

  // Make sure scene has proper rendering settings
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  return flashlightGroup;
}

// Add this to your animation loop
function updateFlashlightHelper() {
  if (gunModel && gunModel.userData.flashlightHelper) {
    gunModel.userData.flashlightHelper.update();
  }
}

function loadBulletModel() {
  loader.load("./public/bullet.glb", (gltf) => {
    bulletModel = gltf.scene;
    bulletModel.scale.set(0.01, 0.01, 0.01);
  });
}

// === Update Bullets and Collisions ===
function updateBullets(delta) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(delta*1.4));

    if (bullet.position.length() > 100) {
      scene.remove(bullet);
      bullets.splice(i, 1);
      continue;
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

        ghostManager.playHitAnimation(ghost);

        if (ghost.hitCount >= 2) {

          medKitManager.createMedKit([ghost.model.position.x,1,ghost.model.position.z]);
          armorManager.createArmorPickup([ghost.model.position.x+1,1,ghost.model.position.z+1])
          ghostManager.removeGhost(index);
          killCounter.incrementKills();
          kills += 1;

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
        


        let x =  ghost.model.position.x*ghost.model.position.x  - model.position.x*model.position.x
        let z = ghost.model.position.z*ghost.model.position.z  - model.position.z*model.position.z
        if (x*x+z*z<=10) {
       //   healthBar.damage(5.1);
          inventory.takeDamage(0.1);
          healthBar.setHealth(inventory.getHealth())

          if(healthBar.getHealth() == 0){

            gameOver();
            pauseAnimation();


          }

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

const startButton = document.getElementById('startButton');
const optionsButton = document.getElementById('optionsButton');
const creditsButton = document.getElementById('creditsButton');
const saveOptionsButton = document.getElementById('saveOptionsButton');
const closeCreditsButton = document.getElementById('closeCreditsButton');


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
saveOptionsButton.addEventListener('click', applyOptions);


function checkMedkitPickup() {
  if (!model) return;

  const playerBox = new THREE.Box3().setFromObject(model);

  medKitManager.medkits.forEach((medkit, index) => {
      const medkitBox = new THREE.Box3().setFromObject(medkit.model);

      if (playerBox.intersectsBox(medkitBox)) {
          // Check if the player's inventory has space for the medkit
          if (1==1) {
              // Add the medkit to the inventory

              // Remove the medkit from the scene
              scene.remove(medkit.model);
              medKitManager.medkits.splice(index, 1);
              healthBar.setHealth(100);

              // Update the player's health
             // inventory.heal(medkit.healAmount);
         //     //healthBar.setHealth(inventory.getHealth());
          }
      }
  });
}


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
  console.log(killCounter.getKillCount);

  // If the player is within the interaction range
  if (distance <= interactionDistance) {
    showPopup();  // Show the interaction popup

    if (keysPressed["e"]) {
      // Check if all enemies are defeated
      if (kills >= 3) {
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

function canTake(){
  
}


function startAnimation() {
  animationFrameId = requestAnimationFrame(animate);
}

// Function to stop the animation




function animate() {
//  requestAnimationFrame(animate);

animationFrameId = requestAnimationFrame(animate);



  if(model && gunModel && bulletModel){
    loadingScreen.unmount();
    updateFlashlightHelper();
    checkMedkitPickup();

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

      checkPlayerDistance(model.position, new THREE.Vector3(-23.83, 1.6, -24.9));

      // Handle camera based on view mode
      if (isThirdPerson) {
        // Third person camera setup
        const cameraOffset = new THREE.Vector3(0, 3, -8);
        const smoothness = 0.1;

        // Calculate desired camera position
        const desiredPosition = new THREE.Vector3()
          .copy(model.position)
          .add(cameraOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), model.rotation.y));

        // Smoothly interpolate current camera position to desired position
        camera.position.lerp(desiredPosition, smoothness);

        // Make camera look at player's head level
        const lookAtPosition = new THREE.Vector3()
          .copy(model.position)
          .add(new THREE.Vector3(0, 2, 0));

        camera.lookAt(lookAtPosition);
      } else {
        // First person camera (original code)
        const cameraOffset = new THREE.Vector3(0, 6, 1.5);
        const cameraPosition = new THREE.Vector3()
          .copy(cameraOffset)
          .applyMatrix4(model.matrixWorld);

        camera.position.copy(cameraPosition);

        const lookDirection = new THREE.Vector3(
          Math.sin(model.rotation.y),
          0,
          Math.cos(model.rotation.y)
        ).normalize();

        const cameraLookAt = new THREE.Vector3()
          .copy(model.position)
          .add(lookDirection);
        camera.lookAt(cameraLookAt.x, model.position.y + 1.5, cameraLookAt.z);
      }
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
  } else {
    if(gameStarted) {
      loadingScreen.mount();
    }
  }
}


// HTML structure for the mode preview
const modePreview = document.createElement('div');
modePreview.style.position = 'fixed';
modePreview.style.bottom = '20px';
modePreview.style.right = '20px';
modePreview.style.padding = '10px 20px';
modePreview.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
modePreview.style.color = 'white';
modePreview.style.borderRadius = '5px';
modePreview.style.fontFamily = 'Arial, sans-serif';
modePreview.style.zIndex = '1000';
document.body.appendChild(modePreview);

// Keep track of the current mode and keys pressed
let isThirdPerson = false;

// Update the mode preview text
function updateModePreview() {
    const currentMode = isThirdPerson ? 'Third Person' : 'First Person';
    
}

// Initialize the preview
updateModePreview();

// Event listener for keydown
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    keysPressed[key] = true;
    
    // Toggle camera view when 'c' is pressed
    if (key === 'c') {
        isThirdPerson = !isThirdPerson;
        updateModePreview();
    
    }
    if(key === 'r'){
      ammoDisplay.reload();

    }
});

// Event listener for keyup
document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    delete keysPressed[key];
});



// Camera mode toggle with SVG icon
class CameraToggle {
  constructor() {
      this.isThirdPerson = false;
      this.createToggleElement();
      this.addEventListeners();
  }

  createToggleElement() {
      // Create container div
      this.container = document.createElement('div');
      this.container.style.cssText = `
          position: fixed;
          bottom: 0px;
          right: 20px;
          display: flex;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          user-select: none;
          font-family: Arial, sans-serif;
          z-index: 1000;
      `;

      // Create SVG icon
      this.iconSvg = this.createCameraIcon();
      this.container.appendChild(this.iconSvg);

      // Create text element
      this.modeText = document.createElement('span');
      this.modeText.style.marginLeft = '10px';
      this.container.appendChild(this.modeText);

      // Initial update
      this.updateMode();

      // Add to document
      document.body.appendChild(this.container);
  }

  createCameraIcon() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '24');
      svg.setAttribute('height', '24');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'white');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');

      // Camera body path
      const bodyPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      bodyPath.setAttribute('d', 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z');
      svg.appendChild(bodyPath);

      // Camera lens path
      const lensPath = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      lensPath.setAttribute('cx', '12');
      lensPath.setAttribute('cy', '13');
      lensPath.setAttribute('r', '3');
      svg.appendChild(lensPath);

      return svg;
  }

  updateMode() {
      this.modeText.textContent = this.isThirdPerson 
          ? 'Third Person Mode' 
          : 'First Person Mode';
      
      // Optional: Add transition or visual feedback
      this.container.style.backgroundColor = 'rgba(0, 100, 255, 0.7)';
      setTimeout(() => {
          this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      }, 200);
  }

  addEventListeners() {

      // Optional: Toggle with 'C' key
      document.addEventListener('keydown', (event) => {
          if (event.key.toLowerCase() === 'c') {
              this.isThirdPerson = !this.isThirdPerson;
              this.updateMode();
          }
      });
  }
}

// Initialize the camera toggle
const cameraToggle = new CameraToggle();


export { animate, scene };
