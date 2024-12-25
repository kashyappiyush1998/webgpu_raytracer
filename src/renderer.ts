import raytracer_kernel from "./shaders/raytracer_kernel.wgsl"
import screen_shader from "./shaders/screen_shader.wgsl"
import { Scene } from "./scene";
import { node } from "webpack";
import { CubeMapMaterial } from "./cube_material";
import { Texture2D } from "./texture";

export class Renderer {

    canvas: HTMLCanvasElement;
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
    triangleBuffer: GPUBuffer;
    nodeBuffer: GPUBuffer;
    triangleIndexBuffer: GPUBuffer;
    sky_material: CubeMapMaterial;
    texture_man_head: Texture2D;

    // Pipeline objects
    ray_tracing_pipeline: GPUComputePipeline;
    ray_tracing_bind_group: GPUBindGroup;
    ray_tracing_bind_group_layout: GPUBindGroupLayout;
    screen_pipeline: GPURenderPipeline;
    screen_bind_group: GPUBindGroup;
    screen_bind_group_layout: GPUBindGroupLayout;

    //Scene to Render
    scene: Scene;


    constructor(canvas: HTMLCanvasElement, change_every_frame: HTMLPreElement, change_every_second: HTMLPreElement, scene: Scene){
        this.canvas = canvas;
        this.change_every_frame = change_every_frame;
        this.change_every_second = change_every_second;
        this.count = 0;
        this.passedTime = 0;
        this.scene = scene;
    }

   async Initialize() {

        await this.setupDevice();

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

        const triangleBufferDescriptor: GPUBufferDescriptor = {
            size: 96 * this.scene.triangles.length,
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

        this.texture_man_head = new Texture2D();
        // await this.texture_man_head.initialize(this.device, "dist/models/dinosaurs_head_2.png");
        await this.texture_man_head.initialize(this.device, "dist/models/man_head_2.png");
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
                    resource: this.texture_man_head.view
                },
                {
                    binding: 8,
                    resource: this.texture_man_head.sampler
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

    

    prepareScene() {

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
                    1.0,
                    sceneData.cameraForward[0],
                    sceneData.cameraForward[1],
                    sceneData.cameraForward[2],
                    1.0,
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

        const triangleData: Float32Array = new Float32Array(24 * this.scene.triangleCount);
        // for (let i = 0; i < 24 * this.scene.triangleCount; i++) {
        //     triangleData[i] = 0.0;
        // }
        for (let i = 0; i < this.scene.triangleCount; i++) {
            for (var corner = 0; corner < 3; corner++) {
                for (var dimension = 0; dimension < 3; dimension++) {
                    triangleData[24*i + 4 * corner + dimension] = 
                        this.scene.triangles[i].corners[corner][dimension];
                }
                triangleData[24*i + 4 * corner + 3] = 0.0;
            }
            for (var channel = 0; channel < 3; channel++) {
                triangleData[24*i + 12 + channel] = this.scene.triangles[i].color[channel];
            }
            triangleData[24*i + 15] = 0.0;
            triangleData[24*i + 16] = this.scene.triangles[i].uv[0][0];
            triangleData[24*i + 17] = this.scene.triangles[i].uv[0][1];
            triangleData[24*i + 18] = this.scene.triangles[i].uv[1][0];
            triangleData[24*i + 19] = this.scene.triangles[i].uv[1][1];
            triangleData[24*i + 20] = this.scene.triangles[i].uv[2][0];
            triangleData[24*i + 21] = this.scene.triangles[i].uv[2][1];
            triangleData[24*i + 22] = 0.0;
            triangleData[24*i + 23] = 0.0;
        }

        this.device.queue.writeBuffer(
            this.triangleBuffer, 0, triangleData, 0, 24 * this.scene.triangleCount
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

        this.prepareScene();


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
    
}