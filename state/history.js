export function snapshot() {
    return JSON.stringify(engine.grid);
}

export function restore(snapshotData) {
    const data = JSON.parse(snapshotData);

    engine.grid = engine.createGrid();

    for (let y = 0; y < Math.min(engine.height, data.length); y++) {
        for (let x = 0; x < Math.min(engine.width, data[y].length); x++) {
            engine.grid[y][x] = data[y][x] ? structuredClone(data[y][x]) : null;
        }
    }

    renderer.render();
}

export function pushUndoState(force = false) {
    if (isRunning && !force) return; // ❌ don't record during simulation

    const current = snapshot();

    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === current) return;

    undoStack.push(current);

    if (undoStack.length > MAX_HISTORY) undoStack.shift();

    redoStack.length = 0;
}

export function undo() {
    if (undoStack.length === 0) return; // nothing to undo

    const current = snapshot();
    redoStack.push(current); // save current state

    const previous = undoStack.pop(); // get last state
    if (previous) restore(previous); // restore it
}

export function redo() {
    if (redoStack.length === 0) return;

    const state = redoStack.pop();
    undoStack.push(state);
    restore(state);
}