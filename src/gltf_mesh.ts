import { vec3, vec2 } from "gl-matrix";
import { Triangle } from "./triangle";
import { load } from '@loaders.gl/core';
import { GLTFLoader, postProcessGLTF } from '@loaders.gl/gltf';


export class GLTFMesh {

    v: vec3[]
    vt: vec2[]
    vn: vec3[]

    triangles: Triangle[]
    color: vec3

    constructor() {

        this.v = [];
        this.vt = [];
        this.vn = [];

        this.triangles = [];
    }

    async initialize(color: vec3, url: string) {

        this.color = color;
        await this.readFile(url);

    }


    async readFile(url: string) {

        var result: number[] = [];
        const gltf_model = await load(url, GLTFLoader);
        const processedGLTF = postProcessGLTF(gltf_model);

        // console.log(processedGLTF.meshes[0].primitives);
        // console.log(processedGLTF.meshes[0].primitives[0].attributes['POSITION']);
        // console.log(processedGLTF.meshes[0].primitives[0].attributes['NORMAL']);
        // console.log(processedGLTF.meshes[0].primitives[0].attributes['TEXCOORD_0']);
        // console.log(processedGLTF.meshes[0].primitives[0].indices);
        
        const triangle_count = processedGLTF.meshes[0].primitives[0].attributes['POSITION'].count;
        const positions = new Float32Array(processedGLTF.meshes[0].primitives[0].attributes['POSITION'].value);
        const normals = new Float32Array(processedGLTF.meshes[0].primitives[0].attributes['NORMAL'].value);
        const uvs = new Float32Array(processedGLTF.meshes[0].primitives[0].attributes['TEXCOORD_0'].value);
        for (var i = 0; i < triangle_count; i++) {
            var tri: Triangle = new Triangle();
            tri.corners.push([positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]]);
            tri.corners.push([positions[(i+1) * 3], positions[(i+1) * 3 + 1], positions[(i+1) * 3 + 2]]);
            tri.corners.push([positions[(i+2) * 3], positions[(i+2) * 3 + 1], positions[(i+2) * 3 + 2]]);
            if(uvs != null){
                tri.uv.push([uvs[i * 2], uvs[i * 2 + 1]]);
                tri.uv.push([uvs[(i+1) * 2], uvs[(i+1) * 2 + 1]]);
                tri.uv.push([uvs[(i+2) * 2], uvs[(i+2) * 2 + 1]]);
            }
            tri.color = this.color;
            tri.make_centroid();
            this.triangles.push(tri);
        }
    }

    
    read_corner_vertex(vertex_description: string, result: number[]): vec3 {
        const v_vt_vn = vertex_description.split("/");
        const v = this.v[Number(v_vt_vn[0]).valueOf() - 1];
        return v;
    }

    read_corner_tex_coord(vertex_description: string, result: number[]): vec2 {
        const v_vt_vn = vertex_description.split("/");
        const vt = this.vt[Number(v_vt_vn[1]).valueOf() - 1];
        return vt;
    }

    read_corner_normal(vertex_description: string, result: number[]): vec3 {
        const v_vt_vn = vertex_description.split("/");
        const vn = this.vn[Number(v_vt_vn[2]).valueOf() - 1];
        return vn;
    }
}