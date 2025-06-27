import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Define the WorkflowNode type
export type WorkflowNode = {
  id: string;
  type: "human-input" | "agent-task";
  description: string;
  tool?: string;
  next?: string[];
};

// Tool input schema
const workflowInputSchema = z.object({
  description: z.string().describe("High-level description of the workflow"),
  steps: z
    .array(
      z.object({
        type: z.enum(["human-input", "agent-task"]),
        description: z.string(),
        tool: z.string().optional(),
      }),
    )
    .describe("Ordered list of steps to convert into a workflow"),
});

// Tool output schema
const workflowOutputSchema = z.object({
  workflow: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["human-input", "agent-task"]),
      description: z.string(),
      tool: z.string().optional(),
      next: z.array(z.string()).optional(),
    }),
  ),
});

export const workflowTool = createTool({
  id: "workflow-generator",
  description:
    "Generate a directed workflow graph from a description and list of steps.",
  inputSchema: workflowInputSchema,
  outputSchema: workflowOutputSchema,
  execute: async ({ context }) => {
    try {
      const { steps } = context;

      // Assign IDs and connect steps sequentially
      const nodes: WorkflowNode[] = steps.map((step, index) => {
        const id = crypto.randomUUID();
        const next = index < steps.length - 1 ? [] : undefined;
        return { ...step, id, next };
      });

      // Link next step by ID
      for (let i = 0; i < nodes.length - 1; i++) {
        nodes[i].next = [nodes[i + 1].id];
      }

      return { workflow: nodes };
    } catch (e) {
      console.error("Workflow generation failed:", e);
      return { workflow: [] };
    }
  },
});

export const clarificationTool = createTool({
  id: "clarify-workflow",
  description: "Ask user clarifying questions before generating a workflow.",
  inputSchema: z.object({
    questions: z.array(z.string().describe("The question to ask the user")),
  }),
  outputSchema: z.object({ questions: z.array(z.string()) }),
  execute: async ({ context }) => {
    try {
      const { questions } = context;
      return { questions };
    } catch (error) {
      console.error("Clarification tool error:", error);
      return { questions: [] };
    }
  },
});
