import * as THREE from "three";

export default class Ceiling{
    constructor(x, y, z){
        this.geometry = new THREE.BoxGeometry(50, 1, 50);
        this.material = new THREE.MeshStandardMaterial({color: 0x00ffff});
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(x, y, z);
    }
}