import type { VideoEngineAdapter } from '../VideoEngineContract';

export class OpenTimelineIOAdapter implements VideoEngineAdapter {
  readonly name = 'opentimelineio';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {
    // Placeholder for future OpenTimelineIO integration.
  }

  async dispose(): Promise<void> {
    // Placeholder for future OpenTimelineIO cleanup.
  }
}
