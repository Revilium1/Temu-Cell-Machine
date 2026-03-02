import { MovementSystem } from "../engine/MovementSystem.js";

export const PullerSystem = {
  run(engine) {
    const moves = [];

    for (let y = 0; y < engine.height; y++) {
      for (let x = 0; x < engine.width; x++) {
        const cell = engine.grid[y][x];
        if (!cell || cell.type !== "puller") continue;

        const { x: dx, y: dy } = cell.dir;
        const fx = x + dx;
        const fy = y + dy;
        if (!engine.inBounds(fx, fy)) continue;

        const frontCell = engine.grid[fy][fx];
        if (frontCell && frontCell.type !== "trash") continue;

        moves.push({ from: { x, y }, to: { x: fx, y: fy } });

        const bx = x - dx;
        const by = y - dy;
        if (!engine.inBounds(bx, by)) continue;

        const behindCell = engine.grid[by][bx];
        if (behindCell) {
          moves.push({ from: { x: bx, y: by }, to: { x, y } });
        }
      }
    }

    MovementSystem.applyMoves(engine, moves);
  }
};
