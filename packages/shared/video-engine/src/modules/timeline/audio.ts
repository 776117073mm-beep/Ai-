export interface AudioTrackNode {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  solo: boolean;
}

export class AudioEngine {
  createTrack(name: string): AudioTrackNode {
    return {
      id: `audio-${Date.now()}`,
      name,
      volume: 1,
      muted: false,
      solo: false
    };
  }
}
