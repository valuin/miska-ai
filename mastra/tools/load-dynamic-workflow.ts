import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import type { AGENT_TYPES } from "@/lib/constants";
import type { MastraRuntimeContext } from "@/mastra";
import type { RuntimeContext } from "@mastra/core/di";

export type WorkflowNode = {
  id: string;
  type: "human-input" | "agent-task";
  description: string;
  agent?: (typeof AGENT_TYPES)[number];
  next?: string[];
};

interface MastraWorkflowConfig {
  id: string;
  description: string;
  nodes: WorkflowNode[];
  runtimeContext: RuntimeContext<MastraRuntimeContext>;
}

/**
 * Dynamically creates a Mastra workflow from a serialized JSON definition.
 *
 * @param config - The configuration object containing the workflow definition.
 * @param config.id - A unique ID for the Mastra workflow.
 * @param config.description - A high-level description for the Mastra workflow.
 * @param config.nodes - An array of WorkflowNode objects representing the graph.
 * @returns A committed Mastra Workflow instance.
 */
export function createMastraWorkflowFromJson({
  id,
  description,
  nodes,
  runtimeContext,
}: MastraWorkflowConfig) {
  if (!nodes || nodes.length === 0) {
    throw new Error("Cannot create a workflow from an empty list of nodes.");
  }

  const mastraSteps = new Map<string, any>();

  for (const node of nodes) {
    let step: any;
    const genericSchema = z.object({ payload: z.any() }).passthrough();

    switch (node.type) {
      case "agent-task": {
        const mastra = runtimeContext.get("mastra");
        if (!node.agent || !mastra.getAgent(node.agent)) {
          throw new Error(
            `Agent "${node.agent}" not found in registry for node ID "${node.id}".`,
          );
        }
        const agentInstance = mastra.getAgent(node.agent);
        step = createStep(agentInstance);
        break;
      }

      case "human-input": {
        step = createStep({
          id: node.id,
          description: node.description,
          inputSchema: genericSchema,
          outputSchema: genericSchema,
          execute: async ({ suspend, inputData }) => {
            console.log(
              `Workflow suspended for human input at step: ${node.description}`,
            );
            console.log("Current data:", inputData);
            return suspend({});
          },
        });
        break;
      }

      default:
        throw new Error(`Unsupported node type for node ID "${node.id}".`);
    }
    mastraSteps.set(node.id, step);
  }

  let workflowBuilder = createWorkflow({
    id,
    description,
    inputSchema: z
      .object({ payload: z.any() })
      .describe("Initial payload for the workflow"),
    outputSchema: z
      .object({ payload: z.any() })
      .describe("Final output of the workflow"),
  });

  // Chain all the created steps sequentially
  for (const node of nodes) {
    const stepToChain = mastraSteps.get(node.id);
    if (stepToChain) {
      if (node.type === "agent-task") {
        workflowBuilder = workflowBuilder.map(async ({ inputData }) => {
          const prompt =
            typeof inputData.payload === "object"
              ? JSON.stringify(inputData.payload)
              : String(inputData.payload);
          return { payload: prompt };
        });
      }
      workflowBuilder = workflowBuilder.then(stepToChain);
    }
  }

  return workflowBuilder.commit();
}
