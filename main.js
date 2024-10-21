import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Level1 from "./World/Level1"; // Assuming Level1 class handles wall creation

// === Scene Setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Dark background for a haunted feel

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

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0x444466, 0.5);
scene.add(ambientLight);

const ghostLight = new THREE.SpotLight(0xaaaaee, 1.0, 100, Math.PI / 8, 0.5, 1);
ghostLight.position.set(5, 20, 5);
ghostLight.castShadow = true;
scene.add(ghostLight);

const directionalLight = new THREE.DirectionalLight(0x666666, 0.3);
directionalLight.position.set(0, 20, 0);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Flicker effect for ghost light
function flickerLight(light) {
  light.intensity = Math.random() * 0.5 + 0.7;
}
setInterval(() => {
  flickerLight(ghostLight);
}, 200); // Flicker every 200ms

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

// === Function to Create Furniture ===
function createFurniture() {
  const furniture = [];
  const buildingBounds = new THREE.Box3(new THREE.Vector3(-25, 0, -25), new THREE.Vector3(25, 10, 25)); // Define the building boundaries

  // Function to check if a position is within the building bounds and does not collide with existing furniture
  function isValidPosition(position) {
    const testBox = new THREE.Box3().setFromCenterAndSize(position, new THREE.Vector3(0.5, 0.5, 0.5)); // Assuming a small size for collision testing
    return buildingBounds.containsPoint(position) && !furniture.some(box => box.intersectsBox(testBox));
  }

  // Create various pieces of furniture
  const furnitureSpecs = [
    { type: "table", geometry: new THREE.BoxGeometry(2,5,2), material: new THREE.MeshStandardMaterial({ color: 0x8B4513 }) },
    { type: "chair", geometry: new THREE.BoxGeometry(2,5,2), material: new THREE.MeshStandardMaterial({ color: 0x654321 }) },
    { type: "shelf", geometry: new THREE.BoxGeometry(2,5,2), material: new THREE.MeshStandardMaterial({ color: 0x3B2F25 }) },
  ];

  furnitureSpecs.forEach(spec => {
    let position;
    do {
      position = new THREE.Vector3(
        Math.random() * (buildingBounds.max.x - buildingBounds.min.x) + buildingBounds.min.x,
        0.5, // Assuming all furniture is placed at a height of 0.5
        Math.random() * (buildingBounds.max.z - buildingBounds.min.z) + buildingBounds.min.z
      );
    } while (!isValidPosition(position));

    const furniturePiece = new THREE.Mesh(spec.geometry, spec.material);
    furniturePiece.position.copy(position);
    furniturePiece.castShadow = true;
    furniturePiece.receiveShadow = true;
    scene.add(furniturePiece);
    furniture.push(new THREE.Box3().setFromObject(furniturePiece)); // Create a bounding box for collision
  });

  // Additional eerie objects
  const candleGeometry = new THREE.CylinderGeometry(2,5,2, 32);
  const candleMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  let candlePosition;
  do {
    candlePosition = new THREE.Vector3(
      Math.random() * (buildingBounds.max.x - buildingBounds.min.x) + buildingBounds.min.x,
      0.1,
      Math.random() * (buildingBounds.max.z - buildingBounds.min.z) + buildingBounds.min.z
    );
  } while (!isValidPosition(candlePosition));
  const candle = new THREE.Mesh(candleGeometry, candleMaterial);
  candle.position.copy(candlePosition);
  candle.castShadow = true;
  scene.add(candle);

  const spookyPictureGeometry = new THREE.PlaneGeometry(2,5,2);
  const spookyPictureMaterial = new THREE.MeshStandardMaterial({
    map: new THREE.TextureLoader().load('./public/spooky-picture.png'), // Replace with your spooky picture texture
  });
  let spookyPicturePosition;
  do {
    spookyPicturePosition = new THREE.Vector3(
      Math.random() * (buildingBounds.max.x - buildingBounds.min.x) + buildingBounds.min.x,
      1,
      Math.random() * (buildingBounds.max.z - buildingBounds.min.z) + buildingBounds.min.z
    );
  } while (!isValidPosition(spookyPicturePosition));
  const spookyPicture = new THREE.Mesh(spookyPictureGeometry, spookyPictureMaterial);
  spookyPicture.position.copy(spookyPicturePosition);
  scene.add(spookyPicture);

  return furniture;
}
const furnitureBoundingBoxes = createFurniture();

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

  // Check collision with walls and furniture
  for (const boundingBox of [...wallBoundingBoxes, ...furnitureBoundingBoxes]) {
    if (modelBoundingBox.intersectsBox(boundingBox)) {
      collidedX = true;
      model.position.x = originalPosition.x; // Revert X movement on collision
      break;
    }
  }

  // Attempt to move along the Z-axis
  model.position.z += deltaZ;
  modelBoundingBox.setFromObject(model);

  for (const boundingBox of [...wallBoundingBoxes, ...furnitureBoundingBoxes]) {
    if (modelBoundingBox.intersectsBox(boundingBox)) {
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

animate();