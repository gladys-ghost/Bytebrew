import * as THREE from "three";

const startMenu = document.getElementById("startMenu");
const optionsScreen = document.getElementById("optionsScreen");
const creditsScreen = document.getElementById("creditsScreen");

const startButton = document.getElementById('startButton');
const optionsButton = document.getElementById('optionsButton');
const creditsButton = document.getElementById('creditsButton');
const saveOptionsButton = document.getElementById('saveOptionsButton');
const closeCreditsButton = document.getElementById('closeCreditsButton');

// Function to load player model and setup scene objects
async function loadPlayerModel() {
  const { animate, scene } = await import('./playerModel');

  // === Ground Plane Setup After Scene is Available ===
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
  scene.add(ground); // Add ground to scene after it is loaded

  // Start animation if needed
  animate();
}

startButton.addEventListener("click", () => {
  // Hide start menu and load player model
  startMenu.style.display = "none";
  setTimeout(loadPlayerModel, 700); // Delay loading by 500ms
});

// === Movement Controls ===
const keysPressed = {};

window.addEventListener("keydown", (event) => {
  keysPressed[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
  keysPressed[event.key.toLowerCase()] = false;
});

// === Setup Level ===
// Any other level setup code goes here, ensuring it's done after loading the player model
