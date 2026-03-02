export class Renderer {
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