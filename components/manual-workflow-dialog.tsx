"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "@/components/ui/stepper";
import SchemaVisualizer from "./schema-builder";
import { agents } from "@/mastra/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useQueryClient } from '@tanstack/react-query';

import { StepContent } from "./workflow/step-content";
import { NodeBuilder } from "./workflow/node-builder";
import { WorkflowReview } from "./workflow/workflow-review";
import { WorkflowProgress } from "./workflow/workflow-progress";
import { steps } from "./workflow/workflow-steps";
import { useWorkflowStore } from "@/lib/store/workflow-store";

const workflowDetailSchema = z.object({
  workflowName: z.string().min(1, "Workflow name is required."),
  workflowDescription: z.string().optional(),
});

const nodeSchema = z.object({
  currentNodeDescription: z.string().min(1, "Node description is required."),
  currentNodeAgent: z.string().min(1, "An agent is required."),
});

export function ManualWorkflowDialog({ onWorkflowCreated }: { onWorkflowCreated?: () => void }) {
  const queryClient = useQueryClient();
  const agentNames = useMemo(() => agents, []);

  // Zustand store
  const {
    workflowName,
    workflowDescription,
    nodes,
    edges,
    currentNodeDescription,
    currentNodeAgent,
    prompt,
    file,
    isGenerating,
    clarificationQuestions,
    workflowProgress,
    isRunningWorkflow,
    executionMessage,
    generationProgress,
    generationMessage,
    showGenerationProgress,
    activeStep,
    open,
    setWorkflowName,
    setWorkflowDescription,
    setNodes,
    setEdges,
    setCurrentNodeDescription,
    setCurrentNodeAgent,
    setPrompt,
    setFile,
    setIsGenerating,
    setClarificationQuestions,
    setWorkflowProgress,
    setIsRunningWorkflow,
    setExecutionMessage,
    setGenerationProgress,
    setGenerationMessage,
    setShowGenerationProgress,
    setActiveStep,
    setOpen,
    resetWorkflow,
  } = useWorkflowStore();

  const addNode = () => {
    const result = nodeSchema.safeParse({
      currentNodeDescription,
      currentNodeAgent,
    });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    const newNodeId = `node-${nodes.length + 1}`;
    const newNode = {
      id: newNodeId,
      type: "workflowNode",
      position: { x: 250, y: 100 + nodes.length * 250 },
      data: {
        type: "agent-task",
        description: currentNodeDescription,
        agent: currentNodeAgent,
      },
    };

    setNodes([...nodes, newNode]);

    if (nodes.length > 0) {
      const prevNodeId = nodes[nodes.length - 1].id;
      const newEdge = {
        id: `edge-${prevNodeId}-${newNodeId}`,
        source: prevNodeId,
        target: newNodeId,
        type: "custom",
      };
      setEdges([...edges, newEdge]);
    }

    setCurrentNodeDescription("");
    setCurrentNodeAgent("");
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter((node) => node.id !== nodeId));
    setEdges(edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const handleNextStep = () => {
    if (activeStep === 1) {
      const result = workflowDetailSchema.safeParse({
        workflowName,
        workflowDescription,
      });
      if (!result.success) {
        toast.error(result.error.errors[0].message);
        return;
      }
    }
    setActiveStep(activeStep + 1);
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName) {
      toast.error("Workflow name cannot be empty.");
      return;
    }

    const workflowData = {
      id: uuidv4(),
      name: workflowName,
      description: workflowDescription,
      nodes: nodes,
      edges: edges,
    };

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schema: workflowData,
          name: workflowName,
          description: workflowDescription,
        }),
      });

      if (response.ok) {
        toast.success("Workflow saved successfully!");
        setOpen(false);
        setActiveStep(1);
        resetWorkflow();
        
        // Invalidate the workflows query to refresh the list
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
        
        if (onWorkflowCreated) {
          onWorkflowCreated();
        }
      } else {
        const errorData = await response.json();
        toast.error(
          `Failed to save workflow: ${errorData.error || response.statusText}`,
        );
      }
    } catch (error) {
      toast.error("An unexpected error occurred while saving the workflow.");
    }
  };

  const handleRunWorkflow = async () => {
    if (nodes.length === 0) {
      toast.error("Please add at least one node to run the workflow");
      return;
    }

    setIsRunningWorkflow(true);
    setExecutionMessage('Starting workflow execution...');
    setWorkflowProgress(new Map());

    const workflowData = {
      id: uuidv4(),
      name: workflowName || "Test Workflow",
      description: workflowDescription,
      nodes: nodes,
      edges: edges,
    };

    try {
      const response = await fetch("/api/workflows/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId: workflowData.id,
          workflowSchema: workflowData,
          inputQuery: "Execute workflow"
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'workflow_started':
                setExecutionMessage(data.message);
                break;
                
              case 'node_started':
                setWorkflowProgress(new Map([...Array.from(workflowProgress.entries()), [data.nodeId, {
                  status: 'running',
                  description: data.description
                }]]));
                setExecutionMessage(`Running ${data.agentName}...`);
                break;
                
              case 'node_completed':
                setWorkflowProgress(new Map([...Array.from(workflowProgress.entries()), [data.nodeId, {
                  status: 'completed',
                  output: data.output,
                  description: data.description
                }]]));
                setExecutionMessage(`${data.agentName} completed`);
                break;
                
              case 'node_error':
                setWorkflowProgress(new Map([...Array.from(workflowProgress.entries()), [data.nodeId, {
                  status: 'error',
                  error: data.error,
                  description: data.description
                }]]));
                setExecutionMessage(`Error: ${data.error}`);
                break;
                
              case 'workflow_completed':
                setExecutionMessage('Workflow completed successfully');
                break;
                
              case 'error':
                setExecutionMessage(data.message);
                break;
            }
          }
        }
      }

      setIsRunningWorkflow(false);
    } catch (error) {
      setExecutionMessage('Failed to execute workflow');
      setIsRunningWorkflow(false);
    }
  };

  const handleGenerateWorkflow = async () => {
    setIsGenerating(true);
    setShowGenerationProgress(true);
    setGenerationProgress(0);
    setGenerationMessage('Initializing...');
    let workflowPrompt = prompt;

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(
            `Failed to upload file: ${errorData.error || response.statusText}`,
          );
          setIsGenerating(false);
          setShowGenerationProgress(false);
          return;
        }

        const uploadData = await response.json();
        workflowPrompt = uploadData.text;
      } catch (error) {
        toast.error("An unexpected error occurred while uploading the file.");
        setIsGenerating(false);
        setShowGenerationProgress(false);
        return;
      }
    }

    if (!workflowPrompt) {
      toast.error("Please provide a prompt or a file.");
      setIsGenerating(false);
      setShowGenerationProgress(false);
      return;
    }

    try {
      console.log(
        "Sending workflow generation request with prompt:",
        workflowPrompt,
      );
      
      const response = await fetch("/api/workflows/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: workflowPrompt }),
      });

      if (!response.ok) {
        console.error(
          "Failed to generate workflow:",
          response.status,
          response.statusText,
        );
        const errorData = await response.json();
        toast.error(
          `Failed to generate workflow: ${
            errorData.error || response.statusText
          }`,
        );
        setIsGenerating(false);
        setShowGenerationProgress(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let workflowData: any = null;
      let eventBuffer = '';

      // Simulate progress lol
      const progressInterval = setInterval(() => {
        const currentProgress = useWorkflowStore.getState().generationProgress;
        const newProgress = Math.min(currentProgress + 1, 90);
        setGenerationProgress(newProgress);
        if (newProgress >= 90) {
          clearInterval(progressInterval);
        }
      }, 125);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        eventBuffer += chunk;

        // Process SSE events
        const events = eventBuffer.split('\n\n');
        eventBuffer = events.pop() || '';

        for (const event of events) {
          const lines = event.split('\n');
          let eventType = '';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              data = line.slice(6);
            }
          }

          if (data) {
            try {
              const parsedData = JSON.parse(data);
              
              switch (eventType) {
                case 'clarification':
                  setClarificationQuestions(parsedData.questions);
                  toast.info("Clarification needed", {
                    description: "Please answer the questions to continue",
                  });
                  clearInterval(progressInterval);
                  setIsGenerating(false);
                  setShowGenerationProgress(false);
                  return;
                  
                case 'workflow':
                  workflowData = parsedData;
                  clearInterval(progressInterval);
                  setGenerationProgress(100);
                  setGenerationMessage('Workflow generated successfully');
                  toast.success("Workflow generated successfully");
                  break;
                  
                case 'progress':
                  setGenerationMessage(parsedData.message);
                  toast.info("Generating workflow", {
                    description: parsedData.message,
                  });
                  break;
                  
                case 'complete':
                  clearInterval(progressInterval);
                  setGenerationProgress(100);
                  setGenerationMessage('Generation completed');
                  break;
                  
                case 'error':
                  toast.error("Generation failed", {
                    description: parsedData.message,
                  });
                  clearInterval(progressInterval);
                  setIsGenerating(false);
                  setShowGenerationProgress(false);
                  return;
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }

      if (workflowData) {
        const newNodes = workflowData.steps.map((step: any, index: number) => ({
          id: `node-${index + 1}`,
          type: "workflowNode",
          position: { x: 250, y: 100 + index * (step.type === "human-input" ? 250 : 200) },
          data: {
            type: step.type,
            description: step.description,
            agent: step.agent || "",
          },
        }));

        const newEdges = newNodes
          .slice(0, -1)
          .map((node: any, index: number) => ({
            id: `edge-${node.id}-${newNodes[index + 1].id}`,
            source: node.id,
            target: newNodes[index + 1].id,
            type: "custom",
          }));

        setNodes(newNodes);
        setEdges(newEdges);
        setWorkflowName(workflowData.name);
        setWorkflowDescription(workflowData.description);
        setClarificationQuestions([]);
        setActiveStep(2);
        
        // Hide progress after a short delay
        setTimeout(() => {
          setShowGenerationProgress(false);
          setGenerationProgress(0);
        }, 1000);
      }
    } catch (error) {
      toast.error(
        "An unexpected error occurred while generating the workflow.",
      );
      setShowGenerationProgress(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Workflow Manually</Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create a New Workflow</DialogTitle>
          <DialogDescription>
            Follow the steps to build and configure your automated workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <Stepper
            value={activeStep}
            onValueChange={setActiveStep}
            className="w-full max-w-3xl"
          >
            {steps.map((step, index) => (
              <StepperItem key={step.id} step={index + 1} className="mx-4">
                <StepperTrigger>
                  <StepperIndicator>{index + 1}</StepperIndicator>
                  <div>
                    <StepperTitle>{step.title}</StepperTitle>
                    <StepperDescription>{step.description}</StepperDescription>
                  </div>
                </StepperTrigger>
                {index < steps.length - 1 && <StepperSeparator />}
              </StepperItem>
            ))}
          </Stepper>
          
          <WorkflowProgress
            showGenerationProgress={showGenerationProgress && activeStep === 1}
            generationProgress={generationProgress}
            generationMessage={generationMessage}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-auto">
          <div className="p-2 border rounded-lg overflow-y-auto">
            {activeStep === 1 && (
              <StepContent
                workflowName={workflowName}
                workflowDescription={workflowDescription}
                prompt={prompt}
                file={file}
                clarificationQuestions={clarificationQuestions}
                isGenerating={isGenerating}
                onWorkflowNameChange={setWorkflowName}
                onWorkflowDescriptionChange={setWorkflowDescription}
                onPromptChange={setPrompt}
                onFileChange={setFile}
                onGenerateWorkflow={handleGenerateWorkflow}
              />
            )}
            {activeStep === 2 && (
              <NodeBuilder
                nodes={nodes}
                currentNodeDescription={currentNodeDescription}
                currentNodeAgent={currentNodeAgent}
                agentNames={agentNames}
                onCurrentNodeDescriptionChange={setCurrentNodeDescription}
                onCurrentNodeAgentChange={setCurrentNodeAgent}
                onAddNode={addNode}
                onDeleteNode={deleteNode}
              />
            )}
            {activeStep === 3 && (
              <WorkflowReview
                workflowName={workflowName}
                workflowDescription={workflowDescription}
                nodes={nodes}
              />
            )}
          </div>

          <div className="border rounded-lg h-full">
            <SchemaVisualizer
              nodes={nodes}
              edges={edges}
              height="h-[62.5vh]"
              workflowProgress={workflowProgress}
            />
          </div>
        </div>

        <DialogFooter>
          {activeStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setActiveStep(activeStep - 1)}
            >
              Back
            </Button>
          )}
          {activeStep < steps.length && (
            <Button onClick={handleNextStep}>Next</Button>
          )}
          {activeStep === steps.length && (
            <>
              <Button 
                onClick={handleRunWorkflow} 
                disabled={isRunningWorkflow || nodes.length === 0}
                variant="secondary"
              >
                {isRunningWorkflow ? "Running..." : "Run Workflow"}
              </Button>
              <Button onClick={handleSaveWorkflow}>Save Workflow</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
