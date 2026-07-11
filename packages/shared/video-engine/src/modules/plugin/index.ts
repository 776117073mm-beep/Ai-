export interface PluginDefinition {
  id: string;
  name: string;
  kind: 'effect' | 'transition' | 'audio' | 'utility';
}

export class PluginManager {
  register(plugin: PluginDefinition): PluginDefinition {
    return plugin;
  }
}
