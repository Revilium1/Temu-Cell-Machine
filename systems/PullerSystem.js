import { MovementSystem } from "../engine/MovementSystem.js";

export const PullerSystem = {
    run(engine) {

        const moves = [];
        const occupied = new Set();

        for (let y = 0; y < engine.height; y++) {
            for (let x = 0; x < engine.width; x++) {

                const cell = engine.grid[y][x];
                if (!cell || cell.type !== "puller") continue;

                const {
                    x: dx,
                    y: dy
                } = cell.dir;

                const fx = x + dx;
                const fy = y + dy;

                if (!engine.inBounds(fx, fy)) continue;

                const frontCell = engine.grid[fy][fx];

                // ❗ Only move if front is empty or trash
                if (frontCell && frontCell.type !== "trash")
                    continue;

                const oldX = x;
                const oldY = y;

                // Move puller forward
                moves.push({
                    from: {
                        x: oldX,
                        y: oldY
                    },
                    to: {
                        x: fx,
                        y: fy
                    }
                });

                // If something is behind, pull it
                const bx = oldX - dx;
                const by = oldY - dy;

                if (engine.inBounds(bx, by)) {
                    const behindCell = engine.grid[by][bx];

                    if (behindCell) {
                        moves.push({
                            from: {
                                x: bx,
                                y: by
                            },
                            to: {
                                x: oldX,
                                y: oldY
                            }
                        });
                    }
                }
            }
        }

        MovementSystem.applyMoves(engine, moves);
    }
};
