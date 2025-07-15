"use client";

import { Progress } from "@/components/ui/progress";

interface WorkflowProgressProps {
  showGenerationProgress: boolean;
  generationProgress: number;
  generationMessage: string;
}

export function WorkflowProgress({ showGenerationProgress, generationProgress, generationMessage }: WorkflowProgressProps) {
  if (!showGenerationProgress) return null;

  return (
    <div className="w-48 ml-4">
      <div className="text-sm text-muted-foreground mb-2">{generationMessage}</div>
      <Progress value={generationProgress} className="h-2" />
      <div className="text-xs text-muted-foreground mt-1">{Math.round(generationProgress)}%</div>
    </div>
  );
}