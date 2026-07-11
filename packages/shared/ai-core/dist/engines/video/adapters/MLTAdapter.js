export class MLTAdapter {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'mlt'
        });
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '1.0.0'
        });
    }
    async initialize() {
        // Placeholder for future MLT integration.
    }
    async dispose() {
        // Placeholder for future MLT cleanup.
    }
}
