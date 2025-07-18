import React from "react";
import { toast } from "sonner";
import type { WorkflowData, WorkflowNodeProgress } from "@/lib/types/workflow";

export function useWorkflowExecution(
  workflow: WorkflowData | null,
  inputQuery: string,
  setIsExecuting: (isExecuting: boolean) => void,
  setNodeResults: (results: any[]) => void,
  setWorkflowProgress: React.Dispatch<
    React.SetStateAction<Map<string, WorkflowNodeProgress>>
  >
) {
  const handleRunWorkflow = async () => {
    if (!workflow) {
      toast.error("Workflow not loaded.");
      return;
    }

    setIsExecuting(true);
    setNodeResults([]);
    setWorkflowProgress(new Map());
    const runningToast = toast.info(`Running workflow: ${workflow.name}`, {
      description: "Please wait, this may take a moment...",
      duration: Number.POSITIVE_INFINITY,
    });

    try {
      const response = await fetch("/api/workflows/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId: workflow.id,
          workflowSchema: workflow.schema,
          inputQuery,
          workflowContext: {
            name: workflow.name,
            description: workflow.description,
            totalNodes: workflow.schema.nodes.length,
            nodeCount: workflow.schema.nodes.length,
            edgeCount: workflow.schema.edges.length,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(
          `Workflow execution failed: ${errorData.error || response.statusText}`,
          { id: runningToast }
        );
        setIsExecuting(false);
        return;
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      const newNodeResults: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "workflow_started":
                  toast.info(data.message, { id: runningToast });
                  break;

                case "node_started":
                  setWorkflowProgress(
                    (prev: Map<string, WorkflowNodeProgress>) => {
                      const newMap = new Map(prev);
                      newMap.set(data.nodeId, {
                        status: "running",
                        description: data.description,
                      });
                      return newMap;
                    }
                  );
                  break;

                case "node_completed":
                  setWorkflowProgress(
                    (prev: Map<string, WorkflowNodeProgress>) => {
                      const newMap = new Map(prev);
                      newMap.set(data.nodeId, {
                        status: "completed",
                        output: data.output,
                        description: data.description,
                      });
                      return newMap;
                    }
                  );
                  newNodeResults.push({
                    nodeId: data.nodeId,
                    agentName: data.agentName,
                    description: data.description,
                    output: data.output,
                  });
                  break;

                case "node_error":
                  setWorkflowProgress(
                    (prev: Map<string, WorkflowNodeProgress>) => {
                      const newMap = new Map(prev);
                      newMap.set(data.nodeId, {
                        status: "error",
                        error: data.error,
                        description: data.description,
                      });
                      return newMap;
                    }
                  );
                  toast.error(`Error: ${data.error}`, { id: runningToast });
                  break;

                case "workflow_completed":
                  toast.success("Workflow execution completed!", {
                    id: runningToast,
                  });
                  break;

                case "error":
                  toast.error(data.message, { id: runningToast });
                  break;
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      }

      setNodeResults(newNodeResults);
      setIsExecuting(false);
    } catch (error) {
      console.error("Error running workflow:", error);
      toast.error("An unexpected error occurred during workflow execution.", {
        id: runningToast,
      });
      setIsExecuting(false);
    }
  };

  return handleRunWorkflow;
}
