struct Sphere {
    center: vec3<f32>,
    color: vec3<f32>,
    radius: f32,
}

struct Triangle {
    corner_a: vec3<f32>,
    corner_b: vec3<f32>,
    corner_c: vec3<f32>,
    color: vec3<f32>,
    corner_a_uv: vec2<f32>,
    corner_b_uv: vec2<f32>,
    corner_c_uv: vec2<f32>,
}

struct ObjectData {
    triangles: array<Triangle>,
}

struct Node {
    minCorner: vec3<f32>,
    leftChild: f32,
    maxCorner: vec3<f32>,
    primitiveCount: f32,
}

struct BVH {
    nodes: array<Node>,
}

struct ObjectIndices {
    primitiveIndices: array<f32>,
}

struct Ray {
    direction: vec3<f32>,
    origin: vec3<f32>,
}

struct SceneData {
    cameraPos : vec3<f32>,
    cameraForwards : vec3<f32>,
    cameraRight : vec3<f32>,
    maxBounces: f32,
    cameraUp : vec3<f32>,
    sphereCount : f32,
}

struct RenderState {
    t: f32,
    color: vec3<f32>,
    hit: bool,
    position: vec3<f32>,
    normal: vec3<f32>,
}

@group(0) @binding(0) var color_buffer: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(1) var<uniform> scene: SceneData;
@group(0) @binding(2) var<storage, read> objects: ObjectData;
@group(0) @binding(3) var<storage, read> tree: BVH;
@group(0) @binding(4) var<storage, read> triangleLookup: ObjectIndices;
@group(0) @binding(5) var skyMaterial: texture_cube<f32>;
@group(0) @binding(6) var skySampler: sampler;
@group(0) @binding(7) var texture: texture_2d<f32>; 
@group(0) @binding(8) var textureSampler: sampler;

@compute @workgroup_size(8,8,1)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {

    let screen_size: vec2<i32> = vec2<i32>(textureDimensions(color_buffer));
    let screen_pos : vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));

    if (screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y) {
        return;
    }

    let forwards: vec3<f32> = scene.cameraForwards;
    let right: vec3<f32> = scene.cameraRight;
    let up: vec3<f32> = scene.cameraUp;
    var pixel_color : vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
    var myRay: Ray;
    myRay.origin = scene.cameraPos;

    let num_samples: f32 = 144.0;
    let width: f32 = sqrt(num_samples);
    let height: f32 = num_samples/width;
    let each_dist_x: f32 = 1.0/(width-1.0);
    let each_dist_y: f32 = 1.0/(height-1.0);

    for(var i: u32 = 0; i < u32(width); i++){
        for(var j: u32 = 0; j < u32(height); j++){
            
            let horizontal_coefficient: f32 = (f32(screen_pos.x) + each_dist_x * f32(i) - f32(screen_size.x) / 2) / f32(screen_size.x);
            let vertical_coefficient: f32 = (f32(screen_pos.y) + each_dist_y * f32(j) - f32(screen_size.y) / 2) / f32(screen_size.x);

            myRay.direction = normalize(forwards + horizontal_coefficient * right + vertical_coefficient * up);
            pixel_color += rayColor(myRay);

        }
    } 
    pixel_color /= num_samples;

    textureStore(color_buffer, screen_pos, vec4<f32>(pixel_color, 1.0));
}

fn rayColor(ray: Ray) -> vec3<f32> {

    var color: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
    var result: RenderState;

    var temp_ray: Ray;
    temp_ray.origin = ray.origin;
    temp_ray.direction = ray.direction;

    let bounces: u32 = 1;//u32(scene.maxBounces);
    let multiply_ratio = 1.0/f32(bounces);

    for(var bounce: u32 = 0; bounce < bounces; bounce++) {
        result = trace(temp_ray);
        color += result.color;

        if(!result.hit){
            break;
        }

        temp_ray.origin = result.position;
        temp_ray.direction = normalize(reflect(temp_ray.direction, result.normal));
    }

    color *= multiply_ratio;

    // if(result.hit) {
    //     color = vec3<f32>(1.0, 1.0, 1.0);
    // }

    return color;
}

fn trace(ray: Ray) -> RenderState {

    var renderState: RenderState;
    renderState.hit = false;
    var nearestHit: f32 = 9999;


    var node: Node = tree.nodes[0];
    var stack: array<Node, 15>;
    var stackLocation: u32 = 0;

    while(true) {

        var primitiveCount: u32 = u32(node.primitiveCount);
        var contents: u32 = u32(node.leftChild);

        if(primitiveCount == 0){

            var child1: Node = tree.nodes[contents];
            var child2: Node = tree.nodes[contents + 1];

            var distance1: f32 = hit_aabb(ray, child1);
            var distance2: f32 = hit_aabb(ray, child2);

            if(distance1 > distance2) {
                var tempDist: f32 = distance1;
                distance1 = distance2;
                distance2 = tempDist;

                var tempChild: Node = child1;
                child1 = child2;
                child2 = tempChild;
            }

            if(distance1 > nearestHit){
                if(stackLocation == 0) {
                    break;
                }
                else {
                    stackLocation -= 1;
                    node = stack[stackLocation];
                }
            }
            else {
                node = child1;
                if(distance2 < nearestHit) {
                    stack[stackLocation] = child2;
                    stackLocation += 1;
                }
            }
        }
        else{

            for(var i: u32 = 0; i < primitiveCount; i++) {
                var newRenderState: RenderState;
                var barycentric_coordinates : vec3<f32> = hit_triangle(ray, objects.triangles[u32(triangleLookup.primitiveIndices[i + contents])], 0.001, nearestHit, renderState, &newRenderState);

                var u: f32 = barycentric_coordinates[0];
                var v: f32 = barycentric_coordinates[1];
                var w: f32 = barycentric_coordinates[2];

                if(newRenderState.hit){
                    var uv_coords: vec2<f32> = uv_triangle(objects.triangles[u32(triangleLookup.primitiveIndices[i + contents])], u, v, w);
                    var color: vec4<f32> = textureSampleLevel(texture, textureSampler, uv_coords, 0.0);
                    nearestHit = newRenderState.t;
                    renderState = newRenderState;
                    // renderState.color = vec3<f32>(uv_coords.x, uv_coords.y, 0.0);
                    renderState.color = color.xyz;
                }
            }
            if(stackLocation ==0 ) {
                break;
            }
            else {
                stackLocation -= 1;
                node = stack[stackLocation];
            }
        }
    }

    if(!renderState.hit) {
        // For white sky
        renderState.color = vec3<f32>(1.0, 1.0, 1.0);
        // renderState.color = textureSampleLevel(skyMaterial, skySampler, ray.direction, 0.0).xyz;   
    }

    return renderState;
}

fn randomOffset(seed: vec2<f32>) -> vec2<f32> {
    return vec2<f32>(fract(sin(dot(seed, vec2<f32>(12.9898, 78.233))) * 43758.5453));
}

fn uv_triangle(tri: Triangle, u: f32, v: f32, w: f32) -> vec2<f32> {
    var uv_coord: vec2<f32>;
    uv_coord = u * tri.corner_a_uv + v * tri.corner_b_uv + w * tri.corner_c_uv; 
    return uv_coord;
}

fn hit_triangle(ray: Ray, tri: Triangle, tMin: f32, tMax: f32, oldRenderState: RenderState, newRenderState: ptr<function, RenderState>) -> vec3<f32> {
    
    //Set up a blank renderstate,
    //right now this hasn't hit anything
    newRenderState.color = oldRenderState.color;
    newRenderState.hit = false;

    //Direction vectors
    let edge_ab: vec3<f32> = tri.corner_b - tri.corner_a;
    let edge_ac: vec3<f32> = tri.corner_c - tri.corner_a;
    //Normal of the triangle
    var n: vec3<f32> = normalize(cross(edge_ab, edge_ac));
    var ray_dot_tri: f32 = dot(ray.direction, n);
    //backface reversal
    if (ray_dot_tri > 0.0) {
        ray_dot_tri = ray_dot_tri * -1;
        n = n * -1;
    }
    //early exit, ray parallel with triangle surface
    if (abs(ray_dot_tri) < 0.00001) {
        return vec3<f32>(0, 0, 0);
    }

    var system_matrix: mat3x3<f32> = mat3x3<f32>(
        ray.direction,
        tri.corner_a - tri.corner_b,
        tri.corner_a - tri.corner_c
    );
    let denominator: f32 = determinant(system_matrix);
    // if (abs(denominator) < 0.00001) {
    //     return vec3<f32>(0, 0, 0);
    // }

    system_matrix = mat3x3<f32>(
        ray.direction,
        tri.corner_a - ray.origin,
        tri.corner_a - tri.corner_c
    );
    let u: f32 = determinant(system_matrix) / denominator;
    
    // if (u < 0 || u > 1) {
    //     return vec3<f32>(0, 0, 0);
    // }

    system_matrix = mat3x3<f32>(
        ray.direction,
        tri.corner_a - tri.corner_b,
        tri.corner_a - ray.origin,
    );
    let v: f32 = determinant(system_matrix) / denominator;
    // if (v < 0.0 || u + v > 1.0) {
    //     return vec3<f32>(0, 0, 0);
    // }

    system_matrix = mat3x3<f32>(
        tri.corner_a - ray.origin,
        tri.corner_a - tri.corner_b,
        tri.corner_a - tri.corner_c
    );
    let t: f32 = determinant(system_matrix) / denominator;

    if (t > tMin && t < tMax) {

        newRenderState.position = ray.origin + t * ray.direction;
        newRenderState.normal = n;
        newRenderState.color = tri.color;
        newRenderState.t = t;
        newRenderState.hit = true;
        return vec3<f32>(u, v, 1-u-v);
    }

    return vec3<f32>(u, v, 1-u-v);
}

fn hit_aabb(ray: Ray, node: Node) -> f32 {
    var inverseDir: vec3<f32> = vec3<f32>(1.0) / ray.direction;
    var t1: vec3<f32> = (node.minCorner - ray.origin) * inverseDir;
    var t2: vec3<f32> = (node.maxCorner - ray.origin) * inverseDir;
    var tMin: vec3<f32> = min(t1, t2);
    var tMax: vec3<f32> = max(t1, t2);

    var t_min: f32 = max(max(tMin.x, tMin.y), tMin.z);
    var t_max: f32 = min(min(tMax.x, tMax.y), tMax.z);

    if (t_min > t_max || t_max < 0) {
        return 99999;
    }
    else {
        return t_min;
    }
}

// fn hit_sphere(ray: Ray, sphere: Sphere, tMin: f32, tMax: f32, oldRenderState: RenderState) -> RenderState {
//     let co: vec3<f32> = ray.origin - sphere.center;
//     let a: f32 = dot(ray.direction, ray.direction);
//     let b: f32 = 2.0 * dot(ray.direction, co);
//     let c: f32 = dot(co, co) - sphere.radius * sphere.radius;
//     let discriminant: f32 = b * b - 4.0 * a * c;

//     renderState.color = oldRenderState.color;

//     if(discriminant > 0.0) {

//         let t: f32 = (-b - sqrt(discriminant)) / (2 * a);

//         if(t > tMin && t < tMax) {
//             renderState.t = t;
//             renderState.position = ray.origin + t * ray.direction;
//             renderState.normal = normalize(renderState.position - sphere.center);
//             renderState.color = sphere.color;
//             renderState.hit = true;
//             return renderState;
//         }
//     }

//     renderState.hit = false;
//     return renderState;
// }