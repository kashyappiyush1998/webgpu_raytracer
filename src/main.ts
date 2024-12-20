import { Scene } from "./scene";
import { Renderer } from "./renderer";

const canvas : HTMLCanvasElement = <HTMLCanvasElement> document.getElementById("gfx-main");
const change_every_frame : HTMLPreElement = <HTMLPreElement> document.getElementById("change-every-frame");
const change_every_second : HTMLPreElement = <HTMLPreElement> document.getElementById("change-every-second");

const scene: Scene = new Scene();

const renderer = new Renderer(canvas, change_every_frame, change_every_second, scene);

renderer.Initialize();
