import { useState } from 'react';
import { useWorkflow } from '../use-workflow';
import { SSEWorkflowExecutionClient } from '@/lib/utils/workflows/sse-workflow-execution-client';
import type { WorkflowError } from '@/lib/utils/workflows/workflow';
import { validateHumanInputs } from '@/lib/validation/workflow-validation';
import type { GenerateTextNode } from './types';

export const useWorkflowExecution = () => {
  const [workflowExecutionState, setWorkflowExecutionState] = useState({
    isRunning: false,
    finishedAt: null as string | null,
    errors: [] as WorkflowError[],
    timesRun: 0,
  });
  const [nodeUserInputs, setNodeUserInputs] = useState<Record<string, string>>(
    {},
  );

  const {
    nodes,
    validateWorkflow,
    updateNodeExecutionState,
    updateNodeExecutionStates,
  } = useWorkflow((state) => ({
    nodes: state.nodes,
    validateWorkflow: state.validateWorkflow,
    updateNodeExecutionState: state.updateNodeExecutionState,
    updateNodeExecutionStates: state.updateNodeExecutionStates,
  }));

  const updateNodeUserInput = (nodeId: string, input: string) => {
    setNodeUserInputs((prevInputs) => ({
      ...prevInputs,
      [nodeId]: input,
    }));
  };

  const validateInputsBeforeExecution = () => {
    return validateHumanInputs(nodes as GenerateTextNode[], nodeUserInputs);
  };

  const startExecution = async () => {
    if (workflowExecutionState.timesRun > 3) {
      const message =
        'Workflow has already run successfully and cannot be run again';
      return {
        status: 'error' as const,
        message,
        error: new Error(message),
      };
    }

    const validation = validateInputsBeforeExecution();

    if (!validation.isValid) {
      const errorMessages = validation.errors.map((e) => e.message);
      return {
        status: 'error' as const,
        message: errorMessages.join(', '),
        error: new Error(errorMessages.join(', ')),
        validationErrors: validation.errors,
      };
    }

    setWorkflowExecutionState((state) => ({
      ...state,
      isRunning: true,
    }));

    try {
      const sseClient = new SSEWorkflowExecutionClient();
      const workflow = validateWorkflow();

      if (workflow.errors.length > 0) {
        const message = 'Workflow validation failed';
        return {
          status: 'error' as const,
          message,
          error: new Error(message),
          validationErrors: workflow.errors,
        };
      }

      await new Promise((resolve, reject) => {
        sseClient.connect(workflow, {
          onNodeUpdate: (nodeId, state) => {
            updateNodeExecutionState(nodeId, state);
          },
          onError: (error) => {
            reject(error);
          },
          onComplete: ({ timestamp }) => {
            setWorkflowExecutionState((state) => ({
              ...state,
              finishedAt: timestamp,
              timesRun: state.timesRun + 1,
            }));
            resolve(undefined);
          },
        });
      });

      return {
        status: 'success' as const,
        message: 'Workflow executed successfully',
      };
    } catch (error) {
      return {
        status: 'error' as const,
        message: 'Workflow execution failed',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    } finally {
      setWorkflowExecutionState((state) => ({
        ...state,
        isRunning: false,
      }));
    }
  };

  return {
    workflowExecutionState,
    nodeUserInputs,
    updateNodeUserInput,
    validateInputsBeforeExecution,
    startExecution,
  };
};
