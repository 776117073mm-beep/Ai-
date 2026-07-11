export class OpenFXAdapter {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'openfx'
        });
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '1.0.0'
        });
    }
    async initialize() {
        // Placeholder for future OpenFX integration.
    }
    async dispose() {
        // Placeholder for future OpenFX cleanup.
    }
}
