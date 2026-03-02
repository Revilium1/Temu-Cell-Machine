export function drawArrow(x, y, dir) {
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

export function drawPaletteArrow(ctx, cx, cy, s, dir) {
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


export function drawSliderMark(x, y, axis) {
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