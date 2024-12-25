import { vec3, mat4 } from "gl-matrix";

export function Deg2Rad(theta: number) : number {
    return theta * Math.PI / 180;
}

export class Camera {

    position: vec3;
    eulers: vec3;
    view: mat4;
    forwards: vec3;
    right: vec3;
    up: vec3;

    constructor(position: vec3, theta: number, phi: number){
        this.position = position;
        this.eulers = [0, phi, theta];
        this.forwards = vec3.create();
        this.right = vec3.create();
        this.up = vec3.create();
    }

    recalculate_vectors(){
        this.forwards = [
            Math.cos(Deg2Rad(this.eulers[2])) * Math.cos(Deg2Rad(this.eulers[1])),
            Math.sin(Deg2Rad(this.eulers[2])) * Math.cos(Deg2Rad(this.eulers[1])),
            Math.sin(Deg2Rad(this.eulers[1]))
        ];

        vec3.cross(this.right, this.forwards, [0.0, 0.0, 1.0]);
        vec3.cross(this.up, this.right, this.forwards);
    }
}