import type { TimelineAdapter, PlaybackAdapter } from './index';

export class MLTAdapter implements TimelineAdapter, PlaybackAdapter {
  readonly name = 'mlt';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {}
  async dispose(): Promise<void> {}

  async createTimeline(projectId: string): Promise<string> {
    return projectId;
  }

  async syncTimeline(projectId: string): Promise<void> {}
  async preparePlayback(projectId: string): Promise<void> {}
}
