'use client';

import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useWorkflow } from '@/hooks/use-workflow';
import { Flow } from './workflow-detail-flow';
import type { WorkflowData, WorkflowNode } from '@/lib/types/workflow';
import type { FlowNode, FlowEdge } from '@/lib/utils/workflows/workflow';

const WorkflowDisplay = ({ result }: { result: WorkflowData }) => {
  const initializeWorkflow = useWorkflow((state) => state.initializeWorkflow);
  const resetWorkflow = useWorkflow((state) => state.resetWorkflow);

  useEffect(() => {
    if (result?.schema) {
      const agentTaskNodes = result.schema.nodes.filter(
        (node: WorkflowNode) => node.data.type === 'agent-task' || node.data.type === 'human-input',
      );

      const nodeIds = new Set(agentTaskNodes.map((n) => n.id));

      const transformedNodes = agentTaskNodes.map((node) => ({
        id: node.id,
        position: node.position,
        type: 'generate-text',
        data: {
          ...node.data,
        },
      })) as FlowNode[];

      const transformedEdges = result.schema.edges
        .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
        .map((edge) => ({
          ...edge,
          type: 'status',
        })) as FlowEdge[];

      initializeWorkflow(
        transformedNodes,
        transformedEdges,
        result.name,
        result.description || '',
      );
    }

    return () => {
      resetWorkflow();
    };
  }, [result, initializeWorkflow, resetWorkflow]);

  if (!result) {
    return null;
  }

  return (
    <div
      className="relative w-full h-[400px] border rounded-lg"
    >
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </div>
  );
};

export default WorkflowDisplay;
