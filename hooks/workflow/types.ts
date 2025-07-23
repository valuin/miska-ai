import type {
  DynamicHandle,
  FlowEdge,
  FlowNode,
  WorkflowDefinition,
  WorkflowError,
} from '@/lib/utils/workflows/workflow';
import type {
  EdgeExecutionState,
  NodeExecutionState,
} from '@/lib/utils/workflows/workflow-execution-engine';
import type { Connection, EdgeChange, Node, NodeChange } from '@xyflow/react';
import type { WorkflowNodeProgress } from '@/lib/types/workflow';

export interface WorkflowState {
  resetWorkflow: () => void;
  generationProgress: number;
  generationMessage: string;
  showGenerationProgress: boolean;
  setGenerationProgress: (progress: number) => void;
  setGenerationMessage: (message: string) => void;
  setShowGenerationProgress: (show: boolean) => void;
  generateWorkflow: (prompt: string, file?: File) => Promise<void>;
  nodes: FlowNode[];
  edges: FlowEdge[];
  workflowName: string;
  workflowDescription: string;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  getNodeById: (nodeId: string) => FlowNode;
  createNode: (
    nodeType: FlowNode['type'],
    position: { x: number; y: number },
  ) => FlowNode;
  updateNode: <T extends FlowNode['type']>(
    id: string,
    nodeType: T,
    data: Partial<FlowNode['data']>,
  ) => void;
  updateNodeExecutionState: (
    nodeId: string,
    state: Partial<NodeExecutionState> | undefined,
  ) => void;
  updateEdgeExecutionState: (
    edgeId: string,
    state: Partial<EdgeExecutionState> | undefined,
  ) => void;
  deleteNode: (id: string) => void;
  addDynamicHandle: <T extends FlowNode['type']>(
    nodeId: string,
    nodeType: T,
    handleCategory: string,
    handle: Omit<DynamicHandle, 'id'>,
  ) => string;
  removeDynamicHandle: <T extends FlowNode['type']>(
    nodeId: string,
    nodeType: T,
    handleCategory: string,
    handleId: string,
  ) => void;
  // Workflow validation and execution state
  validateWorkflow: () => WorkflowDefinition;
  workflowExecutionState: {
    isRunning: boolean;
    finishedAt: string | null;
    errors: WorkflowError[];
    timesRun: number;
  };
  nodeUserInputs: Record<string, string>;
  updateNodeUserInput: (nodeId: string, input: string) => void;
  // execution
  validateInputsBeforeExecution: () => {
    isValid: boolean;
    errors: { nodeId: string; message: string }[];
  };
  startExecution: () => Promise<{
    status: 'success' | 'error';
    message: string;
    error?: Error;
    validationErrors?: WorkflowError[];
  }>;
  // Initialize workflow with nodes and edges
  initializeWorkflow: (
    nodes: FlowNode[],
    edges: FlowEdge[],
    name?: string,
    description?: string,
  ) => void;
  updateNodeExecutionStates: (
    workflowProgress: Map<string, WorkflowNodeProgress>,
  ) => void;
  updateEdgeStatusFromNodes: () => void;
}

export type GenerateTextData = {
  status: 'running' | 'error' | 'completed' | 'idle' | undefined;
  agent: string;
  type: 'human-input' | 'agent-task';
  description: string;
  model?: string;
  dynamicHandles?: {
    [key: string]: any[];
  };
};

export type GenerateTextNode = Node<GenerateTextData, 'generate-text'>;
