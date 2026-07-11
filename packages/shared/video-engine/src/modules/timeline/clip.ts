export interface ClipNode {
  id: string;
  assetId: string;
  inPoint: number;
  outPoint: number;
  trackId: string;
  effects: string[];
  transitions: string[];
  keyframes: string[];
}

export class ClipEngine {
  createClip(assetId: string, trackId: string): ClipNode {
    return {
      id: `clip-${Date.now()}`,
      assetId,
      inPoint: 0,
      outPoint: 100,
      trackId,
      effects: [],
      transitions: [],
      keyframes: []
    };
  }
}
