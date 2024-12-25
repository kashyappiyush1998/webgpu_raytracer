(()=>{"use strict";var e,r,t,n,i={927:(e,r,t)=>{t.a(e,(async(e,r)=>{try{var n=t(410),i=t(853);const e=document.getElementById("gfx-main"),a=document.getElementById("change-every-frame"),s=document.getElementById("change-every-second"),o=new n.Z(1024);await o.make_scene();const c=new i.A(e,a,s,o);await c.Initialize(),r()}catch(e){r(e)}}),1)},853:(e,r,t)=>{t.d(r,{A:()=>s});const n="@group(0) @binding(0) var screen_sampler : sampler;\r\n@group(0) @binding(1) var color_buffer : texture_2d<f32>;\r\n\r\nstruct VertexOutput {\r\n    @builtin(position) Position : vec4<f32>,\r\n    @location(0) TexCoord : vec2<f32>,\r\n}\r\n\r\n@vertex\r\nfn vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {\r\n\r\n    var positions = array<vec2<f32>, 6>(\r\n        vec2<f32>( 1.0,  1.0),\r\n        vec2<f32>( 1.0, -1.0),\r\n        vec2<f32>(-1.0, -1.0),\r\n        vec2<f32>( 1.0,  1.0),\r\n        vec2<f32>(-1.0, -1.0),\r\n        vec2<f32>(-1.0,  1.0)\r\n    );\r\n\r\n    var texCoords = array<vec2<f32>, 6>(\r\n        vec2<f32>(1.0, 0.0),\r\n        vec2<f32>(1.0, 1.0),\r\n        vec2<f32>(0.0, 1.0),\r\n        vec2<f32>(1.0, 0.0),\r\n        vec2<f32>(0.0, 1.0),\r\n        vec2<f32>(0.0, 0.0)\r\n    );\r\n\r\n    var output : VertexOutput;\r\n    output.Position = vec4<f32>(positions[VertexIndex], 0.0, 1.0);\r\n    output.TexCoord = texCoords[VertexIndex];\r\n    return output;\r\n}\r\n\r\n@fragment\r\nfn frag_main(@location(0) TexCoord : vec2<f32>) -> @location(0) vec4<f32> {\r\n  return textureSample(color_buffer, screen_sampler, TexCoord);\r\n}";class i{async initialize(e,r){for(var t=new Array(6),n=0;n<6;n++){const e=await fetch(r[n]),i=await e.blob();t[n]=await createImageBitmap(i)}await this.loadImageBitmaps(e,t),this.view=this.texture.createView({format:"rgba8unorm",dimension:"cube",aspect:"all",baseMipLevel:0,mipLevelCount:1,baseArrayLayer:0,arrayLayerCount:6}),this.sampler=e.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"nearest",mipmapFilter:"nearest",maxAnisotropy:1})}async loadImageBitmaps(e,r){const t={dimension:"2d",size:{width:r[0].width,height:r[0].height,depthOrArrayLayers:6},format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT};this.texture=e.createTexture(t);for(var n=0;n<6;n++)e.queue.copyExternalImageToTexture({source:r[n]},{texture:this.texture,origin:[0,0,n]},[r[n].width,r[n].height])}}class a{async initialize(e,r){var t;const n=await fetch(r),i=await n.blob();t=await createImageBitmap(i),await this.loadImageBitmap(e,t),this.view=this.texture.createView({format:"rgba8unorm",dimension:"2d",aspect:"all",baseMipLevel:0,mipLevelCount:1,baseArrayLayer:0,arrayLayerCount:1}),this.sampler=e.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"nearest",mipmapFilter:"nearest",maxAnisotropy:1})}async loadImageBitmap(e,r){const t={dimension:"2d",size:{width:r.width,height:r.height,depthOrArrayLayers:1},format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT};this.texture=e.createTexture(t),e.queue.copyExternalImageToTexture({source:r},{texture:this.texture,origin:[0,0,0]},[r.width,r.height])}}class s{constructor(e,r,t,n){this.render=()=>{const e=performance.now();this.prepareScene();const r=this.device.createCommandEncoder(),t=r.beginComputePass();t.setPipeline(this.ray_tracing_pipeline),t.setBindGroup(0,this.ray_tracing_bind_group),t.dispatchWorkgroups(Math.floor((this.canvas.width+7)/8),Math.floor((this.canvas.height+7)/8),1),t.end();const n=this.context.getCurrentTexture().createView(),i=r.beginRenderPass({colorAttachments:[{view:n,clearValue:{r:.5,g:0,b:.25,a:1},loadOp:"clear",storeOp:"store"}]});i.setPipeline(this.screen_pipeline),i.setBindGroup(0,this.screen_bind_group),i.draw(6,1,0,0),i.end(),this.device.queue.submit([r.finish()]),this.device.queue.onSubmittedWorkDone().then((()=>{this.change_every_frame.innerHTML="Triangle count: "+this.scene.triangles.length.toFixed(0),this.change_every_frame.innerHTML+="<br />RenderTime: "+(performance.now()-e).toFixed(5)+" ms"})),requestAnimationFrame(this.render),performance.now(),performance.now()-this.passedTime>1e3&&(this.change_every_second.innerHTML="<br />FPS: "+(1e3*this.count/(performance.now()-this.passedTime)).toFixed(1),this.passedTime=performance.now(),this.count=0),this.count+=1},this.canvas=e,this.change_every_frame=r,this.change_every_second=t,this.count=0,this.passedTime=0,this.scene=n}async Initialize(){await this.setupDevice(),await this.makeBindGroupLayouts(),await this.createAssets(),await this.makeBindGroups(),await this.makePipeline(),this.render()}async setupDevice(){var e,r;this.adapter=await(null===(e=navigator.gpu)||void 0===e?void 0:e.requestAdapter()),this.device=await(null===(r=this.adapter)||void 0===r?void 0:r.requestDevice()),this.context=this.canvas.getContext("webgpu"),this.format="bgra8unorm",this.context.configure({device:this.device,format:this.format,alphaMode:"opaque"})}async makeBindGroupLayouts(){this.ray_tracing_bind_group_layout=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba8unorm",viewDimension:"2d"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage",hasDynamicOffset:!1}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage",hasDynamicOffset:!1}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage",hasDynamicOffset:!1}},{binding:5,visibility:GPUShaderStage.COMPUTE,texture:{viewDimension:"cube"}},{binding:6,visibility:GPUShaderStage.COMPUTE,sampler:{}},{binding:7,visibility:GPUShaderStage.COMPUTE,texture:{viewDimension:"2d"}},{binding:8,visibility:GPUShaderStage.COMPUTE,sampler:{}}]}),this.screen_bind_group_layout=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{}}]})}async createAssets(){this.color_buffer=this.device.createTexture({size:{width:this.canvas.width,height:this.canvas.height},format:"rgba8unorm",usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.color_buffer_view=this.color_buffer.createView(),this.sampler=this.device.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"nearest",mipmapFilter:"nearest",maxAnisotropy:1});const e={size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST};this.sceneParameters=this.device.createBuffer(e);const r={size:96*this.scene.triangles.length,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST};this.triangleBuffer=this.device.createBuffer(r);const t={size:32*this.scene.nodesUsed,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST};this.nodeBuffer=this.device.createBuffer(t);const n={size:4*this.scene.triangleCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST};this.triangleIndexBuffer=this.device.createBuffer(n),this.sky_material=new i,await this.sky_material.initialize(this.device,["dist/img/sky_back.png","dist/img/sky_front.png","dist/img/sky_left.png","dist/img/sky_right.png","dist/img/sky_top.png","dist/img/sky_bottom.png"]),this.texture_man_head=new a,await this.texture_man_head.initialize(this.device,"dist/models/man_head_2.png")}async makePipeline(){const e=this.device.createPipelineLayout({bindGroupLayouts:[this.ray_tracing_bind_group_layout]});this.ray_tracing_pipeline=this.device.createComputePipeline({layout:e,compute:{module:this.device.createShaderModule({code:"struct Sphere {\r\n    center: vec3<f32>,\r\n    color: vec3<f32>,\r\n    radius: f32,\r\n}\r\n\r\nstruct Triangle {\r\n    corner_a: vec3<f32>,\r\n    corner_b: vec3<f32>,\r\n    corner_c: vec3<f32>,\r\n    color: vec3<f32>,\r\n    corner_a_uv: vec2<f32>,\r\n    corner_b_uv: vec2<f32>,\r\n    corner_c_uv: vec2<f32>,\r\n}\r\n\r\nstruct ObjectData {\r\n    triangles: array<Triangle>,\r\n}\r\n\r\nstruct Node {\r\n    minCorner: vec3<f32>,\r\n    leftChild: f32,\r\n    maxCorner: vec3<f32>,\r\n    primitiveCount: f32,\r\n}\r\n\r\nstruct BVH {\r\n    nodes: array<Node>,\r\n}\r\n\r\nstruct ObjectIndices {\r\n    primitiveIndices: array<f32>,\r\n}\r\n\r\nstruct Ray {\r\n    direction: vec3<f32>,\r\n    origin: vec3<f32>,\r\n}\r\n\r\nstruct SceneData {\r\n    cameraPos : vec3<f32>,\r\n    cameraForwards : vec3<f32>,\r\n    cameraRight : vec3<f32>,\r\n    maxBounces: f32,\r\n    cameraUp : vec3<f32>,\r\n    sphereCount : f32,\r\n}\r\n\r\nstruct RenderState {\r\n    t: f32,\r\n    color: vec3<f32>,\r\n    hit: bool,\r\n    position: vec3<f32>,\r\n    normal: vec3<f32>,\r\n}\r\n\r\n@group(0) @binding(0) var color_buffer: texture_storage_2d<rgba8unorm, write>;\r\n@group(0) @binding(1) var<uniform> scene: SceneData;\r\n@group(0) @binding(2) var<storage, read> objects: ObjectData;\r\n@group(0) @binding(3) var<storage, read> tree: BVH;\r\n@group(0) @binding(4) var<storage, read> triangleLookup: ObjectIndices;\r\n@group(0) @binding(5) var skyMaterial: texture_cube<f32>;\r\n@group(0) @binding(6) var skySampler: sampler;\r\n@group(0) @binding(7) var texture: texture_2d<f32>; \r\n@group(0) @binding(8) var textureSampler: sampler;\r\n\r\n@compute @workgroup_size(8,8,1)\r\nfn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {\r\n\r\n    let screen_size: vec2<i32> = vec2<i32>(textureDimensions(color_buffer));\r\n    let screen_pos : vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));\r\n\r\n    if (screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y) {\r\n        return;\r\n    }\r\n\r\n    let horizontal_coefficient: f32 = (f32(screen_pos.x) - f32(screen_size.x) / 2) / f32(screen_size.x);\r\n    let vertical_coefficient: f32 = (f32(screen_pos.y) - f32(screen_size.y) / 2) / f32(screen_size.x);\r\n    let forwards: vec3<f32> = scene.cameraForwards;\r\n    let right: vec3<f32> = scene.cameraRight;\r\n    let up: vec3<f32> = scene.cameraUp;\r\n\r\n    var pixel_color : vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);\r\n    var myRay: Ray;\r\n    myRay.origin = scene.cameraPos;\r\n    for (var i = 0; i < 10; i = i + 1) {\r\n        let offset = randomOffset(vec2<f32>(GlobalInvocationID.xy) + vec2<f32>(f32(i), f32(i))) * 10;\r\n        myRay.direction = normalize(forwards + (horizontal_coefficient+offset.x) * right + (vertical_coefficient+offset.y) * up);\r\n\r\n        pixel_color += rayColor(myRay);\r\n    }\r\n    pixel_color *= 0.1;\r\n\r\n    textureStore(color_buffer, screen_pos, vec4<f32>(pixel_color, 1.0));\r\n}\r\n\r\nfn rayColor(ray: Ray) -> vec3<f32> {\r\n\r\n    var color: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);\r\n    var result: RenderState;\r\n\r\n    var temp_ray: Ray;\r\n    temp_ray.origin = ray.origin;\r\n    temp_ray.direction = ray.direction;\r\n\r\n    let bounces: u32 = 1;//u32(scene.maxBounces);\r\n    let multiply_ratio = 1.0/f32(bounces);\r\n\r\n    for(var bounce: u32 = 0; bounce < bounces; bounce++) {\r\n        result = trace(temp_ray);\r\n        color += result.color;\r\n\r\n        if(!result.hit){\r\n            break;\r\n        }\r\n\r\n        temp_ray.origin = result.position;\r\n        temp_ray.direction = normalize(reflect(temp_ray.direction, result.normal));\r\n    }\r\n\r\n    color *= multiply_ratio;\r\n\r\n    // if(result.hit) {\r\n    //     color = vec3<f32>(1.0, 1.0, 1.0);\r\n    // }\r\n\r\n    return color;\r\n}\r\n\r\nfn trace(ray: Ray) -> RenderState {\r\n\r\n    var renderState: RenderState;\r\n    renderState.hit = false;\r\n    var nearestHit: f32 = 9999;\r\n\r\n\r\n    var node: Node = tree.nodes[0];\r\n    var stack: array<Node, 15>;\r\n    var stackLocation: u32 = 0;\r\n\r\n    while(true) {\r\n\r\n        var primitiveCount: u32 = u32(node.primitiveCount);\r\n        var contents: u32 = u32(node.leftChild);\r\n\r\n        if(primitiveCount == 0){\r\n\r\n            var child1: Node = tree.nodes[contents];\r\n            var child2: Node = tree.nodes[contents + 1];\r\n\r\n            var distance1: f32 = hit_aabb(ray, child1);\r\n            var distance2: f32 = hit_aabb(ray, child2);\r\n\r\n            if(distance1 > distance2) {\r\n                var tempDist: f32 = distance1;\r\n                distance1 = distance2;\r\n                distance2 = tempDist;\r\n\r\n                var tempChild: Node = child1;\r\n                child1 = child2;\r\n                child2 = tempChild;\r\n            }\r\n\r\n            if(distance1 > nearestHit){\r\n                if(stackLocation == 0) {\r\n                    break;\r\n                }\r\n                else {\r\n                    stackLocation -= 1;\r\n                    node = stack[stackLocation];\r\n                }\r\n            }\r\n            else {\r\n                node = child1;\r\n                if(distance2 < nearestHit) {\r\n                    stack[stackLocation] = child2;\r\n                    stackLocation += 1;\r\n                }\r\n            }\r\n        }\r\n        else{\r\n\r\n            for(var i: u32 = 0; i < primitiveCount; i++) {\r\n                var newRenderState: RenderState;\r\n                var barycentric_coordinates : vec3<f32> = hit_triangle(ray, objects.triangles[u32(triangleLookup.primitiveIndices[i + contents])], 0.001, nearestHit, renderState, &newRenderState);\r\n\r\n                var u: f32 = barycentric_coordinates[0];\r\n                var v: f32 = barycentric_coordinates[1];\r\n                var w: f32 = barycentric_coordinates[2];\r\n\r\n                if(newRenderState.hit){\r\n                    var uv_coords: vec2<f32> = uv_triangle(objects.triangles[u32(triangleLookup.primitiveIndices[i + contents])], u, v, w);\r\n                    var color: vec4<f32> = textureSampleLevel(texture, textureSampler, uv_coords, 0.0);\r\n                    nearestHit = newRenderState.t;\r\n                    renderState = newRenderState;\r\n                    // renderState.color = vec3<f32>(uv_coords.x, uv_coords.y, 0.0);\r\n                    renderState.color = color.xyz;\r\n                }\r\n            }\r\n            if(stackLocation ==0 ) {\r\n                break;\r\n            }\r\n            else {\r\n                stackLocation -= 1;\r\n                node = stack[stackLocation];\r\n            }\r\n        }\r\n    }\r\n\r\n    if(!renderState.hit) {\r\n        // For white sky\r\n        renderState.color = vec3<f32>(1.0, 1.0, 1.0);\r\n        // renderState.color = textureSampleLevel(skyMaterial, skySampler, ray.direction, 0.0).xyz;   \r\n    }\r\n\r\n    return renderState;\r\n}\r\n\r\nfn randomOffset(seed: vec2<f32>) -> vec2<f32> {\r\n    return vec2<f32>(fract(sin(dot(seed, vec2<f32>(12.9898, 78.233))) * 43758.5453));\r\n}\r\n\r\nfn uv_triangle(tri: Triangle, u: f32, v: f32, w: f32) -> vec2<f32> {\r\n    var uv_coord: vec2<f32>;\r\n    uv_coord = u * tri.corner_a_uv + v * tri.corner_b_uv + w * tri.corner_c_uv; \r\n    return uv_coord;\r\n}\r\n\r\nfn hit_triangle(ray: Ray, tri: Triangle, tMin: f32, tMax: f32, oldRenderState: RenderState, newRenderState: ptr<function, RenderState>) -> vec3<f32> {\r\n    \r\n    //Set up a blank renderstate,\r\n    //right now this hasn't hit anything\r\n    newRenderState.color = oldRenderState.color;\r\n    newRenderState.hit = false;\r\n\r\n    //Direction vectors\r\n    let edge_ab: vec3<f32> = tri.corner_b - tri.corner_a;\r\n    let edge_ac: vec3<f32> = tri.corner_c - tri.corner_a;\r\n    //Normal of the triangle\r\n    var n: vec3<f32> = normalize(cross(edge_ab, edge_ac));\r\n    var ray_dot_tri: f32 = dot(ray.direction, n);\r\n    //backface reversal\r\n    if (ray_dot_tri > 0.0) {\r\n        ray_dot_tri = ray_dot_tri * -1;\r\n        n = n * -1;\r\n    }\r\n    //early exit, ray parallel with triangle surface\r\n    if (abs(ray_dot_tri) < 0.00001) {\r\n        return vec3<f32>(0, 0, 0);\r\n    }\r\n\r\n    var system_matrix: mat3x3<f32> = mat3x3<f32>(\r\n        ray.direction,\r\n        tri.corner_a - tri.corner_b,\r\n        tri.corner_a - tri.corner_c\r\n    );\r\n    let denominator: f32 = determinant(system_matrix);\r\n    if (abs(denominator) < 0.00001) {\r\n        return vec3<f32>(0, 0, 0);\r\n    }\r\n\r\n    system_matrix = mat3x3<f32>(\r\n        ray.direction,\r\n        tri.corner_a - ray.origin,\r\n        tri.corner_a - tri.corner_c\r\n    );\r\n    let u: f32 = determinant(system_matrix) / denominator;\r\n    \r\n    if (u < 0 || u > 1) {\r\n        return vec3<f32>(0, 0, 0);\r\n    }\r\n\r\n    system_matrix = mat3x3<f32>(\r\n        ray.direction,\r\n        tri.corner_a - tri.corner_b,\r\n        tri.corner_a - ray.origin,\r\n    );\r\n    let v: f32 = determinant(system_matrix) / denominator;\r\n    if (v < 0.0 || u + v > 1.0) {\r\n        return vec3<f32>(0, 0, 0);\r\n    }\r\n\r\n    system_matrix = mat3x3<f32>(\r\n        tri.corner_a - ray.origin,\r\n        tri.corner_a - tri.corner_b,\r\n        tri.corner_a - tri.corner_c\r\n    );\r\n    let t: f32 = determinant(system_matrix) / denominator;\r\n\r\n    if (t > tMin && t < tMax) {\r\n\r\n        newRenderState.position = ray.origin + t * ray.direction;\r\n        newRenderState.normal = n;\r\n        newRenderState.color = tri.color;\r\n        newRenderState.t = t;\r\n        newRenderState.hit = true;\r\n        return vec3<f32>(u, v, 1-u-v);\r\n    }\r\n\r\n    return vec3<f32>(u, v, 1-u-v);\r\n}\r\n\r\nfn hit_aabb(ray: Ray, node: Node) -> f32 {\r\n    var inverseDir: vec3<f32> = vec3<f32>(1.0) / ray.direction;\r\n    var t1: vec3<f32> = (node.minCorner - ray.origin) * inverseDir;\r\n    var t2: vec3<f32> = (node.maxCorner - ray.origin) * inverseDir;\r\n    var tMin: vec3<f32> = min(t1, t2);\r\n    var tMax: vec3<f32> = max(t1, t2);\r\n\r\n    var t_min: f32 = max(max(tMin.x, tMin.y), tMin.z);\r\n    var t_max: f32 = min(min(tMax.x, tMax.y), tMax.z);\r\n\r\n    if (t_min > t_max || t_max < 0) {\r\n        return 99999;\r\n    }\r\n    else {\r\n        return t_min;\r\n    }\r\n}\r\n\r\n// fn hit_sphere(ray: Ray, sphere: Sphere, tMin: f32, tMax: f32, oldRenderState: RenderState) -> RenderState {\r\n//     let co: vec3<f32> = ray.origin - sphere.center;\r\n//     let a: f32 = dot(ray.direction, ray.direction);\r\n//     let b: f32 = 2.0 * dot(ray.direction, co);\r\n//     let c: f32 = dot(co, co) - sphere.radius * sphere.radius;\r\n//     let discriminant: f32 = b * b - 4.0 * a * c;\r\n\r\n//     renderState.color = oldRenderState.color;\r\n\r\n//     if(discriminant > 0.0) {\r\n\r\n//         let t: f32 = (-b - sqrt(discriminant)) / (2 * a);\r\n\r\n//         if(t > tMin && t < tMax) {\r\n//             renderState.t = t;\r\n//             renderState.position = ray.origin + t * ray.direction;\r\n//             renderState.normal = normalize(renderState.position - sphere.center);\r\n//             renderState.color = sphere.color;\r\n//             renderState.hit = true;\r\n//             return renderState;\r\n//         }\r\n//     }\r\n\r\n//     renderState.hit = false;\r\n//     return renderState;\r\n// }"}),entryPoint:"main"}});const r=this.device.createPipelineLayout({bindGroupLayouts:[this.screen_bind_group_layout]});this.screen_pipeline=this.device.createRenderPipeline({layout:r,vertex:{module:this.device.createShaderModule({code:n}),entryPoint:"vert_main"},fragment:{module:this.device.createShaderModule({code:n}),entryPoint:"frag_main",targets:[{format:"bgra8unorm"}]},primitive:{topology:"triangle-list"}})}async makeBindGroups(){this.ray_tracing_bind_group=this.device.createBindGroup({layout:this.ray_tracing_bind_group_layout,entries:[{binding:0,resource:this.color_buffer_view},{binding:1,resource:{buffer:this.sceneParameters}},{binding:2,resource:{buffer:this.triangleBuffer}},{binding:3,resource:{buffer:this.nodeBuffer}},{binding:4,resource:{buffer:this.triangleIndexBuffer}},{binding:5,resource:this.sky_material.view},{binding:6,resource:this.sky_material.sampler},{binding:7,resource:this.texture_man_head.view},{binding:8,resource:this.texture_man_head.sampler}]}),this.screen_bind_group=this.device.createBindGroup({layout:this.screen_bind_group_layout,entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.color_buffer_view}]})}prepareScene(){const e={cameraPos:this.scene.camera.position,cameraForward:this.scene.camera.forwards,cameraRight:this.scene.camera.right,cameraUp:this.scene.camera.up,triangleCount:this.scene.triangles.length};this.device.queue.writeBuffer(this.sceneParameters,0,new Float32Array([e.cameraPos[0],e.cameraPos[1],e.cameraPos[2],1,e.cameraForward[0],e.cameraForward[1],e.cameraForward[2],1,e.cameraRight[0],e.cameraRight[1],e.cameraRight[2],4,e.cameraUp[0],e.cameraUp[1],e.cameraUp[2],e.triangleCount]),0,16);const r=new Float32Array(24*this.scene.triangleCount);for(let e=0;e<this.scene.triangleCount;e++){for(var t=0;t<3;t++){for(var n=0;n<3;n++)r[24*e+4*t+n]=this.scene.triangles[e].corners[t][n];r[24*e+4*t+3]=0}for(var i=0;i<3;i++)r[24*e+12+i]=this.scene.triangles[e].color[i];r[24*e+15]=0,r[24*e+16]=this.scene.triangles[e].uv[0][0],r[24*e+17]=this.scene.triangles[e].uv[0][1],r[24*e+18]=this.scene.triangles[e].uv[1][0],r[24*e+19]=this.scene.triangles[e].uv[1][1],r[24*e+20]=this.scene.triangles[e].uv[2][0],r[24*e+21]=this.scene.triangles[e].uv[2][1],r[24*e+22]=0,r[24*e+23]=0}this.device.queue.writeBuffer(this.triangleBuffer,0,r,0,24*this.scene.triangleCount);const a=new Float32Array(8*this.scene.nodesUsed);for(let e=0;e<this.scene.nodesUsed;e++)a[8*e+0]=this.scene.nodes[e].minCorner[0],a[8*e+1]=this.scene.nodes[e].minCorner[1],a[8*e+2]=this.scene.nodes[e].minCorner[2],a[8*e+3]=this.scene.nodes[e].leftChild,a[8*e+4]=this.scene.nodes[e].maxCorner[0],a[8*e+5]=this.scene.nodes[e].maxCorner[1],a[8*e+6]=this.scene.nodes[e].maxCorner[2],a[8*e+7]=this.scene.nodes[e].primitiveCount;this.device.queue.writeBuffer(this.nodeBuffer,0,a,0,8*this.scene.nodesUsed);const s=new Float32Array(this.scene.triangleCount);for(let e=0;e<this.scene.triangleCount;e++)s[e]=this.scene.triangleIndices[e];this.device.queue.writeBuffer(this.triangleIndexBuffer,0,s,0,this.scene.triangleCount)}}},410:(e,r,t)=>{t.d(r,{Z:()=>l});var n,i="undefined"!=typeof Float32Array?Float32Array:Array;function a(e,r,t){return e[0]=Math.min(r[0],t[0]),e[1]=Math.min(r[1],t[1]),e[2]=Math.min(r[2],t[2]),e}function s(e,r,t){return e[0]=Math.max(r[0],t[0]),e[1]=Math.max(r[1],t[1]),e[2]=Math.max(r[2],t[2]),e}function o(e,r,t){var n=r[0],i=r[1],a=r[2],s=t[0],o=t[1],c=t[2];return e[0]=i*c-a*o,e[1]=a*s-n*c,e[2]=n*o-i*s,e}Math.random,Math.PI,Math.hypot||(Math.hypot=function(){for(var e=0,r=arguments.length;r--;)e+=arguments[r]*arguments[r];return Math.sqrt(e)}),n=new i(3),i!=Float32Array&&(n[0]=0,n[1]=0,n[2]=0);class c{constructor(e){this.position=new Float32Array(e),this.theta=0,this.phi=0,this.recalculate_vectors()}recalculate_vectors(){this.forwards=new Float32Array([Math.cos(180*this.theta/Math.PI)*Math.cos(180*this.phi/Math.PI),Math.sin(180*this.theta/Math.PI)*Math.cos(180*this.phi/Math.PI),Math.sin(180*this.phi/Math.PI)]),this.right=new Float32Array([0,0,0]),o(this.right,this.forwards,[0,0,1]),this.up=new Float32Array([0,0,0]),o(this.up,this.right,this.forwards)}}class d{}class u{constructor(){this.corners=[],this.uv=[]}build_from_center_and_offsets(e,r,t){this.centroid=[0,0,0];const n=[.33333,.33333,.33333];r.forEach((r=>{var t=[e[0],e[1],e[2]];this.corners.push([t[0]+r[0],t[1]+r[1],t[2]+r[2]]);var i=[t[0],t[1],t[2]];(function(e,r,t){e[0]=r[0]*t[0],e[1]=r[1]*t[1],e[2]=r[2]*t[2]})(i,i,n),function(e,r,t){e[0]=r[0]+t[0],e[1]=r[1]+t[1],e[2]=r[2]+t[2]}(this.centroid,this.centroid,i)})),this.color=t}make_centroid(){this.centroid=[(this.corners[0][0]+this.corners[1][0]+this.corners[2][0])/3,(this.corners[0][1]+this.corners[1][1]+this.corners[2][1])/3,(this.corners[0][2]+this.corners[1][2]+this.corners[2][2])/3]}}class h{constructor(){this.v=[],this.vt=[],this.vn=[],this.triangles=[]}async initialize(e,r){this.color=e,await this.readFile(r)}async readFile(e){var r=[];const t=await fetch(e),n=await t.blob();(await n.text()).split("\n").forEach((e=>{"v"==e[0]&&" "==e[1]?this.read_vertex_data(e):"v"==e[0]&&"t"==e[1]?this.read_texcoord_data(e):"v"==e[0]&&"n"==e[1]?this.read_normal_data(e):"f"==e[0]&&this.read_face_data(e,r)}))}read_vertex_data(e){const r=e.split(" "),t=[Number(r[1]).valueOf(),Number(r[2]).valueOf(),Number(r[3]).valueOf()];this.v.push(t)}read_texcoord_data(e){const r=e.split(" "),t=[Number(r[1]).valueOf(),Number(r[2]).valueOf()];this.vt.push(t)}read_normal_data(e){const r=e.split(" "),t=[Number(r[1]).valueOf(),Number(r[2]).valueOf(),Number(r[3]).valueOf()];this.vn.push(t)}read_face_data(e,r){const t=(e=e.replace("\n","")).split(" "),n=t.length-3;for(var i=0;i<n;i++){var a=new u;a.corners.push(this.read_corner_vertex(t[1],r)),a.uv.push(this.read_corner_tex_coord(t[1],r)),a.corners.push(this.read_corner_vertex(t[2+i],r)),a.uv.push(this.read_corner_tex_coord(t[1],r)),a.corners.push(this.read_corner_vertex(t[3+i],r)),a.uv.push(this.read_corner_tex_coord(t[1],r)),a.color=this.color,a.make_centroid(),this.triangles.push(a)}}read_corner_vertex(e,r){const t=e.split("/");return this.v[Number(t[0]).valueOf()-1]}read_corner_tex_coord(e,r){const t=e.split("/");return this.vt[Number(t[1]).valueOf()-1]}read_corner_normal(e,r){const t=e.split("/");return this.vn[Number(t[2]).valueOf()-1]}}class l{constructor(e){this.nodesUsed=0,this.mesh=new h,this.camera=new c([-2.5,0,0])}async make_scene(){await this.mesh.initialize([1,1,1],"dist/models/man_head_2.obj"),this.triangles=[],this.mesh.triangles.forEach((e=>{this.triangles.push(e)})),this.triangleCount=this.triangles.length,await this.buildBVH()}async buildBVH(){this.triangleIndices=new Array(this.triangles.length);for(var e=0;e<this.triangles.length;e++)this.triangleIndices[e]=e;for(this.nodes=new Array(2*this.triangles.length-1),e=0;e<2*this.triangles.length-1;e++)this.nodes[e]=new d;var r=this.nodes[0];r.leftChild=0,r.primitiveCount=this.triangles.length,this.nodesUsed+=1,this.updateBounds(0),this.subdivide(0)}updateBounds(e){var r=this.nodes[e];r.minCorner=[99999,99999,99999],r.maxCorner=[-99999,-99999,-99999];for(var t=0;t<r.primitiveCount;t++)this.triangles[this.triangleIndices[r.leftChild+t]].corners.forEach((e=>{a(r.minCorner,r.minCorner,e),s(r.maxCorner,r.maxCorner,e)}))}subdivide(e){var r=this.nodes[e];if(r.primitiveCount<=4)return;var t=[0,0,0];!function(e,r,t){e[0]=r[0]-t[0],e[1]=r[1]-t[1],e[2]=r[2]-t[2]}(t,r.maxCorner,r.minCorner);var n=0;t[1]>t[n]&&(n=1),t[2]>t[n]&&(n=2);const i=r.minCorner[n]+t[n]/2;for(var a=r.leftChild,s=a+r.primitiveCount-1;a<=s;)if(this.triangles[this.triangleIndices[a]].centroid[n]<i)a+=1;else{var o=this.triangleIndices[a];this.triangleIndices[a]=this.triangleIndices[s],this.triangleIndices[s]=o,s-=1}var c=a-r.leftChild;if(0==c||c==r.primitiveCount)return;const d=this.nodesUsed;this.nodesUsed+=1;const u=this.nodesUsed;this.nodesUsed+=1,this.nodes[d].leftChild=r.leftChild,this.nodes[d].primitiveCount=c,this.nodes[u].leftChild=a,this.nodes[u].primitiveCount=r.primitiveCount-c,r.leftChild=d,r.primitiveCount=0,this.updateBounds(d),this.updateBounds(u),this.subdivide(d),this.subdivide(u)}}}},a={};function s(e){var r=a[e];if(void 0!==r)return r.exports;var t=a[e]={exports:{}};return i[e](t,t.exports,s),t.exports}e="function"==typeof Symbol?Symbol("webpack queues"):"__webpack_queues__",r="function"==typeof Symbol?Symbol("webpack exports"):"__webpack_exports__",t="function"==typeof Symbol?Symbol("webpack error"):"__webpack_error__",n=e=>{e&&e.d<1&&(e.d=1,e.forEach((e=>e.r--)),e.forEach((e=>e.r--?e.r++:e())))},s.a=(i,a,s)=>{var o;s&&((o=[]).d=-1);var c,d,u,h=new Set,l=i.exports,f=new Promise(((e,r)=>{u=r,d=e}));f[r]=l,f[e]=e=>(o&&e(o),h.forEach(e),f.catch((e=>{}))),i.exports=f,a((i=>{var a;c=(i=>i.map((i=>{if(null!==i&&"object"==typeof i){if(i[e])return i;if(i.then){var a=[];a.d=0,i.then((e=>{s[r]=e,n(a)}),(e=>{s[t]=e,n(a)}));var s={};return s[e]=e=>e(a),s}}var o={};return o[e]=e=>{},o[r]=i,o})))(i);var s=()=>c.map((e=>{if(e[t])throw e[t];return e[r]})),d=new Promise((r=>{(a=()=>r(s)).r=0;var t=e=>e!==o&&!h.has(e)&&(h.add(e),e&&!e.d&&(a.r++,e.push(a)));c.map((r=>r[e](t)))}));return a.r?d:s()}),(e=>(e?u(f[t]=e):d(l),n(o)))),o&&o.d<0&&(o.d=0)},s.d=(e,r)=>{for(var t in r)s.o(r,t)&&!s.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:r[t]})},s.o=(e,r)=>Object.prototype.hasOwnProperty.call(e,r),s(927)})();