export function rotateCell(cell, clockwise = true) {
  if (!cell) return;

  if (cell.type === "slide") {
    cell.axis = cell.axis === "h" ? "v" : "h";
    return;
  }

  if (!cell.dir) return;

  const { x, y } = cell.dir;
  cell.dir = clockwise ? { x: -y, y: x } : { x: y, y: -x };
}
