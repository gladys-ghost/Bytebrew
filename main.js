import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Level1 from "./World/Level1"; // Assuming Level1 class handles wall creation
import {animate} from './playerModel';
import {scene} from './playerModel';
import { model } from "./playerModel";


// init();
animate();


// === Movement Controls ===
const keysPressed = {};

window.addEventListener("keydown", (event) => {
  keysPressed[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
  keysPressed[event.key.toLowerCase()] = false;
});

// === Setup Level ===