struct VertexOut {
  @builtin(position) position: vec4<f32>,
  //@location(0) color: vec4<f32>,
  @location(1) texCoord: vec2<f32>,
}

@vertex
fn vertex_main(@location(0) position: vec4<f32>) -> VertexOut {
    var output: VertexOut;
    output.position = position;
    //output.color = color;
    output.texCoord = position.xy * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
  //output.texCoord = output.texCoord*2;
    return output;
} 

        
@group(0) @binding(0) var diffuseTexture: texture_2d<f32>;
@group(0) @binding(1) var diffuseSampler: sampler;

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4<f32> {
    let delta = vec2<f32>(0.2, -0.3);

    let alldelta = vec2<f32>(0.5, .5);
  //var s = diffuseTexture[2];
    var diffusecolor1 = textureSample(diffuseTexture, diffuseSampler, fragData.texCoord + delta + alldelta);
    var diffusecolor2 = textureSample(diffuseTexture, diffuseSampler, fragData.texCoord + alldelta);
    var diffusecolor3 = textureSample(diffuseTexture, diffuseSampler, fragData.texCoord - delta + alldelta);
    return vec4<f32>(diffusecolor1.x, diffusecolor2.y, diffusecolor3.z, 1.0);
  //return fragData.color;
  //return round(diffusecolor * 8) / 8;
  //return (diffusecolor+ fragData.color)/2;
} 