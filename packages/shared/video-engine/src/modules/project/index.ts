export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  workspace: string;
  renderMode: 'local' | 'cloud' | 'hybrid';
  syncState: 'idle' | 'syncing' | 'offline';
}

export interface ProjectDocument {
  metadata: ProjectMetadata;
  media: string[];
  timeline: string;
  sequences: string[];
  effects: string[];
  transitions: string[];
  keyframes: string[];
  text: string[];
  audio: string[];
  aiHistory: string[];
  cloudSyncState: Record<string, unknown>;
  future3D: string[];
  futureMotionGraphics: string[];
  futureAnimation: string[];
}

export class ProjectManager {
  createProject(name: string): ProjectDocument {
    return {
      metadata: {
        id: `project-${Date.now()}`,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspace: 'default',
        renderMode: 'local',
        syncState: 'idle'
      },
      media: [],
      timeline: 'default-timeline',
      sequences: [],
      effects: [],
      transitions: [],
      keyframes: [],
      text: [],
      audio: [],
      aiHistory: [],
      cloudSyncState: {},
      future3D: [],
      futureMotionGraphics: [],
      futureAnimation: []
    };
  }
}
