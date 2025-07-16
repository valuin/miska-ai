"use client";

import { Button } from "@/components/ui/button";
import { File } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useChat, useCompletion } from "@ai-sdk/react";
import { useState, type ChangeEvent } from "react";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/dropzone";

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

      <div>Messages:{JSON.stringify(messages, null, 2)}</div>
    </form>
  );
}

export function Page() {
  const { input, setInput, handleSubmit } = useCompletion({
    api: "/api/workflows/generate",
    onResponse: (response) => {
      console.log(response);
    },
  });

  const {
    workflowName,
    workflowDescription,
    workflowExample,
    file,
    clarificationQuestions,
    isGenerating,
    setWorkflowExample,
    setWorkflowName,
    setWorkflowDescription,
    setFile,
    setIsGenerating,
    setShowGenerationProgress,
    setGenerationProgress,
    setGenerationMessage,
  } = useWorkflowStore();

  const handleGenerateWorkflow = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    let prompt = `Workflow Name: ${workflowName}\n`;
    prompt += `Description: ${workflowDescription}\n`;
    prompt += `Workflow Example: ${workflowExample}\n`;

    if (!prompt) {
      toast.error("Please provide a prompt or a file.");
      setIsGenerating(false);
      setShowGenerationProgress(false);
      return;
    }

    setInput(prompt);

    // try {
    //   console.log(
    //     "Sending workflow generation request with prompt:",
    //     workflowPrompt,
    //   );
    //   const response = await fetch("/api/workflows/generate", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ prompt: workflowPrompt }),
    //   });
    //   if (!response.ok) {
    //     console.error(
    //       "Failed to generate workflow:",
    //       response.status,
    //       response.statusText,
    //     );
    //     const errorData = await response.json();
    //     toast.error(
    //       `Failed to generate workflow: ${
    //         errorData.error || response.statusText
    //       }`,
    //     );
    //     setIsGenerating(false);
    //     setShowGenerationProgress(false);
    //     return;
    //   }
    //   const reader = response.body?.getReader();
    //   const decoder = new TextDecoder();
    //   if (!reader) {
    //     throw new Error("No response body");
    //   }
    //   let workflowData: any = null;
    //   let eventBuffer = "";
    //   // Simulate progress lol
    //   const progressInterval = setInterval(() => {
    //     const currentProgress = useWorkflowStore.getState().generationProgress;
    //     const newProgress = Math.min(currentProgress + 1, 90);
    //     setGenerationProgress(newProgress);
    //     if (newProgress >= 90) {
    //       clearInterval(progressInterval);
    //     }
    //   }, 125);
    //   while (true) {
    //     const { done, value } = await reader.read();
    //     if (done) break;
    //     const chunk = decoder.decode(value);
    //     eventBuffer += chunk;
    //     // Process SSE events
    //     const events = eventBuffer.split("\n\n");
    //     eventBuffer = events.pop() || "";
    //     for (const event of events) {
    //       const lines = event.split("\n");
    //       let eventType = "";
    //       let data = "";
    //       for (const line of lines) {
    //         if (line.startsWith("event: ")) {
    //           eventType = line.slice(7);
    //         } else if (line.startsWith("data: ")) {
    //           data = line.slice(6);
    //         }
    //       }
    //       if (data) {
    //         try {
    //           const parsedData = JSON.parse(data);
    //           switch (eventType) {
    //             case "clarification":
    //               setClarificationQuestions(parsedData.questions);
    //               toast.info("Clarification needed", {
    //                 description: "Please answer the questions to continue",
    //               });
    //               clearInterval(progressInterval);
    //               setIsGenerating(false);
    //               setShowGenerationProgress(false);
    //               return;
    //             case "workflow":
    //               workflowData = parsedData;
    //               clearInterval(progressInterval);
    //               setGenerationProgress(100);
    //               setGenerationMessage("Workflow generated successfully");
    //               toast.success("Workflow generated successfully");
    //               break;
    //             case "progress":
    //               setGenerationMessage(parsedData.message);
    //               toast.info("Generating workflow", {
    //                 description: parsedData.message,
    //               });
    //               break;
    //             case "complete":
    //               clearInterval(progressInterval);
    //               setGenerationProgress(100);
    //               setGenerationMessage("Generation completed");
    //               break;
    //             case "error":
    //               toast.error("Generation failed", {
    //                 description: parsedData.message,
    //               });
    //               clearInterval(progressInterval);
    //               setIsGenerating(false);
    //               setShowGenerationProgress(false);
    //               return;
    //           }
    //         } catch (error) {
    //           console.error("Error parsing SSE data:", error);
    //         }
    //       }
    //     }
    //   }
    //   if (workflowData) {
    //     const newNodes = workflowData.steps.map((step: any, index: number) => ({
    //       id: `node-${index + 1}`,
    //       type: "workflowNode",
    //       position: {
    //         x: 250,
    //         y: 100 + index * (step.type === "human-input" ? 250 : 200),
    //       },
    //       data: {
    //         type: step.type,
    //         description: step.description,
    //         agent: step.agent || "",
    //       },
    //     }));
    //     const newEdges = newNodes
    //       .slice(0, -1)
    //       .map((node: any, index: number) => ({
    //         id: `edge-${node.id}-${newNodes[index + 1].id}`,
    //         source: node.id,
    //         target: newNodes[index + 1].id,
    //         type: "custom",
    //       }));
    //     setNodes(newNodes);
    //     setEdges(newEdges);
    //     setWorkflowName(workflowData.name);
    //     setWorkflowDescription(workflowData.description);
    //     setClarificationQuestions([]);
    //     setActiveStep(2);
    //     // Hide progress after a short delay
    //     setTimeout(() => {
    //       setShowGenerationProgress(false);
    //       setGenerationProgress(0);
    //     }, 1000);
    //   }
    // } catch (error) {
    //   toast.error(
    //     "An unexpected error occurred while generating the workflow.",
    //   );
    //   setShowGenerationProgress(false);
    // } finally {
    //   setIsGenerating(false);
    // }
  };

  return (
    <form
      className="flex flex-col gap-2 h-full p-4"
      onSubmit={(e) => {
        handleGenerateWorkflow(e);
        handleSubmit(e);
      }}
    >
      <input type="hidden" value={input} readOnly />
      <div className="flex flex-col gap-2 flex-0 overflow-y-auto">
        <div className="flex flex-col gap-2">
          <Label htmlFor="workflow-name">Workflow Name</Label>
          <Input
            id="workflow-name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="e.g., Customer Support Automation"
          />
        </div>
        {/* Clarification Questions */}

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
          <Label>Example Prompt</Label>
          <Textarea
            placeholder="Describe the workflow you want to generate."
            value={workflowExample}
            onChange={(e) => setWorkflowExample(e.target.value)}
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

      <Button className="flex-1 h-full" type="submit" disabled={isGenerating}>
        {isGenerating ? "Generating..." : "Generate"}
      </Button>
    </form>
  );
}
