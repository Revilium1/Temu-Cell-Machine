import { MovementSystem } from "../engine/MovementSystem.js";

export const RotaterSystem = {
    run(engine) {
        const rotations = [];

        for (let y = 0; y < engine.height; y++) {
            for (let x = 0; x < engine.width; x++) {

                const cell = engine.grid[y][x];
                if (!cell) continue;

                const isCW = cell.type === "rotater-cw";
                const isCCW = cell.type === "rotater-ccw";
                if (!isCW && !isCCW) continue;

                const neighbors = [{
                        x,
                        y: y - 1
                    },
                    {
                        x,
                        y: y + 1
                    },
                    {
                        x: x - 1,
                        y
                    },
                    {
                        x: x + 1,
                        y
                    }
                ];

                for (const n of neighbors) {
                    if (!engine.inBounds(n.x, n.y)) continue;
                    const target = engine.grid[n.y][n.x];
                    if (!target) continue;
                    if (target.type === "trash") continue; // Add this line to skip trash cells
                    if (!target.dir && target.type !== "slide") continue;

                    rotations.push({
                        cell: target,
                        clockwise: isCW
                    });
                }
            }
        }

        for (const r of rotations) {
            rotateCell(r.cell, r.clockwise);
        }
    }
};