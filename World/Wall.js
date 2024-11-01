import * as THREE from "three";

export default class Wall {
  constructor(x, y, z, rotation = 0, size = 20) {
    this.wallHeight = 5;
    this.wallWidth = 0.2;
    this.wallDepth = size;
    this.lights = [];
    this.lightMeshes = [];

    this.loader = new THREE.TextureLoader();

    // Load all textures with enhanced settings
    this.texture = this.loader.load("/wall-textures/concrete_wall_003_diff_1k.jpg", (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 1);
      texture.encoding = THREE.sRGBEncoding;
      texture.anisotropy = 16;
    });

    this.roughnessTexture = this.loader.load("/wall-textures/concrete_wall_003_rough_1k.jpg", (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
    });

    this.normalTexture = this.loader.load("/wall-textures/concrete_wall_003_nor_gl_1k.exr", (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
    });

    this.aoTexture = this.loader.load("/wall-textures/concrete_wall_003_ao_1k.jpg", (texture) => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
    });

    // Create the wall geometry
    this.geometry = new THREE.BoxGeometry(
      this.wallWidth, 
      this.wallHeight, 
      this.wallDepth,
      2,
      10,
      20
    );

    // Create wall material
    this.material = new THREE.MeshStandardMaterial({
      map: this.texture,
      normalMap: this.normalTexture,
      normalScale: new THREE.Vector2(1, 1),
      roughnessMap: this.roughnessTexture,
      roughness: 0.7,
      metalness: 0.1,
      aoMap: this.aoTexture,
      aoMapIntensity: 1,
      side: THREE.DoubleSide
    });

    // Create the wall mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.y = rotation;
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(x, y + this.wallHeight / 2, z);

    // Create wall lights
    this.createWallLights();

    // Setup bounding box
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);

    // Add UV2 for ambient occlusion
    if (this.geometry.attributes.uv) {
      this.geometry.setAttribute('uv2', this.geometry.attributes.uv);
    }
  }

  createWallLights() {
    // Light fixture geometry
    const fixtureGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.2);
    const fixtureMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.8,
      roughness: 0.2
    });

    // Light cover geometry (semi-transparent)
    const coverGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 8);
    const coverMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
      transmission: 0.5
    });

    // Calculate positions for two lights
    const positions = [
      { height: this.wallHeight * 0.2, depth: this.wallDepth * 0.25 },
      { height: this.wallHeight * 0.2, depth: this.wallDepth * 0.75 }
    ];

    positions.forEach(pos => {
      // Create light fixture mesh
      const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
      fixture.castShadow = true;
      fixture.receiveShadow = true;

      // Create light cover mesh
      const cover = new THREE.Mesh(coverGeometry, coverMaterial);
      cover.rotation.x = Math.PI / 2;
      cover.position.z = 0.1;
      fixture.add(cover);

      // Position the fixture
      const direction = this.mesh.rotation.y;
      const offset = this.wallWidth / 2 + 0.1;
      
      fixture.position.set(
        this.mesh.position.x + Math.sin(direction) * offset,
        this.mesh.position.y - this.wallHeight / 2 + pos.height,
        this.mesh.position.z + Math.cos(direction) * offset
      );
      
      fixture.position.z += Math.cos(direction) * (pos.depth - this.wallDepth / 2);
      fixture.position.x += Math.sin(direction) * (pos.depth - this.wallDepth / 2);
      
      fixture.rotation.y = direction;

      // Create point light
      const light = new THREE.PointLight(0xffd28e, 0.8, 5);
      light.castShadow = true;
      light.shadow.mapSize.width = 512;
      light.shadow.mapSize.height = 512;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 10;
      light.position.copy(fixture.position);
      light.position.z += Math.cos(direction) * 0.2;
      light.position.x += Math.sin(direction) * 0.2;

      // Add ambient light for subtle illumination
      const ambient = new THREE.PointLight(0xffd28e, 0.2, 2);
      ambient.position.copy(light.position);

      this.lights.push(light, ambient);
      this.lightMeshes.push(fixture);
    });
  }

  // Method to add lights and fixtures to scene
  addToScene(scene) {
    scene.add(this.mesh);
    this.lights.forEach(light => scene.add(light));
    this.lightMeshes.forEach(mesh => scene.add(mesh));
  }

  // Method to remove lights and fixtures from scene
  removeFromScene(scene) {
    scene.remove(this.mesh);
    this.lights.forEach(light => scene.remove(light));
    this.lightMeshes.forEach(mesh => scene.remove(mesh));
  }

  // Method to animate lights (optional flickering effect)
  animateLights(time) {
    this.lights.forEach((light, index) => {
      if (index % 2 === 0) { // Only animate main lights, not ambient
        // Subtle flickering effect
        const flicker = 0.95 + 0.05 * Math.sin(time * 10 + index);
        light.intensity = 0.8 * flicker;
      }
    });
  }

  // Method to update light colors
  setLightColor(color) {
    this.lights.forEach(light => {
      light.color.set(color);
    });
  }

  // Method to update light intensity
  setLightIntensity(intensity) {
    this.lights.forEach((light, index) => {
      if (index % 2 === 0) { // Main lights
        light.intensity = intensity;
      } else { // Ambient lights
        light.intensity = intensity * 0.25;
      }
    });
  }

  updateBoundingBox() {
    this.boundingBox.setFromObject(this.mesh);
  }

  // Method to clean up resources
  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
    this.roughnessTexture.dispose();
    this.normalTexture.dispose();
    this.aoTexture.dispose();
    
    // Dispose of light fixture geometries and materials
    this.lightMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      mesh.children.forEach(child => {
        child.geometry.dispose();
        child.material.dispose();
      });
    });
  }
}