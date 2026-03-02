import { MovementSystem } from "../engine/MovementSystem.js";

export const GeneratorSystem = {
  run(engine) {
    const allMoves = [];
    const spawns = [];
    const occupied = new Set();

    for (let y = 0; y < engine.height; y++) {
      for (let x = 0; x < engine.width; x++) {
        const cell = engine.grid[y][x];
        if (!cell || cell.type !== "generator" || !cell.dir) continue;

        const { x: dx, y: dy } = cell.dir;
        const bx = x - dx;
        const by = y - dy;
        const fx = x + dx;
        const fy = y + dy;

        if (!engine.inBounds(bx, by) || !engine.inBounds(fx, fy)) continue;

        const behind = engine.grid[by][bx];
        if (!behind) continue;

        const moves = MovementSystem.resolveChain(engine, fx, fy, { x: dx, y: dy }, new Set());
        if (!moves) continue;

        let conflict = false;
        for (const move of moves) {
          const key = `${move.to.x},${move.to.y}`;
          if (occupied.has(key)) {
            conflict = true;
            break;
          }
        }

        if (!conflict) {
          moves.forEach((m) => occupied.add(`${m.to.x},${m.to.y}`));
          allMoves.push(...moves);
          spawns.push({ fx, fy, behind });
        }
      }
    }

    MovementSystem.applyMoves(engine, allMoves);
    for (const { fx, fy, behind } of spawns) {
      engine.grid[fy][fx] = structuredClone(behind);
    }
  }
};
