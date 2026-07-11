export interface KeyframeNode {
  id: string;
  property: string;
  frame: number;
  value: number;
}

export class KeyframeEngine {
  createKeyframe(property: string, frame: number, value: number): KeyframeNode {
    return {
      id: `keyframe-${Date.now()}`,
      property,
      frame,
      value
    };
  }
}
