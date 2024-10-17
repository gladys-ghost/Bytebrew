import * as THREE from "three";

export default class Wall {
  constructor(x, y, z, rotation = 0) {
    this.loader = new THREE.TextureLoader();

    // Load all textures
    this.texture = this.loader.load("/wall-textures/concrete_wall_003_diff_1k.jpg", (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);  // Adjust repeat values as needed
    });

    this.roughnessTexture = this.loader.load("/wall-textures/concrete_wall_003_rough_1k.jpg", (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);  // Repeat to cover the wall
    });

    this.normalTexture = this.loader.load("/wall-textures/concrete_wall_003_nor_gl_1k.exr", (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);  // Repeat to cover the wall
    });

    // Create the geometry
    this.geometry = new THREE.BoxGeometry(0.1, 20, 20);

    // Create the material and assign all the textures
    this.material = new THREE.MeshStandardMaterial({
      map: this.texture,             // Base color texture
      roughnessMap: this.roughnessTexture,  // Roughness texture for surface detail
      normalMap: this.normalTexture,  // Normal texture for 
      roughness: 0.5,
    });

    // Create the mesh and position it
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.y = rotation;
    this.mesh.position.set(x, y, z);
  }
}

