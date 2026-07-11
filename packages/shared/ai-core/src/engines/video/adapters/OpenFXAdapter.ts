import type { VideoEngineAdapter } from '../VideoEngineContract';

export class OpenFXAdapter implements VideoEngineAdapter {
  readonly name = 'openfx';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {
    // Placeholder for future OpenFX integration.
  }

  async dispose(): Promise<void> {
    // Placeholder for future OpenFX cleanup.
  }
}
