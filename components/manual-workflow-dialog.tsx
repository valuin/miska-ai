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
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/dropzone";
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
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clarificationQuestions, setClarificationQuestions] = useState<
    string[]
  >([]);

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

  const handleGenerateWorkflow = async () => {
    setIsGenerating(true);
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
          return;
        }

        const uploadData = await response.json();
        workflowPrompt = uploadData.text;
      } catch (error) {
        toast.error("An unexpected error occurred while uploading the file.");
        setIsGenerating(false);
        return;
      }
    }

    if (!workflowPrompt) {
      toast.error("Please provide a prompt or a file.");
      setIsGenerating(false);
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
        setIsGenerating(false); // Ensure generating state is reset on error
        return;
      }

      const data = await response.json();
      console.log("Workflow generation response data:", data);

      if (data.type === "clarification") {
        setClarificationQuestions(data.questions);
      } else if (data.type === "workflow") {
        const newNodes = data.steps.map((step: any, index: number) => ({
          id: `node-${index + 1}`,
          type: "workflowNode",
          position: { x: 250, y: 100 + index * 150 },
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
        setWorkflowName(data.name);
        setWorkflowDescription(data.description);
        setClarificationQuestions([]);
        setActiveStep(2); // Move to the "Add Nodes" step to show the generated workflow
      }
    } catch (error) {
      toast.error(
        "An unexpected error occurred while generating the workflow.",
      );
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
              <div className="space-y-4 py-4 px-3 flex flex-col h-full">
                <div className="flex flex-col gap-2 flex-0 overflow-y-auto px-1">
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
                  <div className="space-y-2">
                    <Label>Example / Prompt</Label>
                    {clarificationQuestions.length > 0 && (
                      <div className="p-4 border rounded-md bg-amber-50 border-amber-200">
                        <p className="font-semibold text-amber-800">
                          Please answer the following questions to generate the
                          workflow:
                        </p>
                        <ul className="list-disc list-inside mt-2 text-sm text-amber-700">
                          {clarificationQuestions.map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Textarea
                      placeholder="Describe the workflow you want to generate, or answer the questions above."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                    />
                    <Dropzone
                      onDrop={(acceptedFiles) => setFile(acceptedFiles[0])}
                      accept={{ "application/pdf": [".pdf"] }}
                      maxFiles={1}
                    >
                      {file ? (
                        <DropzoneContent>
                          <p>{file.name}</p>
                        </DropzoneContent>
                      ) : (
                        <DropzoneEmptyState>
                          <p>Drop a PDF file here</p>
                        </DropzoneEmptyState>
                      )}
                    </Dropzone>
                  </div>
                </div>
                <Button
                  className="flex-1"
                  onClick={handleGenerateWorkflow}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </Button>
              </div>
            )}
            {activeStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Nodes</Label>
                  <div className="p-2 pt-0 border rounded-md bg-muted min-h-[100px] flex flex-col divide-y divide-white/10">
                    {nodes.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center justify-between text-sm p-1"
                      >
                        <span className="w-full">
                          <span className="text-xs bg-white rounded-lg px-1 py-px text-[#27272a] mr-1">
                            {n.data.type === "agent-task"
                              ? n.data.agent
                              : "Human Input"}
                          </span>
                          <span className="text-xs">{n.data.description}</span>
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
                    className="overflow-x-visible"
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
