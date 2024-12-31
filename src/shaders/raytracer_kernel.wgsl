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
    position: vec3<f32>,
    diffuseIntensity: f32,
    direction: vec3<f32>,
    color: vec3<f32>,
}

struct Lights{
    lights: array<Light>,
}

struct SceneData {
    cameraPos : vec3<f32>,
    ambientLightIntensity: f32,
    cameraForwards : vec3<f32>,
    numSamples: f32,
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

// 3. Adaptive Sampling
struct PixelState {
    mean: vec3<f32>,
    m2: vec3<f32>,
    variance: vec3<f32>,
    samples: u32,
}

fn updatePixelVariance(state: ptr<function, PixelState>, sample: vec3<f32>) {
    (*state).samples += 1u;
    let delta = sample - (*state).mean;
    (*state).mean += delta / f32((*state).samples);
    let delta2 = sample - (*state).mean;
    (*state).m2 += delta * delta2;
    
    if ((*state).samples > 1u) {
        (*state).variance = (*state).m2 / f32((*state).samples - 1u);
    }
}

fn maxVec3(a: vec3<f32>, b: vec3<f32>) -> vec3<f32> {
    return vec3<f32>(
        max(a.x, b.x),
        max(a.y, b.y),
        max(a.z, b.z)
    );
}

fn findMaxInArray(arr: array<vec3<f32>, 9>) -> vec3<f32> {
    // Initialize the maximum with the first element
    var maxValue: vec3<f32> = arr[0];
    
    // Loop through the array to find the maximum
    for (var i: u32 = 0; i < 9; i++) {
        maxValue = maxVec3(maxValue, arr[i]);
    }

    return maxValue;
}


fn vec3Sum(v: vec3<f32>) -> f32 {
    return v.x + v.y + v.z;
}

fn bubbleSortVec3(arr: ptr<function, array<vec3<f32>, 9>>) {
    let n: u32 = 9;
    var swapped: bool;

    loop {
        swapped = false;

        for (var i: u32 = 0u; i < n - 1u; i = i + 1u) {
            let a: vec3<f32> = (*arr)[i];
            let b: vec3<f32> = (*arr)[i + 1u];
            
            if (vec3Sum(a) > vec3Sum(b)) {
                // Swap the elements
                (*arr)[i] = b;
                (*arr)[i + 1u] = a;
                swapped = true;
            }
        }

        // Exit the loop if no swaps occurred
        if (!swapped) {
            break;
        }
    }
}



const epsilon: f32 = 0.00000001;


fn random1D(seed: vec3<f32>) -> f32 {
    return fract(sin(dot(seed, vec3<f32>(12.9898, 78.233, 45.164))) * 43758.5453123);
}

// Generate random point on hemisphere for Monte Carlo sampling
fn randomHemispherePoint(normal: vec3<f32>, seed: vec3<f32>) -> vec3<f32> {
    let u1 = random1D(seed);
    let u2 = random1D(seed + vec3<f32>(1.0, 0.0, 0.0));
    
    let r = sqrt(1.0 - u1 * u1);
    // Every direction has equal probability
    let phi = 2.0 * 3.14159 * u2;
    
    let x = cos(phi) * r;
    let y = sin(phi) * r;
    let z = u1;
    
    var up: vec3<f32>; 
    if(abs(normal.z) < 0.999){
        up = vec3<f32>(0.0, 0.0, 1.0);
    } 
    else {
        up = vec3<f32>(1.0, 0.0, 0.0);
    }
    let tangent = normalize(cross(up, normal));
    let bitangent = cross(normal, tangent);
    
    return normalize(tangent * x + bitangent * y + normal * z);
}

fn random3D(p: vec3<f32>) -> vec3<f32> {
    let rand_3d: vec3<f32> = vec3<f32>((fract(sin(dot(p, vec3<f32>(127.1, 311.7, 415.57))) * 43758.5453123) * 2.0 - 1.0),
                                        (fract(sin(dot(p + vec3<f32>(1.0, 1.0, 1.0), vec3<f32>(127.1, 311.7, 415.57))) * 43758.5453123) * 2.0 - 1.0),
                                        (fract(sin(dot(p + vec3<f32>(2.0, 2.0, 2.0), vec3<f32>(127.1, 311.7, 415.57))) * 43758.5453123) * 2.0 - 1.0));
    return rand_3d * rand_3d;
}

fn random2D(seed: vec2<f32>) -> vec2<f32> {
    let rand_2d: vec2<f32> = vec2<f32>(fract(sin(dot(seed, vec2<f32>(127.1, 311.7))) * 43758.5453123) * 2.0 - 1.0,
                                fract(sin(dot(seed + vec2<f32>(1.0, 1.0), vec2<f32>(127.1, 311.7))) * 43758.5453123) * 2.0 - 1.0);
    return rand_2d;
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
@group(0) @binding(9) var<uniform> light: Light;

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

    let num_samples: f32 = scene.numSamples;
    let width: f32 = sqrt(num_samples);
    let height: f32 = num_samples/width;
    var rand_dist: vec2<f32>;
    var color_array: array<vec3<f32>, 9>;

    var pixel_state: PixelState;
    pixel_state.mean = vec3<f32>(0.0);
    pixel_state.m2 = vec3<f32>(0.0);
    pixel_state.variance = vec3<f32>(0.0);
    pixel_state.samples = 0u;

    // for(var i: u32 = 0; i < u32(width); i++){
    //     for(var j: u32 = 0; j < u32(height); j++){
    for(var sample: u32 = 0u; sample < u32(scene.numSamples); sample++) {
        let seed = vec3<f32>(f32(screen_pos.x), f32(screen_pos.y), f32(sample));
        // Stratified sampling for anti-aliasing
        let offset = random2D(vec2<f32>(seed.x, seed.y) + vec2<f32>(f32(sample)));

        // rand_dist = random2D(vec2<f32>(f32(screen_pos.x), f32(screen_pos.y)) + vec2<f32>(f32(i), f32(j)));
        let horizontal_coefficient: f32 = (f32(screen_pos.x) + offset.x - f32(screen_size.x) / 2) / f32(screen_size.x);
        let vertical_coefficient: f32 = (f32(screen_pos.y) + offset.y - f32(screen_size.y) / 2) / f32(screen_size.x);

        myRay.direction = normalize(forwards + horizontal_coefficient * right + vertical_coefficient * up);
        var color: vec3<f32> = rayColor(myRay);
        // updatePixelVariance(&pixel_state, color);
        pixel_color += color;
        // color_array[i * u32(width) + j] = color;
        // Adaptive sampling - break if variance is low enough
        // if (sample > 2 && max(max(pixel_state.variance.x, pixel_state.variance.y), pixel_state.variance.z) < 0.01) {
        //     break;
        // }
    }
    // } 

    // Median filtering
    // bubbleSortVec3(&color_array);
    // pixel_color = color_array[7];
    pixel_color /= num_samples;

    textureStore(color_buffer, screen_pos, vec4<f32>(pixel_color, 1.0));
}

fn rayColor(ray: Ray) -> vec3<f32> {

    var throughput: vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
    var color: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
    var result: RenderState;

    var temp_ray: Ray;
    temp_ray.origin = ray.origin;
    temp_ray.direction = ray.direction;

    let bounces: u32 = 5;//u32(scene.maxBounces);
    let roughness: f32 = 0.9;
    var count: u32 = 0;
    for(var bounce: u32 = 0; bounce < bounces; bounce++) {
        count += 1;
        result = trace(temp_ray);
        color += result.color;

        if(!result.hit){
            // color += throughput * vec3<f32>(0.5); // Ambient light
            break;
        }

        // Get material properties at hit point
        let albedo = result.color;

        // Russian Roulette for path termination
        let rr_prob = max(max(throughput.r, throughput.g), throughput.b);
        if (random1D(result.position + vec3<f32>(f32(bounce))) > rr_prob && bounce > 3u) {
            break;
        }

        throughput /= rr_prob;

        // Generate new ray direction using hemisphere sampling
        let new_dir = randomHemispherePoint(result.normal, result.position + vec3<f32>(f32(bounce)));

        // Calculate BRDF and cosine term
        let cos_theta = max(dot(new_dir, result.normal), 0.0);
        let brdf = albedo / 3.14159; // Assuming lambertian surface

        // Update throughput
        throughput *= brdf * cos_theta * 2.0 * 3.14159; // PDF = 1 / (2 * PI)

        temp_ray.origin = result.position;// + result.normal * 0.001;
        temp_ray.direction = new_dir;//normalize(reflect(temp_ray.direction, result.normal + random3D(result.normal) * roughness));
        // temp_ray.direction = roughReflection(temp_ray.direction, result.normal, 1.0, result.uv_coords);
    }

    color = color/f32(count);
    // throughput = throughput/f32(count);

    if(result.hit) {
        // throughput = vec3<f32>(0.0, 0.0, 0.0);
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

    var light1: Light;
    light1.diffuseIntensity = light.diffuseIntensity;
    light1.direction = light.direction;
    light1.color = light.color;

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
                        var diffuse: f32 = max(dot(-1 * interpolatedNormal, normalize(light1.direction)), 0.0);
            
                        nearestHit = newRenderState.t;
                        renderState = newRenderState;
                        renderState.normal = interpolatedNormal;
                        renderState.uv_coords = uv_coords;
                        // renderState.color = vec3<f32>(uv_coords.x, uv_coords.y, 0.0);
                        // renderState.color = interpolatedNormal * 0.5 + 0.5;
                        // renderState.color = vec3<f32>(1.0, 0.84, 0.0);
                        renderState.color = light1.diffuseIntensity * diffuse * baseColor;// + scene.ambientLightIntensity * baseColor;
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
        renderState.color = vec3<f32>(0.0, 0.0, 0.0);
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
