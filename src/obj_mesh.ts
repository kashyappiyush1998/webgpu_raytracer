import { vec3, vec2 } from "gl-matrix";
import { Triangle } from "./triangle";
import { Texture2D } from "./texture";

export class ObjMesh {

    v: vec3[]
    vt: vec2[]
    vn: vec3[]

    fileContents: string;
    triangles: Triangle[]
    color: vec3
    tex: Texture2D;

    constructor(fileContents: string) {

        this.fileContents = fileContents;
        this.v = [];
        this.vt = [];
        this.vn = [];

        this.triangles = [];
    }

    async initialize(color: vec3) {
        this.color = color;
        if(this.fileContents.endsWith('.obj')){
            await this.readText(this.fileContents);
        }
        else {
            this.readFile(this.fileContents);
        }
    }

    async readText(url: string) {
        const response: Response = await fetch(url);
        const blob: Blob = await response.blob();
        const file_contents = (await blob.text());
        this.readFile(file_contents);
    }


    async readFile(file_contents: string) {

        var result: number[] = [];
        const lines = file_contents.split("\n");

        lines.forEach(
            (line) => {
                //console.log(line);
                if (line[0] == "v" && line[1] == " ") {
                    this.read_vertex_data(line);
                }
                else if (line[0] == "v" && line[1] == "t") {
                    this.read_texcoord_data(line);
                }
                else if (line[0] == "v" && line[1] == "n") {
                    this.read_normal_data(line);
                }
                else if (line[0] == "f") {
                    this.read_face_data(line, result);
                }
            }
        )
    }

    read_vertex_data(line: string) {

        const components = line.split(" ");
        // ["v", "x", "y", "z"]
        const new_vertex: vec3 = [
            Number(components[1]).valueOf(),
            Number(components[2]).valueOf(),
            Number(components[3]).valueOf()
        ];

        this.v.push(new_vertex);
    }

    read_texcoord_data(line: string) {

        const components = line.split(" ");
        // ["vt", "u", "v"]
        const new_texcoord: vec2 = [
            Number(components[1]).valueOf(),
            Number(components[2]).valueOf()
        ];

        this.vt.push(new_texcoord);
    }

    read_normal_data(line: string) {

        const components = line.split(" ");
        // ["vn", "nx", "ny", "nz"]
        const new_normal: vec3 = [
            Number(components[1]).valueOf(),
            Number(components[2]).valueOf(),
            Number(components[3]).valueOf()
        ];

        this.vn.push(new_normal);
    }

    read_face_data(line: string, result: number[]) {

        line = line.replace("\n", "");
        const vertex_descriptions = line.split(" ");
        // ["f", "v1", "v2", ...]
        /*
            triangle fan setup, eg.
            v1 v2 v3 v4 => (v1, v2, v3), (v1, v3, v4)

            no. of triangles = no. of vertices - 2
        */

       const triangle_count = vertex_descriptions.length - 3; // accounting also for "f"
       for (var i = 0; i < triangle_count; i++) {
            var tri: Triangle = new Triangle();
            tri.corners.push(this.read_corner_vertex(vertex_descriptions[1], result));
            tri.uv.push(this.read_corner_tex_coord(vertex_descriptions[1], result));
            tri.normal.push(this.read_corner_normal(vertex_descriptions[1], result));
            tri.corners.push(this.read_corner_vertex(vertex_descriptions[2 + i], result));
            tri.uv.push(this.read_corner_tex_coord(vertex_descriptions[2 + i], result));
            tri.normal.push(this.read_corner_normal(vertex_descriptions[2 + i], result));
            tri.corners.push(this.read_corner_vertex(vertex_descriptions[3 + i], result));
            tri.uv.push(this.read_corner_tex_coord(vertex_descriptions[3 + i], result));
            tri.normal.push(this.read_corner_normal(vertex_descriptions[3 + i], result));
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