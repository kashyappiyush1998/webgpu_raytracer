export class Sphere {

    center: Float32Array
    color: Float32Array
    radius: number

    constructor(center: number[], radius: number, color: number[]) {
        this.center = new Float32Array(center);
        this.color = new Float32Array(color);
        this.radius = radius;
    }
}