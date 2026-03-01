/* ================================
   CONFIG
================================ */

const WIDTH = 25;
const HEIGHT = 18;
const SIZE = 32;
const CellImages = {};
const MAX_HISTORY = 100;

let TICK_RATE = 10;
let interval = null;
let selectedType = "mover";
let hoveredCell = null;
let undoStack = [];
let redoStack = [];
/* ================================
   ENGINE
================================ */

class Engine {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = this.createGrid();
    }

    createGrid() {
        return Array.from({
                length: this.height
            }, () =>
            Array.from({
                length: this.width
            }, () => null)
        );
    }

    inBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }

    tick() {
        RotaterSystem.run(this);
        GeneratorSystem.run(this);
        PullerSystem.run(this);
        PusherSystem.run(this);
        TrashPusherSystem.run(this);
    }
}

const engine = new Engine(WIDTH, HEIGHT);

/* ================================
   CELL DEFINITIONS
================================ */

const CellTypes = {
    wall: {
        color: "#666"
    },

    push: {
        color: "#ff0"
    },

    mover: {
        color: "#00a"
    },

    generator: {
        color: "#00ff00"
    },

    "rotater-cw": {
        color: "#ff8800"
    },

    "rotater-ccw": {
        color: "#0088ff"
    },

    slide: {
        color: "#0099ff",
        canEnter(dx, dy, cell) {
            if (cell.axis === "h" && dy !== 0) return false;
            if (cell.axis === "v" && dx !== 0) return false;
            return true;
        }
    },
    trash: {
        color: "#ff00ff",
        canEnter(dx, dy, cell) {
            // Trash blocks movement into it, but destroys the incoming cell
            return true; // allow movement so we can destroy the moving cell in applyMoves
        }

    },
    puller: {
        color: "#a0a"
    },
    "trash-mover": {
        color: "#ff4444"
    },
    enemy: {
        color: "#aa0000",
        canEnter(dx, dy, cell) {
            return true; // allow movement into it
        }
    },
    "one-directional": {
        color: "#ffaa00",
        "one-directional": {
    color: "#ffaa00",
    canEnter(dx, dy, cell) {
        if (!cell.dir) return false;

        // Allow entry only from the opposite of its facing direction
        return dx === -cell.dir.x && dy === -cell.dir.y;
    }
},
    },
};

/* ================================
   MOVEMENT SYSTEM
================================ */

const MovementSystem = {

    resolveChain(engine, x, y, dir, visited) {
        const key = `${x},${y}`;
        if (visited.has(key)) return null;
        visited.add(key);

        if (!engine.inBounds(x, y)) return null;

        const cell = engine.grid[y][x];

        // Empty tile = chain success
        if (!cell) return [];

        // Wall blocks completely
        if (cell.type === "wall") return null;

        // Trash is VALID endpoint (movement allowed INTO it)
        if (cell.type === "trash" || cell.type === "enemy") {
            return []; // Stop chain here, allow movement
        }

        const def = CellTypes[cell.type];

        if (def?.canEnter && !def.canEnter(dir.x, dir.y, cell))
            return null;

        const nx = x + dir.x;
        const ny = y + dir.y;

        const next = this.resolveChain(engine, nx, ny, dir, visited);
        if (!next) return null;

        return [
            ...next,
            {
                from: {
                    x,
                    y
                },
                to: {
                    x: nx,
                    y: ny
                }
            }
        ];
    },

    applyMoves(engine, moves) {

        for (const move of moves) {

            const movingCell = engine.grid[move.from.y][move.from.x];
            const targetCell = engine.grid[move.to.y][move.to.x];

            if (!movingCell) continue;

            // Trash → destroy mover only
            if (targetCell && targetCell.type === "trash") {
                engine.grid[move.from.y][move.from.x] = null;
                continue;
            }

            // Enemy → destroy BOTH
            if (targetCell && targetCell.type === "enemy") {
                engine.grid[move.from.y][move.from.x] = null;
                engine.grid[move.to.y][move.to.x] = null;
                continue;
            }

            // Normal movement
            engine.grid[move.to.y][move.to.x] = movingCell;
            engine.grid[move.from.y][move.from.x] = null;
        }
    }
};

/* ================================
   SYSTEMS
================================ */

const RotaterSystem = {
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

const GeneratorSystem = {
    run(engine) {

        const allMoves = [];
        const spawns = [];
        const occupied = new Set();

        for (let y = 0; y < engine.height; y++) {
            for (let x = 0; x < engine.width; x++) {

                const cell = engine.grid[y][x];
                if (!cell || cell.type !== "generator" || !cell.dir) continue;

                const {
                    x: dx,
                    y: dy
                } = cell.dir;

                const bx = x - dx;
                const by = y - dy;
                const fx = x + dx;
                const fy = y + dy;

                if (!engine.inBounds(bx, by) || !engine.inBounds(fx, fy))
                    continue;

                const behind = engine.grid[by][bx];
                if (!behind) continue;

                const moves = MovementSystem.resolveChain(
                    engine,
                    fx,
                    fy, {
                        x: dx,
                        y: dy
                    },
                    new Set()
                );

                if (!moves) continue;

                let conflict = false;
                for (const move of moves) {
                    const key = move.to.x + "," + move.to.y;
                    if (occupied.has(key)) {
                        conflict = true;
                        break;
                    }
                }

                if (!conflict) {
                    moves.forEach(m =>
                        occupied.add(m.to.x + "," + m.to.y)
                    );
                    allMoves.push(...moves);
                    spawns.push({
                        fx,
                        fy,
                        behind
                    });
                }
            }
        }

        MovementSystem.applyMoves(engine, allMoves);

        for (const {
                fx,
                fy,
                behind
            }
            of spawns) {
            engine.grid[fy][fx] = structuredClone(behind);
        }
    }
};

const PusherSystem = {
    run(engine) {

        const allMoves = [];
        const occupied = new Set();

        // Mark movers temporarily disabled if forces equal
        for (let y = 0; y < engine.height; y++) {
            let x = 0;
            while (x < engine.width) {
                // Skip empty/non-mover
                const cell = engine.grid[y][x];
                if (!cell || cell.type !== "mover" || cell.dir.x !== 1) {
                    x++;
                    continue;
                }

                // Build left chain
                const leftChain = [];
                let lx = x;
                while (engine.inBounds(lx, y)) {
                    const c = engine.grid[y][lx];
                    if (!c || c.type !== "mover" || c.dir.x !== 1) break;
                    leftChain.push({
                        x: lx,
                        y
                    });
                    lx++;
                }

                // Build right chain from opposite direction
                let rx = lx;
                if (!engine.inBounds(rx, y)) {
                    x = lx;
                    continue;
                }
                if (!engine.grid[y][rx] || engine.grid[y][rx].type !== "mover" || engine.grid[y][rx].dir.x !== -1) {
                    x = lx;
                    continue;
                }

                const rightChain = [];
                let rxi = rx;
                while (engine.inBounds(rxi, y)) {
                    const c = engine.grid[y][rxi];
                    if (!c || c.type !== "mover" || c.dir.x !== -1) break;
                    rightChain.push({
                        x: rxi,
                        y
                    });
                    rxi++;
                }

                // Determine gap between chains
                const gapStart = leftChain[leftChain.length - 1].x + 1;
                const gapEnd = rightChain[0].x - 1;
                const gapSize = gapEnd - gapStart + 1;

                if (gapSize < 0) {
                    x = rxi;
                    continue;
                } // only handle 1-space tie

                // Equal force? disable movers
                if (leftChain.length === rightChain.length) {
                    leftChain.forEach(c => engine.grid[c.y][c.x].disabledThisTick = true);
                    rightChain.forEach(c => engine.grid[c.y][c.x].disabledThisTick = true);
                }

                // Move to next
                x = rxi;
            }
        }

        // Vertical tie handling (top vs bottom)
        for (let x = 0; x < engine.width; x++) {
            let y = 0;
            while (y < engine.height) {
                const cell = engine.grid[y][x];
                if (!cell || cell.type !== "mover" || cell.dir.y !== 1) {
                    y++;
                    continue;
                }

                // Build top chain
                const topChain = [];
                let ty = y;
                while (engine.inBounds(x, ty)) {
                    const c = engine.grid[ty][x];
                    if (!c || c.type !== "mover" || c.dir.y !== 1) break;
                    topChain.push({
                        x,
                        y: ty
                    });
                    ty++;
                }

                // Build bottom chain
                let by = ty;
                if (!engine.inBounds(x, by)) {
                    y = ty;
                    continue;
                }
                if (!engine.grid[by][x] || engine.grid[by][x].type !== "mover" || engine.grid[by][x].dir.y !== -1) {
                    y = ty;
                    continue;
                }

                const bottomChain = [];
                let byi = by;
                while (engine.inBounds(x, byi)) {
                    const c = engine.grid[byi][x];
                    if (!c || c.type !== "mover" || c.dir.y !== -1) break;
                    bottomChain.push({
                        x,
                        y: byi
                    });
                    byi++;
                }

                // Gap
                const gapStart = topChain[topChain.length - 1].y + 1;
                const gapEnd = bottomChain[0].y - 1;
                const gapSize = gapEnd - gapStart + 1;

                if (gapSize < 0) {
                    y = byi;
                    continue;
                }

                if (topChain.length === bottomChain.length) {
                    topChain.forEach(c => engine.grid[c.y][c.x].disabledThisTick = true);
                    bottomChain.forEach(c => engine.grid[c.y][c.x].disabledThisTick = true);
                }

                y = byi;
            }
        }

        // ===== normal chain resolution =====
        for (let y = 0; y < engine.height; y++) {
            for (let x = 0; x < engine.width; x++) {
                const cell = engine.grid[y][x];
                if (!cell || cell.type !== "mover" || cell.disabledThisTick) continue;

                const moves = MovementSystem.resolveChain(
                    engine,
                    x,
                    y,
                    cell.dir,
                    new Set()
                );

                if (!moves) continue;

                let conflict = false;
                for (const move of moves) {
                    const key = move.to.x + "," + move.to.y;
                    if (occupied.has(key)) {
                        conflict = true;
                        break;
                    }
                }

                if (!conflict) {
                    moves.forEach(m => occupied.add(m.to.x + "," + m.to.y));
                    allMoves.push(...moves);
                }
            }
        }

        MovementSystem.applyMoves(engine, allMoves);

        // Cleanup
        for (let y = 0; y < engine.height; y++) {
            for (let x = 0; x < engine.width; x++) {
                const cell = engine.grid[y][x];
                if (cell && cell.disabledThisTick) delete cell.disabledThisTick;
            }
        }
    }
};

const PullerSystem = {
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

const TrashPusherSystem = {
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

/* ================================
   UTILITIES
================================ */

function rotateCell(cell, clockwise = true) {

    if (cell.type === "slide") {
        cell.axis = (cell.axis === "h") ? "v" : "h";
        return;
    }

    if (!cell.dir) return;

    const {
        x,
        y
    } = cell.dir;

    cell.dir = clockwise ?
        {
            x: -y,
            y: x
        } :
        {
            x: y,
            y: -x
        };
}

/* ================================
   RENDERER
================================ */

const canvas = document.getElementById("grid");
canvas.width = WIDTH * SIZE;
canvas.height = HEIGHT * SIZE;
const ctx = canvas.getContext("2d");

class Renderer {
    constructor(engine, ctx, size) {
        this.engine = engine;
        this.ctx = ctx;
        this.size = size;
    }

    render() {
        const {
            engine,
            ctx,
            size
        } = this;

        ctx.clearRect(0, 0, engine.width * size, engine.height * size);

        for (let y = 0; y < engine.height; y++) {
            for (let x = 0; x < engine.width; x++) {

                const cell = engine.grid[y][x];

                // Draw grid outline
                ctx.strokeStyle = "#222";
                ctx.strokeRect(x * size, y * size, size, size);

                if (!cell) continue;

                const img = CellImages[cell.type];

                if (img) {
                    // Center coordinates for rotation
                    const cx = x * size + size / 2;
                    const cy = y * size + size / 2;

                    ctx.save();
                    ctx.translate(cx, cy);

                    // Rotate according to cell.dir
                    const angle = this.getRotationAngle(cell.dir);
                    ctx.rotate(angle);

                    // Draw the image centered
                    ctx.drawImage(img, -size / 2, -size / 2, size, size);
                    ctx.restore();
                } else {
                    // Fallback color if image not found
                    const def = CellTypes[cell.type];
                    ctx.fillStyle = def?.color || "#fff";
                    ctx.fillRect(x * size, y * size, size, size);

                    if (cell.dir) {
                        drawArrow(x, y, cell.dir);
                    }
                                   // Slider mark overlay
                if (cell.type === "slide")
                    drawSliderMark(x, y, cell.axis);
                }

            }
        }

        // Highlight hovered cell
        if (hoveredCell) {
            ctx.strokeStyle = "#ffffff55";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                hoveredCell.x * size,
                hoveredCell.y * size,
                size,
                size
            );
            ctx.lineWidth = 1;
        }
    }

    // Helper: compute rotation in radians from direction
    getRotationAngle(dir) {
        if (!dir) return 0;
        if (dir.x === 1 && dir.y === 0) return 0; // right
        if (dir.x === -1 && dir.y === 0) return Math.PI; // left
        if (dir.x === 0 && dir.y === 1) return Math.PI / 2; // down
        if (dir.x === 0 && dir.y === -1) return -Math.PI / 2; // up
        return 0;
    }
}

const renderer = new Renderer(engine, ctx, SIZE);

/* ================================
   DRAW HELPERS
================================ */

function drawArrow(x, y, dir) {
    ctx.fillStyle = "#111";
    ctx.beginPath();

    const cx = x * SIZE + SIZE / 2;
    const cy = y * SIZE + SIZE / 2;
    const s = SIZE / 3;

    if (dir.x === 1) {
        ctx.moveTo(cx + s, cy);
        ctx.lineTo(cx - s, cy - s);
        ctx.lineTo(cx - s, cy + s);
    }
    if (dir.x === -1) {
        ctx.moveTo(cx - s, cy);
        ctx.lineTo(cx + s, cy - s);
        ctx.lineTo(cx + s, cy + s);
    }
    if (dir.y === 1) {
        ctx.moveTo(cx, cy + s);
        ctx.lineTo(cx - s, cy - s);
        ctx.lineTo(cx + s, cy - s);
    }
    if (dir.y === -1) {
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx - s, cy + s);
        ctx.lineTo(cx + s, cy + s);
    }

    ctx.closePath();
    ctx.fill();
}

function drawPaletteArrow(ctx, cx, cy, s, dir) {
    ctx.beginPath();

    if (dir.x === 1) {
        ctx.moveTo(cx + s, cy);
        ctx.lineTo(cx - s, cy - s);
        ctx.lineTo(cx - s, cy + s);
    }
    if (dir.x === -1) {
        ctx.moveTo(cx - s, cy);
        ctx.lineTo(cx + s, cy - s);
        ctx.lineTo(cx + s, cy + s);
    }
    if (dir.y === 1) {
        ctx.moveTo(cx, cy + s);
        ctx.lineTo(cx - s, cy - s);
        ctx.lineTo(cx + s, cy - s);
    }
    if (dir.y === -1) {
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx - s, cy + s);
        ctx.lineTo(cx + s, cy + s);
    }

    ctx.closePath();
    ctx.fill();
}


function drawSliderMark(x, y, axis) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();

    if (axis === "h") {
        ctx.moveTo(x * SIZE + 5, y * SIZE + SIZE / 2);
        ctx.lineTo(x * SIZE + SIZE - 5, y * SIZE + SIZE / 2);
    } else {
        ctx.moveTo(x * SIZE + SIZE / 2, y * SIZE + 5);
        ctx.lineTo(x * SIZE + SIZE / 2, y * SIZE + SIZE - 5);
    }

    ctx.stroke();
    ctx.lineWidth = 1;
}

/* ================================
   INPUT
================================ */
let isMouseDown = false;

canvas.addEventListener("mousedown", e => {
    if (isRunning) return;

    isMouseDown = true;

    if (e.button === 0) { // left click
        pushUndoState(); // snapshot BEFORE drag
    }

    handlePaint(e);
});

canvas.addEventListener("mousemove", e => {
    updateHover(e);
    if (isMouseDown && !isRunning) handlePaint(e); // don't push state here
    renderer.render();
});

canvas.addEventListener("mouseup", () => isMouseDown = false);
canvas.addEventListener("mouseleave", () => isMouseDown = false);

function updateHover(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / SIZE);
    const y = Math.floor((e.clientY - rect.top) / SIZE);

    hoveredCell =
        (x >= 0 && y >= 0 && x < engine.width && y < engine.height) ?
        {
            x,
            y
        } :
        null;
}

function handlePaint(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / SIZE);
    const y = Math.floor((e.clientY - rect.top) / SIZE);

    if (!engine.inBounds(x, y)) return;

    if (e.buttons === 2) { // right click
        if (engine.grid[y][x]) engine.grid[y][x] = null;
    } else {
        placeCell(x, y);
    }

    renderer.render();
}
canvas.addEventListener("contextmenu", e => e.preventDefault());

function placeCell(x, y) {

    if (selectedType === "mover")
        engine.grid[y][x] = {
            type: "mover",
            dir: {
                x: 1,
                y: 0
            }
        };

    if (selectedType === "push")
        engine.grid[y][x] = {
            type: "push"
        };

    if (selectedType === "wall")
        engine.grid[y][x] = {
            type: "wall"
        };

    if (selectedType === "generator")
        engine.grid[y][x] = {
            type: "generator",
            dir: {
                x: 1,
                y: 0
            }
        };

    if (selectedType === "rotater-cw")
        engine.grid[y][x] = {
            type: "rotater-cw"
        };

    if (selectedType === "rotater-ccw")
        engine.grid[y][x] = {
            type: "rotater-ccw"
        };

    if (selectedType === "slide")
        engine.grid[y][x] = {
            type: "slide",
            axis: "h"
        };
    if (selectedType === "trash")
        engine.grid[y][x] = {
            type: "trash"
        };
    if (selectedType === "puller")
        engine.grid[y][x] = {
            type: "puller",
            dir: {
                x: 1,
                y: 0
            }
        };
    if (selectedType === "trash-mover")
        engine.grid[y][x] = {
            type: "trash-mover",
            dir: {
                x: 1,
                y: 0
            }
        };
    if (selectedType === "enemy")
        engine.grid[y][x] = {
            type: "enemy"
        };
    if (selectedType === "one-directional")
        engine.grid[y][x] = {
            type: "one-directional",
            dir: {
                x: 1,
                y: 0
    }
    };
            
        
}

function snapshot() {
    return JSON.stringify(engine.grid);
}

function restore(snapshotData) {
    const data = JSON.parse(snapshotData);

    engine.grid = engine.createGrid();

    for (let y = 0; y < Math.min(engine.height, data.length); y++) {
        for (let x = 0; x < Math.min(engine.width, data[y].length); x++) {
            engine.grid[y][x] = data[y][x] ? structuredClone(data[y][x]) : null;
        }
    }

    renderer.render();
}

function pushUndoState(force = false) {
    if (isRunning && !force) return; // ❌ don't record during simulation

    const current = snapshot();

    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === current) return;

    undoStack.push(current);

    if (undoStack.length > MAX_HISTORY) undoStack.shift();

    redoStack.length = 0;
}

function undo() {
    if (undoStack.length === 0) return; // nothing to undo

    const current = snapshot();
    redoStack.push(current); // save current state

    const previous = undoStack.pop(); // get last state
    if (previous) restore(previous); // restore it
}

function redo() {
    if (redoStack.length === 0) return;

    const state = redoStack.pop();
    undoStack.push(state);
    restore(state);
}

/* ================================
   LOOP CONTROL
================================ */

let isRunning = false;

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

function setSpeed(val) {
    TICK_RATE = Number(val);
    stop();
    start();
}

function serializeGrid() {
    return JSON.stringify({
        width: engine.width,
        height: engine.height,
        grid: engine.grid
    });
}

function loadFromJSON(json) {
    try {
        const data = JSON.parse(json);

        if (!Array.isArray(data.grid))
            throw new Error("Invalid save format");

        stop();

        // Recreate clean grid
        engine.grid = engine.createGrid();

        for (let y = 0; y < Math.min(engine.height, data.grid.length); y++) {
            for (let x = 0; x < Math.min(engine.width, data.grid[y].length); x++) {

                const cell = data.grid[y][x];

                // Deep clone to avoid reference weirdness
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
    const data = serializeGrid();
    const blob = new Blob([data], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "grid-save.json";
    a.click();

    URL.revokeObjectURL(url);
}

function clearGrid() {
    pushUndoState(true); // force snapshot
    stop();
    engine.grid = engine.createGrid();
    renderer.render();
}

function step() {
    stop(); // ensure it's not running
    engine.tick(); // run one tick
    renderer.render(); // redraw
}

document.addEventListener("keydown", e => {
    if (!hoveredCell) return;

    const {
        x,
        y
    } = hoveredCell;
    const cell = engine.grid[y][x];
    if (!cell) return;

    if (e.key.toLowerCase() === "e") {
        rotateCell(cell, true);
    }

    if (e.key.toLowerCase() === "q") {
        rotateCell(cell, false);
    }

    renderer.render();
});

document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
    }

    if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
    }
});

document.getElementById("loadFile")
    .addEventListener("change", function() {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = e => {
            loadFromJSON(e.target.result);
        };

        reader.readAsText(file);
    });


function buildPalette() {
    const palette = document.getElementById("palette");
    palette.innerHTML = "";

    for (const type of Object.keys(CellTypes)) {
        const btn = document.createElement("button");
        btn.className = "palette-btn";
        btn.title = type; // hover name

        btn.onclick = () => {
            selectedType = type;
            document.querySelectorAll(".palette-btn")
                .forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
        };

        const img = CellImages[type];

        if (img && img.complete && img.naturalWidth > 0) {
            const preview = document.createElement("img");
            preview.src = img.src;
            preview.draggable = false;
            btn.appendChild(preview);
        } else {
            // fallback flat color preview with arrow if direction exists by default
            const swatch = document.createElement("div");
            swatch.style.background = CellTypes[type].color || "#fff";
            swatch.className = "swatch";
            btn.appendChild(swatch);

            // Draw arrow overlay on swatch if this type uses direction
            const dirTypes = new Set([
                "mover", "generator", "rotater-cw", "rotater-ccw", "puller", "trash-mover", "one-directional"
            ]);

            if (dirTypes.has(type)) {
                // draw arrow on swatch using a canvas overlay

                const canvasPreview = document.createElement("canvas");
canvasPreview.width = 40;
canvasPreview.height = 40;
canvasPreview.style.position = "absolute";
canvasPreview.style.top = "2px";
canvasPreview.style.left = "2px";
btn.style.position = "relative";
btn.appendChild(canvasPreview);
const ctxPreview = canvasPreview.getContext("2d");

ctxPreview.clearRect(0, 0, 40, 40);   // Clear transparent background
ctxPreview.fillStyle = "#111";         // Arrow color
drawPaletteArrow(ctxPreview, 20, 20, 10, {x: 1, y: 0}); // Draw arrow


            }
        }

        palette.appendChild(btn);
    }
}

function loadCellImages(types, callback) {
    let loaded = 0;
    const total = Object.keys(types).length;

    for (const type of Object.keys(types)) {
        const img = new Image();
        img.src = `images/${type}.png`;
        img.onload = () => {
            loaded++;
            if (loaded === total) callback();
        };
        img.onerror = () => {
            console.warn(`Image not found for cell type: ${type}`);
            loaded++;
            if (loaded === total) callback();
        };
        CellImages[type] = img;
    }
}

// Load all images before rendering
loadCellImages(CellTypes, () => {
    renderer.render();
   buildPalette();
});

buildPalette();

function resizeGrid(newWidth, newHeight) {
    pushUndoState(true); // force snapshot
    stop();

    const oldGrid = engine.grid;
    engine.width = newWidth;
    engine.height = newHeight;

    // Create new grid
    const newGrid = Array.from({
            length: newHeight
        }, (_, y) =>
        Array.from({
                length: newWidth
            }, (_, x) =>
            oldGrid[y] && oldGrid[y][x] ? structuredClone(oldGrid[y][x]) : null
        )
    );

    engine.grid = newGrid;

    // Resize canvas
    canvas.width = newWidth * SIZE;
    canvas.height = newHeight * SIZE;

    renderer.render();
}

document.getElementById("resizeGrid").addEventListener("click", () => {
    const w = Number(document.getElementById("gridWidth").value);
    const h = Number(document.getElementById("gridHeight").value);
    if (w > 0 && h > 0) resizeGrid(w, h);
});

renderer.render();
pushUndoState();
