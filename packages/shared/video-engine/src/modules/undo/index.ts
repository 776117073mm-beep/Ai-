export interface UndoableAction {
  id: string;
  execute(): Promise<void>;
  undo(): Promise<void>;
}

export class UndoRedoManager {
  private undoStack: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];

  async execute(action: UndoableAction): Promise<void> {
    await action.execute();
    this.undoStack.push(action);
    this.redoStack = [];
  }

  async undo(): Promise<void> {
    const action = this.undoStack.pop();
    if (!action) return;
    await action.undo();
    this.redoStack.push(action);
  }

  async redo(): Promise<void> {
    const action = this.redoStack.pop();
    if (!action) return;
    await action.execute();
    this.undoStack.push(action);
  }
}
