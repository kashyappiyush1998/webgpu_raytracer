@group(0) @binding(0) var screen_sampler : sampler;
@group(0) @binding(1) var color_buffer : texture_2d<f32>;

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
  
    var offset: array<vec2<f32>, 25>;
    offset[0] = vec2<f32>(-2,-2);
    offset[1] = vec2<f32>(-1,-2);
    offset[2] = vec2<f32>(0,-2);
    offset[3] = vec2<f32>(1,-2);
    offset[4] = vec2<f32>(2,-2);
    
    offset[5] = vec2<f32>(-2,-1);
    offset[6] = vec2<f32>(-1,-1);
    offset[7] = vec2<f32>(0,-1);
    offset[8] = vec2<f32>(1,-1);
    offset[9] = vec2<f32>(2,-1);
    
    offset[10] = vec2<f32>(-2,0);
    offset[11] = vec2<f32>(-1,0);
    offset[12] = vec2<f32>(0,0);
    offset[13] = vec2<f32>(1,0);
    offset[14] = vec2<f32>(2,0);
    
    offset[15] = vec2<f32>(-2,1);
    offset[16] = vec2<f32>(-1,1);
    offset[17] = vec2<f32>(0,1);
    offset[18] = vec2<f32>(1,1);
    offset[19] = vec2<f32>(2,1);
    
    offset[20] = vec2<f32>(-2,2);
    offset[21] = vec2<f32>(-1,2);
    offset[22] = vec2<f32>(0,2);
    offset[23] = vec2<f32>(1,2);
    offset[24] = vec2<f32>(2,2);
    
    
    var kernel: array<f32, 25>;
    kernel[0] = 1.0/256.0;
    kernel[1] = 1.0/64.0;
    kernel[2] = 3.0/128.0;
    kernel[3] = 1.0/64.0;
    kernel[4] = 1.0/256.0;
    
    kernel[5] = 1.0/64.0;
    kernel[6] = 1.0/16.0;
    kernel[7] = 3.0/32.0;
    kernel[8] = 1.0/16.0;
    kernel[9] = 1.0/64.0;
    
    kernel[10] = 3.0/128.0;
    kernel[11] = 3.0/32.0;
    kernel[12] = 9.0/64.0;
    kernel[13] = 3.0/32.0;
    kernel[14] = 3.0/128.0;
    
    kernel[15] = 1.0/64.0;
    kernel[16] = 1.0/16.0;
    kernel[17] = 3.0/32.0;
    kernel[18] = 1.0/16.0;
    kernel[19] = 1.0/64.0;
    
    kernel[20] = 1.0/256.0;
    kernel[21] = 1.0/64.0;
    kernel[22] = 3.0/128.0;
    kernel[23] = 1.0/64.0;
    kernel[24] = 1.0/256.0;

    var denoiseStrength : f32 = 3.0;
    var sum : vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    var c_phi : f32 = 1.0;
    var n_phi : f32 = 0.5;

    var color : vec4<f32> = textureSample(color_buffer, screen_sampler, TexCoord);
	var cval : vec4<f32> = textureSample(color_buffer, screen_sampler, TexCoord);

    var cum_w : f32 = 0.0;
    var uv : vec2<f32>;
    var ctmp : vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    var t : vec4<f32> = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    var dist2 : f32 = 0.0;
    var c_w : f32 = 0.0;
    var weight : f32 = 1.0;

    for(var i = 0; i < 25; i++)
    {
        uv = TexCoord+offset[i]*denoiseStrength;
        
        ctmp = textureSample(color_buffer, screen_sampler, uv);
        t = cval - ctmp;
        dist2 = dot(t,t);
        c_w = min(exp(-(dist2)/c_phi), 1.0);
        
        weight = c_w;
        sum += ctmp*weight*kernel[i];
        cum_w += weight*kernel[i];
    }

    color = sum/cum_w;

    return color;
}