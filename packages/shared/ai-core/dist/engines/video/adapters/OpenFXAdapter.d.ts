import type { VideoEngineAdapter } from '../VideoEngineContract';
export declare class OpenFXAdapter implements VideoEngineAdapter {
    readonly name = "openfx";
    readonly version = "1.0.0";
    initialize(): Promise<void>;
    dispose(): Promise<void>;
}
