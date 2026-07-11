import type { VideoEngineAdapter } from './index';

export class OpenFXAdapter implements VideoEngineAdapter {
  readonly name = 'openfx';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {}
  async dispose(): Promise<void> {}

  getEffects() {
    return [
      { id: 'color-correct', name: 'Color Correct', kind: 'effect' as const },
      { id: 'blur', name: 'Blur', kind: 'effect' as const },
      { id: 'sharpen', name: 'Sharpen', kind: 'effect' as const },
      { id: 'noise-reduction', name: 'Noise Reduction', kind: 'effect' as const }
    ];
  }
}
