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
export declare class AIOrchestrator {
    private readonly agents;
    constructor(agents: AIAgent[]);
    execute(command: AICommand): Promise<AIExecutionResult>;
}
