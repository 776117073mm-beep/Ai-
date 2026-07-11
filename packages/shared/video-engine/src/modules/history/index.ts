export interface HistoryEntry {
  id: string;
  type: string;
  timestamp: number;
}

export class HistoryManager {
  private entries: HistoryEntry[] = [];

  push(entry: HistoryEntry): void {
    this.entries.push(entry);
  }

  getEntries(): HistoryEntry[] {
    return this.entries;
  }
}
