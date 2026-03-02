export function drawArrow(ctx, size, x, y, dir) {
  ctx.fillStyle = "#111";
  ctx.beginPath();

  const cx = x * size + size / 2;
  const cy = y * size + size / 2;
  const s = size / 3;

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

export function drawSliderMark(ctx, size, x, y, axis) {
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.beginPath();

  if (axis === "h") {
    ctx.moveTo(x * size + 5, y * size + size / 2);
    ctx.lineTo(x * size + size - 5, y * size + size / 2);
  } else {
    ctx.moveTo(x * size + size / 2, y * size + 5);
    ctx.lineTo(x * size + size / 2, y * size + size - 5);
  }

  ctx.stroke();
  ctx.lineWidth = 1;
}
