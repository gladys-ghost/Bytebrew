import * as THREE from "three";

export default class Ceiling {
  constructor(scene, width, height, depth) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.depth = depth;

    this.loader = new THREE.TextureLoader();

    this.diffuseTexture = this.loadTexture(
      "/ceiling-interior/textures/ceiling_interior_diff_1k.jpg",
      5
    );
    this.displacementTexture = this.loadTexture(
      "/ceiling-interior/textures/ceiling_interior_disp_1k.png",
      5
    );
    this.roughnessTexture = this.loadTexture(
      "/ceiling-interior/textures/ceiling_interior_rough_1k.exr",
      5
    );
    this.normalTexture = this.loadTexture(
      "/ceiling-interior/textures/ceiling_interior_nor_gl_1k.exr",
      5
    );

    this.ceiling = this.createCeiling();
    this.scene.add(this.ceiling);
  }

  loadTexture(path, repeatValue) {
    return this.loader.load(path, (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatValue, repeatValue);
    });
  }

  createCeiling() {
    const geometry = new THREE.PlaneGeometry(this.width, this.depth);
    const material = new THREE.MeshStandardMaterial({
      map: this.diffuseTexture,
      displacementMap: this.displacementTexture,
      roughnessMap: this.roughnessTexture,
      normalMap: this.normalTexture,
      displacementScale: 0.01, // Adjust to control the depth of displacement
      side: THREE.DoubleSide,
    });
    const ceiling = new THREE.Mesh(geometry, material);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = this.height;
    ceiling.receiveShadow = true;
    ceiling.castShadow = true;
    return ceiling;
  }

  createCeilingLight(x, y, z, flickering = false) {
    const bulbGeometry = new THREE.SphereGeometry(0.02, 16, 8);
    this.bulbLight = new THREE.PointLight(0xffffff, 100, 20); // Adjusted intensity and range for spotlight

    this.bulbMat = new THREE.MeshStandardMaterial({
      emissive: 0xffffee,
      emissiveIntensity: 10,
      color: 0x000000,
    });

    const bulbMesh = new THREE.Mesh(bulbGeometry, this.bulbMat);
    this.bulbLight.add(bulbMesh);
    this.bulbLight.position.set(x, y, z);
    this.bulbLight.castShadow = true;
    this.bulbLight.shadow.mapSize.width = 1024;
    this.bulbLight.shadow.mapSize.height = 1024;
    this.bulbLight.shadow.bias = 0.0001;
    this.bulbLight.shadow.normalBias = 0.05;

    // Set the spotlight target to a position below it
    const target = new THREE.Object3D();
    target.position.set(x, y - 1, z); // Adjust the y-position to point the light downwards
    this.scene.add(target);
    this.bulbLight.target = target;
    

    this.scene.add(this.bulbLight);

    if (flickering) {
      this.addFlickeringEffect(this.bulbLight);
    }
  }

  createLightBulb(x, y, z) {
    const geometry = new THREE.SphereGeometry(0.6);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const lightBulb = new THREE.Mesh(geometry, material);
    lightBulb.position.set(x, y, z);
    
    return lightBulb;
  }

  addFlickeringEffect(light) {
    const flickerClock = new THREE.Clock();
    const flickerSpeed = 5; // Base speed of flickering
    const intensityRange = 10; // Amplitude of flicker effect
    const maxInterval = 100; // Maximum interval in milliseconds for flicker updates
  
    const updateFlicker = () => {
      const elapsedTime = flickerClock.getElapsedTime();
      // Set the light intensity
      light.intensity = Math.sin(elapsedTime * flickerSpeed) * intensityRange + 10;
  
      // Calculate a random delay for the next flicker
      const randomDelay = Math.random() * maxInterval;
      setTimeout(updateFlicker, randomDelay); // Schedule the next update
    }
  
    updateFlicker(); // Call the update function to start the effect
  }

}
