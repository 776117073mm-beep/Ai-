export class FFmpegAdapter {
    constructor() {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'ffmpeg'
        });
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '1.0.0'
        });
    }
    async initialize() {
        // Placeholder for future FFmpeg integration.
    }
    async dispose() {
        // Placeholder for future FFmpeg cleanup.
    }
}
