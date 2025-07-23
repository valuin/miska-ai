'use client';

import { Flow } from '@/components/workflow-detail-flow';
import { ReactFlowProvider } from '@xyflow/react';
import { shallow } from 'zustand/shallow';
import { useParams } from 'next/navigation';
import { useWorkflow } from '@/hooks/use-workflow';
import { useWorkflowData } from '@/hooks/use-workflow-data';
import { useWorkflowExecution } from '@/hooks/use-workflow-execution';
import { useWorkflowUiState } from '@/lib/store/workflow-ui-store';
import React, { useEffect, useState } from 'react';
import type { WorkflowData, WorkflowNodeProgress } from '@/lib/types/workflow';
import {
  WorkflowDetails,
  NodeOutput,
  WorkflowOutput,
} from '@/components/workflow-detail-sidebar';
export default function WorkflowDetailPage() {
  const { workflowId } = useParams();
  const { setActiveHumanInputNode } = useWorkflowUiState();
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputQuery, setInputQuery] = useState('');
  const [nodeResults, setNodeResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState<
    Map<string, WorkflowNodeProgress>
  >(new Map());

  const store = useWorkflow(
    (store) => ({
      nodes: store.nodes,
      edges: store.edges,
      onNodesChange: store.onNodesChange,
      onEdgesChange: store.onEdgesChange,
      onConnect: store.onConnect,
      startExecution: store.startExecution,
      createNode: store.createNode,
      updateEdgeExecutionState: store.updateEdgeExecutionState,
      initializeWorkflow: store.initializeWorkflow,
      resetWorkflow: store.resetWorkflow,
    }),
    shallow,
  );

  useEffect(() => {
    // Cleanup function to reset the workflow when the component unmounts
    return () => {
      store.resetWorkflow();
    };
  }, [store.resetWorkflow]);

  useWorkflowData(
    workflowId,
    setWorkflow,
    setLoading,
    store.initializeWorkflow,
  );

  const handleRunWorkflow = useWorkflowExecution(
    workflow,
    inputQuery,
    setIsExecuting,
    setNodeResults,
    setWorkflowProgress,
    store.updateEdgeExecutionState,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading workflow details...</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Workflow not found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 h-full p-4 gap-4">
      <div className="col-span-2 size-full border border-border rounded-lg">
        <ReactFlowProvider>
          <Flow
            onPaneClick={() => setActiveHumanInputNode(null)}
            workflowProgress={workflowProgress}
          />
        </ReactFlowProvider>
      </div>

      <div className="w-full flex flex-col gap-4">
        <WorkflowDetails
          workflow={workflow}
          inputQuery={inputQuery}
          setInputQuery={setInputQuery}
          onRunWorkflow={handleRunWorkflow}
          isExecuting={isExecuting}
        />

        <NodeOutput nodeResults={nodeResults} />
        <WorkflowOutput nodeResults={nodeResults} workflow={workflow} />
      </div>
    </div>
  );
}
