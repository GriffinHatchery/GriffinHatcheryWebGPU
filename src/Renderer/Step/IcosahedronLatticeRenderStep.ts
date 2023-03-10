import { Camera } from "../../Util/Camera.js";
import type { RenderStep } from "./IRenderStep";
const Phi = (Math.sqrt(5) + 1) / 2;

export class IcosahedronLatticeRenderStep implements RenderStep {
  private device: GPUDevice;
  private vertexBuffer: GPUBuffer;
  private shaderModule: GPUShaderModule;
  private pipeline: GPURenderPipeline;
  private bindGroup: GPUBindGroup;
  private renderPassDescriptor: GPURenderPassDescriptor;
  private depthTexture: GPUTexture;
  private latticeSizeBuffer: GPUBuffer;
  private latticeCount: number;
  private camera: Camera;

  constructor(public latticeSize: number[]) {
    this.latticeCount = latticeSize[0] * latticeSize[1] * latticeSize[2];
  }
  public init(device: GPUDevice, camera: Camera, size: number[], first: boolean): Promise<void> {
    this.device = device;
    this.camera = camera
    this.initDepth(size);
    this.initVertices();
    this.initCamera();
    return this.initPipeline(first);
  }

  public initCamera() {
    this.latticeSizeBuffer = this.device.createBuffer(
      {
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true,
      }
    );
    new Int32Array(this.latticeSizeBuffer.getMappedRange()).set(this.latticeSize);
    this.latticeSizeBuffer.unmap();
  }

  public initDepth(size: number[]) {
    if (this.depthTexture) {
      this.depthTexture.destroy();
    }
    this.depthTexture = this.device.createTexture({
      size: <GPUExtent3DDictStrict>{
        width: size[0],
        height: size[1]
      },
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  private async initPipeline(first: boolean) {
    let responce = await fetch("shaders/icosahedronLattice.wgsl");
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
        },
        {
          shaderLocation: 1,
          offset: 16,
          format: "float32x4",
        }
      ],
      arrayStride: 32,
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
        cullMode: "front"
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      }
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
          binding: 1,
          resource: {
            buffer: this.latticeSizeBuffer
          }
        },
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
      depthStencilAttachment: <GPURenderPassDepthStencilAttachment>{
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
        view: this.depthTexture.createView()
      },
    };

  }

  private initVertices() {
    let vertices = [
      [1.0, 0, Phi, 1],  //0
      [1.0, 0, -Phi, 1], //1
      [-1.0, 0, Phi, 1], //2
      [-1.0, 0, -Phi, 1],//3

      [Phi, 1.0, 0, 1],  //4
      [-Phi, 1.0, 0, 1], //5
      [Phi, -1.0, 0, 1], //6
      [-Phi, -1.0, 0, 1],//7

      [0, Phi, 1.0, 1],  //8
      [0, Phi, -1.0, 1], //9
      [0, -Phi, 1.0, 1], //10
      [0, -Phi, -1.0, 1],//11
    ];

    let indices = [
      0, 2, 8,
      0, 8, 4,
      0, 4, 6,
      0, 6, 10,
      0, 10, 2,


      3, 1, 9,
      3, 9, 5,
      3, 5, 7,
      3, 7, 11,
      3, 11, 1,

      8, 9, 4,
      4, 9, 1,
      6, 4, 1,
      11, 6, 1,
      11, 10, 6,
      11, 7, 10,
      10, 7, 2,
      2, 7, 5,
      8, 2, 5,
      9, 8, 5
    ];

    let normals = this.makeNormals(vertices, indices);

    this.vertexBuffer = this.device.createBuffer({
      size: normals.length * 4,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Float32Array(this.vertexBuffer.getMappedRange()).set(normals);
    this.vertexBuffer.unmap();
  }

  public makeNormals(vertices: number[][], indices: number[]): number[] {
    let array = [];
    for (let i = 0; i < indices.length; i += 3) {
      let v1 = vertices[indices[i]];
      let v2 = vertices[indices[i + 1]];
      let v3 = vertices[indices[i + 2]];
      let norm = this.adv(v1, v2, v3);
      array.push(...v1, ...norm, ...v2, ...norm, ...v3, ...norm);
    }
    return array;
  }

  public adv(v1: number[], v2: number[], v3: number[]) {
    let x = v1[0] + v2[0] + v3[0];
    let y = v1[1] + v2[1] + v3[1];
    let z = v1[2] + v2[2] + v3[2];
    let norm = Math.sqrt(x * x + y * y + z * z);
    return [x / norm, y / norm, z / norm, 1];
  }

  public async prePass(): Promise<void> {

  }

  public onResize(size: number[]): void {
    this.initDepth(size);
    this.renderPassDescriptor.depthStencilAttachment.view = this.depthTexture.createView();
  }

  public makePass(commandEncoder: GPUCommandEncoder, view: GPUTextureView): void {
    (<GPURenderPassColorAttachment[]>this.renderPassDescriptor.colorAttachments)[0].view = view;
    let passEncoder =
      commandEncoder.beginRenderPass(this.renderPassDescriptor);

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.draw(20 * 3, this.latticeCount);

    passEncoder.end();
  }
}

