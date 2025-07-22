import { SSEWorkflowExecutionClient } from "@/lib/utils/workflows/sse-workflow-execution-client";
import {
  type FlowEdge,
  type FlowNode,
  type WorkflowDefinition,
  type WorkflowError,
  getLayoutedElements,
  prepareWorkflow,
} from "@/lib/utils/workflows/workflow";
import type {
  EdgeExecutionState,
  NodeExecutionState,
} from "@/lib/utils/workflows/workflow-execution-engine";
import type { StateCreator } from "zustand";
import { validateHumanInputs } from "@/lib/validation/workflow-validation";
import type {
  GenerateTextNode,
  WorkflowState,
} from "./types";
import type { WorkflowNodeProgress } from "@/lib/types/workflow";

export interface ExecutionSlice {
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
    status: "success" | "error";
    message: string;
    error?: Error;
    validationErrors?: WorkflowError[];
  }>;
  initializeWorkflow: (nodes: FlowNode[], edges: FlowEdge[]) => void;
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
    return validateHumanInputs(
      nodes as GenerateTextNode[],
      nodeUserInputs,
    );
  },
  initializeWorkflow: (initialNodes: FlowNode[], initialEdges: FlowEdge[]) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
    );
    set({ nodes: layoutedNodes, edges: layoutedEdges });
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
        const targetNode = state.nodes.find((n) => n.id === edge.target);

        if (
          sourceNode?.data.executionState &&
          targetNode?.data.executionState
        ) {
          let edgeStatus: "idle" | "running" | "completed" | "error" = "idle";

          const sourceStatus = sourceNode.data.executionState.status;
          const targetStatus = targetNode.data.executionState.status;

          if (sourceStatus === "error" || targetStatus === "error") {
            edgeStatus = "error";
          } else if (
            sourceStatus === "completed" &&
            targetStatus === "completed"
          ) {
            edgeStatus = "completed";
          } else if (
            (sourceStatus === "running" || sourceStatus === "completed") &&
            targetStatus === "running"
          ) {
            edgeStatus = "running";
          } else if (
            sourceStatus === "completed" &&
            targetStatus === "idle"
          ) {
            edgeStatus = "completed";
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
          case "multiple-sources-for-target-handle":
          case "cycle":
            for (const edge of error.edges) {
              get().updateEdgeExecutionState(edge.id, {
                error,
              });
            }
            break;
          case "missing-required-connection":
            get().updateNodeExecutionState(error.node.id, {
              status: "idle",
              timestamp: new Date().toISOString(),
              error,
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
        "Workflow has already run successfully and cannot be run again";
      console.warn(message);
      return {
        status: "error",
        message,
        error: new Error(message),
      };
    }

    const validation = get().validateInputsBeforeExecution();

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => e.message);
      return {
        status: "error",
        message: errorMessages.join(", "),
        error: new Error(errorMessages.join(", ")),
      };
    }

    set((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          executionState: {
            status: "idle",
            timestamp: new Date().toISOString(),
          },
        },
      })) as FlowNode[],
    }));

    const workflow = get().validateWorkflow();

    if (workflow.errors.length > 0) {
      const message = "Workflow validation failed";
      return {
        status: "error",
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
            console.error("Error in execution:", error);
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
        status: "success",
        message: "Workflow executed successfully",
      };
    } catch (error) {
      console.error("Workflow execution failed:", error);
      return {
        status: "error",
        message: "Workflow execution failed",
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