"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "@/components/ui/stepper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SchemaVisualizer from "./schema-builder";
import { agents } from "@/mastra/client";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

const steps = [
  { id: "step-1", title: "Workflow Details", description: "Name and describe" },
  { id: "step-2", title: "Add Nodes", description: "Build your workflow" },
  {
    id: "step-3",
    title: "Review & Save",
    description: "Finalize your workflow",
  },
];

const workflowDetailSchema = z.object({
  workflowName: z.string().min(1, "Workflow name is required."),
  workflowDescription: z.string().optional(),
});

const nodeSchema = z.object({
  currentNodeDescription: z.string().min(1, "Node description is required."),
  currentNodeAgent: z.string().min(1, "An agent is required."),
});

export function ManualWorkflowDialog() {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [currentNodeDescription, setCurrentNodeDescription] = useState("");
  const [currentNodeAgent, setCurrentNodeAgent] = useState("");

  const agentNames = useMemo(() => agents, []);

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
      position: { x: 250, y: 100 + nodes.length * 150 },
      data: {
        type: "agent-task",
        description: currentNodeDescription,
        agent: currentNodeAgent,
      },
    };

    setNodes((prev) => [...prev, newNode]);

    if (nodes.length > 0) {
      const prevNodeId = nodes[nodes.length - 1].id;
      const newEdge = {
        id: `edge-${prevNodeId}-${newNodeId}`,
        source: prevNodeId,
        target: newNodeId,
        type: "custom",
      };
      setEdges((prev) => [...prev, newEdge]);
    }

    setCurrentNodeDescription("");
    setCurrentNodeAgent("");
  };

  const deleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
    setEdges((prev) =>
      prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    );
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
    // For step 2, we don't have explicit validation to prevent moving forward if no nodes are added,
    // but we could add a check here if needed (e.g., if (activeStep === 2 && nodes.length === 0) return;)
    setActiveStep((s) => s + 1);
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
        setWorkflowName("");
        setWorkflowDescription("");
        setNodes([]);
        setEdges([]);
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

        <div className="flex justify-start mb-4">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-auto">
          <div className="p-2 border rounded-lg overflow-y-auto">
            {activeStep === 1 && (
              <div className="space-y-4 py-4 px-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="e.g., Customer Support Automation"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea
                    id="workflow-description"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    rows={8}
                    placeholder="Describe what this workflow does."
                  />
                </div>
              </div>
            )}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Nodes</Label>
                  <div className="p-2 border rounded-md bg-muted min-h-[100px]">
                    {nodes.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center justify-between text-sm p-1"
                      >
                        <span>
                          {n.data.description} ({n.data.agent})
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNode(n.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="node-description">Node Description</Label>
                  <Textarea
                    id="node-description"
                    value={currentNodeDescription}
                    onChange={(e) => setCurrentNodeDescription(e.target.value)}
                    placeholder="Describe the agent's task for this node."
                  />
                </div>
                <div>
                  <Label htmlFor="node-agent">Select Agent</Label>
                  <Select
                    value={currentNodeAgent}
                    onValueChange={setCurrentNodeAgent}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentNames.map((agent) => (
                        <SelectItem key={agent} value={agent}>
                          {agent}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addNode}>Add Node</Button>
              </div>
            )}
            {activeStep === 3 && (
              <div>
                <h3 className="font-semibold text-lg">Review Your Workflow</h3>
                <p>
                  <strong>Name:</strong> {workflowName}
                </p>
                <p>
                  <strong>Description:</strong> {workflowDescription || "N/A"}
                </p>
                <p>
                  <strong>Nodes:</strong> {nodes.length}
                </p>
              </div>
            )}
          </div>

          <div className="border rounded-lg h-full">
            <SchemaVisualizer nodes={nodes} edges={edges} height="h-[62.5vh]" />
          </div>
        </div>

        <DialogFooter>
          {activeStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setActiveStep((s) => s - 1)}
            >
              Back
            </Button>
          )}
          {activeStep < steps.length && (
            <Button onClick={handleNextStep}>Next</Button>
          )}
          {activeStep === steps.length && (
            <Button onClick={handleSaveWorkflow}>Save Workflow</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
