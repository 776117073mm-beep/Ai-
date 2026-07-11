import type { VideoEngineAdapter } from '../VideoEngineContract';
export declare class OpenTimelineIOAdapter implements VideoEngineAdapter {
    readonly name = "opentimelineio";
    readonly version = "1.0.0";
    initialize(): Promise<void>;
    dispose(): Promise<void>;
}
