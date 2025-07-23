'use client';

import { Button } from '@/components/ui/button';
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '@/components/ui/dropzone';
import { Textarea } from '@/components/ui/textarea';
import { useWorkflow } from '@/hooks/use-workflow';
import { useState } from 'react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

export function GenerateWorkflow() {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | undefined>();
  const {
    generateWorkflow,
    generationProgress,
    generationMessage,
    showGenerationProgress,
  } = useWorkflow((state) => ({
    generateWorkflow: state.generateWorkflow,
    generationProgress: state.generationProgress,
    generationMessage: state.generationMessage,
    showGenerationProgress: state.showGenerationProgress,
  }));

  const handleGenerate = () => {
    if (!prompt) {
      toast.error('Please enter a prompt to generate the workflow.');
      return;
    }
    generateWorkflow(prompt, file);
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the workflow you want to create..."
        rows={4}
      />
      <Dropzone
        onDrop={(acceptedFiles) => setFile(acceptedFiles[0])}
        maxFiles={1}
      >
        {file ? (
          <DropzoneContent>{file.name}</DropzoneContent>
        ) : (
          <DropzoneEmptyState>
            Drop a file or click to upload (optional)
          </DropzoneEmptyState>
        )}
      </Dropzone>
      <Button onClick={handleGenerate} disabled={showGenerationProgress}>
        {showGenerationProgress ? 'Generating...' : 'Generate Workflow'}
      </Button>
      {showGenerationProgress && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{generationMessage}</p>
          <Progress value={generationProgress} />
        </div>
      )}
    </div>
  );
}
