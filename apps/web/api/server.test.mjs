import { describe, expect, it } from 'vitest';
import { buildWaveformSamples, extractMultipartFileInfo } from './server.mjs';

describe('buildWaveformSamples', () => {
  it('handles odd-length PCM buffers without throwing', () => {
    const buffer = Buffer.from([0x00, 0x01, 0x02]);

    expect(() => buildWaveformSamples(buffer)).not.toThrow();
    expect(buildWaveformSamples(buffer)).toHaveLength(1);
  });
});

describe('extractMultipartFileInfo', () => {
  it('extracts the uploaded filename and file payload from multipart form data', () => {
    const boundary = '----boundary';
    const body = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="sample.mp4"\r\nContent-Type: video/mp4\r\n\r\nhello-bytes\r\n--${boundary}--\r\n`);

    const result = extractMultipartFileInfo(body, `multipart/form-data; boundary=${boundary}`, 'fallback.mp4');

    expect(result.originalName).toBe('sample.mp4');
    expect(result.fileBuffer.toString()).toBe('hello-bytes');
  });
});
