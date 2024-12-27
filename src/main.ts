import { Scene } from "./scene";
import { Renderer } from "./renderer";

const canvas : HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("gfx-main");
const change_every_frame : HTMLPreElement = <HTMLPreElement> document.getElementById("change-every-frame");
const change_every_second : HTMLPreElement = <HTMLPreElement> document.getElementById("change-every-second");
const inputElement: HTMLInputElement = <HTMLInputElement> document.getElementById("input");

const scene: Scene = new Scene("dist/models/white_man_head.obj");
await scene.make_scene();

const renderer = new Renderer(canvas, scene, inputElement, change_every_frame, change_every_second);
await renderer.setupDevice();
await renderer.loadDefaultTexture();
await renderer.Initialize();
