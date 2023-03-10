import { Camera } from "../Util/Camera.js";
import type { RenderStep } from "./Step/IRenderStep";

export class BaseRenderer {
  public adapter: GPUAdapter;
  public device: GPUDevice;
  public presentationFormat: string;
  public size: number[];
  public context: GPUCanvasContext;
  public started = false;
  public steps: RenderStep[];
  public camera: Camera;
  public canvas: HTMLCanvasElement;

  public constructor() {
    this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  }

  public async init(steps: RenderStep[]): Promise<void> {

    this.camera = new Camera();
    this.steps = [this.camera, ...steps];
    await this.initDevice();
    this.initContext();
    let first = true;
    await this.camera.init(this.device, null, this.size, false);
    for (let step of steps) {
      await step.init(this.device, this.camera, this.size, first);
      first = false;
    }

    window.addEventListener('resize', () => this.onResize());
    return Promise.resolve();
  }

  public async initDevice() {
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice();
  }

  private initContext() {
    this.canvas = <HTMLCanvasElement>document.querySelector("#gpuCanvas");
    this.size = [
      this.canvas.width = window.innerWidth,
      this.canvas.height = window.innerHeight// * window.devicePixelRatio
    ];

    this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: "opaque"
    });
  }

  public start() {
    this.started = true;
    requestAnimationFrame(this.frame_fn);
  }


  public onResize(): any {
    this.size = [
      this.canvas.width = window.innerWidth,
      this.canvas.height = window.innerHeight// * window.devicePixelRatio
    ];
    console.debug("onResize: " + this.size);
    for (let step of this.steps) {
      step.onResize(this.size);
    }
  }

  private frame_fn = async (time: number) => {

    if (!this.started) {
      return;
    }
    for (let step of this.steps) {
      await step.prePass();
    }


    let commandEncoder = this.device.createCommandEncoder();
    let view: GPUTextureView = this.context.getCurrentTexture().createView();
    for (let step of this.steps) {
      step.makePass(commandEncoder, view);
    }
    this.device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(this.frame_fn);
  }
}