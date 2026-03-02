import { MovementSystem } from "../engine/MovementSystem.js";

export const PusherSystem = {
  run(engine) {
    const allMoves = [];
    const occupied = new Set();

    for (let y = 0; y < engine.height; y++) {
      let x = 0;
      while (x < engine.width) {
        const cell = engine.grid[y][x];
        if (!cell || cell.type !== "mover" || cell.dir.x !== 1) {
          x++;
          continue;
        }

        const leftChain = [];
        let lx = x;
        while (engine.inBounds(lx, y)) {
          const c = engine.grid[y][lx];
          if (!c || c.type !== "mover" || c.dir.x !== 1) break;
          leftChain.push({ x: lx, y });
          lx++;
        }

        const rx = lx;
        if (!engine.inBounds(rx, y)) {
          x = lx;
          continue;
        }

        const rightStart = engine.grid[y][rx];
        if (!rightStart || rightStart.type !== "mover" || rightStart.dir.x !== -1) {
          x = lx;
          continue;
        }

        const rightChain = [];
        let rxi = rx;
        while (engine.inBounds(rxi, y)) {
          const c = engine.grid[y][rxi];
          if (!c || c.type !== "mover" || c.dir.x !== -1) break;
          rightChain.push({ x: rxi, y });
          rxi++;
        }

        const gapStart = leftChain[leftChain.length - 1].x + 1;
        const gapEnd = rightChain[0].x - 1;
        const gapSize = gapEnd - gapStart + 1;

        if (gapSize >= 0 && leftChain.length === rightChain.length) {
          leftChain.forEach((c) => (engine.grid[c.y][c.x].disabledThisTick = true));
          rightChain.forEach((c) => (engine.grid[c.y][c.x].disabledThisTick = true));
        }

        x = rxi;
      }
    }

    for (let x = 0; x < engine.width; x++) {
      let y = 0;
      while (y < engine.height) {
        const cell = engine.grid[y][x];
        if (!cell || cell.type !== "mover" || cell.dir.y !== 1) {
          y++;
          continue;
        }

        const topChain = [];
        let ty = y;
        while (engine.inBounds(x, ty)) {
          const c = engine.grid[ty][x];
          if (!c || c.type !== "mover" || c.dir.y !== 1) break;
          topChain.push({ x, y: ty });
          ty++;
        }

        const by = ty;
        if (!engine.inBounds(x, by)) {
          y = ty;
          continue;
        }

        const bottomStart = engine.grid[by][x];
        if (!bottomStart || bottomStart.type !== "mover" || bottomStart.dir.y !== -1) {
          y = ty;
          continue;
        }

        const bottomChain = [];
        let byi = by;
        while (engine.inBounds(x, byi)) {
          const c = engine.grid[byi][x];
          if (!c || c.type !== "mover" || c.dir.y !== -1) break;
          bottomChain.push({ x, y: byi });
          byi++;
        }

        const gapStart = topChain[topChain.length - 1].y + 1;
        const gapEnd = bottomChain[0].y - 1;
        const gapSize = gapEnd - gapStart + 1;

        if (gapSize >= 0 && topChain.length === bottomChain.length) {
          topChain.forEach((c) => (engine.grid[c.y][c.x].disabledThisTick = true));
          bottomChain.forEach((c) => (engine.grid[c.y][c.x].disabledThisTick = true));
        }

        y = byi;
      }
    }

    for (let y = 0; y < engine.height; y++) {
      for (let x = 0; x < engine.width; x++) {
        const cell = engine.grid[y][x];
        if (!cell || cell.type !== "mover" || cell.disabledThisTick) continue;

        const moves = MovementSystem.resolveChain(engine, x, y, cell.dir, new Set());
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
        }
      }
    }

    MovementSystem.applyMoves(engine, allMoves);

    for (let y = 0; y < engine.height; y++) {
      for (let x = 0; x < engine.width; x++) {
        const cell = engine.grid[y][x];
        if (cell?.disabledThisTick) delete cell.disabledThisTick;
      }
    }
  }
};
