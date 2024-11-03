import * as THREE from "three";
import Wall from "./Wall.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";


export default class Level1 {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.offset = new Wall(0, 0, 0, 0, 0).wallWidth / 2;
    this.objects = [];

    // Array to store bounding boxes for all walls
    this.wallBoundingBoxes = [];

    const gltfLoader = new GLTFLoader();
    let doorModel;

    this.monstersDead = false;

    let doorType = this.monstersDead ? "unlocked.glb" : "scene.gltf";


    // this.player.position.set(-23.83, 1.6, -24.9);
    console.log("Player:::: ",this.player);


    gltfLoader.load(
      `/science_lab_door_-_apocalyptic/${doorType}`,
      (gltf) => {
        doorModel = gltf.scene;
        doorModel.scale.set(2, 1.5, 1);
        doorModel.position.set(-23.83, 1.6, -24.9);
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
    this.addBoundingBox(this.wall.mesh);

    this.wall2 = new Wall(-25, 0, 0, 0, 50);
    this.roomGroup.add(this.wall2.mesh);
    this.addBoundingBox(this.wall2.mesh);

    this.wall3 = new Wall(1.5, 0, -25, Math.PI / 2, 48.9);
    this.roomGroup.add(this.wall3.mesh);
    this.addBoundingBox(this.wall3.mesh);

    this.wallTop = new Wall(-24, 3, -25, Math.PI / 2, 2.2);
    this.roomGroup.add(this.wallTop.mesh);
    this.addBoundingBox(this.wallTop.mesh);

    this.wall4 = new Wall(0, 0, 25, Math.PI / 2, 50);
    this.roomGroup.add(this.wall4.mesh);
    this.addBoundingBox(this.wall4.mesh);

    this.scene.add(this.roomGroup);

    // Create bedroom group
    this.bedroomGroup = new THREE.Group();

    this.bedroomWall1 = new Wall(-10, 0, 20, 0, 10);
    this.bedroomGroup.add(this.bedroomWall1.mesh);
    this.addBoundingBox(this.bedroomWall1.mesh);

    this.bedroomWall2 = new Wall(
      -16.5 + this.offset - slightOffset,
      0,
      15 + this.offset - slightOffset,
      Math.PI / 2,
      13
    );
    this.bedroomGroup.add(this.bedroomWall2.mesh);
    this.addBoundingBox(this.bedroomWall2.mesh);

    this.scene.add(this.bedroomGroup);

    // Create enemy room group
    this.enemyRoomGroup = new THREE.Group();

    let roomDoorModel;

    gltfLoader.load(
      "/prison_cell_door/scene.gltf",
      (gltf) => {
        roomDoorModel = gltf.scene;
        roomDoorModel.scale.set(2, 1.5, 1);
        roomDoorModel.position.set(2.2, 0, 14.95);
        this.enemyRoomGroup.add(roomDoorModel);

        let anotherDoor = roomDoorModel.clone();
        anotherDoor.position.set(18.2, 0, 14.95);
        this.enemyRoomGroup.add(anotherDoor);

        // Add walls for the first room
        this.enemyRoomWall1 = new Wall(-5, 0, 20, 0, 10);
        this.enemyRoomGroup.add(this.enemyRoomWall1.mesh);
        

        this.enemyRoomWall2 = new Wall(
          10 - this.offset + slightOffset,
          0,
          15 - this.offset - slightOffset,
          Math.PI / 2,
          13
        );
        this.enemyRoomGroup.add(this.enemyRoomWall2.mesh);
        

        this.enemyRoomWall3 = new Wall(10, 0, 20, 0, 10);
        this.enemyRoomGroup.add(this.enemyRoomWall3.mesh);
        

        this.enemyRoomWall4 = new Wall(
          -2.5 - this.offset + slightOffset,
          0,
          15 - this.offset - slightOffset,
          Math.PI / 2,
          5
        );
        this.enemyRoomGroup.add(this.enemyRoomWall4.mesh);
        

        this.enemyRoomWall5 = new Wall(
          22.5 - this.offset + slightOffset,
          0,
          15 - this.offset - slightOffset,
          Math.PI / 2,
          5
        );
        this.enemyRoomGroup.add(this.enemyRoomWall5.mesh);
        
        // Add the first room group to the scene
        this.scene.add(this.enemyRoomGroup);
        this.addBoundingBox(this.enemyRoomGroup);

        // Clone walls and create a new group for the second room
        this.anotherRoomGroup = this.enemyRoomGroup.clone();
        this.anotherRoomGroup.rotation.set(0, Math.PI/2, 0);
        this.addBoundingBox(this.anotherRoomGroup);
        // Add the cloned room to the scene
        this.scene.add(this.anotherRoomGroup);
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );

    // Create the lab
    this.labGroup = new THREE.Group();

    this.labWall1 = new Wall(10, 0, -17.5, 0, 15);
    this.labGroup.add(this.labWall1.mesh);
    this.addBoundingBox(this.labWall1.mesh);

    this.labWall2 = new Wall(10, 0, 2, 0, 16);
    this.labGroup.add(this.labWall2.mesh);
    this.addBoundingBox(this.labWall2.mesh);

    this.labWall3 = new Wall(-7.5, 0, 10, Math.PI / 2, 35);
    this.labGroup.add(this.labWall3.mesh);
    this.addBoundingBox(this.labWall3.mesh);

    this.scene.add(this.labGroup);

    const fbxLoader = new FBXLoader();
    fbxLoader.load(
        '/models/fireplace/source/maya2sketchfab.fbx',
        (fbx) => {
            fbx.scale.set(0.4, 0.4, 0.4);
            fbx.position.set(-22.5, 0, -10);
            fbx.rotation.y = Math.PI / 2;
            
            // Basic material handling
            fbx.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Create basic material for the fireplace structure
                    const material = new THREE.MeshStandardMaterial({
                        color: 0x808080,
                        roughness: 0.7,
                        metalness: 0.3
                    });
                    
                    // If it's the fire part, make it emissive
                    if (child.name.toLowerCase().includes('fire') || child.name.toLowerCase().includes('flame')) {
                        material.emissive = new THREE.Color(0xff5500);
                        material.emissiveIntensity = 2;
                    }
                    
                    child.material = material;
                }
            });
            
            // Simple lighting setup
            // Main bright light for the fire
            const fireLight = new THREE.PointLight(0xff7700, 8, 20);
            fireLight.position.copy(fbx.position);
            fireLight.position.y += 2;
            
            // Ambient light to make the fireplace visible
            const ambientLight = new THREE.AmbientLight(0xffffff, 1);
            
            // Animate the fire light
            const animate = () => {
                fireLight.intensity = 6 + Math.random() * 4; // Flicker between 6 and 10 intensity
                requestAnimationFrame(animate);
            };
            animate();
            
            this.scene.add(ambientLight);
            this.scene.add(fireLight);
            this.scene.add(fbx);
            
            // Add collision box for the fireplace
            const fireplaceBox = new THREE.Box3().setFromObject(fbx);
            const boxSize = new THREE.Vector3();
            fireplaceBox.getSize(boxSize);
            
            // Create a slightly smaller collision box
            const collisionGeometry = new THREE.BoxGeometry(
                boxSize.x * 0.8,  // Make collision box slightly smaller than the model
                boxSize.y,
                boxSize.z * 0.8
            );
            const collisionMaterial = new THREE.MeshBasicMaterial({
                visible: false  // Make it invisible
            });
            const collisionMesh = new THREE.Mesh(collisionGeometry, collisionMaterial);
            
            // Position the collision box
            collisionMesh.position.copy(fbx.position);
            collisionMesh.rotation.copy(fbx.rotation);
            
            // Add to scene and store in bounding boxes array
            this.scene.add(collisionMesh);
            this.addBoundingBox(collisionMesh);
            
            // Store reference to remove later
            this.fireplaceCollider = collisionMesh;
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('Error loading fireplace:', error);
        }
    );
  }

  // Helper method to create and store bounding boxes for each wall
  addBoundingBox(mesh) {
    const boundingBox = new THREE.Box3().setFromObject(mesh);
    this.wallBoundingBoxes.push(boundingBox);
  }
  getWallBoundingBoxes() {
    return this.wallBoundingBoxes;
  }
  setMonstersDead(){
    this.monstersDead = true;
  }

  clearScene() {
    this.scene.remove(this.labGroup);
    this.scene.remove(this.anotherRoomGroup);
    this.scene.remove(this.enemyRoomGroup);
    this.scene.remove(this.bedroomGroup);
    
    if (this.fireplaceCollider) {
        this.scene.remove(this.fireplaceCollider);
    }
    
    // Remove all lights and models
    this.scene.traverse((object) => {
        if (object.isPointLight || object.type === 'Group') {
            this.scene.remove(object);
        }
    });
  }
}