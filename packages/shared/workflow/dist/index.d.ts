export interface WorkflowStep {
    id: string;
    name: string;
    description: string;
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    steps: WorkflowStep[];
}
export declare class WorkflowEngine {
    create(definition: WorkflowDefinition): WorkflowDefinition;
}
