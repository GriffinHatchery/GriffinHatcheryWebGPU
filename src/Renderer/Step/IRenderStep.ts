import type { Camera } from "../../Util/Camera";

export interface RenderStep {
  onResize(size: number[]): void;
  init(device: GPUDevice, camera: Camera, size: number[], first: boolean): Promise<void>;
  prePass(): Promise<void>;
  makePass(commandEncoder: GPUCommandEncoder, view: GPUTextureView): void;
}