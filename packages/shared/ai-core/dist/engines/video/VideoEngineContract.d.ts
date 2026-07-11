export interface VideoEngineAdapter {
    readonly name: string;
    readonly version: string;
    initialize(): Promise<void>;
    dispose(): Promise<void>;
}
export interface VideoProjectState {
    id: string;
    name: string;
    tracks: string[];
    markers: string[];
}
export interface VideoEnginePort {
    createProject(name: string): Promise<VideoProjectState>;
    openProject(id: string): Promise<VideoProjectState>;
}
export declare class VideoEngine implements VideoEnginePort {
    private readonly adapter;
    constructor(adapter: VideoEngineAdapter);
    createProject(name: string): Promise<VideoProjectState>;
    openProject(id: string): Promise<VideoProjectState>;
}
