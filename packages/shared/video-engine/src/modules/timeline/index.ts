export * from './sequence';
export * from './track';
export * from './clip';
export * from './effects';
export * from './transitions';
export * from './keyframes';
export * from './audio';

export type TrackKind = 'video' | 'audio' | 'subtitle' | 'effect';

export interface TimelineTrack {
  id: string;
  kind: TrackKind;
  name: string;
  locked: boolean;
  muted: boolean;
  solo: boolean;
  enabled: boolean;
}

export interface TimelineMarker {
  id: string;
  frame: number;
  label: string;
}

export interface TimelineRegion {
  id: string;
  startFrame: number;
  endFrame: number;
  label: string;
}

export interface TimelineSequence {
  id: string;
  name: string;
  tracks: TimelineTrack[];
  markers: TimelineMarker[];
  regions: TimelineRegion[];
  nestedSequences: string[];
  adjustmentLayers: string[];
  compoundClips: string[];
}

export interface TimelineState {
  id: string;
  sequences: TimelineSequence[];
  zoom: number;
  frameRate: number;
  snapping: boolean;
  rippleEditing: boolean;
  rollingEdit: boolean;
  slipEdit: boolean;
  slideEdit: boolean;
  virtualizationEnabled: boolean;
  cachingEnabled: boolean;
}

export class TimelineEngine {
  createState(id: string): TimelineState {
    return {
      id,
      sequences: [],
      zoom: 1,
      frameRate: 30,
      snapping: true,
      rippleEditing: false,
      rollingEdit: false,
      slipEdit: false,
      slideEdit: false,
      virtualizationEnabled: true,
      cachingEnabled: true
    };
  }

  createSequence(name: string): TimelineSequence {
    return {
      id: `sequence-${Date.now()}`,
      name,
      tracks: [],
      markers: [],
      regions: [],
      nestedSequences: [],
      adjustmentLayers: [],
      compoundClips: []
    };
  }
}
