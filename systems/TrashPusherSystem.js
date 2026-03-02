import { MovementSystem } from "../engine/MovementSystem.js";

export const TrashPusherSystem = {
    run(engine) {

        const moves = [];
        const toDelete = [];

        for (let y = 0; y < engine.height; y++) {
            for (let x = 0; x < engine.width; x++) {

                const cell = engine.grid[y][x];
                if (!cell || cell.type !== "trash-mover") continue;

                const {
                    x: dx,
                    y: dy
                } = cell.dir;

                const fx = x + dx;
                const fy = y + dy;

                if (!engine.inBounds(fx, fy)) continue;

                const front = engine.grid[fy][fx];

                // Wall blocks completely
                if (front && front.type === "wall")
                    continue;

                // Trash takes priority → just move into it
                // applyMoves will delete the trash-mover
                if (front && front.type === "trash") {
                    moves.push({
                        from: {
                            x,
                            y
                        },
                        to: {
                            x: fx,
                            y: fy
                        }
                    });
                    continue;
                }

                // Any other cell → delete it first
                if (front) {
                    toDelete.push({
                        x: fx,
                        y: fy
                    });
                }

                // Then move forward
                moves.push({
                    from: {
                        x,
                        y
                    },
                    to: {
                        x: fx,
                        y: fy
                    }
                });
            }
        }

        // Perform deletions first
        for (const pos of toDelete) {
            engine.grid[pos.y][pos.x] = null;
        }

        // Then apply movement
        MovementSystem.applyMoves(engine, moves);
    }
};
