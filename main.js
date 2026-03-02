import { WIDTH, HEIGHT, SIZE } from "./config.js";
import { Engine } from "./engine/Engine.js";
import { Renderer } from "./rendering/Renderer.js";
import { setupMouse } from "./input/mouse.js";

const engine = new Engine(WIDTH, HEIGHT);
const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");

const renderer = new Renderer(engine, ctx, SIZE);

setupMouse(canvas, engine, renderer);

renderer.render();