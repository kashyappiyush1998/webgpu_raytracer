import { vec2, vec3 } from "gl-matrix";

export class Light {

    position: vec3
    diffuseIntensity: number
    direction: vec3
    color: vec3

    constructor(position: vec3, direction: vec3) {
        this.position = position;
        this.diffuseIntensity = 2.0;
        this.direction = direction;
        this.color = [1.0, 1.0, 1.0];
    }

    setPosition(position: vec3){
        this.position = position;
    }

    setDirection(direction: vec3){
        this.direction = direction;
    }

}