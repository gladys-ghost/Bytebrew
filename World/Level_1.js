import * as THREE from "three";
import Wall from "./Wall.js";

export default class Level_1 {
    constructor(scene) {
        this.scene = scene;
        this.wall = new Wall(0, 0, 0, Math.PI / 2);
        this.wall2 = new Wall(-10, 0, 0);
        this.wall3 = new Wall(10, 0, 10);
        this.scene.add(this.wall.mesh);
        this.scene.add(this.wall2.mesh);
        this.scene.add(this.wall3.mesh);
    }
}