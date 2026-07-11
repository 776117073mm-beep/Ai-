import type { TimelineAdapter } from './index';

export class OpenTimelineIOAdapter implements TimelineAdapter {
  readonly name = 'opentimelineio';
  readonly version = '1.0.0';

  async initialize(): Promise<void> {}
  async dispose(): Promise<void> {}

  async createTimeline(projectId: string): Promise<string> {
    return projectId;
  }

  async syncTimeline(projectId: string): Promise<void> {}
}
