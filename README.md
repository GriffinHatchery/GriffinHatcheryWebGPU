# GriffinHatcheryWebGPU
 
The project illustrates some things that can be done with WebGpu.

Everything is done from scratch. The transpiled javascript does not rely on other third party libraries. 
Although I build with NPM using typescript and have some other dev dependencies, the built website has no dependencies on other projects or node modules.

## Setup
The project requires npm to buld.

You will also need the Canary build of Chrome or use the `--enable-unsafe-webgpu` flag to run until WebGpu is no longer experimental.

I use Visual Studio Code as my development enviroment.

I use the wgsl-analyzer extention to help me write the wgsl shaders.

I use the Live Server extention set up to serve from dist using these setting:

> "liveServer.settings.root": "/dist"

> "liveServer.settings.AdvanceCustomBrowserCmdLine": "chrome.exe --enable-unsafe-webgpu" 

## Build
To build there are two options 

1. You can simply run '`npm run build`'. This will give you control of when things are rebuild.

2. Alternitively you can run '`npm run link`' to set up links between public files and dist and run '`npx tsc -w`' to automaticaly bulid the typescript. This is will allow the fastest development because any changes to any of the files take effect immediately.

Run '`npm run clean`' if you want to switch how you build.

## Run
I serve using the Live Server extention in Visual Studio Code. You can also just open a browser to dist/index.html. Make sure the `--enable-unsafe-webgpu` flag is enabled or you are useing Chrome Canary. If you are opening the file directly you will also need the `--allow-file-access-from-files` flag. 

*NOTE: `--enable-unsafe-webgpu` is no longer needed in Chrome Canary.