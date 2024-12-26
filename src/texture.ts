export class Texture2D {
    
    texture: GPUTexture
    view: GPUTextureView
    sampler: GPUSampler
    blob: Blob
    imageData: ImageBitmap;

    async getBlob(device: GPUDevice, url: string) {
        const response: Response = await fetch(url);
        this.blob = await response.blob();
        await this.initialize(device, this.blob);
    }

    async initialize(device: GPUDevice, blob: Blob) {
        this.imageData = await createImageBitmap(blob);
        
        await this.loadImageBitmap(device);
        await this.flipImageBitmapY();

        this.copyTexture(device);

        const viewDescriptor: GPUTextureViewDescriptor = {
            format: "rgba8unorm",
            dimension: "2d",
            aspect: "all",
            baseMipLevel: 0,
            mipLevelCount: 1,
            baseArrayLayer: 0,
            arrayLayerCount: 1
        };
        this.view = this.texture.createView(viewDescriptor);

        const samplerDescriptor: GPUSamplerDescriptor = {
            addressModeU: "repeat",
            addressModeV: "repeat",
            magFilter: "linear",
            minFilter: "nearest",
            mipmapFilter: "nearest",
            maxAnisotropy: 1
        };
        this.sampler = device.createSampler(samplerDescriptor);
        
    }

    async loadImageBitmap(device: GPUDevice) {

        const textureDescriptor: GPUTextureDescriptor = {
            dimension: "2d",
            size: {
                width: this.imageData.width,
                height: this.imageData.height,
                depthOrArrayLayers: 1
            },
            format: "rgba8unorm",
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
        };

        this.texture = device.createTexture(textureDescriptor);
    }

    copyTexture(device: GPUDevice) {
        device.queue.copyExternalImageToTexture(
            {source: this.imageData},
            {texture: this.texture, origin: [0, 0, 0]},
            [this.imageData.width, this.imageData.height]
        );
    }

    async flipImageBitmapY() {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
    
        if (!ctx) {
            throw new Error("Canvas 2D context not available.");
        }
    
        // Set canvas size to match the ImageBitmap dimensions
        canvas.width = this.imageData.width;
        canvas.height = this.imageData.height;
    
        // Flip the image vertically
        ctx.drawImage(this.imageData, 0, 0);
        ctx.scale(1, -1); // Scale vertically
        ctx.translate(0, -canvas.height); // Translate back into view
        ctx.drawImage(this.imageData, 0, 0); // Draw the flipped image
    
        // Create a new ImageBitmap from the canvas
        this.imageData = await createImageBitmap(canvas);
    }
}