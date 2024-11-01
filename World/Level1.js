import * as THREE from "three";
import Wall from "./Wall.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import listener from "./audioListener.js";
import camera from "../camera.js"
import { cos } from "three/webgpu";
import Ceiling from "./Ceiling.js";


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


    gltfLoader.load(
      `/science_lab_door_-_apocalyptic/${doorType}`,
      (gltf) => {
        doorModel = gltf.scene;
        console.log(doorModel);
        doorModel.scale.set(2, 1.5, 1);
        doorModel.position.set(-23.83, 1.6, -24.9);
        this.addBoundingBox(doorModel);
        this.scene.add(doorModel);
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );
    let sofa,tv,cab;
    gltfLoader.load(
      "/night-stand/sofa.glb",
      (gltf) => {
        tv = gltf.scene;
        console.log(tv);
        tv.scale.set(2, 1.5, 1);
        tv.position.set(-8.83, 0, 0.8);
        this.addBoundingBox(tv);
        this.scene.add(tv);
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );
    gltfLoader.load(
      "/night-stand/tv_set.glb",
      (gltf) => {
        sofa = gltf.scene;
        console.log(sofa);
        sofa.scale.set(0.03, 0.03, 0.03);
        sofa.position.set(-3.83, 0, 0.8);
        this.addBoundingBox(sofa);
        this.scene.add(sofa);
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );
    gltfLoader.load(
      "/night-stand/old_wooden_cabinet.glb",
      (gltf) => {
      
      cab = gltf.scene;
        console.log(cab);
        cab.scale.set(1, 0.5, 1);
        cab.position.set(-12, 0, 16);
        cab.rotation.y = -Math.PI/12;
        this.addBoundingBox(cab);
        this.scene.add(cab);
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
      -16 + this.offset - slightOffset,
      0,
      15 + this.offset - slightOffset,
      Math.PI / 2,
      12
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

    // Ceiling

    this.ceiling = new Ceiling(this.scene, 50, new Wall().wallHeight, 50);
    this.ceiling.createCeilingLight( 17.5, new Wall().wallHeight - 0.2, 20, true);
    this.ceiling.createCeilingLight( 5, new Wall().wallHeight - 0.2, 20, true);
    this.ceiling.createCeilingLight( 24, new Wall().wallHeight - 0.2, -20, false);




    let standModel;
    gltfLoader.load(
      "/night-stand/old_bed.glb",
      (gltf) => {
        standModel = gltf.scene;
        console.log(standModel);
        standModel.scale.set(2, 1.5, 1);
        standModel.position.set(4.2, 100, 19.95);
        this.enemyRoomGroup.add(standModel);
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );
    camera.add(listener);

// Initialize audio loader
const audioLoader = new THREE.AudioLoader();

  
    let ghost;
    let mixer;
    let clock = new THREE.Clock();
    let ghostSound = new THREE.PositionalAudio(listener);
    
    gltfLoader.load(
      "/night-stand/ghost_girl_animated.glb",
      (gltf) => {
        ghost = gltf.scene;
        console.log(ghost);
        ghost.scale.set(2, 1.5, 1);
        ghost.position.set(4.2, 0, 18.95);
        this.scene.add(ghost);
    
        // Initialize animation mixer and play the animation
        mixer = new THREE.AnimationMixer(ghost);
        const clip = THREE.AnimationClip.findByName(gltf.animations, "CINEMA_4D_Main");
        if (clip) {
          const action = mixer.clipAction(clip);
          action.play();
        } else {
          console.error("CINEMA_4D_MAIN animation not found in the GLTF model.");
        }
        ghost.add(ghostSound);

         // Load werewolf sound
    audioLoader.load('night-stand/girl.mp3', (buffer) => {
     ghostSound.setBuffer(buffer);
     ghostSound.setLoop(true);
     ghostSound.setVolume(0.5);  // Adjust volume as needed
     ghostSound.setRefDistance(2); // Distance at which sound starts to fade
     ghostSound.setMaxDistance(1); // Maximum distance for the sound to be heard
     ghostSound.play();  // Play sound when the werewolf moves
    });

        // Movement variables
        const moveDistance = 3;
        const speed = 0.02;
        let direction = 1; // Start moving forward
        let stepCount = 0;
    
        // Create the movement loop
        const moveGhost = () => {
          requestAnimationFrame(moveGhost);
    
          const delta = clock.getDelta();
          if (mixer) mixer.update(delta); // Update the walking animation
    
          // Move the ghost forward and backward
          ghost.position.z += direction * speed;
          stepCount += direction * speed;
    
          // Reverse direction when the ghost has moved the set distance
          if (Math.abs(stepCount) >= moveDistance) {
            direction *= -1; // Change direction
    
            // Rotate ghost when changing direction
            if (direction === 1) {
              // Face forward (original orientation)
              ghost.rotation.y = 0;
            } else {
              // Face backward (rotate 180 degrees)
              ghost.rotation.y = Math.PI;
            }
          }
        };
    
        moveGhost(); // Start the movement loop
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );
    gltfLoader.load(
      "/night-stand/old_bed.glb",
      (gltf) => {
        standModel = gltf.scene;
        console.log(standModel);
        standModel.scale.set(2, 1.5, 1);
        standModel.position.set(18.2, 0, 19.95);
        this.enemyRoomGroup.add(standModel);
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );
    
    const audioLoader1 = new THREE.AudioLoader();
    let wolf;
    let mixer1;
    let clock1 =new THREE.Clock();
    let wolfSound = new THREE.PositionalAudio(listener);
    gltfLoader.load(
      "/night-stand/werewolf_running_in_low_poly.glb",
      (gltf) => {
        wolf = gltf.scene;
        console.log(wolf);
        wolf.scale.set(2, 1.5, 1);
        wolf.position.set(18.2, 0, 18.95);
        this.scene.add(wolf);
    
        // Initialize animation mixer and play the animation
        mixer1 = new THREE.AnimationMixer(wolf);
        const clip = THREE.AnimationClip.findByName(gltf.animations, "mixamo.com");
        if (clip) {
          const action = mixer1.clipAction(clip);
          action.play();
        } else {
          console.error("CINEMA_4D_MAIN animation not found in the GLTF model.");
        }
        wolf.add(wolfSound);
        audioLoader1.load('night-stand/howl.mp3', (buffer) => {
          wolfSound.setBuffer(buffer);
          wolfSound.setLoop(true);
          wolfSound.setVolume(0.5);  // Adjust volume as needed
          wolfSound.setRefDistance(10); // Distance at which sound starts to fade
          wolfSound.setMaxDistance(50); // Maximum distance for the sound to be heard
          wolfSound.play();  // Play sound when the werewolf moves
        });
 
        // Movement variables
        const moveDistance = 3;
        const speed = 0.02;
        let direction = 1; // Start moving forward
        let stepCount = 0;
    
        // Create the movement loop
        const moveGhost = () => {
          requestAnimationFrame(moveGhost);
    
          const delta = clock1.getDelta();
          if (mixer1) mixer1.update(delta); // Update the walking animation
    
          // Move the ghost forward and backward
          wolf.position.z += direction * speed;
          stepCount += direction * speed;
    
          // Reverse direction when the ghost has moved the set distance
          if (Math.abs(stepCount) >= moveDistance) {
            direction *= -1; // Change direction
    
            // Rotate ghost when changing direction
            if (direction === 1) {
              // Face forward (original orientation)
              wolf.rotation.y = 0;
            } else {
              // Face backward (rotate 180 degrees)
              wolf.rotation.y = Math.PI;
            }
          }
        };
    
        moveGhost(); // Start the movement loop
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );
   let standModel1;
    gltfLoader.load(
      "/night-stand/old_bed.glb",
      (gltf) => {
        standModel1= gltf.scene;
        console.log(standModel1);
        standModel1.scale.set(2, 1.5, 1);
        standModel1.position.set(18.2, 0.5, -15);
        this.addBoundingBox(standModel1);
        this.enemyRoomGroup.add(standModel1);
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );
    let lady;
    let mixer2;
    let clock2 =new THREE.Clock();

    
    gltfLoader.load(
      "/night-stand/doll.glb",
      (gltf) => {
        lady = gltf.scene;
        console.log(lady);
        lady.scale.set(10, 11.5, 11);
        lady.position.set(18.2, 0.5, -14);
        this.scene.add(lady);
    
        // Initialize animation mixer and play the animation
        mixer2 = new THREE.AnimationMixer(lady);
        const clip = THREE.AnimationClip.findByName(gltf.animations, "Take 001");
        if (clip) {
          const action = mixer2.clipAction(clip);
          action.play();
        } else {
          console.error("CINEMA_4D_MAIN animation not found in the GLTF model.");
        }
           // Add sound to the ghost
    
        // Movement variables
        const moveDistance = 3;
        const speed = 0.02;
        let direction = 1; // Start moving forward
        let stepCount = 0;
    
        // Create the movement loop
        const moveGhost = () => {
          requestAnimationFrame(moveGhost);
    
          const delta = clock2.getDelta();
          if (mixer2) mixer2.update(delta); // Update the walking animation
    
          // Move the ghost forward and backward
          lady.position.z += direction * speed;
          stepCount += direction * speed;
    
          // Reverse direction when the ghost has moved the set distance
          if (Math.abs(stepCount) >= moveDistance) {
            direction *= -1; // Change direction
    
            // Rotate ghost when changing direction
            if (direction === 1) {
              // Face forward (original orientation)
              lady.rotation.y = 0;
            } else {
              // Face backward (rotate 180 degrees)
              lady.rotation.y = Math.PI;
            }
          }
        };
    
        moveGhost(); // Start the movement loop
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );
    gltfLoader.load(
      "/night-stand/old_bed.glb",
      (gltf) => {
        standModel1 = gltf.scene;
        console.log(standModel1);
        standModel1.scale.set(2, 1.5, 1);
        standModel1.position.set(18.2, 0.5, -2);
        this.addBoundingBox(standModel1);
        this.enemyRoomGroup.add(standModel1);
      },
      undefined,
      (error) => {
        console.error("Error loading the GLTF model:", error);
      }
    );
    let granny;
    let mixer3;
    let clock3 =new THREE.Clock();

    
    gltfLoader.load(
      "/night-stand/doll.glb",
      (gltf) => {
        granny = gltf.scene;
        console.log(granny);
        granny.scale.set(10, 11.5, 11);
        granny.position.set(18.2, 0.5, -1);
        this.scene.add(granny);
    
        // Initialize animation mixer and play the animation
        mixer3 = new THREE.AnimationMixer(granny);
        const clip = THREE.AnimationClip.findByName(gltf.animations, "Take 001");
        if (clip) {
          const action = mixer3.clipAction(clip);
          action.play();
        } else {
          console.error("CINEMA_4D_MAIN animation not found in the GLTF model.");
        }
           // Add sound to the ghost
    
        // Movement variables
        const moveDistance = 3;
        const speed = 0.02;
        let direction = 1; // Start moving forward
        let stepCount = 0;
    
        // Create the movement loop
        const moveGhost = () => {
          requestAnimationFrame(moveGhost);
    
          const delta = clock3.getDelta();
          if (mixer3) mixer3.update(delta); // Update the walking animation
    
          // Move the ghost forward and backward
          granny.position.z += direction * speed;
          stepCount += direction * speed;
    
          // Reverse direction when the ghost has moved the set distance
          if (Math.abs(stepCount) >= moveDistance) {
            direction *= -1; // Change direction
    
            // Rotate ghost when changing direction
            if (direction === 1) {
              // Face forward (original orientation)
              granny.rotation.y = 0;
            } else {
              // Face backward (rotate 180 degrees)
              granny.rotation.y = Math.PI;
            }
          }
        };
    
        moveGhost(); // Start the movement loop
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
  }

  setPlayer(player){
    this.player = player;
    this.player.position.set(-20, 0, 20);
  }

  // === Ceiling Setup ===

}