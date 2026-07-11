export interface PanelLayoutState {
  id: string;
  name: string;
  docked: boolean;
  collapsed: boolean;
  width?: number;
  height?: number;
}

export interface WorkspaceState {
  panels: PanelLayoutState[];
  keyboardShortcutsEnabled: boolean;
  aiPanelCollapsed: boolean;
}

export class WorkspaceManager {
  createWorkspace(): WorkspaceState {
    return {
      panels: [
        { id: 'project-panel', name: 'Project Panel', docked: true, collapsed: false, width: 280 },
        { id: 'media-browser', name: 'Media Browser', docked: true, collapsed: false, width: 280 },
        { id: 'effects-library', name: 'Effects Library', docked: true, collapsed: false, width: 280 },
        { id: 'transitions-library', name: 'Transitions Library', docked: true, collapsed: false, width: 280 },
        { id: 'preview-panel', name: 'Live Preview', docked: true, collapsed: false, height: 320 },
        { id: 'timeline-panel', name: 'Professional Timeline', docked: true, collapsed: false, height: 280 },
        { id: 'inspector-panel', name: 'Properties Inspector', docked: true, collapsed: false, width: 320 },
        { id: 'audio-mixer', name: 'Audio Mixer', docked: true, collapsed: false, width: 320 },
        { id: 'status-bar', name: 'Status Bar', docked: true, collapsed: false, height: 48 },
        { id: 'ai-panel', name: 'AI Assistant', docked: false, collapsed: true, width: 360 }
      ],
      keyboardShortcutsEnabled: true,
      aiPanelCollapsed: true
    };
  }
}
