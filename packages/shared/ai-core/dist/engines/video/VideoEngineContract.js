export class VideoEngine {
    constructor(adapter) {
        Object.defineProperty(this, "adapter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: adapter
        });
    }
    async createProject(name) {
        await this.adapter.initialize();
        return {
            id: crypto.randomUUID(),
            name,
            tracks: [],
            markers: []
        };
    }
    async openProject(id) {
        await this.adapter.initialize();
        return {
            id,
            name: 'Loaded project',
            tracks: [],
            markers: []
        };
    }
}
