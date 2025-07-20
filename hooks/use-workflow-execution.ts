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
  >,
  updateEdgeExecutionState: (edgeId: string, state: any) => void
) {
  const handleRunWorkflow = async () => {
    if (!workflow) {
      toast.error("Workflow not loaded.");
      return;
    }

    setIsExecuting(true);
    setNodeResults([]);
    setWorkflowProgress(new Map());
    
    // Initialize edge states
    workflow.schema.edges.forEach((edge) => {
      updateEdgeExecutionState(edge.id, {
        status: "idle",
        timestamp: new Date().toISOString(),
      });
    });

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
      let buffer = '';

      if (!reader) {
        throw new Error("No response body");
      }

      const newNodeResults: any[] = [];

      const processEvent = (data: any) => {
        let connectedEdges; // Declare once here
        switch (data.type) {
          case "workflow_started":
            toast.info(data.message, { id: runningToast });
            break;

          case "node_started":
            // Update node progress
            setWorkflowProgress(
              (prev: Map<string, WorkflowNodeProgress>) => {
                const newMap = new Map(prev);
                const newNodeProgress: WorkflowNodeProgress = {
                  status: "running",
                  description: data.description,
                };
                newMap.set(data.nodeId, newNodeProgress);
                console.log(`Node ${data.nodeId} status updated to:`, newNodeProgress.status);
                return newMap;
              }
            );
            
            // Update edge status for connected edges
            connectedEdges = workflow.schema.edges.filter(
              (edge) => edge.source === data.nodeId || edge.target === data.nodeId
            );
            connectedEdges.forEach((edge) => {
              updateEdgeExecutionState(edge.id, {
                status: "running",
                timestamp: new Date().toISOString(),
              });
            });
            break;

          case "node_completed":
            // Update node progress
            setWorkflowProgress(
              (prev: Map<string, WorkflowNodeProgress>) => {
                const newMap = new Map(prev);
                const newNodeProgress: WorkflowNodeProgress = {
                  status: "completed",
                  output: data.output,
                  description: data.description,
                };
                newMap.set(data.nodeId, newNodeProgress);
                console.log(`Node ${data.nodeId} status updated to:`, newNodeProgress.status);
                return newMap;
              }
            );
            
            // Update edge status for connected edges
            connectedEdges = workflow.schema.edges.filter(
              (edge) => edge.source === data.nodeId || edge.target === data.nodeId
            );
            connectedEdges.forEach((edge) => {
              updateEdgeExecutionState(edge.id, {
                status: "completed",
                timestamp: new Date().toISOString(),
              });
            });
            
            newNodeResults.push({
              nodeId: data.nodeId,
              agentName: data.agentName,
              description: data.description,
              output: data.output,
            });
            break;

          case "node_error":
            // Update node progress
            setWorkflowProgress(
              (prev: Map<string, WorkflowNodeProgress>) => {
                const newMap = new Map(prev);
                const newNodeProgress: WorkflowNodeProgress = {
                  status: "error",
                  error: data.error,
                  description: data.description,
                };
                newMap.set(data.nodeId, newNodeProgress);
                console.log(`Node ${data.nodeId} status updated to:`, newNodeProgress.status);
                return newMap;
              }
            );
            
            // Update edge status for connected edges
            connectedEdges = workflow.schema.edges.filter(
              (edge) => edge.source === data.nodeId || edge.target === data.nodeId
            );
            connectedEdges.forEach((edge) => {
              updateEdgeExecutionState(edge.id, {
                status: "error",
                timestamp: new Date().toISOString(),
              });
            });
            
            toast.error(`Error: ${data.error}`, { id: runningToast });
            break;

          case "workflow_completed":
            // Reset all edges to completed
            workflow.schema.edges.forEach((edge) => {
              updateEdgeExecutionState(edge.id, {
                status: "completed",
                timestamp: new Date().toISOString(),
              });
            });
            
            toast.success("Workflow execution completed!", {
              id: runningToast,
            });
            break;

          case "error":
            toast.error(data.message, { id: runningToast });
            break;
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value);
        const lines = buffer.split('\n');
        
        // Process complete lines, keep incomplete line in buffer
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              processEvent(data);
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
        
        // Keep the last incomplete line in buffer
        buffer = lines[lines.length - 1] || '';
      }
      
      // Process any remaining buffer
      const remainingLines = buffer.split('\n');
      for (const line of remainingLines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmedLine.slice(6));
            processEvent(data);
          } catch (parseError) {
            console.error("Error parsing final SSE data:", parseError);
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
