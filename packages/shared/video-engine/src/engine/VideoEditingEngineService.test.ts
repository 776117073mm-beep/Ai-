import { promises as fs } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { VideoEditingEngineService } from './VideoEditingEngineService';

async function ensureSampleVideo(path: string) {
  await fs.writeFile(path, 'placeholder');
}

describe('VideoEditingEngineService', () => {
  it('creates a project and imports media', async () => {
    const samplePath = '/tmp/sample.mp4';
    await ensureSampleVideo(samplePath);
    const service = new VideoEditingEngineService();
    const project = await service.createProject('Demo');
    const result = await service.importMedia(project.project.metadata.id, samplePath, 'sample.mp4');

    expect(project.project.metadata.name).toBe('Demo');
    expect(result.asset.id).toBeDefined();
    expect(result.analysis.durationSeconds).toBeGreaterThan(0);
    expect(result.clip.id).toBeDefined();
  });

  it('supports timeline operations', async () => {
    const samplePath = '/tmp/sample.mp4';
    await ensureSampleVideo(samplePath);
    const service = new VideoEditingEngineService();
    const project = await service.createProject('Timeline');
    const imported = await service.importMedia(project.project.metadata.id, samplePath, 'sample.mp4');

    const trimmed = service.trimClip(project.project.metadata.id, imported.clip.id, 10, 120);
    const split = service.splitClip(project.project.metadata.id, imported.clip.id, 60);
    const moved = service.moveClip(project.project.metadata.id, split[0].id, 'track-video-2', 90);

    expect(trimmed.inPoint).toBe(10);
    expect(split).toHaveLength(2);
    expect(moved.trackId).toBe('track-video-2');
  });
});
