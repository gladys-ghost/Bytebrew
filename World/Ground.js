import * as THREE from 'three';

export default class Ground {
    constructor(size = 50, texturePath = '/old-plank-flooring4-bl/') {
      this.size = size;
      this.texturePath = texturePath;
      this.ground = null;
      this.initGround();
    }
  
    initGround() {
      const groundGeometry = new THREE.PlaneGeometry(this.size, this.size);
      const groundMaterial = new THREE.MeshStandardMaterial({
        roughness: 0.8,
        color: 0xffffff,
        metalness: 0.2,
        bumpScale: 1,
        side: THREE.DoubleSide,
      });
  
      this.loadTextures(groundMaterial);
  
      this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
      this.ground.rotation.x = -Math.PI / 2;
      this.ground.receiveShadow = true;
      this.ground.castShadow = true;
    }
  
    loadTextures(material) {
      const loader = new THREE.TextureLoader();
      const repeatSetting = { wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping, repeat: new THREE.Vector2(20, 20), anisotropy: 4 };
  
      loader.load(`${this.texturePath}old-plank-flooring4_basecolor.png`, (texture) => {
        Object.assign(texture, repeatSetting, { colorSpace: THREE.SRGBColorSpace });
        material.map = texture;
        material.needsUpdate = true;
      });
  
      loader.load(`${this.texturePath}old-plank-flooring4_normal.png`, (texture) => {
        Object.assign(texture, repeatSetting);
        material.normalMap = texture;
        material.needsUpdate = true;
      });
  
      loader.load(`${this.texturePath}old-plank-flooring4_roughness.png`, (texture) => {
        Object.assign(texture, repeatSetting);
        material.roughnessMap = texture;
        material.needsUpdate = true;
      });
  
      loader.load(`${this.texturePath}old-plank-flooring4_metalness.png`, (texture) => {
        Object.assign(texture, repeatSetting);
        material.metalnessMap = texture;
        material.needsUpdate = true;
      });
    }
  
    addToScene(scene) {
      if (this.ground) {
        scene.add(this.ground);
      }
    }
  }
  
  