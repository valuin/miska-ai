"use client";

import { Button } from "@/components/ui/button";
import { File } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { type Message, useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { Dropzone } from "@/components/ui/dropzone";

export function WorkflowDetails() {
  const [readySubmit, setReadySubmit] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const {
    workflowName,
    workflowDescription,
    workflowExample,
    workflowFileText,
    file,
    clarificationQuestions,
    isGenerating,
    setWorkflowExample,
    setWorkflowName,
    setWorkflowDescription,
    setWorkflowFileText,
    setFile,
    setIsGenerating,
    setShowGenerationProgress,
    setGenerationProgress,
    setGenerationMessage,
    setNodes,
    setEdges,
    setClarificationQuestions,
    setActiveStep,
  } = useWorkflowStore();

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    toast.info("Uploading file...");
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
      return uploadData.text;
    } catch (error) {
      toast.error("An unexpected error occurred while uploading the file.");
      setIsGenerating(false);
      setShowGenerationProgress(false);
      return null;
    }
  };

  const { messages, handleInputChange, handleSubmit, setInput } = useChat({
    api: "/api/workflows/generate",
    streamProtocol: "data",
    onResponse: (response) => {
      console.log(response);
    },
  });

  const getPrompt = ({
    name,
    description,
    example,
    file,
  }: {
    name: string;
    description: string;
    example: string;
    file: string;
  }) => {
    let prompt = ``;
    if (name) prompt += `Name: ${name}; `;
    if (description) prompt += `Description: ${description}; `;
    if (example) prompt += `Workflow Example: ${example}; `;
    if (file) prompt += `\nFile: ${file}; `;
    return prompt;
  };

  const onChange = (value: string, key: string) => {
    const prompt = getPrompt({
      name: workflowName,
      description: workflowDescription,
      example: workflowExample,
      file: workflowFileText,
      [key]: value,
    });
    const event = {
      target: { value: prompt },
    } as ChangeEvent<HTMLInputElement>;
    setInput(prompt);
    handleInputChange(event);
    if (prompt && !uploadingFile) setReadySubmit(true);
    return value;
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!readySubmit) {
      toast.error("Please fill in all fields.");
      return;
    }

    toast.info("Generating workflow...");
    setIsGenerating(true);
    setShowGenerationProgress(true);
    setGenerationProgress(0);
    setGenerationMessage("Initializing...");
    handleSubmit();
  };

  const updatingWorkflow = useCallback(
    (name: string, description: string, steps: any[]) => {
      // create nodes
      const newNodes = steps.map((step: any, index: number) => ({
        id: `node-${index + 1}`,
        type: "workflowNode",
        position: {
          x: 250,
          y: 100 + index * (step.type === "human-input" ? 250 : 200),
        },
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
      setWorkflowName(name);
      setWorkflowDescription(description);
      setClarificationQuestions([]);
      setActiveStep(2);
    },
    [
      setNodes,
      setEdges,
      setWorkflowName,
      setWorkflowDescription,
      setClarificationQuestions,
      setActiveStep,
    ],
  );

  // handling tool invocations
  useEffect(() => {
    try {
      const processTools = (messages: Message[]) => {
        const assistantMessage = messages.find((m) => m.role === "assistant");
        if (!assistantMessage) return;
        const { parts } = assistantMessage;
        if (!parts) return "Couldn't find parts";
        const toolInvocations = parts.filter(
          (p) => p.type === "tool-invocation",
        );
        if (!toolInvocations || toolInvocations.length === 0)
          return "No tool invocations";
        const result = toolInvocations[0] as any;
        const { toolInvocation } = result;
        const { name, description, steps } = toolInvocation?.args || {};
        if (!steps || !Array.isArray(steps)) return "No steps";
        updatingWorkflow(name, description, steps);
        return "success";
      };

      const result = processTools(messages);
      if (!result) return;
      if (result === "success") {
        toast.success("Workflow generated successfully");
        setShowGenerationProgress(false);
        setIsGenerating(false);
      }
    } catch (error) {
      setShowGenerationProgress(false);
      setIsGenerating(false);
      toast.error(
        "An unexpected error occurred while generating the workflow.",
      );
    }
  }, [messages, updatingWorkflow, setIsGenerating, setShowGenerationProgress]);

  // handling tool invocations
  useEffect(() => {
    const processAnnotations = (messages: Message[]) => {
      const annotations: any[] = messages
        .flatMap((m) => m.annotations)
        .filter(Boolean);

      if (!annotations || annotations.length === 0) return;

      const progress = annotations
        .filter((a) => a.type === "progress")
        .at(-1) as any;

      if (progress) {
        setGenerationProgress(progress.progress);
        setGenerationMessage(progress.message);
        if (progress.progress === 100) {
          setIsGenerating(false);
          setShowGenerationProgress(false);
        }
      }
    };

    processAnnotations(messages);
  }, [
    messages,
    setGenerationProgress,
    setGenerationMessage,
    setIsGenerating,
    setShowGenerationProgress,
  ]);

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 h-full p-4">
      <div className="flex h-full flex-col gap-2 flex-0 overflow-y-auto px-1">
        {clarificationQuestions.length > 0 && (
          <div className="p-4 border rounded-md bg-amber-50 border-amber-200">
            <p className="font-semibold text-amber-800">
              Please answer the following questions to generate the workflow:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-amber-700">
              {clarificationQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        <Label htmlFor="workflow-name">Workflow Name</Label>
        <Input
          id="workflow-name"
          name="name"
          value={workflowName}
          placeholder="e.g., Customer Support Automation"
          onChange={(event) => {
            const prompt = onChange(event.target.value, "name");
            setWorkflowName(prompt);
          }}
        />

        <Label htmlFor="workflow-description">Description</Label>
        <Textarea
          rows={4}
          id="workflow-description"
          name="description"
          value={workflowDescription}
          placeholder="Describe what this workflow does."
          onChange={(event) => {
            const prompt = onChange(event.target.value, "description");
            setWorkflowDescription(prompt);
          }}
        />

        <Label htmlFor="workflow-example">Example Prompt</Label>
        <Textarea
          rows={4}
          id="workflow-example"
          name="example"
          placeholder="Describe the workflow you want to generate."
          value={workflowExample}
          onChange={(event) => {
            const prompt = onChange(event.target.value, "example");
            setWorkflowExample(prompt);
          }}
        />

        <Label htmlFor="workflow-file">File</Label>
        <Dropzone
          onDrop={async (acceptedFiles) => {
            const file = acceptedFiles[0];
            setFile(acceptedFiles[0]);
            setUploadingFile(true);
            setReadySubmit(false);
            const fileText = await uploadFile(file);
            onChange(fileText, "file");
            setWorkflowFileText(fileText);
            setUploadingFile(false);
            setReadySubmit(true);
          }}
          accept={{ "application/pdf": [".pdf"] }}
          maxFiles={1}
        >
          <div>
            {uploadingFile ? (
              <p>Uploading file...</p>
            ) : file ? (
              <p className="flex items-center gap-2">
                <File size={16} />
                {file.name ?? (file as any)?.path?.split("/").pop() ?? "File"}
              </p>
            ) : (
              <p>Drop a PDF file here</p>
            )}
          </div>
        </Dropzone>
      </div>
      <Button
        className="sticky bottom-0"
        type="submit"
        disabled={isGenerating || !readySubmit}
      >
        {isGenerating ? "Generating..." : "Generate Workflow"}
      </Button>
    </form>
  );
}
