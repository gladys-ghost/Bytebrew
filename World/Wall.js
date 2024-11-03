import * as THREE from "three";

export default class Wall {
  constructor(x, y, z, rotation = 0, size = 20) {
    this.wallHeight = 5;
    this.wallWidth = 0.3;
    this.wallDepth = size;

    const textureLoader = new THREE.TextureLoader();

    // Create the material
    this.material = new THREE.MeshStandardMaterial({
      roughness: 0.5,
      color: 0xffffff,
      metalness: 0.1,
      displacementScale: 0, 
      side: THREE.DoubleSide,
    });

    // Load and configure each texture
    textureLoader.load("/cracked_concrete_wall_1k.blend/textures/cracked_concrete_wall_diff_1k.jpg", (map) => {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(size / 5, 1);
      map.anisotropy = 2;
      map.colorSpace = THREE.SRGBColorSpace;
      this.material.map = map;
      this.material.needsUpdate = true;
    });

    textureLoader.load("/cracked_concrete_wall_1k.blend/textures/cracked_concrete_wall_rough_1k.jpg", (map) => {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(size / 5, 1);
      map.anisotropy = 2;
      this.material.roughnessMap = map;
      this.material.needsUpdate = true;
    });

    textureLoader.load("/cracked_concrete_wall_1k.blend/textures/cracked_concrete_wall_nor_gl_1k.exr", (map) => {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(size / 5, 1);
      map.anisotropy = 2;
      this.material.normalMap = map;
      this.material.needsUpdate = true;
    });

    textureLoader.load("/cracked_concrete_wall_1k.blend/textures/cracked_concrete_wall_disp_1k.png", (map) => {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(size / 5, 1);
      map.anisotropy = 2;
      this.material.displacementMap = map;
      this.material.needsUpdate = true;
    });

    // Create the wall geometry and mesh
    this.geometry = new THREE.BoxGeometry(this.wallWidth, this.wallHeight, this.wallDepth);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.y = rotation;
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.mesh.position.set(x, y + this.wallHeight / 2, z);
  }

  updateBoundingBox() {
    this.boundingBox.setFromObject(this.mesh);
  }
}
