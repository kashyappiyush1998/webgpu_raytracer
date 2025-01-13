@group(0) @binding(0) var screen_sampler : sampler;
@group(0) @binding(1) var color_buffer : texture_2d<f32>;
@group(0) @binding(2) var history_buffer : texture_2d<f32>;
@group(0) @binding(3) var normal_buffer : texture_2d<f32>;


// const stepSize = 1;
const colorPhi = 1.0;
const normalPhi = 0.2;
const kernelRadius = 2.0;


// Gaussian kernel weights for 5x5 kernel
const kernel = array<f32, 25>(
    1.0/256.0,  4.0/256.0,  6.0/256.0,  4.0/256.0, 1.0/256.0,
    4.0/256.0, 16.0/256.0, 24.0/256.0, 16.0/256.0, 4.0/256.0,
    6.0/256.0, 24.0/256.0, 36.0/256.0, 24.0/256.0, 6.0/256.0,
    4.0/256.0, 16.0/256.0, 24.0/256.0, 16.0/256.0, 4.0/256.0,
    1.0/256.0,  4.0/256.0,  6.0/256.0,  4.0/256.0, 1.0/256.0
);


fn calculateWeight(centerColor: vec4<f32>, sampleColor: vec4<f32>, centerNormal: vec4<f32>, sampleNormal: vec4<f32>) -> f32 {
    let colorDist = length(centerColor.rgb - sampleColor.rgb);
    let normalDist = 1.0 - max(dot(centerNormal.xyz, sampleNormal.xyz), 0.0);
    
    let colorWeight = exp(-colorDist / colorPhi);
    let normalWeight = exp(-normalDist / normalPhi);
    
    return colorWeight * normalWeight;
}


struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) TexCoord : vec2<f32>,
}

@vertex
fn vert_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {

    var positions = array<vec2<f32>, 6>(
        vec2<f32>( 1.0,  1.0),
        vec2<f32>( 1.0, -1.0),
        vec2<f32>(-1.0, -1.0),
        vec2<f32>( 1.0,  1.0),
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(-1.0,  1.0)
    );

    var texCoords = array<vec2<f32>, 6>(
        vec2<f32>(1.0, 0.0),
        vec2<f32>(1.0, 1.0),
        vec2<f32>(0.0, 1.0),
        vec2<f32>(1.0, 0.0),
        vec2<f32>(0.0, 1.0),
        vec2<f32>(0.0, 0.0)
    );

    var output : VertexOutput;
    output.Position = vec4<f32>(positions[VertexIndex], 0.0, 1.0);
    output.TexCoord = texCoords[VertexIndex];
    return output;
}

@fragment
fn frag_main(@location(0) TexCoord : vec2<f32>) -> @location(0) vec4<f32> {

    let dims = vec2<f32>(textureDimensions(color_buffer));
    let pixelSize = vec2<f32>(1.0) / dims;
    // // var mostionVector : vec2<f32> = vec2<f32>(0.0, 0.0);
    // var currentColor : vec4<f32> = textureSample(color_buffer, screen_sampler, TexCoord);
    // var historyColor : vec4<f32> = textureSample(history_buffer, screen_sampler, TexCoord);
    // var normal : vec4<f32> = textureSample(normal_buffer, screen_sampler, TexCoord);
    // // let alpha = 0.9;
    // // var blendedColor : vec4<f32> = mix(historyColor, currentColor, alpha);

    let centerColor : vec4<f32> = textureSample(color_buffer, screen_sampler, TexCoord);
    let centerNormal : vec4<f32> = normalize(textureSample(normal_buffer, screen_sampler, TexCoord) * 2.0 - 1.0);
    
    var filteredColor : vec4<f32> = vec4<f32>(0.0);
    var weightSum : f32 = 0.0;
    
    // 5x5 kernel
    for (var stepSize = 1; stepSize <= 3; stepSize++){
        for (var y = -2; y <= 2; y++) {
            for (var x = -2; x <= 2; x++) {
                let offset : vec2<f32> = vec2<f32>(f32(x), f32(y)) * f32(stepSize) * pixelSize;
                let samplePos : vec2<f32> = TexCoord + offset;

                let kernelIndex = (y + 2) * 5 + (x + 2);
                let kernelWeight = kernel[kernelIndex];
                
                let sampleColor = textureSample(color_buffer, screen_sampler, samplePos);
                let sampleNormal = normalize(textureSample(normal_buffer, screen_sampler, samplePos) * 2.0 - 1.0);
                
                let weight = kernelWeight * calculateWeight(centerColor, sampleColor, centerNormal, sampleNormal);
                
                filteredColor += sampleColor * weight;
                weightSum += weight;
            }
        }
    }

    // Normalize
    filteredColor = select(centerColor, filteredColor / weightSum, weightSum > 0.0);

    return filteredColor;
}