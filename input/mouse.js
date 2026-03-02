export function setupMouse({
  canvas,
  engine,
  renderer,
  size,
  isRunning,
  pushUndoState,
  placeCell,
  setHoveredCell,
  getHoveredCell
}) {
  let isMouseDown = false;

  const updateHover = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / size);
    const y = Math.floor((e.clientY - rect.top) / size);

    setHoveredCell(
      x >= 0 && y >= 0 && x < engine.width && y < engine.height ? { x, y } : null
    );
  };

  const handlePaint = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / size);
    const y = Math.floor((e.clientY - rect.top) / size);

    if (!engine.inBounds(x, y)) return;

    if (e.buttons === 2) {
      if (engine.grid[y][x]) engine.grid[y][x] = null;
    } else {
      placeCell(x, y);
    }

    renderer.render();
  };

  canvas.addEventListener("mousedown", (e) => {
    if (isRunning()) return;
    isMouseDown = true;
    if (e.button === 0) pushUndoState();
    handlePaint(e);
  });

  canvas.addEventListener("mousemove", (e) => {
    updateHover(e);
    if (isMouseDown && !isRunning()) handlePaint(e);
    renderer.render();
  });

  canvas.addEventListener("mouseup", () => (isMouseDown = false));
  canvas.addEventListener("mouseleave", () => {
    isMouseDown = false;
    if (getHoveredCell()) {
      setHoveredCell(null);
      renderer.render();
    }
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
}
