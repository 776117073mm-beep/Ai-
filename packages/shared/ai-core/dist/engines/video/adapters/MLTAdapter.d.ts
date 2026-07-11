import type { VideoEngineAdapter } from '../VideoEngineContract';
export declare class MLTAdapter implements VideoEngineAdapter {
    readonly name = "mlt";
    readonly version = "1.0.0";
    initialize(): Promise<void>;
    dispose(): Promise<void>;
}
