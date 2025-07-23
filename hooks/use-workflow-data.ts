import { useEffect } from 'react';
import { toast } from 'sonner';
import type { WorkflowData } from '@/lib/types/workflow';

export function useWorkflowData(
  workflowId: string | string[] | undefined,
  setWorkflow: (data: WorkflowData | null) => void,
  setLoading: (loading: boolean) => void,
  initializeWorkflow: (nodes: any[], edges: any[]) => void,
) {
  useEffect(() => {
    if (!workflowId) return;

    const fetchWorkflow = async () => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}`);
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(
            `Failed to fetch workflow: ${errorData.error || response.statusText}`,
          );
        }

        const data = await response.json();
        setWorkflow(data.workflow);

        if (!data.workflow?.schema?.nodes || !data.workflow?.schema?.edges) {
          toast.error('Workflow schema is invalid.');
          return;
        }

        // Prepare workflow context for all nodes
        const workflowContext = {
          name: data.workflow.name,
          description: data.workflow.description,
          totalNodes: data.workflow.schema.nodes.length,
          workflowId: data.workflow.id,
          nodeNames: data.workflow.schema.nodes.map(
            (n: any) => n.data.description || 'Unnamed node',
          ),
          connections: data.workflow.schema.edges.map((e: any) => ({
            from: e.source,
            to: e.target,
          })),
        };

        // Transform existing nodes
        const baseNodes = data.workflow.schema.nodes.map((node: any) => {
          if (node.type === 'workflowNode') {
            const agentType = node.data.agent || 'normalAgent';
            const description = node.data.description || '';
            // Use text-input for human input, generate-text for agent tasks
            let newType = 'generate-text';
            let agent = node.data.agent || 'normalAgent';
            if (
              node.data.type === 'human-input' ||
              agent === 'human' ||
              agent === 'user'
            ) {
              newType = 'generate-text';
              agent = 'human';
            }

            return {
              id: node.id,
              type: newType,
              position: node.position,
              data: {
                config: {
                  agent: agent,
                  type: node.data.type || 'agent-task',
                  description: node.data.description || 'Agent task',
                  // model: "llama-3.1-8b-instant",
                },
                workflowContext,
                executionState: {
                  status: 'idle',
                  timestamp: new Date().toISOString(),
                },
              },
              width: 300,
              height: 200,
            };
          }
          return node;
        });

        const transformedNodes = [...baseNodes];

        const transformedEdges = [
          ...data.workflow.schema.edges.map((edge: any) => ({
            id: edge.id,
            type: 'status',
            source: edge.source,
            target: edge.target,
            sourceHandle: 'result',
            targetHandle: 'prompt',
            data: {
              executionState: {
                status: 'idle',
                timestamp: new Date().toISOString(),
              },
            },
          })),
        ];

        initializeWorkflow(transformedNodes, transformedEdges);
      } catch (error) {
        toast.error(
          'An unexpected error occurred while fetching the workflow.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, initializeWorkflow]);
}
