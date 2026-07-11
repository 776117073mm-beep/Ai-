export interface SequenceNode {
  id: string;
  name: string;
  parentId?: string;
  kind: 'sequence' | 'clip' | 'group' | 'adjustment-layer' | 'compound-clip';
}

export class SequenceEngine {
  createNode(name: string, kind: SequenceNode['kind']): SequenceNode {
    return {
      id: `node-${Date.now()}`,
      name,
      kind
    };
  }
}
