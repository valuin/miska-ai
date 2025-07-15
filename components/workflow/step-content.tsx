"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/dropzone";
import { Button } from "@/components/ui/button";

interface StepContentProps {
  workflowName: string;
  workflowDescription: string;
  prompt: string;
  file: File | null;
  clarificationQuestions: string[];
  isGenerating: boolean;
  onWorkflowNameChange: (value: string) => void;
  onWorkflowDescriptionChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onGenerateWorkflow: () => void;
}

export function StepContent({
  workflowName,
  workflowDescription,
  prompt,
  file,
  clarificationQuestions,
  isGenerating,
  onWorkflowNameChange,
  onWorkflowDescriptionChange,
  onPromptChange,
  onFileChange,
  onGenerateWorkflow,
}: StepContentProps) {
  return (
    <div className="space-y-4 py-4 px-3 flex flex-col h-full">
      <div className="flex flex-col gap-2 flex-0 overflow-y-auto px-1">
        <div className="flex flex-col gap-2">
          <Label htmlFor="workflow-name">Workflow Name</Label>
          <Input
            id="workflow-name"
            value={workflowName}
            onChange={(e) => onWorkflowNameChange(e.target.value)}
            placeholder="e.g., Customer Support Automation"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="workflow-description">Description</Label>
          <Textarea
            id="workflow-description"
            value={workflowDescription}
            onChange={(e) => onWorkflowDescriptionChange(e.target.value)}
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
            onChange={(e) => onPromptChange(e.target.value)}
            rows={4}
          />
          <Dropzone
            onDrop={(acceptedFiles) => onFileChange(acceptedFiles[0])}
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
        onClick={onGenerateWorkflow}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate"}
      </Button>
    </div>
  );
}