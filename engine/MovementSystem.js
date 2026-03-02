import { CellTypes } from "../cells/CellTypes.js";

export const MovementSystem = {
  resolveChain(engine, x, y, dir, visited = new Set()) {
    const key = `${x},${y}`;
    if (visited.has(key)) return null;
    visited.add(key);

    if (!engine.inBounds(x, y)) return null;

    const cell = engine.grid[y][x];
    if (!cell) return [];

    if (cell.type === "wall") return null;
    if (cell.type === "trash" || cell.type === "enemy") return [];

    const def = CellTypes[cell.type];
    if (def?.canEnter && !def.canEnter(-dir.x, -dir.y, cell)) return null;

    const nx = x + dir.x;
    const ny = y + dir.y;

    const next = this.resolveChain(engine, nx, ny, dir, visited);
    if (!next) return null;

    return [...next, { from: { x, y }, to: { x: nx, y: ny } }];
  },

  applyMoves(engine, moves) {
    for (const move of moves) {
      const movingCell = engine.grid[move.from.y][move.from.x];
      const targetCell = engine.grid[move.to.y][move.to.x];
      if (!movingCell) continue;

      if (targetCell?.type === "trash") {
        engine.grid[move.from.y][move.from.x] = null;
        continue;
      }

      if (targetCell?.type === "enemy") {
        engine.grid[move.from.y][move.from.x] = null;
        engine.grid[move.to.y][move.to.x] = null;
        continue;
      }

      engine.grid[move.to.y][move.to.x] = movingCell;
      engine.grid[move.from.y][move.from.x] = null;
    }
  }
};
