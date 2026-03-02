export const CellTypes = {
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
    canEnter(dx, dy, cell) {
        if (!cell.dir) return false;

        // Reverse it
        return dx === -cell.dir.x && dy === -cell.dir.y;
    }
},
};