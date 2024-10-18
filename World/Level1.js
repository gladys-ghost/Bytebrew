import * as THREE from "three";
import Wall from "./Wall.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default class Level1 {
  constructor(scene) {
    this.scene = scene;
    this.offset = new Wall(0, 0, 0, 0, 0).wallWidth / 2;

    const gltfLoader = new GLTFLoader();
    let doorModel;

    gltfLoader.load(
      "/science_lab_door_-_apocalyptic/scene.gltf",
      (gltf) => {
        doorModel = gltf.scene;
        doorModel.scale.set(2,1.5, 1);
        doorModel.position.set(-23.83, 1.6, -24.8);
        doorModel
        this.scene.add(doorModel);
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );

    // Create a group to hold all walls
    this.roomGroup = new THREE.Group();

    // Slightly adjust the positions to avoid Z-fighting
    const slightOffset = 0.001;

    // Main room walls
    this.wall = new Wall(25, 0, 0, 0, 50);
    this.roomGroup.add(this.wall.mesh);

    this.wall2 = new Wall(-25, 0, 0, 0, 50);
    this.roomGroup.add(this.wall2.mesh);

    this.wall3 = new Wall(1.5, 0, -25, Math.PI / 2, 48.9);
    this.roomGroup.add(this.wall3.mesh);

    this.wallTop = new Wall(-24, 3, -25, Math.PI / 2, 2.2);
    this.roomGroup.add(this.wallTop.mesh);

    this.wall4 = new Wall(0, 0, 25, Math.PI / 2, 50);
    this.roomGroup.add(this.wall4.mesh);

    this.scene.add(this.roomGroup);

    // Create bedroom group
    this.bedroomGroup = new THREE.Group();

    this.bedroomWall1 = new Wall(-10, 0, 20, 0, 10);
    this.bedroomGroup.add(this.bedroomWall1.mesh);

    this.bedroomWall2 = new Wall(
      -16.5 + this.offset - slightOffset,
      0,
      15 + this.offset - slightOffset,
      Math.PI / 2,
      13
    );
    this.bedroomGroup.add(this.bedroomWall2.mesh);

    this.scene.add(this.bedroomGroup);

    // Create enemy room group
    this.enemyRoomGroup = new THREE.Group();

    // Enemy room walls
    this.enemyRoomWall1 = new Wall(-5, 0, 20, 0, 10);
    this.enemyRoomGroup.add(this.enemyRoomWall1.mesh);

    this.enemyRoomWall3 = new Wall(10, 0, 20, 0, 10);
    this.enemyRoomGroup.add(this.enemyRoomWall3.mesh);

    this.enemyRoomWall2 = new Wall(
      10 - this.offset + slightOffset,
      0,
      15 - this.offset - slightOffset,
      Math.PI / 2,
      13
    );
    this.enemyRoomGroup.add(this.enemyRoomWall2.mesh);

    this.enemyRoomWall4 = new Wall(
      -2.5 - this.offset + slightOffset,
      0,
      15 - this.offset - slightOffset,
      Math.PI / 2,
      5
    );
    this.enemyRoomGroup.add(this.enemyRoomWall4.mesh);

    this.enemyRoomWall4 = new Wall(
      22.5 - this.offset + slightOffset,
      0,
      15 - this.offset - slightOffset,
      Math.PI / 2,
      5
    );
    this.enemyRoomGroup.add(this.enemyRoomWall4.mesh);

    this.scene.add(this.enemyRoomGroup);

    this.anotherRoomGroup = this.enemyRoomGroup.clone();
    this.anotherRoomGroup.position.set(0, 0, 0);
    this.anotherRoomGroup.rotation.set(0, Math.PI / 2, 0);
    this.scene.add(this.anotherRoomGroup);

    // Create the lab
    this.labGroup = new THREE.Group();

    this.labWall1 = new Wall(10, 0, -17.5, 0, 15);
    this.labGroup.add(this.labWall1.mesh);

    this.labWall2 = new Wall(10, 0, 2, 0, 16);
    this.labGroup.add(this.labWall2.mesh);

    this.labWall3 = new Wall(-7.5, 0, 10, Math.PI / 2, 35);
    this.labGroup.add(this.labWall3.mesh);
    this.scene.add(this.labGroup);
  }
}
