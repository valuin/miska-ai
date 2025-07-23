import { parseDataStreamPart } from 'ai';
import { SSEWorkflowExecutionClient } from '@/lib/utils/workflows/sse-workflow-execution-client';
import {
  type FlowEdge,
  type FlowNode,
  type WorkflowDefinition,
  type WorkflowError,
  getLayoutedElements,
  prepareWorkflow,
} from '@/lib/utils/workflows/workflow';
import type {
  EdgeExecutionState,
  NodeExecutionState,
} from '@/lib/utils/workflows/workflow-execution-engine';
import type { StateCreator } from 'zustand';
import { validateHumanInputs } from '@/lib/validation/workflow-validation';
import type { GenerateTextNode, WorkflowState } from './types';
import type { WorkflowNodeProgress } from '@/lib/types/workflow';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Edge } from '@xyflow/react'; // Import Edge from reactflow

export interface ExecutionSlice {
  generationProgress: number;
  generationMessage: string;
  showGenerationProgress: boolean;
  setGenerationProgress: (progress: number) => void;
  setGenerationMessage: (message: string) => void;
  setShowGenerationProgress: (show: boolean) => void;
  generateWorkflow: (prompt: string, file?: File) => Promise<void>;
  workflowName: string;
  workflowDescription: string;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  currentNodeDescription: string;
  currentNodeAgent: string;
  setCurrentNodeDescription: (description: string) => void;
  setCurrentNodeAgent: (agent: string) => void;
  addNode: () => void;
  deleteNode: (nodeId: string) => void;
  workflowExecutionState: {
    isRunning: boolean;
    finishedAt: string | null;
    errors: WorkflowError[];
    timesRun: number;
  };
  nodeUserInputs: Record<string, string>;
  updateNodeUserInput: (nodeId: string, input: string) => void;
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
  validateWorkflow: () => WorkflowDefinition;
  updateNodeExecutionState: (
    nodeId: string,
    state: Partial<NodeExecutionState> | undefined,
  ) => void;
  updateEdgeExecutionState: (
    edgeId: string,
    state: Partial<EdgeExecutionState> | undefined,
  ) => void;
}

export const createExecutionSlice: StateCreator<
  WorkflowState,
  [],
  [],
  ExecutionSlice
> = (set, get) => ({
  generationProgress: 0,
  generationMessage: '',
  showGenerationProgress: false,
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setGenerationMessage: (message) => set({ generationMessage: message }),
  setShowGenerationProgress: (show) => set({ showGenerationProgress: show }),
  workflowName: '',
  workflowDescription: '',
  setWorkflowName: (name) => set({ workflowName: name }),
  setWorkflowDescription: (description) => set({ workflowDescription: description }),
  currentNodeDescription: '',
  currentNodeAgent: '',
  setCurrentNodeDescription: (description) => set({ currentNodeDescription: description }),
  setCurrentNodeAgent: (agent) => set({ currentNodeAgent: agent }),
  addNode: () => {
    const { nodes, edges, currentNodeDescription, currentNodeAgent } = get();

    if (!currentNodeDescription || !currentNodeAgent) {
      toast.error("Node description and agent are required.");
      return;
    }

    const newNodeId = `node-${nanoid()}`;
    const newNode: FlowNode = {
      id: newNodeId,
      type: "generate-text",
      position: { x: 250, y: 100 + nodes.length * 250 },
      data: {
        type: "agent-task",
        description: currentNodeDescription,
        agent: currentNodeAgent,
        status: "idle",
        executionState: {
          status: "idle",
          timestamp: new Date().toISOString(),
        },
      },
    };

    set({ nodes: [...nodes, newNode] });

    if (nodes.length > 0) {
      const prevNodeId = nodes[nodes.length - 1].id;
      const newEdge: Edge = { // Cast to basic Edge type
        id: `edge-${prevNodeId}-${newNodeId}`,
        source: prevNodeId,
        target: newNodeId,
        type: "status",
        sourceHandle: "result", // Use sourceHandle
        targetHandle: "prompt", // Use targetHandle
        data: {
          executionState: {
            status: "idle",
          },
        },
      };
      set({ edges: [...edges, newEdge as FlowEdge] }); // Cast back to FlowEdge for the state
    }

    set({ currentNodeDescription: "", currentNodeAgent: "" });
    get().validateWorkflow();
  },
  deleteNode: (nodeId: string) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    }));
    get().validateWorkflow();
  },
  generateWorkflow: async (prompt, file) => {
    get().setShowGenerationProgress(true);
    get().setGenerationMessage('Generating workflow...');
    get().setGenerationProgress(0);

    const formData = new FormData();
    formData.append('prompt', prompt);
    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await fetch('/api/workflows/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      let fullSchema = '';
      try {
        let lineBuffer = ''; // Buffer for incomplete lines

        await response.body.pipeThrough(new TextDecoderStream()).pipeTo(
          new WritableStream({
            write(chunk) {
              lineBuffer += chunk;
              const lines = lineBuffer.split('\n');
              lineBuffer = lines.pop() || ''; // Keep the last (potentially incomplete) line

              for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                  const part = parseDataStreamPart(line);
                  switch (part.type) {
                    case 'message_annotations':
                      for (const annotation of part.value) {
                        if (
                          annotation &&
                          typeof annotation === 'object' &&
                          'type' in annotation &&
                          (annotation as any).type === 'progress' &&
                          'message' in annotation &&
                          typeof (annotation as any).message === 'string' &&
                          'progress' in annotation &&
                          typeof (annotation as any).progress === 'number'
                        ) {
                          get().setGenerationMessage(annotation.message as string);
                          get().setGenerationProgress(annotation.progress as number);
                        }
                      }
                      break;
                    case 'data':
                      for (const data of part.value) {
                        if (
                          data &&
                          typeof data === 'object' &&
                          'type' in data &&
                          (data as any).type === 'schema_chunk' &&
                          'chunk' in data &&
                          typeof (data as any).chunk === 'string'
                        ) {
                          fullSchema += (data as any).chunk;
                        }
                      }
                      break;
                  }
                } catch (parseError) {}
              }
            },
            close() {
              try {
                const finalSchema = JSON.parse(fullSchema);

                // The schema is now nested under the `schema` property
                const workflowSchema = finalSchema.schema;

                get().initializeWorkflow(
                  workflowSchema.nodes,
                  workflowSchema.edges,
                  finalSchema.name, // Pass name
                  finalSchema.description, // Pass description
                );
                get().setGenerationMessage('Workflow generated successfully!');
                get().setGenerationProgress(100);
              } catch (jsonError) {
                get().setGenerationMessage(
                  `Failed to parse final workflow schema: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
                );
              }
            },
            abort(reason) {
              get().setGenerationMessage(
                `Workflow generation aborted: ${reason instanceof Error ? reason.message : String(reason)}`,
              );
            },
          }),
        );
      } catch (error) {
        get().setGenerationMessage(
          `Failed to generate workflow: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      try {
        const finalSchema = JSON.parse(fullSchema);
        get().initializeWorkflow(finalSchema.nodes, finalSchema.edges);
        get().setGenerationMessage('Workflow generated successfully!');
        get().setGenerationProgress(100);
      } catch (jsonError) {
        get().setGenerationMessage(
          `Failed to parse final workflow schema: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
        );
      }
    } catch (error) {
      get().setGenerationMessage(
        `Failed to generate workflow: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setTimeout(() => get().setShowGenerationProgress(false), 3000);
    }
  },
  workflowExecutionState: {
    isRunning: false,
    finishedAt: null,
    errors: [],
    timesRun: 0,
  },
  nodeUserInputs: {},
  updateNodeUserInput: (nodeId, input) => {
    set((state) => ({
      nodeUserInputs: {
        ...state.nodeUserInputs,
        [nodeId]: input,
      },
    }));
  },
  validateInputsBeforeExecution: () => {
    const { nodes, nodeUserInputs } = get();
    return validateHumanInputs(nodes as GenerateTextNode[], nodeUserInputs);
  },
  initializeWorkflow: (initialNodes: FlowNode[], initialEdges: FlowEdge[], name?: string, description?: string) => {
    if (!initialNodes || !initialEdges) {
      return;
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
    );
    set({ nodes: layoutedNodes, edges: layoutedEdges, workflowName: name || '', workflowDescription: description || '' });
    get().validateWorkflow();
  },
  updateNodeExecutionStates: (
    workflowProgress: Map<string, WorkflowNodeProgress>,
  ) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        const progress = workflowProgress.get(node.id);
        if (progress) {
          return {
            ...node,
            data: {
              ...node.data,
              executionState: {
                ...(node.data.executionState || {}),
                status: progress.status,
                output: progress.output,
                error: progress.error as any,
                description: progress.description,
                timestamp:
                  node.data.executionState?.timestamp ||
                  new Date().toISOString(),
              },
            },
          } as FlowNode;
        }
        return node;
      }),
    }));

    get().updateEdgeStatusFromNodes();
  },
  updateEdgeStatusFromNodes: () => {
    set((state) => ({
      edges: state.edges.map((edge) => {
        const sourceNode = state.nodes.find((n) => n.id === edge.source);
        const targetNode = state.nodes.find((n) => n.id === edge.id);

        if (
          sourceNode?.data.executionState &&
          targetNode?.data.executionState
        ) {
          let edgeStatus: 'idle' | 'running' | 'completed' | 'error' = 'idle';

          const sourceStatus = sourceNode.data.executionState.status;
          const targetStatus = targetNode.data.executionState.status;

          if (sourceStatus === 'error' || targetStatus === 'error') {
            edgeStatus = 'error';
          } else if (
            sourceStatus === 'completed' &&
            targetStatus === 'completed'
          ) {
            edgeStatus = 'completed';
          } else if (
            (sourceStatus === 'running' || sourceStatus === 'completed') &&
            targetStatus === 'running'
          ) {
            edgeStatus = 'running';
          } else if (sourceStatus === 'completed' && targetStatus === 'idle') {
            edgeStatus = 'completed';
          }

          return {
            ...edge,
            data: {
              ...edge.data,
              status: edgeStatus,
            },
          };
        }
        return edge;
      }),
    }));
  },
  validateWorkflow: () => {
    const { nodes, edges } = get();
    const workflow = prepareWorkflow(nodes, edges);

    for (const edge of workflow.edges) {
      get().updateEdgeExecutionState(edge.id, {
        error: undefined,
      });
    }

    if (workflow.errors.length > 0) {
      for (const error of workflow.errors) {
        switch (error.type) {
          case 'multiple-sources-for-target-handle':
          case 'cycle':
            for (const edge of error.edges) {
              get().updateEdgeExecutionState(edge.id, {
                error,
              });
            }
            break;
          case 'missing-required-connection':
            get().updateNodeExecutionState(error.node.id, {
              status: 'idle',
              timestamp: new Date().toISOString(),
            });
            break;
        }
      }
    }

    set((state) => ({
      workflowExecutionState: {
        ...state.workflowExecutionState,
        errors: workflow.errors,
      },
    }));
    return workflow;
  },
  updateNodeExecutionState: (nodeId, state) => {
    set((currentState) => ({
      nodes: currentState.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              executionState: {
                ...node.data?.executionState,
                ...state,
              },
            },
          } as FlowNode;
        }
        return node;
      }),
    }));
  },
  updateEdgeExecutionState: (edgeId, state) => {
    set((currentState) => ({
      edges: currentState.edges.map((edge) => {
        if (edge.id === edgeId) {
          return {
            ...edge,
            data: {
              ...edge.data,
              executionState: {
                ...edge.data?.executionState,
                ...state,
              },
            },
          };
        }
        return edge;
      }),
    }));
  },
  async startExecution() {
    if (get().workflowExecutionState.timesRun > 3) {
      const message =
        'Workflow has already run successfully and cannot be run again';
      return {
        status: 'error',
        message,
        error: new Error(message),
      };
    }

    const validation = get().validateInputsBeforeExecution();

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e: { message: string }) => e.message);
      return {
        status: 'error',
        message: errorMessages.join(', '),
        error: new Error(errorMessages.join(', ')),
        validationErrors: validation.errors as unknown as WorkflowError[],
      };
    }

    set((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          executionState: {
            status: 'idle',
            timestamp: new Date().toISOString(),
          },
        },
      })) as FlowNode[],
    }));

    const workflow = get().validateWorkflow();

    if (workflow.errors.length > 0) {
      const message = 'Workflow validation failed';
      return {
        status: 'error',
        message,
        error: new Error(message),
        validationErrors: workflow.errors,
      };
    }

    set((state) => ({
      workflowExecutionState: {
        ...state.workflowExecutionState,
        isRunning: true,
      },
    }));

    try {
      const sseClient = new SSEWorkflowExecutionClient();
      const { updateNodeExecutionState } = get();

      await new Promise((resolve, reject) => {
        sseClient.connect(workflow, {
          onNodeUpdate: (nodeId, state) => {
            updateNodeExecutionState(nodeId, state);
          },
          onError: (error) => {
            reject(error);
          },
          onComplete: ({ timestamp }) => {
            set((state) => ({
              workflowExecutionState: {
                ...state.workflowExecutionState,
                finishedAt: timestamp,
                timesRun: state.workflowExecutionState.timesRun + 1,
              },
            }));
            resolve(undefined);
          },
        });
      });

      return {
        status: 'success',
        message: 'Workflow executed successfully',
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Workflow execution failed',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    } finally {
      set((state) => ({
        workflowExecutionState: {
          ...state.workflowExecutionState,
          isRunning: false,
        },
      }));
    }
  },
});
