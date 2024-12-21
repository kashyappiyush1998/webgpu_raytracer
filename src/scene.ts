import { Sphere } from "./sphere";
import { Camera } from "./camera";
import { Node } from "./node";
import { vec3 } from "gl-matrix";

export class Scene{

    spheres: Sphere[];
    camera: Camera;
    sphereCount: number;
    nodes: Node[];
    nodesUsed: number = 0;
    sphereIndices: number[];

    constructor() {
        this.spheres = new Array(1024);
        for(let i = 0; i < this.spheres.length; i++){

            const center: number[] = [
                -50.0 + 100.0 * Math.random(),
                -50.0 + 100.0 * Math.random(),
                -50.0 + 100.0 * Math.random()
            ]

            const radius: number = 0.1 + 1.9 * Math.random();

            const color: number[] = [
                0.3 + 0.7 * Math.random(),
                0.3 + 0.7 * Math.random(),
                0.3 + 0.7 * Math.random()
            ]

            this.spheres[i] = new Sphere(center, radius, color);
        }
        this.sphereCount = this.spheres.length;

        this.camera = new Camera([-20.0, 0.0, 0.0]);

        this.sphereIndices = new Array(this.sphereCount);

        for(var i: number = 0; i < this.sphereCount; i++) {
            this.sphereIndices[i] = i;
        }

        this.nodes = new Array(2 * this.sphereCount -1);
        for(var i: number = 0; i < 2 * this.sphereCount -1; i++) {
            this.nodes[i] = new Node();
        }

        var root: Node = this.nodes[0];
        root.leftChild = 0;
        root.sphereCount = this.sphereCount;
        this.nodesUsed += 1;

        this.updateBounds(0);
        this.subdivide(0);
    }

    updateBounds(nodeIndex: number) {

        var node: Node = this.nodes[nodeIndex];
        node.minCorner = [99999, 99999, 99999];
        node.maxCorner = [-99999, -99999, -99999];

        for(var i: number = 0; i < node.sphereCount; i++) {
            const sphere: Sphere = this.spheres[this.sphereIndices[node.leftChild + i]];
            const axis: vec3 = [sphere.radius, sphere.radius, sphere.radius];

            var temp: vec3 = [0, 0, 0];
            vec3.subtract(temp, sphere.center, axis);
            vec3.min(node.minCorner, node.minCorner, temp);

            vec3.add(temp, sphere.center, axis);
            vec3.min(node.maxCorner, node.maxCorner, temp);
        }
    }

    subdivide(nodeIndex: number) {

        var node: Node = this.nodes[nodeIndex];

        if(node.sphereCount <=4){
            return;
        }

        var extent: vec3 = [0, 0, 0];
        vec3.subtract(extent, node.maxCorner, node.minCorner);
        var axis: number = 0;
        if(extent[1] > extent[axis]) {
            axis = 1;
        }
        if(extent[2] > extent[axis]) {
            axis = 2;
        }

        const splitPosition: number = node.minCorner[axis] + extent[axis] / 2;

        var i: number = node.leftChild;
        var j: number = i + node.sphereCount - 1;

        while (i <= j) {
            if(this.spheres[this.sphereIndices[i]].center[axis] < splitPosition) {
                i += 1;
            }
            else {
                var temp: number = this.sphereIndices[i];
                this.sphereIndices[i] = this.sphereIndices[j];
                this.sphereIndices[j] = temp;
                j -= 1;
            }
        }

        var leftCount: number = i - node.leftChild;
        if(leftCount ==0 || leftCount == node.sphereCount) {
            return;
        }

        const leftChildIndex: number = this.nodesUsed;
        this.nodesUsed += 1;
        const rightChildIndex: number = this.nodesUsed;
        this.nodesUsed += 1;

        this.nodes[leftChildIndex].leftChild = node.leftChild;
        this.nodes[leftChildIndex].sphereCount = leftCount;
        this.nodes[rightChildIndex].leftChild = i;
        this.nodes[rightChildIndex].sphereCount = node.sphereCount - leftCount;

        node.leftChild = leftChildIndex;
        node.sphereCount = 0;

        this.updateBounds(leftChildIndex);
        this.updateBounds(rightChildIndex);
        this.subdivide(leftChildIndex);
        this.subdivide(rightChildIndex);

    }


}