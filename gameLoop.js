export class GameLoop {
    constructor(scene, camera, renderer, clock) {
      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.clock = clock;
      
      // Configuration
      this.config = {
        player: {
          walkSpeed: 5,
          rotateSpeed: Math.PI,
          cameraOffset: new THREE.Vector3(0, 6, 1.5)
        }
      };
  
      this.loadingScreen = null;
      this.gameStarted = false;
      this.keysPressed = {};
    }
  
    init(loadingScreen) {
      this.loadingScreen = loadingScreen;
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }
  
    updatePlayerMovement(delta) {
      if (!this.model) return false;
  
      const walkSpeed = this.config.player.walkSpeed * delta;
      const rotateSpeed = this.config.player.rotateSpeed * delta;
      let isMoving = false;
      let deltaX = 0;
      let deltaZ = 0;
  
      // Forward/Backward movement
      if (this.keysPressed["w"] || this.keysPressed["arrowup"]) {
        deltaZ = walkSpeed * Math.cos(this.model.rotation.y);
        deltaX = walkSpeed * Math.sin(this.model.rotation.y);
        isMoving = true;
      }
      if (this.keysPressed["s"] || this.keysPressed["arrowdown"]) {
        deltaZ = -walkSpeed * Math.cos(this.model.rotation.y);
        deltaX = -walkSpeed * Math.sin(this.model.rotation.y);
        isMoving = true;
      }
  
      // Rotation
      if (this.keysPressed["a"] || this.keysPressed["arrowleft"]) {
        this.model.rotation.y += rotateSpeed;
      }
      if (this.keysPressed["d"] || this.keysPressed["arrowright"]) {
        this.model.rotation.y -= rotateSpeed;
      }
  
      // Collision detection
      const { collidedX, collidedZ } = this.checkAndResolveCollision(deltaX, deltaZ);
      
      return isMoving;
    }
  
    updateCamera() {
      if (!this.model) return;
  
      // Position camera relative to player
      const cameraPosition = new THREE.Vector3()
        .copy(this.config.player.cameraOffset)
        .applyMatrix4(this.model.matrixWorld);
      
      this.camera.position.copy(cameraPosition);
  
      // Update camera look direction
      const lookDirection = new THREE.Vector3(
        Math.sin(this.model.rotation.y),
        0,
        Math.cos(this.model.rotation.y)
      ).normalize();
  
      const cameraLookAt = new THREE.Vector3()
        .copy(this.model.position)
        .add(lookDirection);
      
      this.camera.lookAt(
        cameraLookAt.x,
        this.model.position.y + 1.5,
        cameraLookAt.z
      );
    }
  
    updateAnimations(isMoving, delta) {
      if (this.mixer) {
        this.mixer.update(delta);
      }
  
      if (this.walkAction) {
        this.walkAction.paused = !isMoving;
      }
    }
  
    updateGameEntities(delta) {
      this.targetCube.rotation.y += 0.01;
      
      if (this.bossModel?.model) {
        this.bossModel.update(delta);
        if (this.gameStarted) {
          this.bossModel.moveTowardsTarget(this.model);
        }
      }
  
      this.updateGhosts(this.ghostManager, delta);
      this.checkGhostCollisions();
      this.updateBullets(delta);
  
      // Check player distance from door
      this.checkPlayerDistance(
        this.model.position,
        new THREE.Vector3(-23.83, 1.6, -24.9)
      );
    }
  
    animate() {
      requestAnimationFrame(this.animate);
  
      const assetsLoaded = this.model && this.gunModel && this.bulletModel;
      
      if (assetsLoaded) {
        this.loadingScreen?.unmount();
        
        const delta = this.clock.getDelta();
        const isMoving = this.updatePlayerMovement(delta);
        
        this.updateCamera();
        this.updateAnimations(isMoving, delta);
        this.updateGameEntities(delta);
        
        this.renderer.render(this.scene, this.camera);
      } else if (this.gameStarted) {
        this.loadingScreen?.mount();
      }
    }
  }
  
  export default GameLoop;