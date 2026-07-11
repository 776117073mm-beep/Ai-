import type { VideoEngineAdapter } from '../VideoEngineContract';
export declare class FFmpegAdapter implements VideoEngineAdapter {
    readonly name = "ffmpeg";
    readonly version = "1.0.0";
    initialize(): Promise<void>;
    dispose(): Promise<void>;
}
