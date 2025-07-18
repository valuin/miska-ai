import { useEffect } from "react";
import { toast } from "sonner";
import type { WorkflowData } from "@/lib/types/workflow";

export function useWorkflowData(
  workflowId: string | string[] | undefined,
  setWorkflow: (data: WorkflowData | null) => void,
  setLoading: (loading: boolean) => void,
  initializeWorkflow: (nodes: any[], edges: any[]) => void
) {
  useEffect(() => {
    if (!workflowId) return;
    
    const fetchWorkflow = async () => {
      try {
        const response = await fetch(`/api/workflows/${workflowId}`);
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(
            `Failed to fetch workflow: ${errorData.error || response.statusText}`
          );
        }

        const data = await response.json();
        setWorkflow(data.workflow);

        if (!data.workflow?.schema?.nodes || !data.workflow?.schema?.edges) {
          toast.error("Workflow schema is invalid.");
          return;
        }

        // Transform existing nodes
        const baseNodes = data.workflow.schema.nodes.map((node: any) => {
          if (node.type === "workflowNode") {
            const agentType = node.data.agent || "normalAgent";
            const description = node.data.description || "";
            // Use text-input for human input, generate-text for agent tasks
            let newType = "generate-text";
            const agent = node.data.agent || "normalAgent";
            if (agent === "human" || agent === "user") {
              newType = "text-input";
            }

            return {
              id: node.id,
              type: newType,
              position: node.position,
              data: {
                config: {
                  agent: node.data.agent || "normalAgent",
                  type: node.data.type || "agent-task",
                  description: node.data.description || "Agent task",
                  // model: "llama-3.1-8b-instant",
                },

                executionState: {
                  status: "idle",
                  timestamp: new Date().toISOString(),
                },
              },
              width: 300,
              height: 200,
            };
          }
          return node;
        });

        // Add result node (renamed from visualize-text)
        const resultNodeId = `result-${Date.now()}`;
        const resultNode = {
          id: resultNodeId,
          type: "visualize-text",
          position: { x: 400, y: 300 },
          data: {
            status: "idle",
            input: "Workflow results will appear here",
          },
          width: 300,
          height: 200,
        };

        const transformedNodes = [...baseNodes, resultNode];

        // Connect last node to result node
        const lastNode = baseNodes[baseNodes.length - 1];
        const resultEdge = {
          id: `edge-${lastNode.id}-${resultNodeId}`,
          type: "status",
          source: lastNode.id,
          target: resultNodeId,
          sourceHandle: "result",
          targetHandle: "input",
          data: {
            executionState: {
              status: "idle",
              timestamp: new Date().toISOString(),
            },
          },
        };

        const transformedEdges = [
          ...data.workflow.schema.edges.map((edge: any) => ({
            id: edge.id,
            type: "status",
            source: edge.source,
            target: edge.target,
            sourceHandle: "result",
            targetHandle: "prompt",
            data: {
              executionState: {
                status: "idle",
                timestamp: new Date().toISOString(),
              },
            },
          })),
          resultEdge,
        ];

        initializeWorkflow(transformedNodes, transformedEdges);
      } catch (error) {
        console.error("Error fetching workflow:", error);
        toast.error(
          "An unexpected error occurred while fetching the workflow."
        );
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkflow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowId, initializeWorkflow]);
}
