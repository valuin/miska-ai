import {
  type FlowEdge,
  type FlowNode,
  type WorkflowDefinition,
  getLayoutedElements,
  prepareWorkflow,
} from "@/lib/utils/workflows/workflow";
import type {
  EdgeExecutionState,
  NodeExecutionState,
} from "@/lib/utils/workflows/workflow-execution-engine";
import type { StateCreator } from "zustand";
import type { WorkflowState } from "./types";
import type { WorkflowNodeProgress } from "@/lib/types/workflow";

export interface WorkflowSlice {
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

export const createWorkflowSlice: StateCreator<
  WorkflowState,
  [],
  [],
  WorkflowSlice
> = (set, get) => ({
  initializeWorkflow: (initialNodes: FlowNode[], initialEdges: FlowEdge[]) => {
    console.log("initializeWorkflow called with initialNodes:", initialNodes, "and initialEdges:", initialEdges);
    console.trace("Call stack for initializeWorkflow:");

    if (!initialNodes || !initialEdges) {
      console.warn("initializeWorkflow received undefined nodes or edges. Skipping layouting.");
      return;
    }

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
});
