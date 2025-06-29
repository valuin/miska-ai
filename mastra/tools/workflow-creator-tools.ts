import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const AGENT_TYPES = ["researchAgent", "ragChatAgent", "documentAgent"] as const;
const agentEnum = z.enum(AGENT_TYPES);

export type WorkflowNode = {
  id: string;
  type: "human-input" | "agent-task";
  description: string;
  agent?: (typeof AGENT_TYPES)[number];
  next?: string[];
};

export const workflowTool = createTool({
  id: "workflow-generator",
  description: `
  Generates a directed workflow graph from a description and list of steps.
  
  Required node structure:
  - id: string (unique identifier, typically UUID)
  - type: "human-input" | "agent-task"
  - description: string (clear step description)
  - agent: string (required for agent-task nodes)
  - next: string[] (optional array of next node IDs)
  
  Rules:
  1. All nodes must be connected via 'next' fields
  2. Human-input nodes cannot have agents
  3. Agent-task nodes must specify an agent
  4. The last node should omit 'next' field
  `,
  inputSchema: z.object({
    description: z.string().describe("High-level description of the workflow"),
    steps: z.array(
      z.object({
        type: z.enum(["human-input", "agent-task"]),
        description: z.string(),
        agent: agentEnum.optional(),
      }),
    ),
  }),
  outputSchema: z.object({
    workflow: z.array(
      z.object({
        id: z.string(),
        type: z.enum(["human-input", "agent-task"]),
        description: z.string(),
        agent: agentEnum.optional(),
        next: z.array(z.string()).optional(),
      }),
    ),
  }),
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
  id: "clarification-tool",
  description: `
  Asks user clarifying questions before workflow generation.
  
  Rules:
  - Must ask 1-3 specific questions
  - Questions should target missing information
  - Should explain why each question is needed
  - Must be used when request is ambiguous
  `,
  inputSchema: z.object({
    questions: z.array(z.string()).min(1).max(3),
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
