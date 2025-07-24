'use client';

import {
  Controls,
  type EdgeTypes,
  // MiniMap,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Background, ReactFlow, useReactFlow } from '@xyflow/react';
import { GenerateTextNodeController } from '@/components/workflow-v2/generate-text-node-controller';
import { PromptCrafterNodeController } from '@/components/workflow-v2/prompt-crafter-node-controller';
import { shallow } from 'zustand/shallow';
import { StatusEdgeController } from '@/components/workflow-v2/status-edge-controller';
import { TextInputNodeController } from '@/components/workflow-v2/text-input-node-controller';
import { useWorkflow } from '@/hooks/use-workflow';
import { VisualizeTextNodeController } from '@/components/workflow-v2/visualize-text-node-controller';
import type { DragEvent } from 'react';
import type { FlowNode } from '@/lib/utils/workflows/workflow';

const nodeTypes: NodeTypes = {
  'generate-text': GenerateTextNodeController,
  'visualize-text': VisualizeTextNodeController,
  'text-input': TextInputNodeController,
  'prompt-crafter': PromptCrafterNodeController,
};

const edgeTypes: EdgeTypes = {
  status: StatusEdgeController,
};

import type { WorkflowNodeProgress } from '@/lib/types/workflow';
import { useEffect } from 'react';

export function Flow({
  onPaneClick,
  workflowProgress,
}: {
  onPaneClick?: () => void;
  workflowProgress?: Map<string, WorkflowNodeProgress>;
}) {
  const store = useWorkflow(
    (store) => ({
      nodes: store.nodes,
      edges: store.edges,
      onNodesChange: store.onNodesChange,
      onEdgesChange: store.onEdgesChange,
      onConnect: store.onConnect,
      startExecution: store.startExecution,
      createNode: store.createNode,
      workflowExecutionState: store.workflowExecutionState,
      updateNodeExecutionStates: store.updateNodeExecutionStates,
    }),
    shallow,
  );

  useEffect(() => {
    if (workflowProgress) {
      store.updateNodeExecutionStates(workflowProgress);
    }
  }, [workflowProgress, store.updateNodeExecutionStates]);

  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData(
      'application/reactflow',
    ) as FlowNode['type'];

    if (!type) {
      return;
    }

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    store.createNode(type, position);
  };

  return (
    <ReactFlow
      className="react-flow dark"
      nodes={store.nodes}
      edges={store.edges}
      onNodesChange={store.onNodesChange}
      onEdgesChange={store.onEdgesChange}
      onConnect={store.onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onPaneClick={onPaneClick}
      fitView
    >
      <Background />
      <Controls />
      {/* <MiniMap /> */}
    </ReactFlow>
  );
}
