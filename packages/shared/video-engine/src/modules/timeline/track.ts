export interface TrackNode {
  id: string;
  kind: 'video' | 'audio';
  name: string;
  locked: boolean;
  muted: boolean;
  solo: boolean;
  enabled: boolean;
}

export class TrackEngine {
  createTrack(kind: TrackNode['kind'], name: string): TrackNode {
    return {
      id: `track-${Date.now()}`,
      kind,
      name,
      locked: false,
      muted: false,
      solo: false,
      enabled: true
    };
  }
}
