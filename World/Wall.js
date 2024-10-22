import * as THREE from "three";

export default class Wall {
  constructor(x, y, z, rotation = 0, size = 20) {
    this.wallHeight = 5;
    this.wallWidth = 0.2;
    this.wallDepth = size;

    this.loader = new THREE.TextureLoader();

    // Load all textures
    this.texture = this.loader.load("/wall-textures/concrete_wall_003_diff_1k.jpg", (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3, 1);  // Adjust repeat values as needed
    });

    this.roughnessTexture = this.loader.load("/wall-textures/concrete_wall_003_rough_1k.jpg", (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);  // Repeat to cover the wall
    });

    this.normalTexture = this.loader.load("/wall-textures/concrete_wall_003_nor_gl_1k.exr", (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);  // Repeat to cover the wall
    });

    // Create the geometry
    this.geometry = new THREE.BoxGeometry(this.wallWidth, this.wallHeight, this.wallDepth);

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
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
    this.mesh.receiveShadow = true;
    this.mesh.position.set(x , y + this.wallHeight / 2, z);
  }
  updateBoundingBox() {
    this.boundingBox.setFromObject(this.mesh);
  }
}

