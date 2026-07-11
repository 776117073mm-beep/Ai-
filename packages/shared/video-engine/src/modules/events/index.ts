export type VideoEventName =
  | 'project.opened'
  | 'project.changed'
  | 'timeline.updated'
  | 'preview.frame'
  | 'render.started'
  | 'render.completed'
  | 'asset.imported'
  | 'command.executed';

export interface VideoEvent<TPayload = Record<string, unknown>> {
  type: VideoEventName;
  payload: TPayload;
  timestamp: number;
}

export interface VideoEventBus {
  publish<TPayload>(event: VideoEvent<TPayload>): void;
  subscribe(listener: (event: VideoEvent) => void): () => void;
}

export class DefaultVideoEventBus implements VideoEventBus {
  private listeners = new Set<(event: VideoEvent) => void>();

  publish<TPayload>(event: VideoEvent<TPayload>): void {
    for (const listener of this.listeners) {
      listener(event as VideoEvent);
    }
  }

  subscribe(listener: (event: VideoEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
