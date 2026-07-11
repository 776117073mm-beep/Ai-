export interface MetadataEntry {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
}

export interface MetadataState {
  entries: MetadataEntry[];
}

export class MetadataManager {
  createState(): MetadataState {
    return { entries: [] };
  }
}
