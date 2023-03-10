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

fn getColor(norm: vec3<f32>) -> vec4<f32> {

    let n = -clamp(norm.x, -1.0, 0.0) - clamp(norm.y, -1.0, 0.0) - clamp(norm.z, -1.0, 0.0);
    return vec4<f32>(clamp(norm.x + n, 0.0, 1.0), clamp(norm.y + n, 0.0, 1.0), clamp(norm.z + n, 0.0, 1.0), 1.0);
}

struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) normal: vec3<f32>,
  @location(1) pointing: vec3<f32>,
  @location(2) color: vec4<f32>,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<uniform>  latticeSize: vec4<i32>;
@vertex
fn vertex_main(@location(0) position: vec3<f32>, @location(1) norm: vec3<f32>, @builtin(instance_index) instance_index: u32) -> VertexOut {

    let int = i32(instance_index);
    let center = vec3<f32>(
        f32(((int / (latticeSize.y * latticeSize.z)) % latticeSize.x - latticeSize.x / 2) * latticeSize.w),
        f32(((int / latticeSize.z) % latticeSize.y - latticeSize.y / 2) * latticeSize.w),
        f32(((int / 1) % latticeSize.z - latticeSize.z / 2) * latticeSize.w)
    );

    let a = (sin(f32(int)) * 12.1) % 4.0;
    let b = (cos(f32(int * 2)) * 345.6) % 3.1;
    let c = (tan(f32(int * 3)) * 17.32) % 2.2;
    let rotp = roty(rotx(rotz(position, a), b), c);
    let pos = center + rotp - camera.pos;
    let size = 100000.0;
    let rot = quaternionRotation(pos, camera.rot);


    let z = rot.y;
    let zoom = 1.0 / (abs(z) * camera.size.z);
    let x = rot.x / camera.size.x * zoom;
    let y = rot.z / camera.size.y * zoom;

    var output: VertexOut;
    output.position = vec4<f32>(x, y, z / size, 1.0);
    output.normal = rotx(rotz(norm, a), b);
    output.pointing = pos;
    output.color = getColor(norm);
    return output;
} 

fn mirror(a: vec3<f32>, b: vec3<f32>) -> vec3<f32> {
    return normalize(a - 2.0 * b * dot(a, b)) ;
}

@fragment
fn fragment_main(fragData: VertexOut) -> @location(0) vec4<f32> {
    var p = abs(mirror(normalize(fragData.pointing), fragData.normal).x) - dot(fragData.normal, normalize(fragData.pointing));
    return fragData.color * p;
} 