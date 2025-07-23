import { createNode } from '@/lib/utils/workflows/node-factory';
import {
  type DynamicHandle,
  type FlowEdge,
  type FlowNode,
  isNodeOfType,
  isNodeWithDynamicHandles,
} from '@/lib/utils/workflows/workflow';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import type { Connection, EdgeChange, NodeChange } from '@xyflow/react';
import { nanoid } from 'nanoid';
import type { StateCreator } from 'zustand';
import type { WorkflowState } from './types';

export interface NodeSlice {
  resetWorkflow: () => void;
  nodes: FlowNode[];
  edges: FlowEdge[];
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
  addNode: () => void;
}

interface NodeSliceState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  currentNodeDescription: string;
  currentNodeAgent: string;
}

interface NodeSliceActions {
  setCurrentNodeDescription: (description: string) => void;
  setCurrentNodeAgent: (agent: string) => void;
  addNode: () => void;
  resetWorkflow: () => void;
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
    type: T,
    data: Partial<FlowNode['data']>,
  ) => void;
  deleteNode: (id: string) => void;
  addDynamicHandle: <T extends FlowNode['type']>(
    nodeId: string,
    type: T,
    handleCategory: string,
    handle: Omit<DynamicHandle, 'id'>,
  ) => string;
  removeDynamicHandle: <T extends FlowNode['type']>(
    nodeId: string,
    type: T,
    handleCategory: string,
    handleId: string,
  ) => void;
}

type NodeSliceComplete = NodeSliceState & NodeSliceActions;

export const createNodeSlice: StateCreator<WorkflowState, [], [], NodeSlice> = (
  set: (
    partial:
      | Partial<WorkflowState>
      | ((state: WorkflowState) => Partial<WorkflowState>),
  ) => void,
  get: () => WorkflowState,
): NodeSliceComplete => ({
  nodes: [],
  edges: [],
  currentNodeDescription: '',
  currentNodeAgent: 'human',
  setCurrentNodeDescription: (description: string) => {
    set({ currentNodeDescription: description });
  },
  setCurrentNodeAgent: (agent: string) => {
    set({ currentNodeAgent: agent });
  },
  addNode: () => {
    const {
      currentNodeAgent,
      currentNodeDescription,
    }: { currentNodeAgent: string; currentNodeDescription: string } = get();
    const nodeType: FlowNode['type'] =
      currentNodeAgent === 'human' || currentNodeAgent === 'user'
        ? 'text-input'
        : 'generate-text';

    const newNode: FlowNode = createNode(nodeType, {
      x: 250,
      y: 250,
    });
    newNode.data = {
      ...newNode.data,
      agent: currentNodeAgent,
      description: currentNodeDescription,
      type: nodeType === 'text-input' ? 'human-input' : 'agent-task',
    };

    set((state: WorkflowState) => ({
      nodes: [...state.nodes, newNode],
      currentNodeDescription: '',
      currentNodeAgent: 'human',
    }));
  },
  resetWorkflow: () => {
    set({
      nodes: [],
      edges: [],
    });
  },
  onNodesChange: (changes: NodeChange<FlowNode>[]) => {
    const currentNodes: FlowNode[] = get().nodes;
    const updatedNodes: FlowNode[] = applyNodeChanges<FlowNode>(
      changes,
      currentNodes,
    );

    const nodesWithPreservedState: FlowNode[] = updatedNodes.map(
      (updatedNode: FlowNode) => {
        const originalNode: FlowNode | undefined = currentNodes.find(
          (n: FlowNode) => n.id === updatedNode.id,
        );
        if (
          originalNode?.data.executionState &&
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
      },
    );

    set({
      nodes: nodesWithPreservedState,
    });
    get().validateWorkflow();
  },
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => {
    const currentEdges: FlowEdge[] = get().edges;
    const updatedEdges: FlowEdge[] = applyEdgeChanges(changes, currentEdges);

    const edgesWithPreservedState: FlowEdge[] = updatedEdges.map(
      (updatedEdge: FlowEdge) => {
        const originalEdge: FlowEdge | undefined = currentEdges.find(
          (e: FlowEdge) => e.id === updatedEdge.id,
        );
        if (
          originalEdge?.data?.executionState &&
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
      },
    );

    set({
      edges: edgesWithPreservedState,
    });
    get().validateWorkflow();
  },
  onConnect: (connection: Connection) => {
    const newEdge: FlowEdge[] = addEdge(
      { ...connection, type: 'status' },
      get().edges,
    );
    const sourceNode: FlowNode = get().getNodeById(connection.source!);
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
