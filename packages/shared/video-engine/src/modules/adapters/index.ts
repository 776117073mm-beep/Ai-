export interface VideoEngineAdapter {
  readonly name: string;
  readonly version: string;
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}

export interface MediaAdapter extends VideoEngineAdapter {
  importAsset(source: string): Promise<string>;
  analyzeMedia(source: string, originalName: string): Promise<{ source: string; durationSeconds: number; width: number; height: number; fps: number; audioChannels: number; audioSampleRate: number; thumbnailPath?: string; proxyPath?: string; waveformPath?: string; codec?: string }>;
  generateThumbnail(source: string, outputPath: string): Promise<string>;
  generateWaveform(source: string, outputPath: string): Promise<string>;
  generateProxy(source: string, outputPath: string): Promise<string>;
}

export interface TimelineAdapter extends VideoEngineAdapter {
  createTimeline(projectId: string): Promise<string>;
  syncTimeline(projectId: string): Promise<void>;
}

export interface PlaybackAdapter extends VideoEngineAdapter {
  preparePlayback(projectId: string): Promise<void>;
}

export interface RenderAdapter extends VideoEngineAdapter {
  enqueueRender(projectId: string): Promise<string>;
  prepareExport(outputPath: string, frameCount: number): Promise<string>;
}

export * from './ffmpeg';
export * from './mlt';
export * from './opentimelineio';
export * from './openfx';
