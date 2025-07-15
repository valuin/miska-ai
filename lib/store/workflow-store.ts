import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    type: string;
    description: string;
    agent?: string;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface WorkflowProgress {
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: string;
  error?: string;
  description?: string;
}

interface WorkflowStore {
  // State
  workflowName: string;
  workflowDescription: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  currentNodeDescription: string;
  currentNodeAgent: string;
  prompt: string;
  file: File | null;
  isGenerating: boolean;
  clarificationQuestions: string[];
  workflowProgress: Map<string, WorkflowProgress>;
  isRunningWorkflow: boolean;
  executionMessage: string;
  generationProgress: number;
  generationMessage: string;
  showGenerationProgress: boolean;
  activeStep: number;
  open: boolean;

  // Actions
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  setCurrentNodeDescription: (description: string) => void;
  setCurrentNodeAgent: (agent: string) => void;
  setPrompt: (prompt: string) => void;
  setFile: (file: File | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setClarificationQuestions: (questions: string[]) => void;
  setWorkflowProgress: (progress: Map<string, WorkflowProgress>) => void;
  setIsRunningWorkflow: (isRunning: boolean) => void;
  setExecutionMessage: (message: string) => void;
  setGenerationProgress: (progress: number) => void;
  setGenerationMessage: (message: string) => void;
  setShowGenerationProgress: (show: boolean) => void;
  setActiveStep: (step: number) => void;
  setOpen: (open: boolean) => void;
  
  // Reset
  resetWorkflow: () => void;
}

const initialState = {
  workflowName: '',
  workflowDescription: '',
  nodes: [],
  edges: [],
  currentNodeDescription: '',
  currentNodeAgent: '',
  prompt: '',
  file: null,
  isGenerating: false,
  clarificationQuestions: [],
  workflowProgress: new Map(),
  isRunningWorkflow: false,
  executionMessage: '',
  generationProgress: 0,
  generationMessage: '',
  showGenerationProgress: false,
  activeStep: 1,
  open: false,
};

export const useWorkflowStore = create<WorkflowStore>()(
  devtools(
    (set) => ({
      ...initialState,
      
      setWorkflowName: (name) => set({ workflowName: name }),
      setWorkflowDescription: (description) => set({ workflowDescription: description }),
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),
      setCurrentNodeDescription: (description) => set({ currentNodeDescription: description }),
      setCurrentNodeAgent: (agent) => set({ currentNodeAgent: agent }),
      setPrompt: (prompt) => set({ prompt }),
      setFile: (file) => set({ file }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setClarificationQuestions: (questions) => set({ clarificationQuestions: questions }),
      setWorkflowProgress: (progress) => set({ workflowProgress: progress }),
      setIsRunningWorkflow: (isRunning) => set({ isRunningWorkflow: isRunning }),
      setExecutionMessage: (message) => set({ executionMessage: message }),
      setGenerationProgress: (progress) => set({ generationProgress: progress }),
      setGenerationMessage: (message) => set({ generationMessage: message }),
      setShowGenerationProgress: (show) => set({ showGenerationProgress: show }),
      setActiveStep: (step) => set({ activeStep: step }),
      setOpen: (open) => set({ open }),
      
      resetWorkflow: () => set(initialState),
    }),
    {
      name: 'workflow-store',
    }
  )
);