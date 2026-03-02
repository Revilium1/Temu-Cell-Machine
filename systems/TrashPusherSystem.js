import { MovementSystem } from "../engine/MovementSystem.js";

export const TrashPusherSystem = {
  run(engine) {
    const moves = [];
    const toDelete = [];

    for (let y = 0; y < engine.height; y++) {
      for (let x = 0; x < engine.width; x++) {
        const cell = engine.grid[y][x];
        if (!cell || cell.type !== "trash-mover") continue;

        const { x: dx, y: dy } = cell.dir;
        const fx = x + dx;
        const fy = y + dy;
        if (!engine.inBounds(fx, fy)) continue;

        const front = engine.grid[fy][fx];
        if (front?.type === "wall") continue;

        if (front?.type === "trash") {
          moves.push({ from: { x, y }, to: { x: fx, y: fy } });
          continue;
        }

        if (front) toDelete.push({ x: fx, y: fy });
        moves.push({ from: { x, y }, to: { x: fx, y: fy } });
      }
    }

    for (const pos of toDelete) engine.grid[pos.y][pos.x] = null;
    MovementSystem.applyMoves(engine, moves);
  }
};
