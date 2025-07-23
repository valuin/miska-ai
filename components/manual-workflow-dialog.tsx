'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from '@/components/ui/stepper';
import { useWorkflow } from '@/hooks/use-workflow';
import { useQueryClient } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { Flow } from './workflow-detail-flow';
import {
  NodeBuilder,
  WorkflowDetails,
  WorkflowReview,
} from './workflow-details';
import { GenerateWorkflow } from './generate-workflow';

const steps = [
  { id: 1, title: 'Details', description: 'Configure basic settings' },
  { id: 2, title: 'Build', description: 'Add and connect nodes' },
  { id: 3, title: 'Review', description: 'Review and test' },
];

const workflowDetailSchema = z.object({
  workflowName: z.string().min(1, 'Workflow name is required.'),
  workflowDescription: z.string().optional(),
});

export function ManualWorkflowDialog({
  onWorkflowCreated,
}: {
  onWorkflowCreated?: () => void;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // Start at 'Details'

  const {
    nodes,
    edges,
    startExecution,
    resetWorkflow,
    workflowExecutionState,
    workflowName,
    workflowDescription,
  } = useWorkflow((state) => ({
    nodes: state.nodes,
    edges: state.edges,
    startExecution: state.startExecution,
    resetWorkflow: state.resetWorkflow,
    workflowExecutionState: state.workflowExecutionState,
    workflowName: state.workflowName,
    workflowDescription: state.workflowDescription,
  }));

  const handleNextStep = () => {
    if (activeStep === 1) { // Now 'Details' is step 1
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
      toast.error('Workflow name cannot be empty.');
      return;
    }

    const workflowData = {
      id: uuidv4(),
      name: workflowName,
      description: workflowDescription,
      nodes,
      edges,
    };

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: workflowData,
          name: workflowName,
          description: workflowDescription,
        }),
      });

      if (response.ok) {
        toast.success('Workflow saved successfully!');
        setOpen(false);
        setActiveStep(1);
        resetWorkflow();
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
      toast.error('An unexpected error occurred while saving the workflow.');
    }
  };

  const handleRunWorkflow = async () => {
    if (nodes.length === 0) {
      toast.error('Please add at least one node to run the workflow');
      return;
    }

    const result = await startExecution();
    if (result.status === 'error') {
      toast.error(result.message);
    } else {
      toast.success('Workflow execution started.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Workflow</Button>
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
            {steps.map(
              (
                step: { id: number; title: string; description: string },
                index: number,
              ) => (
                <StepperItem key={step.id} step={index + 1} className="mx-4">
                  <StepperTrigger>
                    <StepperIndicator>{index + 1}</StepperIndicator>
                    <div>
                      <StepperTitle>{step.title}</StepperTitle>
                      <StepperDescription>
                        {step.description}
                      </StepperDescription>
                    </div>
                  </StepperTrigger>
                  {index < steps.length - 1 && <StepperSeparator />}
                </StepperItem>
              ),
            )}
          </Stepper>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-auto">
          <div className="border rounded-lg overflow-y-auto p-4">
            {activeStep === 1 && (
              <WorkflowDetails />
            )}
            {activeStep === 2 && <NodeBuilder />}
            {activeStep === 3 && <WorkflowReview />}
            {activeStep === 4 && <GenerateWorkflow />}
          </div>

          <div className="border rounded-lg h-full">
            <ReactFlowProvider>
              <Flow />
            </ReactFlowProvider>
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
                disabled={
                  workflowExecutionState.isRunning || nodes.length === 0
                }
                variant="secondary"
              >
                {workflowExecutionState.isRunning
                  ? 'Running...'
                  : 'Run Workflow'}
              </Button>
              <Button onClick={handleSaveWorkflow}>Save Workflow</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
