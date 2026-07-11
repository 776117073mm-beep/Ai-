export interface SelectionState {
  clipIds: string[];
  trackIds: string[];
  range?: { startFrame: number; endFrame: number };
}

export class SelectionManager {
  createSelection(): SelectionState {
    return { clipIds: [], trackIds: [] };
  }
}
