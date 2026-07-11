export interface RenderJob {
  id: string;
  projectId: string;
  target: 'local' | 'cloud' | 'hybrid';
  status: 'queued' | 'running' | 'completed' | 'failed';
}

export class RenderQueue {
  createJob(projectId: string): RenderJob {
    return {
      id: `render-${Date.now()}`,
      projectId,
      target: 'local',
      status: 'queued'
    };
  }
}

export class ExportManager {
  exportProject(projectId: string): RenderJob {
    return new RenderQueue().createJob(projectId);
  }
}
