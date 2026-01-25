import { Project } from '@ai-video-editor/shared-types';

export class HistoryManager {
  private undoStack: Project[] = [];
  private redoStack: Project[] = [];

  push(state: Project): void {
    // Store a deep copy of the state
    this.undoStack.push(JSON.parse(JSON.stringify(state)));
    // Clear redo stack on new action
    this.redoStack = [];
  }

  undo(currentState: Project): Project | undefined {
    const prev = this.undoStack.pop();
    if (prev) {
      this.redoStack.push(JSON.parse(JSON.stringify(currentState)));
      return prev;
    }
    return undefined;
  }

  redo(currentState: Project): Project | undefined {
    const next = this.redoStack.pop();
    if (next) {
      this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
      return next;
    }
    return undefined;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
