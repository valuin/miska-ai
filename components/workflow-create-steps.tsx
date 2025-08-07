'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { File, UploadCloud, Trash2 } from 'lucide-react'; // Added Trash2
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState } from 'react';
import { useWorkflow } from '@/hooks/use-workflow';
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '@/components/ui/dropzone';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { AGENT_TYPES } from '@/lib/constants';

export const WorkflowDetails = () => {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const {
    generateWorkflow,
    generationProgress,
    generationMessage,
    showGenerationProgress,
    workflowName,
    workflowDescription,
    setWorkflowName,
    setWorkflowDescription,
  } = useWorkflow((state) => ({
    generateWorkflow: state.generateWorkflow,
    generationProgress: state.generationProgress,
    generationMessage: state.generationMessage,
    showGenerationProgress: state.showGenerationProgress,
    workflowName: state.workflowName,
    workflowDescription: state.workflowDescription,
    setWorkflowName: state.setWorkflowName,
    setWorkflowDescription: state.setWorkflowDescription,
  }));

  const handleGenerate = () => {
    if (!prompt) {
      toast.error('Please enter a prompt to generate the workflow.');
      return;
    }
    generateWorkflow(prompt, file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="workflow-name">Workflow Name</Label>
          <Input
            id="workflow-name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="e.g., Customer Support Automation"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="workflow-description">Description</Label>
          <Textarea
            id="workflow-description"
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            placeholder="Describe what this workflow does."
            className="mt-1"
            rows={4}
          />
        </div>
        {/* Generate Workflow Section */}
        <div>
          <Label htmlFor="workflow-prompt" className="text-lg">
            Example Prompt
          </Label>
          <Textarea
            rows={4}
            id="workflow-prompt"
            name="prompt"
            placeholder="Describe the workflow you want to generate."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="workflow-file" className="text-lg">
            File
          </Label>
          <Dropzone
            className="mt-1"
            onDrop={(acceptedFiles) => {
              setFile(acceptedFiles[0]);
            }}
            accept={{
              'text/plain': ['.txt'],
              'application/pdf': ['.pdf'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                ['.docx'],
            }}
            maxFiles={1}
          >
            <DropzoneContent>
              <DropzoneEmptyState>
                <UploadCloud className="size-6" />
                <p className="text-sm text-gray-500">
                  Drop a file here or click to upload
                </p>
              </DropzoneEmptyState>
            </DropzoneContent>
          </Dropzone>
          {file && (
            <p className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
              <File size={16} />
              {file.name}
            </p>
          )}
        </div>
        <Button onClick={handleGenerate} className="w-full">
          {showGenerationProgress ? 'Generating...' : 'Generate Workflow'}
        </Button>
      </CardContent>
    </Card>
  );
};

const nodeSchema = z.object({
  currentNodeDescription: z.string().min(1, 'Node description is required.'),
  currentNodeAgent: z.string().min(1, 'An agent is required.'),
});

export function NodeBuilder() {
  const {
    nodes,
    edges,
    currentNodeDescription,
    currentNodeAgent,
    setCurrentNodeDescription,
    setCurrentNodeAgent,
    addNode,
    deleteNode,
  } = useWorkflow((state) => ({
    nodes: state.nodes,
    edges: state.edges,
    currentNodeDescription: state.currentNodeDescription,
    currentNodeAgent: state.currentNodeAgent,
    setCurrentNodeDescription: state.setCurrentNodeDescription,
    setCurrentNodeAgent: state.setCurrentNodeAgent,
    addNode: state.addNode,
    deleteNode: state.deleteNode,
  }));

  const handleAddNode = () => {
    const result = nodeSchema.safeParse({
      currentNodeDescription,
      currentNodeAgent,
    });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    addNode();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-lg">Nodes</Label>
          <div className="border rounded-md bg-muted min-h-[100px] max-h-[220px] flex flex-col divide-y divide-white/10 overflow-x-hidden overflow-y-auto">
            {nodes.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between text-sm hover:bg-muted-foreground/10 px-2"
              >
                <span className="w-full">
                  <span className="text-xs bg-white rounded-lg px-1 py-px text-[#27272a] mr-1">
                    {'agent' in n.data && n.data.agent
                      ? n.data.agent
                      : 'Human Input'}
                  </span>
                  <span className="text-xs">
                    {'description' in n.data && n.data.description}
                  </span>
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

        <div className="space-y-2">
          <Label className="text-lg">Create a new node</Label>
          <div className="flex flex-col gap-2">
            <Label htmlFor="node-agent">Select Agent</Label>
            <Select
              value={currentNodeAgent}
              onValueChange={setCurrentNodeAgent}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_TYPES.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Label htmlFor="node-description">Node Description</Label>
            <Textarea
              className="overflow-x-visible"
              id="node-description"
              value={currentNodeDescription}
              onChange={(e) => setCurrentNodeDescription(e.target.value)}
              placeholder="Describe the agent's task for this node."
            />
            <Button onClick={handleAddNode}>Add Node</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const WorkflowReview = () => (
  <Card>
    <CardHeader>
      <CardTitle>Review & Test</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Review your workflow configuration and run it.
      </p>
    </CardContent>
  </Card>
);

export const steps = [
  { id: 1, title: 'Details', description: 'Configure basic settings' },
  { id: 2, title: 'Build', description: 'Add and connect nodes' },
  { id: 3, title: 'Review', description: 'Review and test' },
];
