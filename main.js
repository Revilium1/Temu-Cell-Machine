import { WIDTH, HEIGHT, SIZE, MAX_HISTORY } from "./config.js";
import { CellTypes } from "./cells/CellTypes.js";
import { Engine } from "./engine/Engine.js";
import { Renderer } from "./rendering/Renderer.js";
import { drawPaletteArrow } from "./rendering/DrawHelpers.js";
import { setupMouse } from "./input/mouse.js";
import { createHistory } from "./state/history.js";
import { rotateCell } from "./utils/rotateCell.js";

const CellImages = {};

let selectedType = "mover";
let hoveredCell = null;
let isRunning = false;
let interval = null;
let TICK_RATE = 10;

const engine = new Engine(WIDTH, HEIGHT);
const canvas = document.getElementById("grid");
canvas.width = WIDTH * SIZE;
canvas.height = HEIGHT * SIZE;
const ctx = canvas.getContext("2d");

const renderer = new Renderer(engine, ctx, SIZE, CellImages, () => hoveredCell);

const history = createHistory({
  maxHistory: MAX_HISTORY,
  getGrid: () => engine.grid,
  setGrid: (grid) => {
    engine.grid = engine.createGrid();
    for (let y = 0; y < Math.min(engine.height, grid.length); y++) {
      for (let x = 0; x < Math.min(engine.width, grid[y].length); x++) {
        engine.grid[y][x] = grid[y][x] ? structuredClone(grid[y][x]) : null;
      }
    }
  },
  render: () => renderer.render(),
  isRunning: () => isRunning
});

function placeCell(x, y) {
  if (selectedType === "mover") engine.grid[y][x] = { type: "mover", dir: { x: 1, y: 0 } };
  if (selectedType === "push") engine.grid[y][x] = { type: "push" };
  if (selectedType === "wall") engine.grid[y][x] = { type: "wall" };
  if (selectedType === "generator") engine.grid[y][x] = { type: "generator", dir: { x: 1, y: 0 } };
  if (selectedType === "rotater-cw") engine.grid[y][x] = { type: "rotater-cw" };
  if (selectedType === "rotater-ccw") engine.grid[y][x] = { type: "rotater-ccw" };
  if (selectedType === "slide") engine.grid[y][x] = { type: "slide", axis: "h" };
  if (selectedType === "trash") engine.grid[y][x] = { type: "trash" };
  if (selectedType === "puller") engine.grid[y][x] = { type: "puller", dir: { x: 1, y: 0 } };
  if (selectedType === "trash-mover") engine.grid[y][x] = { type: "trash-mover", dir: { x: 1, y: 0 } };
  if (selectedType === "enemy") engine.grid[y][x] = { type: "enemy" };
  if (selectedType === "one-directional") {
    engine.grid[y][x] = { type: "one-directional", dir: { x: 1, y: 0 } };
  }
}

setupMouse({
  canvas,
  engine,
  renderer,
  size: SIZE,
  isRunning: () => isRunning,
  pushUndoState: history.pushUndoState,
  placeCell,
  setHoveredCell: (cell) => {
    hoveredCell = cell;
  },
  getHoveredCell: () => hoveredCell
});

function start() {
  if (interval) return;
  isRunning = true;
  interval = setInterval(() => {
    engine.tick();
    renderer.render();
  }, 1000 / TICK_RATE);
}

function stop() {
  clearInterval(interval);
  interval = null;
  isRunning = false;
}

function step() {
  stop();
  engine.tick();
  renderer.render();
}

function setSpeed(val) {
  TICK_RATE = Number(val);
  if (interval) {
    stop();
    start();
  }
}

function clearGrid() {
  history.pushUndoState(true);
  stop();
  engine.grid = engine.createGrid();
  renderer.render();
}

function serializeGrid() {
  return JSON.stringify({ width: engine.width, height: engine.height, grid: engine.grid });
}

function loadFromJSON(json) {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data.grid)) throw new Error("Invalid save format");

    stop();
    engine.grid = engine.createGrid();

    for (let y = 0; y < Math.min(engine.height, data.grid.length); y++) {
      for (let x = 0; x < Math.min(engine.width, data.grid[y].length); x++) {
        const cell = data.grid[y][x];
        engine.grid[y][x] = cell ? structuredClone(cell) : null;
      }
    }

    renderer.render();
  } catch (err) {
    alert("Failed to load save file.");
    console.error(err);
  }
}

function saveToFile() {
  const blob = new Blob([serializeGrid()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "grid-save.json";
  a.click();
  URL.revokeObjectURL(url);
}

function resizeGrid(newWidth, newHeight) {
  history.pushUndoState(true);
  stop();

  const oldGrid = engine.grid;
  engine.width = newWidth;
  engine.height = newHeight;

  engine.grid = Array.from({ length: newHeight }, (_, y) =>
    Array.from({ length: newWidth }, (_, x) =>
      oldGrid[y] && oldGrid[y][x] ? structuredClone(oldGrid[y][x]) : null
    )
  );

  canvas.width = newWidth * SIZE;
  canvas.height = newHeight * SIZE;
  renderer.render();
}

function loadCellImages(types, callback) {
  let loaded = 0;
  const total = Object.keys(types).length;

  for (const type of Object.keys(types)) {
    const img = new Image();
    img.src = `images/${type}.png`;
    img.onload = img.onerror = () => {
      loaded++;
      if (loaded === total) callback();
    };
    CellImages[type] = img;
  }
}

function buildPalette() {
  const palette = document.getElementById("palette");
  palette.innerHTML = "";

  for (const type of Object.keys(CellTypes)) {
    const btn = document.createElement("button");
    btn.className = "palette-btn";
    btn.title = type;
    btn.onclick = () => {
      selectedType = type;
      document.querySelectorAll(".palette-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    };

    const img = CellImages[type];
    if (img && img.complete && img.naturalWidth > 0) {
      const preview = document.createElement("img");
      preview.src = img.src;
      preview.draggable = false;
      btn.appendChild(preview);
    } else {
      const swatch = document.createElement("div");
      swatch.className = "swatch";
      swatch.style.background = CellTypes[type].color || "#fff";
      btn.appendChild(swatch);

      const dirTypes = new Set([
        "mover",
        "generator",
        "rotater-cw",
        "rotater-ccw",
        "puller",
        "trash-mover",
        "one-directional"
      ]);

      if (dirTypes.has(type)) {
        btn.style.position = "relative";
        const canvasPreview = document.createElement("canvas");
        canvasPreview.width = 40;
        canvasPreview.height = 40;
        canvasPreview.style.position = "absolute";
        canvasPreview.style.top = "2px";
        canvasPreview.style.left = "2px";
        btn.appendChild(canvasPreview);

        const previewCtx = canvasPreview.getContext("2d");
        previewCtx.fillStyle = "#111";
        drawPaletteArrow(previewCtx, 20, 20, 10, { x: 1, y: 0 });
      }
    }

    palette.appendChild(btn);
  }
}

document.addEventListener("keydown", (e) => {
  if (!hoveredCell) return;

  const { x, y } = hoveredCell;
  const cell = engine.grid[y][x];
  if (!cell) return;

  if (e.key.toLowerCase() === "e") rotateCell(cell, true);
  if (e.key.toLowerCase() === "q") rotateCell(cell, false);
  renderer.render();
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "z") {
    e.preventDefault();
    history.undo();
  }

  if (e.ctrlKey && e.key.toLowerCase() === "y") {
    e.preventDefault();
    history.redo();
  }
});

document.getElementById("loadFile").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => loadFromJSON(e.target.result);
  reader.readAsText(file);
});

document.getElementById("resizeGrid").addEventListener("click", () => {
  const w = Number(document.getElementById("gridWidth").value);
  const h = Number(document.getElementById("gridHeight").value);
  if (w > 0 && h > 0) resizeGrid(w, h);
});

loadCellImages(CellTypes, () => {
  renderer.render();
  buildPalette();
});

buildPalette();
renderer.render();
history.pushUndoState();

window.start = start;
window.stop = stop;
window.step = step;
window.clearGrid = clearGrid;
window.setSpeed = setSpeed;
window.saveToFile = saveToFile;
