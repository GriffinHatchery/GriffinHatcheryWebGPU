struct Camera {
  pos: vec3<f32>,
  rot: vec4<f32>,
  size: vec3<f32>,
}

fn rotz(position: vec3<f32>, a: f32) -> vec3<f32> {
    let rotx = vec3<f32>(cos(a), sin(a), 0.0);
    let rotz = vec3<f32>(0.0, 0.0, 1.0);
    let roty = cross(rotz, rotx);
    return rotx * position.x + roty * position.y + rotz * position.z;
}

fn roty(position: vec3<f32>, a: f32) -> vec3<f32> {
    let rotz = vec3<f32>(sin(a), 0.0, cos(a));
    let roty = vec3<f32>(0.0, 1.0, 0.0);
    let rotx = cross(roty, rotz);
    return rotx * position.x + roty * position.y + rotz * position.z;
}

fn rotx(position: vec3<f32>, a: f32) -> vec3<f32> {
    let rotx = vec3<f32>(1.0, 0.0, 0.0);
    let rotz = vec3<f32>(0.0, sin(a), cos(a));
    let roty = cross(rotz, rotx);
    return rotx * position.x + roty * position.y + rotz * position.z;
}

fn quaternionInv(q: vec4<f32>) -> vec4<f32> {
    return vec4<f32>(-q.xyz, q.w);
}

fn quaternionMult(q1: vec4<f32>, q2: vec4<f32>) -> vec4<f32> {
    return vec4<f32>(
        q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x,
        -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y,
        q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z,
        -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w
    );
}

fn quaternionRotation(v: vec3<f32>, q: vec4<f32>) -> vec3<f32> {
    return quaternionMult(quaternionMult(q, vec4<f32>(v, 0.0)), quaternionInv(q)).xyz;
}

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  //@location(0) color: vec4<f32>,
  @location(1) texCoord: vec2<f32>,
}
@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var diffuseTexture: texture_2d<f32>;
@group(0) @binding(2) var diffuseSampler: sampler;

@vertex
fn vertex_main(@location(0) position: vec4<f32>) -> VertexOut {
    var output: VertexOut;
    output.position = position;
    let td = vec2<f32>(textureDimensions(diffuseTexture));
    let m = min(td.x, td.y);
    output.texCoord = position.xy * vec2<f32>(0.5, -0.5) * camera.size.xy / td * m + vec2<f32>(0.5);
    return output;
} 
        

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4<f32> {
    let sina = sqrt(1.0 - camera.rot.w * camera.rot.w);
    let delta = vec2<f32>(sina, camera.rot.w);
    let alldelta = vec2<f32>(0.5, 0.5);
    let tex2 = vec2<f32>(fragData.texCoord.x * camera.rot.w + fragData.texCoord.y * sina, fragData.texCoord.y * camera.rot.w - fragData.texCoord.x * sina);
    var diffusecolor1 = textureSample(diffuseTexture, diffuseSampler, fragData.texCoord + delta + alldelta);
    var diffusecolor2 = textureSample(diffuseTexture, diffuseSampler, tex2 + alldelta);
    var diffusecolor3 = textureSample(diffuseTexture, diffuseSampler, fragData.texCoord - delta + alldelta);
    return vec4<f32>(diffusecolor1.x, diffusecolor2.y, diffusecolor3.z, 1.0);
} 