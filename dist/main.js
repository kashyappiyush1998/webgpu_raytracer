(()=>{"use strict";class e{constructor(e,r,n){this.center=new Float32Array(e),this.color=new Float32Array(n),this.radius=r}}var r,n="undefined"!=typeof Float32Array?Float32Array:Array;function t(e,r,n){return e[0]=r[0]+n[0],e[1]=r[1]+n[1],e[2]=r[2]+n[2],e}function i(e,r,n){return e[0]=r[0]-n[0],e[1]=r[1]-n[1],e[2]=r[2]-n[2],e}function s(e,r,n){return e[0]=Math.min(r[0],n[0]),e[1]=Math.min(r[1],n[1]),e[2]=Math.min(r[2],n[2]),e}function a(e,r,n){var t=r[0],i=r[1],s=r[2],a=n[0],o=n[1],c=n[2];return e[0]=i*c-s*o,e[1]=s*a-t*c,e[2]=t*o-i*a,e}Math.random,Math.PI,Math.hypot||(Math.hypot=function(){for(var e=0,r=arguments.length;r--;)e+=arguments[r]*arguments[r];return Math.sqrt(e)}),r=new n(3),n!=Float32Array&&(r[0]=0,r[1]=0,r[2]=0);class o{constructor(e){this.position=new Float32Array(e),this.theta=0,this.phi=0,this.recalculate_vectors()}recalculate_vectors(){this.forwards=new Float32Array([Math.cos(180*this.theta/Math.PI)*Math.cos(180*this.phi/Math.PI),Math.sin(180*this.theta/Math.PI)*Math.cos(180*this.phi/Math.PI),Math.sin(180*this.phi/Math.PI)]),this.right=new Float32Array([0,0,0]),a(this.right,this.forwards,[0,0,1]),this.up=new Float32Array([0,0,0]),a(this.up,this.right,this.forwards)}}class c{}const h="@group(0) @binding(0) var screen_sampler : sampler;\r\n@group(0) @binding(1) var color_buffer : texture_2d<f32>;\r\n\r\nstruct VertexOutput {\r\n    @builtin(position) Position : vec4<f32>,\r\n    @location(0) TexCoord : vec2<f32>,\r\n}\r\n\r\n@vertex\r\nfn vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {\r\n\r\n    var positions = array<vec2<f32>, 6>(\r\n        vec2<f32>( 1.0,  1.0),\r\n        vec2<f32>( 1.0, -1.0),\r\n        vec2<f32>(-1.0, -1.0),\r\n        vec2<f32>( 1.0,  1.0),\r\n        vec2<f32>(-1.0, -1.0),\r\n        vec2<f32>(-1.0,  1.0)\r\n    );\r\n\r\n    var texCoords = array<vec2<f32>, 6>(\r\n        vec2<f32>(1.0, 0.0),\r\n        vec2<f32>(1.0, 1.0),\r\n        vec2<f32>(0.0, 1.0),\r\n        vec2<f32>(1.0, 0.0),\r\n        vec2<f32>(0.0, 1.0),\r\n        vec2<f32>(0.0, 0.0)\r\n    );\r\n\r\n    var output : VertexOutput;\r\n    output.Position = vec4<f32>(positions[VertexIndex], 0.0, 1.0);\r\n    output.TexCoord = texCoords[VertexIndex];\r\n    return output;\r\n}\r\n\r\n@fragment\r\nfn frag_main(@location(0) TexCoord : vec2<f32>) -> @location(0) vec4<f32> {\r\n  return textureSample(color_buffer, screen_sampler, TexCoord);\r\n}";var d=function(e,r,n,t){return new(n||(n=Promise))((function(i,s){function a(e){try{c(t.next(e))}catch(e){s(e)}}function o(e){try{c(t.throw(e))}catch(e){s(e)}}function c(e){var r;e.done?i(e.value):(r=e.value,r instanceof n?r:new n((function(e){e(r)}))).then(a,o)}c((t=t.apply(e,r||[])).next())}))};class u{initialize(e,r){return d(this,void 0,void 0,(function*(){for(var n=new Array(6),t=0;t<6;t++){const e=yield fetch(r[t]),i=yield e.blob();n[t]=yield createImageBitmap(i)}yield this.loadImageBitmaps(e,n),this.view=this.texture.createView({format:"rgba8unorm",dimension:"cube",aspect:"all",baseMipLevel:0,mipLevelCount:1,baseArrayLayer:0,arrayLayerCount:6}),this.sampler=e.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"nearest",mipmapFilter:"nearest",maxAnisotropy:1})}))}loadImageBitmaps(e,r){return d(this,void 0,void 0,(function*(){const n={dimension:"2d",size:{width:r[0].width,height:r[0].height,depthOrArrayLayers:6},format:"rgba8unorm",usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT};this.texture=e.createTexture(n);for(var t=0;t<6;t++)e.queue.copyExternalImageToTexture({source:r[t]},{texture:this.texture,origin:[0,0,t]},[r[t].width,r[t].height])}))}}var f=function(e,r,n,t){return new(n||(n=Promise))((function(i,s){function a(e){try{c(t.next(e))}catch(e){s(e)}}function o(e){try{c(t.throw(e))}catch(e){s(e)}}function c(e){var r;e.done?i(e.value):(r=e.value,r instanceof n?r:new n((function(e){e(r)}))).then(a,o)}c((t=t.apply(e,r||[])).next())}))};const l=document.getElementById("gfx-main"),p=document.getElementById("change-every-frame"),v=document.getElementById("change-every-second"),m=new class{constructor(){this.nodesUsed=0,this.spheres=new Array(1024);for(let r=0;r<this.spheres.length;r++){const n=[100*Math.random()-50,100*Math.random()-50,100*Math.random()-50],t=.1+1.9*Math.random(),i=[.3+.7*Math.random(),.3+.7*Math.random(),.3+.7*Math.random()];this.spheres[r]=new e(n,t,i)}this.sphereCount=this.spheres.length,this.camera=new o([-20,0,0]),this.sphereIndices=new Array(this.sphereCount);for(var r=0;r<this.sphereCount;r++)this.sphereIndices[r]=r;for(this.nodes=new Array(2*this.sphereCount-1),r=0;r<2*this.sphereCount-1;r++)this.nodes[r]=new c;var n=this.nodes[0];n.leftChild=0,n.sphereCount=this.sphereCount,this.nodesUsed+=1,this.updateBounds(0),this.subdivide(0)}updateBounds(e){var r=this.nodes[e];r.minCorner=[99999,99999,99999],r.maxCorner=[-99999,-99999,-99999];for(var n=0;n<r.sphereCount;n++){const e=this.spheres[this.sphereIndices[r.leftChild+n]],o=[e.radius,e.radius,e.radius];var a=[0,0,0];i(a,e.center,o),s(r.minCorner,r.minCorner,a),t(a,e.center,o),s(r.maxCorner,r.maxCorner,a)}}subdivide(e){var r=this.nodes[e];if(r.sphereCount<=4)return;var n=[0,0,0];i(n,r.maxCorner,r.minCorner);var t=0;n[1]>n[t]&&(t=1),n[2]>n[t]&&(t=2);const s=r.minCorner[t]+n[t]/2;for(var a=r.leftChild,o=a+r.sphereCount-1;a<=o;)if(this.spheres[this.sphereIndices[a]].center[t]<s)a+=1;else{var c=this.sphereIndices[a];this.sphereIndices[a]=this.sphereIndices[o],this.sphereIndices[o]=c,o-=1}var h=a-r.leftChild;if(0==h||h==r.sphereCount)return;const d=this.nodesUsed;this.nodesUsed+=1;const u=this.nodesUsed;this.nodesUsed+=1,this.nodes[d].leftChild=r.leftChild,this.nodes[d].sphereCount=h,this.nodes[u].leftChild=a,this.nodes[u].sphereCount=r.sphereCount-h,r.leftChild=d,r.sphereCount=0,this.updateBounds(d),this.updateBounds(u),this.subdivide(d),this.subdivide(u)}},g=new class{constructor(e,r,n,t){this.render=()=>{this.prepareScene();const e=performance.now(),r=this.device.createCommandEncoder(),n=r.beginComputePass();n.setPipeline(this.ray_tracing_pipeline),n.setBindGroup(0,this.ray_tracing_bind_group),n.dispatchWorkgroups(Math.floor((this.canvas.width+7)/8),Math.floor((this.canvas.height+7)/8),1),n.end();const t=this.context.getCurrentTexture().createView(),i=r.beginRenderPass({colorAttachments:[{view:t,clearValue:{r:.5,g:0,b:.25,a:1},loadOp:"clear",storeOp:"store"}]});i.setPipeline(this.screen_pipeline),i.setBindGroup(0,this.screen_bind_group),i.draw(6,1,0,0),i.end(),this.device.queue.submit([r.finish()]),this.device.queue.onSubmittedWorkDone().then((()=>{this.change_every_frame.innerHTML="Sphere count: "+this.scene.spheres.length.toFixed(0),this.change_every_frame.innerHTML+="<br />RenderTime: "+(performance.now()-e).toFixed(5)+" ms"})),requestAnimationFrame(this.render),performance.now(),performance.now()-this.passedTime>1e3&&(this.change_every_second.innerHTML="<br />FPS: "+(1e3*this.count/(performance.now()-this.passedTime)).toFixed(1),this.passedTime=performance.now(),this.count=0),this.count+=1},this.canvas=e,this.change_every_frame=r,this.change_every_second=n,this.count=0,this.passedTime=0,this.scene=t}Initialize(){return f(this,void 0,void 0,(function*(){yield this.setupDevice(),yield this.makeBindGroupLayouts(),yield this.createAssets(),yield this.makeBindGroups(),yield this.makePipeline(),this.render()}))}setupDevice(){return f(this,void 0,void 0,(function*(){var e,r;this.adapter=yield null===(e=navigator.gpu)||void 0===e?void 0:e.requestAdapter(),this.device=yield null===(r=this.adapter)||void 0===r?void 0:r.requestDevice(),this.context=this.canvas.getContext("webgpu"),this.format="bgra8unorm",this.context.configure({device:this.device,format:this.format,alphaMode:"opaque"})}))}makeBindGroupLayouts(){return f(this,void 0,void 0,(function*(){this.ray_tracing_bind_group_layout=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.COMPUTE,storageTexture:{access:"write-only",format:"rgba8unorm",viewDimension:"2d"}},{binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:"uniform"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage",hasDynamicOffset:!1}},{binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage",hasDynamicOffset:!1}},{binding:4,visibility:GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage",hasDynamicOffset:!1}},{binding:5,visibility:GPUShaderStage.COMPUTE,texture:{viewDimension:"cube"}},{binding:6,visibility:GPUShaderStage.COMPUTE,sampler:{}}]}),this.screen_bind_group_layout=this.device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,sampler:{}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{}}]})}))}createAssets(){return f(this,void 0,void 0,(function*(){this.color_buffer=this.device.createTexture({size:{width:this.canvas.width,height:this.canvas.height},format:"rgba8unorm",usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.STORAGE_BINDING|GPUTextureUsage.TEXTURE_BINDING}),this.color_buffer_view=this.color_buffer.createView(),this.sampler=this.device.createSampler({addressModeU:"repeat",addressModeV:"repeat",magFilter:"linear",minFilter:"nearest",mipmapFilter:"nearest",maxAnisotropy:1});const e={size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST};this.sceneParameters=this.device.createBuffer(e);const r={size:32*this.scene.spheres.length,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST};this.sphereBuffer=this.device.createBuffer(r);const n={size:32*this.scene.nodesUsed,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST};this.nodeBuffer=this.device.createBuffer(n);const t={size:4*this.scene.sphereCount,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST};this.sphereIndexBuffer=this.device.createBuffer(t),this.sky_material=new u,yield this.sky_material.initialize(this.device,["dist/img/sky_back.png","dist/img/sky_front.png","dist/img/sky_left.png","dist/img/sky_right.png","dist/img/sky_top.png","dist/img/sky_bottom.png"])}))}makePipeline(){return f(this,void 0,void 0,(function*(){const e=this.device.createPipelineLayout({bindGroupLayouts:[this.ray_tracing_bind_group_layout]});this.ray_tracing_pipeline=this.device.createComputePipeline({layout:e,compute:{module:this.device.createShaderModule({code:"struct Sphere {\r\n    center: vec3<f32>,\r\n    color: vec3<f32>,\r\n    radius: f32,\r\n}\r\n\r\nstruct ObjectData {\r\n    spheres: array<Sphere>,\r\n}\r\n\r\nstruct Node {\r\n    minCorner: vec3<f32>,\r\n    leftChild: f32,\r\n    maxCorner: vec3<f32>,\r\n    sphereCount: f32,\r\n}\r\n\r\nstruct BVH {\r\n    nodes: array<Node>,\r\n}\r\n\r\nstruct ObjectIndices {\r\n    sphereIndices: array<f32>,\r\n}\r\n\r\nstruct Ray {\r\n    direction: vec3<f32>,\r\n    origin: vec3<f32>,\r\n}\r\n\r\nstruct SceneData {\r\n    cameraPos : vec3<f32>,\r\n    cameraForwards : vec3<f32>,\r\n    cameraRight : vec3<f32>,\r\n    maxBounces: f32,\r\n    cameraUp : vec3<f32>,\r\n    sphereCount : f32,\r\n}\r\n\r\nstruct RenderState {\r\n    t: f32,\r\n    color: vec3<f32>,\r\n    hit: bool,\r\n    position: vec3<f32>,\r\n    normal: vec3<f32>,\r\n}\r\n\r\n@group(0) @binding(0) var color_buffer: texture_storage_2d<rgba8unorm, write>;\r\n@group(0) @binding(1) var<uniform> scene: SceneData;\r\n@group(0) @binding(2) var<storage, read> objects: ObjectData;\r\n@group(0) @binding(3) var<storage, read> tree: BVH;\r\n@group(0) @binding(4) var<storage, read> sphereLookup: ObjectIndices;\r\n@group(0) @binding(5) var skyMaterial: texture_cube<f32>;\r\n@group(0) @binding(6) var skySampler: sampler;\r\n\r\n@compute @workgroup_size(8,8,1)\r\nfn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {\r\n\r\n    let screen_size: vec2<i32> = vec2<i32>(textureDimensions(color_buffer));\r\n    let screen_pos : vec2<i32> = vec2<i32>(i32(GlobalInvocationID.x), i32(GlobalInvocationID.y));\r\n\r\n    if (screen_pos.x >= screen_size.x || screen_pos.y >= screen_size.y) {\r\n        return;\r\n    }\r\n\r\n    let horizontal_coefficient: f32 = (f32(screen_pos.x) - f32(screen_size.x) / 2) / f32(screen_size.x);\r\n    let vertical_coefficient: f32 = (f32(screen_pos.y) - f32(screen_size.y) / 2) / f32(screen_size.x);\r\n    let forwards: vec3<f32> = scene.cameraForwards;\r\n    let right: vec3<f32> = scene.cameraRight;\r\n    let up: vec3<f32> = scene.cameraUp;\r\n\r\n    var myRay: Ray;\r\n    myRay.direction = normalize(forwards + horizontal_coefficient * right + vertical_coefficient * up);\r\n    myRay.origin = scene.cameraPos;\r\n\r\n    var pixel_color : vec3<f32> = rayColor(myRay);\r\n\r\n    textureStore(color_buffer, screen_pos, vec4<f32>(pixel_color, 1.0));\r\n}\r\n\r\nfn rayColor(ray: Ray) -> vec3<f32> {\r\n\r\n    var color: vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);\r\n    var result: RenderState;\r\n\r\n    var temp_ray: Ray;\r\n    temp_ray.origin = ray.origin;\r\n    temp_ray.direction = ray.direction;\r\n\r\n    let bounces: u32 = u32(scene.maxBounces);\r\n\r\n    for(var bounce: u32 = 0; bounce < bounces; bounce++) {\r\n        result = trace(temp_ray);\r\n        color = color * result.color;\r\n\r\n        if(!result.hit){\r\n            break;\r\n        }\r\n\r\n        temp_ray.origin = result.position;\r\n        temp_ray.direction = normalize(reflect(temp_ray.direction, result.normal));\r\n    }\r\n\r\n    if(result.hit) {\r\n        color = vec3<f32>(0.0, 0.0, 0.0);\r\n    }\r\n\r\n    return color;\r\n}\r\n\r\nfn trace(ray: Ray) -> RenderState {\r\n\r\n    var renderState: RenderState;\r\n    renderState.hit = false;\r\n    var nearestHit: f32 = 9999;\r\n\r\n\r\n    var node: Node = tree.nodes[0];\r\n    var stack: array<Node, 15>;\r\n    var stackLocation: u32 = 0;\r\n\r\n    while(true) {\r\n\r\n        var sphereCount: u32 = u32(node.sphereCount);\r\n        var contents: u32 = u32(node.leftChild);\r\n\r\n        if(sphereCount == 0){\r\n\r\n            var child1: Node = tree.nodes[contents];\r\n            var child2: Node = tree.nodes[contents + 1];\r\n\r\n            var distance1: f32 = hit_aabb(ray, child1);\r\n            var distance2: f32 = hit_aabb(ray, child2);\r\n\r\n            if(distance1 > distance2) {\r\n                var tempDist: f32 = distance1;\r\n                distance1 = distance2;\r\n                distance2 = tempDist;\r\n\r\n                var tempChild: Node = child1;\r\n                child1 = child2;\r\n                child2 = tempChild;\r\n            }\r\n\r\n            if(distance1 > nearestHit){\r\n                if(stackLocation == 0) {\r\n                    break;\r\n                }\r\n                else {\r\n                    stackLocation -= 1;\r\n                    node = stack[stackLocation];\r\n                }\r\n            }\r\n            else {\r\n                node = child1;\r\n                if(distance2 < nearestHit) {\r\n                    stack[stackLocation] = child2;\r\n                    stackLocation += 1;\r\n                }\r\n            }\r\n        }\r\n        else{\r\n\r\n            for(var i: u32 = 0; i < sphereCount; i++) {\r\n                var newRenderState : RenderState = hit_sphere(ray, objects.spheres[u32(sphereLookup.sphereIndices[i + contents])], 0.001, nearestHit, renderState);\r\n\r\n                if(newRenderState.hit){\r\n                    nearestHit = newRenderState.t;\r\n                    renderState = newRenderState;\r\n                }\r\n            }\r\n            if(stackLocation ==0 ) {\r\n                break;\r\n            }\r\n            else {\r\n                stackLocation -= 1;\r\n                node = stack[stackLocation];\r\n            }\r\n        }\r\n    }\r\n\r\n    if(!renderState.hit) {\r\n        // For white sky\r\n        // renderState.color = vec3<f32>(1.0, 1.0, 1.0);\r\n        renderState.color = textureSampleLevel(skyMaterial, skySampler, ray.direction, 0.0).xyz;   \r\n    }\r\n\r\n    return renderState;\r\n}\r\n\r\nfn hit_sphere(ray: Ray, sphere: Sphere, tMin: f32, tMax: f32, oldRenderState: RenderState) -> RenderState {\r\n    let co: vec3<f32> = ray.origin - sphere.center;\r\n    let a: f32 = dot(ray.direction, ray.direction);\r\n    let b: f32 = 2.0 * dot(ray.direction, co);\r\n    let c: f32 = dot(co, co) - sphere.radius * sphere.radius;\r\n    let discriminant: f32 = b * b - 4.0 * a * c;\r\n\r\n    var renderState: RenderState;\r\n    renderState.color = oldRenderState.color;\r\n\r\n    if(discriminant > 0.0) {\r\n\r\n        let t: f32 = (-b - sqrt(discriminant)) / (2 * a);\r\n\r\n        if(t > tMin && t < tMax) {\r\n            renderState.t = t;\r\n            renderState.position = ray.origin + t * ray.direction;\r\n            renderState.normal = normalize(renderState.position - sphere.center);\r\n            renderState.color = sphere.color;\r\n            renderState.hit = true;\r\n            return renderState;\r\n        }\r\n    }\r\n\r\n    renderState.hit = false;\r\n    return renderState;\r\n}\r\n\r\nfn hit_aabb(ray: Ray, node: Node) -> f32 {\r\n    var inverseDir: vec3<f32> = vec3<f32>(1.0) / ray.direction;\r\n    var t1: vec3<f32> = (node.minCorner - ray.origin) * inverseDir;\r\n    var t2: vec3<f32> = (node.maxCorner - ray.origin) * inverseDir;\r\n    var tMin: vec3<f32> = min(t1, t2);\r\n    var tMax: vec3<f32> = max(t1, t2);\r\n\r\n    var t_min: f32 = max(max(tMin.x, tMin.y), tMin.z);\r\n    var t_max: f32 = min(min(tMax.x, tMax.y), tMax.z);\r\n\r\n    if (t_min > t_max || t_max < 0) {\r\n        return 99999;\r\n    }\r\n    else {\r\n        return t_min;\r\n    }\r\n}"}),entryPoint:"main"}});const r=this.device.createPipelineLayout({bindGroupLayouts:[this.screen_bind_group_layout]});this.screen_pipeline=this.device.createRenderPipeline({layout:r,vertex:{module:this.device.createShaderModule({code:h}),entryPoint:"vert_main"},fragment:{module:this.device.createShaderModule({code:h}),entryPoint:"frag_main",targets:[{format:"bgra8unorm"}]},primitive:{topology:"triangle-list"}})}))}makeBindGroups(){return f(this,void 0,void 0,(function*(){this.ray_tracing_bind_group=this.device.createBindGroup({layout:this.ray_tracing_bind_group_layout,entries:[{binding:0,resource:this.color_buffer_view},{binding:1,resource:{buffer:this.sceneParameters}},{binding:2,resource:{buffer:this.sphereBuffer}},{binding:3,resource:{buffer:this.nodeBuffer}},{binding:4,resource:{buffer:this.sphereIndexBuffer}},{binding:5,resource:this.sky_material.view},{binding:6,resource:this.sky_material.sampler}]}),this.screen_bind_group=this.device.createBindGroup({layout:this.screen_bind_group_layout,entries:[{binding:0,resource:this.sampler},{binding:1,resource:this.color_buffer_view}]})}))}prepareScene(){const e={cameraPos:this.scene.camera.position,cameraForward:this.scene.camera.forwards,cameraRight:this.scene.camera.right,cameraUp:this.scene.camera.up,sphereCount:this.scene.spheres.length};this.device.queue.writeBuffer(this.sceneParameters,0,new Float32Array([e.cameraPos[0],e.cameraPos[1],e.cameraPos[2],1,e.cameraForward[0],e.cameraForward[1],e.cameraForward[2],1,e.cameraRight[0],e.cameraRight[1],e.cameraRight[2],4,e.cameraUp[0],e.cameraUp[1],e.cameraUp[2],e.sphereCount]),0,16);const r=new Float32Array(8*this.scene.spheres.length);for(let e=0;e<this.scene.spheres.length;e++)r[8*e+0]=this.scene.spheres[e].center[0],r[8*e+1]=this.scene.spheres[e].center[1],r[8*e+2]=this.scene.spheres[e].center[2],r[8*e+3]=0,r[8*e+4]=this.scene.spheres[e].color[0],r[8*e+5]=this.scene.spheres[e].color[1],r[8*e+6]=this.scene.spheres[e].color[2],r[8*e+7]=this.scene.spheres[e].radius;this.device.queue.writeBuffer(this.sphereBuffer,0,r,0,8*this.scene.spheres.length);const n=new Float32Array(8*this.scene.nodesUsed);for(let e=0;e<this.scene.nodesUsed;e++)n[8*e+0]=this.scene.nodes[e].minCorner[0],n[8*e+1]=this.scene.nodes[e].minCorner[1],n[8*e+2]=this.scene.nodes[e].minCorner[2],n[8*e+3]=this.scene.nodes[e].leftChild,n[8*e+4]=this.scene.nodes[e].maxCorner[0],n[8*e+5]=this.scene.nodes[e].maxCorner[1],n[8*e+6]=this.scene.nodes[e].maxCorner[2],n[8*e+7]=this.scene.nodes[e].sphereCount;this.device.queue.writeBuffer(this.nodeBuffer,0,n,0,8*this.scene.nodesUsed);const t=new Float32Array(this.scene.sphereCount);for(let e=0;e<this.scene.sphereCount;e++)t[e]=this.scene.sphereIndices[e];this.device.queue.writeBuffer(this.sphereIndexBuffer,0,t,0,this.scene.sphereCount)}}(l,p,v,m);g.Initialize()})();