import * as THREE from 'three';

export default class Collider {
  constructor() {
    this.colliders = [];
  }

  addCollider(object, type = 'box') {
    const collider = {
      object: object,
      type: type,
      boundingBox: new THREE.Box3().setFromObject(object)
    };
    this.colliders.push(collider);
  }

  checkCollision(object) {
    const objectBox = new THREE.Box3().setFromObject(object);
    
    for (const collider of this.colliders) {
      if (objectBox.intersectsBox(collider.boundingBox)) {
        return true;
      }
    }
    return false;
  }

  updateColliders() {
    this.colliders.forEach(collider => {
      collider.boundingBox.setFromObject(collider.object);
    });
  }
} 