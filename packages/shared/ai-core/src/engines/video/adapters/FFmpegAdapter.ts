import type { VideoEngineAdapter } from '../VideoEngineContract';

export class FFmpegAdapter implements VideoEngineAdapter {
  readonly name = 'ffmpeg';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {
    // Placeholder for future FFmpeg integration.
  }

  async dispose(): Promise<void> {
    // Placeholder for future FFmpeg cleanup.
  }
}
