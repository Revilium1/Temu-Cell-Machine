import { CellTypes } from "../cells/CellTypes.js";
import { drawArrow, drawSliderMark } from "./DrawHelpers.js";

export class Renderer {
  constructor(engine, ctx, size, cellImages, getHoveredCell) {
    this.engine = engine;
    this.ctx = ctx;
    this.size = size;
    this.cellImages = cellImages;
    this.getHoveredCell = getHoveredCell;
  }

  render() {
    const { engine, ctx, size } = this;
    ctx.clearRect(0, 0, engine.width * size, engine.height * size);

    for (let y = 0; y < engine.height; y++) {
      for (let x = 0; x < engine.width; x++) {
        const cell = engine.grid[y][x];

        ctx.strokeStyle = "#222";
        ctx.strokeRect(x * size, y * size, size, size);

        if (!cell) continue;

        const img = this.cellImages[cell.type];
        if (img) {
          const cx = x * size + size / 2;
          const cy = y * size + size / 2;

          ctx.save();
          ctx.translate(cx, cy);
          let angle = 0;

if (cell.dir) {
  angle = this.getRotationAngle(cell.dir);
}
else if (cell.type === "slide") {
  // Horizontal = default orientation
  // Vertical = rotate 90°
  if (cell.axis === "v") {
    angle = Math.PI / 2;
  }
}

ctx.rotate(angle);
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
          continue;
        }

        const def = CellTypes[cell.type];
        ctx.fillStyle = def?.color || "#fff";
        ctx.fillRect(x * size, y * size, size, size);

        if (cell.dir) drawArrow(ctx, size, x, y, cell.dir);
        if (cell.type === "slide") drawSliderMark(ctx, size, x, y, cell.axis);
      }
    }

    const hoveredCell = this.getHoveredCell?.();
    if (hoveredCell) {
      ctx.strokeStyle = "#ffffff55";
      ctx.lineWidth = 2;
      ctx.strokeRect(hoveredCell.x * size, hoveredCell.y * size, size, size);
      ctx.lineWidth = 1;
    }
  }

  getRotationAngle(dir) {
    if (!dir) return 0;
    if (dir.x === 1 && dir.y === 0) return 0;
    if (dir.x === -1 && dir.y === 0) return Math.PI;
    if (dir.x === 0 && dir.y === 1) return Math.PI / 2;
    if (dir.x === 0 && dir.y === -1) return -Math.PI / 2;
    return 0;
  }
}
