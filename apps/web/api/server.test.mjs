import { describe, expect, it } from 'vitest';
import { buildWaveformSamples } from './server.mjs';

describe('buildWaveformSamples', () => {
  it('handles odd-length PCM buffers without throwing', () => {
    const buffer = Buffer.from([0x00, 0x01, 0x02]);

    expect(() => buildWaveformSamples(buffer)).not.toThrow();
    expect(buildWaveformSamples(buffer)).toHaveLength(1);
  });
});
