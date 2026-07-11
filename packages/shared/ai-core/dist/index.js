export * from './engines';
export class AIOrchestrator {
    constructor(agents) {
        Object.defineProperty(this, "agents", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: agents
        });
    }
    async execute(command) {
        const agent = this.agents[0];
        if (!agent) {
            return { success: false, message: 'No AI agent registered.' };
        }
        return agent.execute(command);
    }
}
