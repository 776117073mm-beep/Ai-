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

export class VideoEngine implements VideoEnginePort {
  constructor(private readonly adapter: VideoEngineAdapter) {}

  async createProject(name: string): Promise<VideoProjectState> {
    await this.adapter.initialize();
    return {
      id: crypto.randomUUID(),
      name,
      tracks: [],
      markers: []
    };
  }

  async openProject(id: string): Promise<VideoProjectState> {
    await this.adapter.initialize();
    return {
      id,
      name: 'Loaded project',
      tracks: [],
      markers: []
    };
  }
}
