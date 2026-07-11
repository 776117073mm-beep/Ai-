import type { VideoEngineAdapter } from '../VideoEngineContract';

export class MLTAdapter implements VideoEngineAdapter {
  readonly name = 'mlt';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {
    // Placeholder for future MLT integration.
  }

  async dispose(): Promise<void> {
    // Placeholder for future MLT cleanup.
  }
}
