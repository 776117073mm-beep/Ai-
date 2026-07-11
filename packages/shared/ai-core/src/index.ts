export * from './engines';

export interface AICommand {
  id: string;
  intent: string;
  payload: Record<string, unknown>;
}

export interface AIExecutionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export interface AIAgent {
  name: string;
  execute(command: AICommand): Promise<AIExecutionResult>;
}

export class AIOrchestrator {
  constructor(private readonly agents: AIAgent[]) {}

  async execute(command: AICommand): Promise<AIExecutionResult> {
    const agent = this.agents[0];
    if (!agent) {
      return { success: false, message: 'No AI agent registered.' };
    }

    return agent.execute(command);
  }
}
