import { Camera } from "../../Util/Camera";
import { RenderStep } from "./IRenderStep";

export class VideoRenderStep implements RenderStep {
  private device: GPUDevice;
  public vertexBuffer: GPUBuffer;
  public indexBuffer: GPUBuffer;
  private sampler: GPUSampler;
  private imageCapture: ImageCapture;
  private textureDescriptor: GPUTextureDescriptor
  private texture: GPUTexture;

  public renderPassDescriptor: GPURenderPassDescriptor;
  private shaderModule: GPUShaderModule;
  private bindGroup: GPUBindGroup;
  private pipeline: GPURenderPipeline;
  private frame: ImageBitmap;
  private camera: Camera;

  async init(device: GPUDevice, camera: Camera, size: number[], first: boolean): Promise<void> {
    this.device = device;
    this.camera = camera;
    this.initVertices();
    this.initSampler();
    await this.initVideo().then((frame) => this.initTexture(frame));
    return this.initPipeline(first);
  }

  async prePass(): Promise<void> {
    this.frame = await this.imageCapture.grabFrame();
  }

  async makePass(commandEncoder: GPUCommandEncoder, view: GPUTextureView): Promise<void> {

    this.device.queue.copyExternalImageToTexture({ source: this.frame }, { texture: this.texture }, this.textureDescriptor.size);
    (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].view = view;
    let passEncoder =
      commandEncoder.beginRenderPass(this.renderPassDescriptor);

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.setIndexBuffer(this.indexBuffer, "uint16");

    passEncoder.drawIndexed(6);

    passEncoder.end();
  }


  private initVertices() {
    let vertices = new Float32Array([
      -1.0, -1.0, 0, 1, // Bottom left,
      1.0, -1.0, 0, 1,  // Bottom right,
      1.0, 1.0, 0, 1, // Top right,
      -1.0, 1.0, 0, 1, // Top left,
    ]);

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();

    let indices = new Uint16Array([0, 1, 2, 0, 2, 3])
    this.indexBuffer = this.device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    })

    new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
    this.indexBuffer.unmap();
  }

  private initSampler() {
    this.sampler = this.device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "mirror-repeat",
      addressModeV: "mirror-repeat",
    });
  }


  private async initVideo(): Promise<{ width: number, height: number }> {
    let stream = await navigator.mediaDevices.getUserMedia({ video: true });
    let track = stream.getVideoTracks()[0];
    this.imageCapture = new ImageCapture(track);
    this.frame = await this.imageCapture.grabFrame();
    return { width: this.frame.width, height: this.frame.height };
  }

  private initTexture(frame: { width: number, height: number }) {
    this.textureDescriptor = {
      size: <GPUExtent3DDictStrict>{ width: frame.width, height: frame.height },
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    };
    this.texture = this.device.createTexture(this.textureDescriptor);
  }

  private async initPipeline(first: boolean) {
    let responce = await fetch("shaders/video.wgsl");
    let code = await responce?.text();
    if (!code) {
      throw "could not load shader source code";
    }

    this.shaderModule = this.device.createShaderModule({ code });
    let vertexBuffersDescriptors: GPUVertexBufferLayout =
    {
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: "float32x4",
        }
      ],
      arrayStride: 16,
      stepMode: "vertex",
    };

    this.pipeline = this.device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: this.shaderModule,
        entryPoint: "vertex_main",
        buffers: [vertexBuffersDescriptors],
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: "fragment_main",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
      },
    });

    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.camera.cameraBuffer
          }
        },
        {
          binding: 1, resource: this.texture.createView()
        },
        {
          binding: 2, resource: this.sampler
        }
      ]
    })

    this.renderPassDescriptor = {
      colorAttachments: <GPURenderPassColorAttachment[]>[
        {
          loadOp: first ? "clear" : "load",
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          storeOp: "store",
        },
      ],
    };

  }
  public onResize(size: number[]): void {
  }
}