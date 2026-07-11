export interface TransitionNode {
  id: string;
  pluginId: string;
  name: string;
  duration: number;
}

export class TransitionEngine {
  createTransition(pluginId: string, name: string): TransitionNode {
    return {
      id: `transition-${Date.now()}`,
      pluginId,
      name,
      duration: 15
    };
  }
}
