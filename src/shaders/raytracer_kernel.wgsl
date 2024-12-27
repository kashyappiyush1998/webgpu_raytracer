struct Sphere {
    center: vec3<f32>,
    color: vec3<f32>,
    radius: f32,
}

struct Triangle {
    corner_a: vec3<f32>,
    corner_b: vec3<f32>,
    corner_c: vec3<f32>,
    normal_a: vec3<f32>,
    normal_b: vec3<f32>,
    normal_c: vec3<f32>,
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

struct Light{
    intentisty: f32,
    direction: vec3<f32>,
    color: vec3<f32>,
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
    uv_coords: vec2<f32>,
}

const epsilon: f32 = 0.00000001;

fn hash2D(p: vec2<f32>) -> vec2<f32> {
    let rand_hash: vec2<f32> = vec2<f32>(fract(sin(dot(p, vec2<f32>(127.1, 311.7))) * 43758.5453123) * 2.0 - 1.0,
                                fract(sin(dot(p + vec2<f32>(1.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453123) * 2.0 - 1.0);
    return rand_hash;
}

fn random3D(p: vec3<f32>) -> vec3<f32> {
    let rand_3d: vec3<f32> = vec3<f32>((fract(sin(dot(p, vec3<f32>(127.1, 311.7, 415.57))) * 43758.5453123) * 2.0 - 1.0),
                                        (fract(sin(dot(p + vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(127.1, 311.7, 415.57))) * 43758.5453123) * 2.0 - 1.0),
                                        (fract(sin(dot(p + vec3<f32>(2.0, 2.0, 2.0), vec3<f32>(127.1, 311.7, 415.57))) * 43758.5453123) * 2.0 - 1.0));
    return rand_3d * rand_3d;
}

fn random2D(seed: vec2<f32>) -> vec2<f32> {
    return hash2D(seed);
}

fn randomHemisphereDirection(normal: vec3<f32>, rand: vec2<f32>) -> vec3<f32> {
    let phi: f32 = 2.0 * 3.14159265359 * rand.x; // Random angle around normal
    let cosTheta: f32 = sqrt(1.0 - rand.y);      // Bias towards the normal
    let sinTheta: f32 = sqrt(rand.y);

    let tangent: vec3<f32> = normalize(vec3<f32>(normal.y, normal.z, -normal.x)); // Generate tangent
    let bitangent: vec3<f32> = cross(normal, tangent);

    return normalize(sinTheta * cos(phi) * tangent +
                     sinTheta * sin(phi) * bitangent +
                     cosTheta * normal);
}

fn roughReflection(incident: vec3<f32>, normal: vec3<f32>, roughness: f32, rand: vec2<f32>) -> vec3<f32> {
    let perfectReflection: vec3<f32> = reflect(incident, normal);
    let randomDir: vec3<f32> = randomHemisphereDirection(perfectReflection, rand);
    return normalize((perfectReflection + randomDir) * roughness);
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

    let num_samples: f32 = 9.0;
    let width: f32 = sqrt(num_samples);
    let height: f32 = num_samples/width;
    let each_dist_x: f32 = 1.0/width;
    let each_dist_y: f32 = 1.0/height;

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

    var color: vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
    var result: RenderState;

    var temp_ray: Ray;
    temp_ray.origin = ray.origin;
    temp_ray.direction = ray.direction;

    let bounces: u32 = 20;//u32(scene.maxBounces);
    let multiply_ratio = 1.0/f32(bounces);
    let roughness: f32 = 0.9;
    var count: u32 = 0;
    for(var bounce: u32 = 0; bounce < bounces; bounce++) {
        count += 1;
        result = trace(temp_ray);
        color *= result.color;

        if(!result.hit){
            break;
        }

        temp_ray.origin = result.position;
        temp_ray.direction = normalize(reflect(temp_ray.direction, result.normal + random3D(result.normal) * roughness));
        // temp_ray.direction = roughReflection(temp_ray.direction, result.normal, 1.0, result.uv_coords);
    }

    // color = color/f32(count);

    if(result.hit) {
        color = vec3<f32>(0.0, 0.0, 0.0);
    }

    return color;
}

fn trace(ray: Ray) -> RenderState {

    var renderState: RenderState;
    renderState.hit = false;
    renderState.color = vec3<f32>(1.0, 1.0, 1.0);
    var nearestHit: f32 = 9999999;

    var node: Node = tree.nodes[0];
    var stack: array<Node, 15>;
    var stackLocation: u32 = 0;

    var light: Light;
    light.intentisty = 1.0;
    light.direction = scene.cameraForwards;
    light.color = vec3<f32>(1.0, 1.0, 1.0);

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
                    if (u >= 0.0 && v >= 0.0 && w >= 0.0 && (u + v + w) <= 1.0) {
                        var tri: Triangle = objects.triangles[u32(triangleLookup.primitiveIndices[i + contents])];
                        var uv_coords: vec2<f32> = w * tri.corner_a_uv + u * tri.corner_b_uv + v * tri.corner_c_uv;
                        var interpolatedNormal: vec3<f32> = normalize(w * tri.normal_a + u * tri.normal_b + v * tri.normal_c);
                        var baseColor: vec3<f32> = textureSampleLevel(texture, textureSampler, uv_coords, 0.0).xyz;
                        // var diffuse: f32 = max(dot(interpolatedNormal, normalize(light.direction)), 0.0);
                        var diffuse: f32 = max(dot(-1 * interpolatedNormal, normalize(light.direction)), 0.0);
            
                        nearestHit = newRenderState.t;
                        renderState = newRenderState;
                        renderState.normal = interpolatedNormal;
                        renderState.uv_coords = uv_coords;
                        // renderState.color = vec3<f32>(uv_coords.x, uv_coords.y, 0.0);
                        // renderState.color = interpolatedNormal * 0.5 + 0.5;
                        // renderState.color = vec3<f32>(1.0, 0.84, 0.0);
                        renderState.color = diffuse * baseColor;
                        // renderState.color = random2D(uv_coords);
                    }
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
    if (abs(ray_dot_tri) < 0.001) {
        return vec3<f32>(1, 1, 1);
    }

    var system_matrix: mat3x3<f32> = mat3x3<f32>(
        ray.direction,
        tri.corner_a - tri.corner_b,
        tri.corner_a - tri.corner_c
    );
    let denominator: f32 = determinant(system_matrix);
    if (abs(denominator) < epsilon) {
        return vec3<f32>(1, 1, 1);
    }

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
        // newRenderState.normal = n;
        // newRenderState.color = tri.color;
        newRenderState.t = t;
        newRenderState.hit = true;
        return vec3<f32>(u, v, 1-u-v);
    }

    return vec3<f32>(1, 1, 1);
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
        return 9999999;
    }
    else {
        return t_min;
    }
}
