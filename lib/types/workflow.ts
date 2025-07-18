export type WorkflowNode = {
  id: string;
  type: "workflowNode";
  position: { x: number; y: number };
  data: {
    type: "human-input" | "agent-task";
    agent: string;
    description: string;
  };
};

export type WorkflowEdge = {
  id: string;
  type: "custom";
  source: string;
  target: string;
};

export interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  schema: {
    id: string;
    name: string;
    description: string | null;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  createdAt: string;
  updatedAt: string;
}

export type WorkflowNodeProgress = {
  status: "pending" | "running" | "completed" | "error";
  output?: string;
  error?: string;
  description?: string;
};

export interface WorkflowDetailsProps {
  workflow: WorkflowData;
  inputQuery: string;
  setInputQuery: (query: string) => void;
  onRunWorkflow: () => void;
  isExecuting: boolean;
}

export interface NodeOutputProps {
  nodeResults: any[];
}

export interface WorkflowOutputProps {
  nodeResults: any[];
  workflow: WorkflowData | null;
}
