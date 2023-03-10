

async function main() {
  const { BaseRenderer } = await import("./Renderer/BaseRenderer.js");
  const { VideoRenderStep } = await import("./Renderer/Step/VideoRenderStep.js");
  const { IcosahedronLatticeRenderStep } = await import("./Renderer/Step/IcosahedronLatticeRenderStep.js");
  let renderer = new BaseRenderer();
  let steps = [];
  //steps.push(new VideoRenderStep());
  steps.push(new IcosahedronLatticeRenderStep([36, 36, 36, 30]));
  renderer.init(steps).then(() => {
    renderer.start()
  });
}
main();