"use client";

import { Button } from "@/components/ui/button";
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
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { WorkflowDetails } from "./workflow/workflow-details";
import { NodeBuilder } from "./workflow/node-builder";
import { WorkflowReview } from "./workflow/workflow-review";
import { WorkflowProgress } from "./workflow/workflow-progress";
import { steps } from "./workflow/workflow-steps";
import { useWorkflowStore } from "@/lib/store/workflow-store";

const workflowDetailSchema = z.object({
  workflowName: z.string().min(1, "Workflow name is required."),
  workflowDescription: z.string().optional(),
});

export function ManualWorkflowDialog({
  onWorkflowCreated,
}: {
  onWorkflowCreated?: () => void;
}) {
  const queryClient = useQueryClient();

  // Zustand store
  const {
    workflowName,
    workflowDescription,
    nodes,
    edges,
    workflowProgress,
    isRunningWorkflow,
    generationProgress,
    generationMessage,
    showGenerationProgress,
    activeStep,
    open,
    setWorkflowProgress,
    setIsRunningWorkflow,
    resetWorkflow,
    setActiveStep,
    setExecutionMessage,
    setOpen,
  } = useWorkflowStore();

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
        queryClient.invalidateQueries({ queryKey: ["workflows"] });

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
    setExecutionMessage("Starting workflow execution...");
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
          inputQuery: "Execute workflow",
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
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            switch (data.type) {
              case "workflow_started":
                setExecutionMessage(data.message);
                break;

              case "node_started":
                setWorkflowProgress(
                  new Map([
                    ...Array.from(workflowProgress.entries()),
                    [
                      data.nodeId,
                      {
                        status: "running",
                        description: data.description,
                      },
                    ],
                  ]),
                );
                setExecutionMessage(`Running ${data.agentName}...`);
                break;

              case "node_completed":
                setWorkflowProgress(
                  new Map([
                    ...Array.from(workflowProgress.entries()),
                    [
                      data.nodeId,
                      {
                        status: "completed",
                        output: data.output,
                        description: data.description,
                      },
                    ],
                  ]),
                );
                setExecutionMessage(`${data.agentName} completed`);
                break;

              case "node_error":
                setWorkflowProgress(
                  new Map([
                    ...Array.from(workflowProgress.entries()),
                    [
                      data.nodeId,
                      {
                        status: "error",
                        error: data.error,
                        description: data.description,
                      },
                    ],
                  ]),
                );
                setExecutionMessage(`Error: ${data.error}`);
                break;

              case "workflow_completed":
                setExecutionMessage("Workflow completed successfully");
                break;

              case "error":
                setExecutionMessage(data.message);
                break;
            }
          }
        }
      }

      setIsRunningWorkflow(false);
    } catch (error) {
      setExecutionMessage("Failed to execute workflow");
      setIsRunningWorkflow(false);
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
            {activeStep === 1 && <WorkflowDetails />}
            {activeStep === 2 && <NodeBuilder />}
            {activeStep === 3 && <WorkflowReview />}
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
