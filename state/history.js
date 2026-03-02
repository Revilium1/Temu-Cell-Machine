export function createHistory({ maxHistory, getGrid, setGrid, render, isRunning }) {
  const undoStack = [];
  const redoStack = [];

  const snapshot = () => JSON.stringify(getGrid());

  const restore = (snapshotData) => {
    const data = JSON.parse(snapshotData);
    setGrid(data.map((row) => row.map((cell) => (cell ? structuredClone(cell) : null))));
    render();
  };

  const pushUndoState = (force = false) => {
    if (isRunning() && !force) return;

    const current = snapshot();
    if (undoStack.at(-1) === current) return;

    undoStack.push(current);
    if (undoStack.length > maxHistory) undoStack.shift();
    redoStack.length = 0;
  };

  const undo = () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
  };

  const redo = () => {
    if (!redoStack.length) return;
    const state = redoStack.pop();
    undoStack.push(state);
    restore(state);
  };

  return { pushUndoState, undo, redo };
}
