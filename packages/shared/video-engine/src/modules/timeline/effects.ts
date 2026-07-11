export interface EffectNode {
  id: string;
  pluginId: string;
  name: string;
  parameters: Record<string, unknown>;
}

export class EffectEngine {
  createEffect(pluginId: string, name: string): EffectNode {
    return {
      id: `effect-${Date.now()}`,
      pluginId,
      name,
      parameters: {}
    };
  }
}
