function setupMouse(canvas, engine, renderer) {
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

}

export function updateHover(e) {
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

export function handlePaint(e) {
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
