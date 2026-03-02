import { RotaterSystem } from "../systems/RotaterSystem.js";
import { GeneratorSystem } from "../systems/GeneratorSystem.js";
import { PullerSystem } from "../systems/PullerSystem.js";
import { PusherSystem } from "../systems/PusherSystem.js";
import { TrashPusherSystem } from "../systems/TrashPusherSystem.js";

export class Engine {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = this.createGrid();
    }

    createGrid() {
        return Array.from({ length: this.height }, () =>
            Array.from({ length: this.width }, () => null)
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