
import { RenderStep } from "../Renderer/Step/IRenderStep.js";
import { Controller } from "./Controller.js";

export class Camera implements RenderStep {
  controller = new Controller();
  public camPos = [0, -5, 0];
  public rotation = [0, 0, 0, 1];
  public rotationRate = [0, 0, 0, 1];
  public moveRate = [0, 0, 0];

  public zoomRate = 0.1;
  public size = [1, 2];
  public zoom = 1;
  public readonly delta = 20;
  public readonly deltaA = 1;
  public time: number;

  public cameraBuffer: GPUBuffer;
  public stagingBuffer: GPUBuffer;

  private device: GPUDevice

  private timeout: number;

  private minMove = 0.001;
  private minRot = 0.0001;


  public init(device: GPUDevice, camera: Camera, size: number[], first: boolean): Promise<void> {
    this.device = device;

    this.cameraBuffer = this.device.createBuffer(
      {
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      }
    );
    this.stagingBuffer = this.device.createBuffer(
      {
        size: 64,
        usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
        mappedAtCreation: false,
      }
    );
    this.onResize(size);

    new Float32Array(this.cameraBuffer.getMappedRange()).set(this.getArray());
    this.cameraBuffer.unmap();

    this.start();
    return Promise.resolve();
  }

  public async prePass(): Promise<void> {
    await this.stagingBuffer.mapAsync(GPUMapMode.WRITE);
  }

  public makePass(commandEncoder: GPUCommandEncoder, view: GPUTextureView): void {
    new Float32Array(this.stagingBuffer.getMappedRange()).set(this.getArray());
    this.stagingBuffer.unmap();
    commandEncoder.copyBufferToBuffer(this.stagingBuffer, 0, this.cameraBuffer, 0, 64);
  }

  public start() {
    this.stop();
    this.time = performance.now();
    this.timeout = setTimeout(this.update);
  }
  public stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  public update = () => {
    this.timeout = null;
    let now = performance.now();
    let dt = (now - this.time) / 1000.0;
    if (dt > 0.1) {
      dt = 0.1;
    }
    this.time = now;

    let dx = dt * this.delta;
    let da = dt * this.deltaA;
    let factor = Math.exp(-dt / 2);
    this.moveRate[0] *= factor;
    this.moveRate[1] *= factor;
    this.moveRate[2] *= factor;
    this.rotationRate = this.quaternionPower(this.rotationRate, Math.exp(-dt))

    let move = [this.controller.getRight(), this.controller.getForward(), this.controller.getRise()];
    let rot = this.getQuaternion(this.controller.getYaw(), this.controller.getPitch(), this.controller.getRoll(), da);

    this.rotationRate = this.quaternionMult(rot, this.rotationRate);
    move = this.toVector(this.quaternionRotation(move, this.rotation));

    this.addTo(this.moveRate, move, dx);

    if (this.norm(this.moveRate) * dt > this.minMove) {
      this.addTo(this.camPos, this.moveRate, dt * this.zoom);
    }
    if (Math.abs(Math.acos(this.rotationRate[3])) * dt > this.minRot) {
      this.rotation = this.quaternionMult(this.quaternionPower(this.rotationRate, dt * Math.min(this.zoom, 1)), this.rotation);
    }

    this.normalize(this.rotationRate);
    this.normalize(this.rotation);

    if (this.controller.getZoomReset()) {
      this.zoom = 1;
    } else {
      this.zoom += this.zoom * this.controller.getZoom() * dt
    }

    this.timeout = setTimeout(this.update);
  }

  private normalize(v: number[]) {
    let len = this.norm(v);
    if (len != 1) {
      for (let i = 0; i < v.length; ++i) {
        v[i] /= len;
      }
      if (Math.abs(len - 1) > 0.00001) {
        console.error(len);
      }
    }
  }

  private norm(v: number[]) {
    let len = 0;
    for (let i = 0; i < v.length; ++i) {
      len += v[i] * v[i];
    }
    return Math.sqrt(len);
  }
  public getQuaternion(yaw: number, pitch: number, roll: number, f: number) {

    const y = yaw * f / 2
    const p = pitch * f / 2
    const r = roll * f / 2
    const yc = Math.cos(y);
    const ys = Math.sin(y);
    const pc = Math.cos(p);
    const ps = Math.sin(p);
    const rc = Math.cos(r);
    const rs = Math.sin(r);

    const psys = ps * ys;
    const psyc = ps * yc;
    const pcys = pc * ys;
    const pcyc = pc * yc;

    return [rs * pcys + rc * psyc, rs * pcyc - rc * psys, rc * pcys + rs * psyc, rc * pcyc - rs * psys];
  }

  public getArray(): number[] {
    return [...this.camPos, 0, ...this.rotation, ...this.size, this.zoom, 0];
  }

  public quaternionMult(q1: number[], q2: number[]): number[] {
    return [
      q1[0] * q2[3] + q1[1] * q2[2] - q1[2] * q2[1] + q1[3] * q2[0],
      -q1[0] * q2[2] + q1[1] * q2[3] + q1[2] * q2[0] + q1[3] * q2[1],
      q1[0] * q2[1] - q1[1] * q2[0] + q1[2] * q2[3] + q1[3] * q2[2],
      -q1[0] * q2[0] - q1[1] * q2[1] - q1[2] * q2[2] + q1[3] * q2[3]
    ];
  }
  public quaternionInv(q: number[]): number[] {
    return [-q[0], -q[1], -q[2], q[3]];
  }
  public toQuaternion(v: number[]): number[] {
    return (v.length == 3) ? [...v, 0] : v;
  }
  public toVector(q: number[]): number[] {
    return (q.length != 4) ? [q[0], q[1], q[2]] : q;
  }

  public quaternionRotation(v: number[], q: number[]): number[] {
    return this.quaternionMult(this.quaternionMult(this.quaternionInv(q), this.toQuaternion(v)), q);
  }

  public quaternionPower(q: number[], p: number): number[] {
    let phi = Math.acos(q[3]);
    if (phi == 0) {
      return [0, 0, 0, 1];
    }
    let l = phi * p;

    let sin = Math.sin(l) / Math.sin(phi);
    return [
      q[0] * sin,
      q[1] * sin,
      q[2] * sin,
      Math.cos(l)
    ]

  }


  public addTo(v1: number[], v2: number[], dx: number) {
    v1[0] += v2[0] * dx;
    v1[1] += v2[1] * dx;
    v1[2] += v2[2] * dx;
  }

  public onResize(size: number[]) {
    let x = size[0];
    let y = size[1];
    let min = Math.min(x, y);
    this.size[0] = x / min;
    this.size[1] = y / min;
  }
}
