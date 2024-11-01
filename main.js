import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Level1 from "./World/Level1"; // Assuming Level1 class handles wall creation
import {animate} from './playerModel';
import {scene} from './playerModel';
import { model } from "./playerModel";

animate();


const groundGeometry = new THREE.PlaneGeometry(50, 50); // Added subdivisions for displacement
const loaderGround = new THREE.TextureLoader();

const groundMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.8,
  color: 0xffffff,
  metalness: 0.2,
  bumpScale: 1,
  side: THREE.DoubleSide,
});

// Load and set textures with properties
loaderGround.load('/old-plank-flooring4-bl/old-plank-flooring4_basecolor.png', (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;
  groundMaterial.map = texture;
  groundMaterial.needsUpdate = true;
});

loaderGround.load('/old-plank-flooring4-bl/old-plank-flooring4_normal.png', (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);
  texture.anisotropy = 4;
  groundMaterial.normalMap = texture;
  groundMaterial.needsUpdate = true;
});

loaderGround.load('/old-plank-flooring4-bl/old-plank-flooring4_roughness.png', (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);
  texture.anisotropy = 4;
  groundMaterial.roughnessMap = texture;
  groundMaterial.needsUpdate = true;
});

loaderGround.load('/old-plank-flooring4-bl/old-plank-flooring4_metalness.png', (texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);
  texture.anisotropy = 4;
  groundMaterial.metalnessMap = texture;
  groundMaterial.needsUpdate = true;
});

// Create and add the ground mesh
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to horizontal
ground.receiveShadow = true;
ground.castShadow = true;
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