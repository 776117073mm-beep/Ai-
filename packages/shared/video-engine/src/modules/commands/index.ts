export * from './command-types';

export interface VideoCommandContext {
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface VideoCommand {
  id: string;
  type: string;
  context: VideoCommandContext;
  execute(): Promise<void>;
  undo(): Promise<void>;
}

export interface VideoCommandBus {
  execute(command: VideoCommand): Promise<void>;
  undo(): Promise<void>;
  redo(): Promise<void>;
}

export class DefaultVideoCommandBus implements VideoCommandBus {
  private history: VideoCommand[] = [];
  private future: VideoCommand[] = [];

  async execute(command: VideoCommand): Promise<void> {
    await command.execute();
    this.history.push(command);
    this.future = [];
  }

  async undo(): Promise<void> {
    const command = this.history.pop();
    if (!command) return;
    await command.undo();
    this.future.push(command);
  }

  async redo(): Promise<void> {
    const command = this.future.pop();
    if (!command) return;
    await command.execute();
    this.history.push(command);
  }
}

export class ImportMediaCommand implements VideoCommand {
  id: string;
  type = 'ImportMedia';
  context: VideoCommandContext;

  constructor(private readonly assetId: string, private readonly target: string) {
    this.id = `import:${assetId}`;
    this.context = { type: this.type, payload: { assetId, target }, timestamp: Date.now() };
  }

  async execute(): Promise<void> {
    // Placeholder for future import logic.
  }

  async undo(): Promise<void> {
    // Placeholder for future undo logic.
  }
}

export class SplitClipCommand implements VideoCommand {
  id: string;
  type = 'SplitClip';
  context: VideoCommandContext;

  constructor(private readonly clipId: string, private readonly frame: number) {
    this.id = `split:${clipId}:${frame}`;
    this.context = { type: this.type, payload: { clipId, frame }, timestamp: Date.now() };
  }

  async execute(): Promise<void> {
    // Placeholder for future split logic.
  }

  async undo(): Promise<void> {
    // Placeholder for future undo logic.
  }
}

export class TrimClipCommand implements VideoCommand {
  id: string;
  type = 'TrimClip';
  context: VideoCommandContext;

  constructor(private readonly clipId: string, private readonly start: number, private readonly end: number) {
    this.id = `trim:${clipId}`;
    this.context = { type: this.type, payload: { clipId, start, end }, timestamp: Date.now() };
  }

  async execute(): Promise<void> {
    // Placeholder for future trim logic.
  }

  async undo(): Promise<void> {
    // Placeholder for future undo logic.
  }
}

export class DeleteClipCommand implements VideoCommand {
  id: string;
  type = 'DeleteClip';
  context: VideoCommandContext;

  constructor(private readonly clipId: string) {
    this.id = `delete:${clipId}`;
    this.context = { type: this.type, payload: { clipId }, timestamp: Date.now() };
  }

  async execute(): Promise<void> {
    // Placeholder for future deletion logic.
  }

  async undo(): Promise<void> {
    // Placeholder for future undo logic.
  }
}

export class MoveClipCommand implements VideoCommand {
  id: string;
  type = 'MoveClip';
  context: VideoCommandContext;

  constructor(private readonly clipId: string, private readonly targetTrack: string, private readonly targetFrame: number) {
    this.id = `move:${clipId}`;
    this.context = { type: this.type, payload: { clipId, targetTrack, targetFrame }, timestamp: Date.now() };
  }

  async execute(): Promise<void> {
    // Placeholder for future move logic.
  }

  async undo(): Promise<void> {
    // Placeholder for future undo logic.
  }
}

export class ApplyTransitionCommand implements VideoCommand {
  id: string;
  type = 'ApplyTransition';
  context: VideoCommandContext;

  constructor(private readonly clipId: string, private readonly transitionId: string) {
    this.id = `transition:${clipId}:${transitionId}`;
    this.context = { type: this.type, payload: { clipId, transitionId }, timestamp: Date.now() };
  }

  async execute(): Promise<void> {
    // Placeholder for future transition logic.
  }

  async undo(): Promise<void> {
    // Placeholder for future undo logic.
  }
}

export class ApplyEffectCommand implements VideoCommand {
  id: string;
  type = 'ApplyEffect';
  context: VideoCommandContext;

  constructor(private readonly clipId: string, private readonly effectId: string) {
    this.id = `effect:${clipId}:${effectId}`;
    this.context = { type: this.type, payload: { clipId, effectId }, timestamp: Date.now() };
  }

  async execute(): Promise<void> {
    // Placeholder for future effect logic.
  }

  async undo(): Promise<void> {
    // Placeholder for future undo logic.
  }
}
