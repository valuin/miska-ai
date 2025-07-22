import { createNode } from "@/lib/utils/workflows/node-factory";
import {
  type DynamicHandle,
  type FlowEdge,
  type FlowNode,
  isNodeOfType,
  isNodeWithDynamicHandles,
} from "@/lib/utils/workflows/workflow";
import { addEdge, applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import type { Connection, EdgeChange, NodeChange } from "@xyflow/react";
import { nanoid } from "nanoid";
import type { StateCreator } from "zustand";
import type { WorkflowState } from "./types";

export interface NodeSlice {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  getNodeById: (nodeId: string) => FlowNode;
  createNode: (
    nodeType: FlowNode["type"],
    position: { x: number; y: number },
  ) => FlowNode;
  updateNode: <T extends FlowNode["type"]>(
    id: string,
    nodeType: T,
    data: Partial<FlowNode["data"]>,
  ) => void;
  deleteNode: (id: string) => void;
  addDynamicHandle: <T extends FlowNode["type"]>(
    nodeId: string,
    nodeType: T,
    handleCategory: string,
    handle: Omit<DynamicHandle, "id">,
  ) => string;
  removeDynamicHandle: <T extends FlowNode["type"]>(
    nodeId: string,
    nodeType: T,
    handleCategory: string,
    handleId: string,
  ) => void;
}

export const createNodeSlice: StateCreator<
  WorkflowState,
  [],
  [],
  NodeSlice
> = (set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) => {
    const currentNodes = get().nodes;
    const updatedNodes = applyNodeChanges<FlowNode>(changes, currentNodes);

    const nodesWithPreservedState = updatedNodes.map((updatedNode) => {
      const originalNode = currentNodes.find((n) => n.id === updatedNode.id);
      if (
        originalNode &&
        originalNode.data.executionState &&
        updatedNode.data.executionState !== originalNode.data.executionState
      ) {
        return {
          ...updatedNode,
          data: {
            ...updatedNode.data,
            executionState: originalNode.data.executionState,
          },
        } as FlowNode;
      }
      return updatedNode;
    });

    set({
      nodes: nodesWithPreservedState,
    });
    get().validateWorkflow();
  },
  onEdgesChange: (changes) => {
    const currentEdges = get().edges;
    const updatedEdges = applyEdgeChanges(changes, currentEdges);

    const edgesWithPreservedState = updatedEdges.map((updatedEdge) => {
      const originalEdge = currentEdges.find((e) => e.id === updatedEdge.id);
      if (
        originalEdge &&
        originalEdge.data?.executionState &&
        updatedEdge.data?.executionState !== originalEdge.data?.executionState
      ) {
        return {
          ...updatedEdge,
          data: {
            ...updatedEdge.data,
            executionState: originalEdge.data.executionState,
          },
        };
      }
      return updatedEdge;
    });

    set({
      edges: edgesWithPreservedState,
    });
    get().validateWorkflow();
  },
  onConnect: (connection) => {
    const newEdge = addEdge({ ...connection, type: "status" }, get().edges);
    const sourceNode = get().getNodeById(connection.source!);

    if (!connection.sourceHandle) {
      throw new Error("Source handle not found");
    }

    const sourceExecutionState = sourceNode.data.executionState;

    if (sourceExecutionState?.sources) {
      const sourceHandleData =
        sourceExecutionState.sources[connection.sourceHandle];
      const nodes = get().nodes.map((node) => {
        if (node.id === connection.target && connection.targetHandle) {
          return {
            ...node,
            data: {
              ...node.data,
              executionState: node.data.executionState
                ? {
                    ...node.data.executionState,
                    targets: {
                      ...node.data.executionState.targets,
                      [connection.targetHandle]: sourceHandleData,
                    },
                  }
                : {
                    status: "success",
                    timestamp: new Date().toISOString(),
                    targets: {
                      [connection.targetHandle]: sourceHandleData,
                    },
                  },
            },
          };
        }
        return node;
      });

      set({
        nodes: nodes as FlowNode[],
      });
    }

    set({
      edges: newEdge,
    });
    get().validateWorkflow();
  },
  getNodeById: (nodeId) => {
    const node = get().nodes.find((node) => node.id === nodeId);
    if (!node) {
      throw new Error(`Node with id ${nodeId} not found`);
    }
    return node;
  },
  createNode(nodeType, position) {
    const newNode = createNode(nodeType, position);
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
    return newNode;
  },
  updateNode(id, type, data) {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === id && isNodeOfType(node, type)) {
          return {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          };
        }
        return node;
      }),
    }));
  },
  deleteNode(id) {
    set({
      nodes: get().nodes.filter((node) => node.id !== id),
      edges: get().edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
      ),
    });
  },
  addDynamicHandle(nodeId, type, handleCategory, handle) {
    const newId = nanoid();
    set({
      nodes: get().nodes.map((node) => {
        if (
          node.id === nodeId &&
          isNodeWithDynamicHandles(node) &&
          isNodeOfType(node, type)
        ) {
          return {
            ...node,
            data: {
              ...node.data,
              dynamicHandles: {
                ...node.data.dynamicHandles,
                [handleCategory]: [
                  ...(node.data.dynamicHandles[
                    handleCategory as keyof typeof node.data.dynamicHandles
                  ] || []),
                  {
                    ...handle,
                    id: newId,
                  },
                ],
              },
            },
          };
        }

        return node;
      }),
    });
    return newId;
  },
  removeDynamicHandle(nodeId, type, handleCategory, handleId) {
    set({
      nodes: get().nodes.map((node) => {
        if (
          node.id === nodeId &&
          isNodeWithDynamicHandles(node) &&
          isNodeOfType(node, type)
        ) {
          const dynamicHandles = node.data.dynamicHandles;
          const handles = dynamicHandles[
            handleCategory as keyof typeof dynamicHandles
          ] as DynamicHandle[];
          const newHandles = handles.filter((handle) => handle.id !== handleId);

          return {
            ...node,
            data: {
              ...node.data,
              dynamicHandles: {
                ...node.data.dynamicHandles,
                [handleCategory]: newHandles,
              },
            },
          };
        }
        return node;
      }),
      edges: get().edges.filter((edge) => {
        if (edge.source === nodeId && edge.sourceHandleId === handleId) {
          return false;
        }
        if (edge.target === nodeId && edge.targetHandleId === handleId) {
          return false;
        }
        return true;
      }),
    });
  },
});