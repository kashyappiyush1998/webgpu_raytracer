import raytracer_kernel from "./shaders/raytracer_kernel.wgsl"
import screen_shader from "./shaders/screen_shader.wgsl"
import { Scene } from "./scene";
import { node } from "webpack";
import { CubeMapMaterial } from "./cube_material";
import { Texture2D } from "./texture";
import $ from "jquery";
import { Canvas, FabricImage } from "fabric/*";

export class Renderer {

    canvas: HTMLCanvasElement;
    scene: Scene;
    inputObj: File;
    inputTexture: Texture2D;
    change_every_frame: HTMLPreElement;
    change_every_second: HTMLPreElement;
    passedTime: number;
    count: number;

    // Device/Context objects
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format : GPUTextureFormat;

    //Assets
    color_buffer: GPUTexture;
    color_buffer_view: GPUTextureView;
    sampler: GPUSampler;
    sceneParameters: GPUBuffer;
    lightParameters: GPUBuffer;
    triangleBuffer: GPUBuffer;
    nodeBuffer: GPUBuffer;
    triangleIndexBuffer: GPUBuffer;
    sky_material: CubeMapMaterial;
    // texture_man_head: Texture2D;

    // Pipeline objects
    ray_tracing_pipeline: GPUComputePipeline;
    ray_tracing_bind_group: GPUBindGroup;
    ray_tracing_bind_group_layout: GPUBindGroupLayout;
    screen_pipeline: GPURenderPipeline;
    screen_bind_group: GPUBindGroup;
    screen_bind_group_layout: GPUBindGroupLayout;    

    forwards_amount: number;
    right_amount: number;
    up_amount: number;
    light_angle: number;


    constructor(canvas: HTMLCanvasElement, scene: Scene, inputElement: HTMLInputElement, change_every_frame: HTMLPreElement, change_every_second: HTMLPreElement){
        this.canvas = canvas;
        this.change_every_frame = change_every_frame;
        this.change_every_second = change_every_second;
        this.count = 0;
        this.passedTime = 0;
        this.scene = scene;

        this.forwards_amount = 0;
        this.right_amount = 0;
        this.up_amount = 0;
        this.light_angle = 0;

        this.setupDownloadButton()
        this.inputTexture = new Texture2D();

        inputElement.addEventListener("change", async (ev) =>{
            var inputFiles = (<HTMLInputElement>ev.target).files;
            if(inputFiles!=null){
                for(var inputFileIndex = 0; inputFileIndex < inputFiles.length.valueOf(); inputFileIndex++){
                    var inputFile = inputFiles[inputFileIndex];
                    if(inputFile.name.endsWith(".obj")) {
                        console.log(inputFile)
                        var objText = await inputFile.text();
                        this.scene = new Scene(objText.toString());
                        this.scene.make_scene();
                    }
                    if(inputFile.type.includes("image")) {
                        console.log(inputFile)
                        this.inputTexture = new Texture2D();
                        this.inputTexture.initialize(this.device, inputFile);
                    }
                }
                await this.Initialize();
            }
        });


        $(document).on(
            "keydown", 
            (event) => {
                this.handle_keypress(event);
            }
        );
        $(document).on(
            "keyup", 
            (event) => {
                this.handle_keyrelease(event);
            }
        );
        this.canvas.onclick = () => {
            this.canvas.requestPointerLock();
        }
        this.canvas.onclick = () => {
            this.canvas.requestPointerLock();
        }
        // this.canvas.addEventListener(
        //     "mousemove", 
        //     (event: MouseEvent) => {this.handle_mouse_move(event);}
        // );
        
    }

    async loadDefaultTexture(){
        await this.inputTexture.getBlob(this.device, "dist/models/white_man_head.png");
    }

    async Initialize() {

        await this.makeBindGroupLayouts();

        await this.createAssets();

        await this.makeBindGroups();
    
        await this.makePipeline();

        this.render();
    }

    async setupDevice() {

        //adapter: wrapper around (physical) GPU.
        //Describes features and limits
        this.adapter = <GPUAdapter> await navigator.gpu?.requestAdapter();
        //device: wrapper around GPU functionality
        //Function calls are made through the device
        this.device = <GPUDevice> await this.adapter?.requestDevice();
        //context: similar to vulkan instance (or OpenGL context)
        this.context = <GPUCanvasContext> this.canvas.getContext("webgpu");
        this.format = "bgra8unorm";
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });

    }

    async makeBindGroupLayouts() {
        this.ray_tracing_bind_group_layout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.COMPUTE,
                    storageTexture: {
                        access: "write-only",
                        format: "rgba8unorm",
                        viewDimension: "2d"
                    }
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false,
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false,
                    }
                },
                {
                    binding: 4,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset: false,
                    }
                },
                {
                    binding: 5,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: {
                        viewDimension: "cube",
                    }
                },
                {
                    binding: 6,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: {}
                },
                {
                    binding: 7,
                    visibility: GPUShaderStage.COMPUTE,
                    texture: {
                        viewDimension: "2d",
                    }
                },
                {
                    binding: 8,
                    visibility: GPUShaderStage.COMPUTE,
                    sampler: {}
                },
                {
                    binding: 9,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: {
                        type: "uniform",
                    }
                },
            ]

        });

        this.screen_bind_group_layout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
            ]

        });
    }

    async createAssets() {
        
        this.color_buffer = this.device.createTexture(
            {
                size: {
                    width: this.canvas.width,
                    height: this.canvas.height,
                },
                format: "rgba8unorm",
                usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING
            }
        );

        this.color_buffer_view = this.color_buffer.createView();

        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1
        };
        this.sampler = this.device.createSampler(samplerDescriptor);

        const parameterBufferDescriptor: GPUBufferDescriptor = {
            size: 64,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        };
        this.sceneParameters = this.device.createBuffer(
            parameterBufferDescriptor
        );
        const lightBufferDescriptor: GPUBufferDescriptor = {
            size: 48,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        };
        this.lightParameters = this.device.createBuffer(
            lightBufferDescriptor
        );

        const triangleBufferDescriptor: GPUBufferDescriptor = {
            size: 144 * this.scene.triangles.length,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        };
        this.triangleBuffer = this.device.createBuffer(
            triangleBufferDescriptor
        );

        const nodeBufferDescriptor: GPUBufferDescriptor = {
            size: 32 * this.scene.nodesUsed,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        };
        this.nodeBuffer = this.device.createBuffer(
            nodeBufferDescriptor
        );

        const triangleIndexBufferDescriptor: GPUBufferDescriptor = {
            size: 4 * this.scene.triangleCount,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        };
        this.triangleIndexBuffer = this.device.createBuffer(
            triangleIndexBufferDescriptor
        );

        const urls = [
            "dist/img/sky_back.png",  //x+
            "dist/img/sky_front.png",   //x-
            "dist/img/sky_left.png",   //y+
            "dist/img/sky_right.png",  //y-
            "dist/img/sky_top.png", //z+
            "dist/img/sky_bottom.png",    //z-
        ]
        this.sky_material = new CubeMapMaterial();
        await this.sky_material.initialize(this.device, urls);
    }

    async makePipeline() {
        
        const ray_tracing_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.ray_tracing_bind_group_layout]
        });

        this.ray_tracing_pipeline = this.device.createComputePipeline({
            layout: ray_tracing_pipeline_layout,
            
            compute: {
                module: this.device.createShaderModule({
                code: raytracer_kernel,
            }),
            entryPoint: 'main',
        },
        });

        const screen_pipeline_layout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.screen_bind_group_layout]
        });

        this.screen_pipeline = this.device.createRenderPipeline({
            layout: screen_pipeline_layout,
            
            vertex: {
                module: this.device.createShaderModule({
                code: screen_shader,
            }),
            entryPoint: 'vert_main',
            },

            fragment: {
                module: this.device.createShaderModule({
                code: screen_shader,
            }),
            entryPoint: 'frag_main',
            targets: [
                {
                    format: "bgra8unorm"
                }
            ]
            },

            primitive: {
                topology: "triangle-list"
            }
        });
        
    }

    async makeBindGroups() {
        this.ray_tracing_bind_group = this.device.createBindGroup({
            layout: this.ray_tracing_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource: this.color_buffer_view
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.sceneParameters,
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.triangleBuffer,
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: this.nodeBuffer,
                    }
                },
                {
                    binding: 4,
                    resource: {
                        buffer: this.triangleIndexBuffer,
                    }
                },
                {
                    binding: 5,
                    resource: this.sky_material.view
                },
                {
                    binding: 6,
                    resource: this.sky_material.sampler
                },
                {
                    binding: 7,
                    resource: this.inputTexture.view
                },
                {
                    binding: 8,
                    resource: this.inputTexture.sampler
                },
                {
                    binding: 9,
                    resource: {
                        buffer: this.lightParameters,
                    }
                },
            ]
        });

        this.screen_bind_group = this.device.createBindGroup({
            layout: this.screen_bind_group_layout,
            entries: [
                {
                    binding: 0,
                    resource:  this.sampler
                },
                {
                    binding: 1,
                    resource: this.color_buffer_view
                }
            ]
        });
    }

    private setupDownloadButton() {
        const buttonDownloadElement = document.getElementById("download_canvas") as HTMLButtonElement;
        buttonDownloadElement.addEventListener('click', (e) => {

            this.prepareScene(256);

            const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();

            const ray_trace_pass : GPUComputePassEncoder = commandEncoder.beginComputePass();
            ray_trace_pass.setPipeline(this.ray_tracing_pipeline);
            ray_trace_pass.setBindGroup(0, this.ray_tracing_bind_group);
            ray_trace_pass.dispatchWorkgroups(
                Math.floor((this.canvas.width + 7) / 8), 
                Math.floor((this.canvas.height + 7) / 8), 1);
            ray_trace_pass.end();

            const textureView : GPUTextureView = this.context.getCurrentTexture().createView();
            const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
                colorAttachments: [{
                    view: textureView,
                    clearValue: {r: 0.5, g: 0.0, b: 0.25, a: 1.0},
                    loadOp: "clear",
                    storeOp: "store"
                }]
            });


            renderpass.setPipeline(this.screen_pipeline);
            renderpass.setBindGroup(0, this.screen_bind_group);

            renderpass.draw(6, 1, 0, 0);

            renderpass.end();

            this.device.queue.submit([commandEncoder.finish()]);

            const canvasUrl = this.canvas.toDataURL();
            const createEl = document.createElement('a');
            createEl.href = canvasUrl;
            createEl.download = "frame_render.png";

            createEl.click();
            createEl.remove();
        });
    }

    

    prepareScene(num_of_samples: number) {

        this.scene.update();
        this.scene.move_camera(this.forwards_amount, this.right_amount, this.up_amount);
        this.scene.rotate_light(this.light_angle);

        const sceneData = {
            cameraPos: this.scene.camera.position,
            cameraForward: this.scene.camera.forwards,
            cameraRight: this.scene.camera.right,
            cameraUp: this.scene.camera.up,
            triangleCount: this.scene.triangles.length
        }
        const maxBounces: number = 4;

        this.device.queue.writeBuffer(
            this.sceneParameters, 0,
            new Float32Array(
                [
                    sceneData.cameraPos[0],
                    sceneData.cameraPos[1],
                    sceneData.cameraPos[2],
                    0.2, // ambient Intensity
                    sceneData.cameraForward[0],
                    sceneData.cameraForward[1],
                    sceneData.cameraForward[2],
                    num_of_samples,
                    sceneData.cameraRight[0],
                    sceneData.cameraRight[1],
                    sceneData.cameraRight[2],
                    maxBounces,
                    sceneData.cameraUp[0],
                    sceneData.cameraUp[1],
                    sceneData.cameraUp[2],
                    sceneData.triangleCount,
                ]
            ), 0, 16
        );

        const lightData = {
            lightPos: this.scene.lights[0].position,
            diffuseIntensity: this.scene.lights[0].diffuseIntensity,
            direction: this.scene.lights[0].direction,
            color: this.scene.lights[0].color,
        }

        this.device.queue.writeBuffer(
            this.lightParameters, 0,
            new Float32Array(
                [
                    lightData.lightPos[0],
                    lightData.lightPos[1],
                    lightData.lightPos[2],
                    lightData.diffuseIntensity,
                    lightData.direction[0],
                    lightData.direction[1],
                    lightData.direction[2],
                    1.0,
                    lightData.color[0],
                    lightData.color[1],
                    lightData.color[2],
                    1.0,
                ]
            ), 0, 12
        );

        const triangleData: Float32Array = new Float32Array(36 * this.scene.triangleCount);
        // for (let i = 0; i < 24 * this.scene.triangleCount; i++) {
        //     triangleData[i] = 0.0;
        // }
        for (let i = 0; i < this.scene.triangleCount; i++) {
            for (var corner = 0; corner < 3; corner++) {
                for (var dimension = 0; dimension < 3; dimension++) {
                    triangleData[36*i + 4 * corner + dimension] = 
                        this.scene.triangles[i].corners[corner][dimension];
                }
                triangleData[36*i + 4 * corner + 3] = 0.0;
            }
            for (var normal = 0; normal < 3; normal++) {
                for (var dimension = 0; dimension < 3; dimension++) {
                    triangleData[36*i + 12 + 4 * normal + dimension] = 
                        this.scene.triangles[i].normal[normal][dimension];
                }
                triangleData[36*i + 12 +  4 * normal + 3] = 0.0;
            }
            for (var channel = 0; channel < 3; channel++) {
                triangleData[36*i + 24 + channel] = this.scene.triangles[i].color[channel];
            }
            triangleData[36*i + 27] = 0.0;
            triangleData[36*i + 28] = this.scene.triangles[i].uv[0][0];
            triangleData[36*i + 29] = this.scene.triangles[i].uv[0][1];
            triangleData[36*i + 30] = this.scene.triangles[i].uv[1][0];
            triangleData[36*i + 31] = this.scene.triangles[i].uv[1][1];
            triangleData[36*i + 32] = this.scene.triangles[i].uv[2][0];
            triangleData[36*i + 33] = this.scene.triangles[i].uv[2][1];
            triangleData[36*i + 34] = 0.0;
            triangleData[36*i + 35] = 0.0;
        }

        this.device.queue.writeBuffer(
            this.triangleBuffer, 0, triangleData, 0, 36 * this.scene.triangleCount
        );
        
        const nodeData: Float32Array = new Float32Array(8 * this.scene.nodesUsed);
        for(let i = 0; i < this.scene.nodesUsed; i++) {
            nodeData[8*i+0] = this.scene.nodes[i].minCorner[0];
            nodeData[8*i+1] = this.scene.nodes[i].minCorner[1];
            nodeData[8*i+2] = this.scene.nodes[i].minCorner[2];
            nodeData[8*i+3] = this.scene.nodes[i].leftChild;
            nodeData[8*i+4] = this.scene.nodes[i].maxCorner[0];
            nodeData[8*i+5] = this.scene.nodes[i].maxCorner[1];
            nodeData[8*i+6] = this.scene.nodes[i].maxCorner[2];
            nodeData[8*i+7] = this.scene.nodes[i].primitiveCount;
        }

        this.device.queue.writeBuffer(
            this.nodeBuffer, 0, nodeData, 0, 8 * this.scene.nodesUsed
        );

        const triangleIndexData: Float32Array = new Float32Array(this.scene.triangleCount);
        for(let i = 0; i < this.scene.triangleCount; i++) {
            triangleIndexData[i] = this.scene.triangleIndices[i];
        }

        this.device.queue.writeBuffer(
            this.triangleIndexBuffer, 0, triangleIndexData, 0, this.scene.triangleCount
        );
    }

    render = () => {

        const startTime = performance.now();

        this.prepareScene(4);

        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();

        const ray_trace_pass : GPUComputePassEncoder = commandEncoder.beginComputePass();
        ray_trace_pass.setPipeline(this.ray_tracing_pipeline);
        ray_trace_pass.setBindGroup(0, this.ray_tracing_bind_group);
        ray_trace_pass.dispatchWorkgroups(
            Math.floor((this.canvas.width + 7) / 8), 
            Math.floor((this.canvas.height + 7) / 8), 1);
        ray_trace_pass.end();

        const textureView : GPUTextureView = this.context.getCurrentTexture().createView();
        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.5, g: 0.0, b: 0.25, a: 1.0},
                loadOp: "clear",
                storeOp: "store"
            }]
        });


        renderpass.setPipeline(this.screen_pipeline);
        renderpass.setBindGroup(0, this.screen_bind_group);

        renderpass.draw(6, 1, 0, 0);

        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);

        this.device.queue.onSubmittedWorkDone().then(() => {
            this.change_every_frame.innerHTML = "Triangle count: " + this.scene.triangles.length.toFixed(0);
            this.change_every_frame.innerHTML += '<br />RenderTime: ' + (performance.now() - startTime).toFixed(5) + ' ms';
        });


        
        requestAnimationFrame(this.render);
        

        const totalTime = performance.now() - startTime;

        if(performance.now() - this.passedTime > 1000){
            this.change_every_second.innerHTML = '<br />FPS: ' + (this.count * 1000 / (performance.now() - this.passedTime)).toFixed(1);
            this.passedTime = performance.now();
            this.count = 0;
        }
        this.count += 1;
    }

    handle_keypress(event: JQuery.KeyDownEvent) {
        if (event.code == "KeyW") {
            this.forwards_amount = 0.02;
        }
        if (event.code == "KeyS") {
            this.forwards_amount = -0.02;
        }
        if (event.code == "KeyA") {
            this.right_amount = -0.02;
        }
        if (event.code == "KeyD") {
            this.right_amount = 0.02;
        }
        if (event.code == "KeyX") {
            this.up_amount = 0.02;
        }
        if (event.code == "KeyZ") {
            this.up_amount = -0.02;
        }
        if (event.code == "KeyR") {
            this.light_angle = +0.1;
        }
        if (event.code == "KeyL") {
            this.light_angle = -0.1;
        }

    }

    handle_keyrelease(event: JQuery.KeyUpEvent) {
        if (event.code == "KeyW") {
            this.forwards_amount = 0;
        }
        if (event.code == "KeyS") {
            this.forwards_amount = 0;
        }
        if (event.code == "KeyA") {
            this.right_amount = 0;
        }
        if (event.code == "KeyD") {
            this.right_amount = 0;
        }
        if (event.code == "KeyX") {
            this.up_amount = 0;
        }
        if (event.code == "KeyZ") {
            this.up_amount = 0;
        }
        if (event.code == "KeyR") {
            this.light_angle = 0;
        }
        if (event.code == "KeyL") {
            this.light_angle = 0;
        }
    }

    handle_mouse_move(event: MouseEvent) {
        this.scene.spin_camera(
            event.movementX / 5, event.movementY / 5
        );
    }
}