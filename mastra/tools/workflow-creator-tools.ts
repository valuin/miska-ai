import { AGENT_TYPES } from "@/lib/constants";
import { createMastraWorkflowFromJson } from "./load-dynamic-workflow";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const agentEnum = z.enum(AGENT_TYPES);

export type WorkflowNode = {
  id: string;
  type: "human-input" | "agent-task";
  description: string;
  agent?: (typeof AGENT_TYPES)[number];
  next?: string[];
};

export type CreatedWorkflow = {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
};

export const workflowTool = createTool({
  id: "create-workflow-tool",
  description: `
  Generates a directed workflow graph from a description and list of steps.
  
  Required node structure:
  - id: string (unique identifier, typically UUID)
  - type: "human-input" | "agent-task"
  - description: string (clear step description)
  - agent: string (required for agent-task nodes)
  - next: string[] (optional array of next node IDs)
  
  Available agents and their use cases:
  - researchAgent: For web research, data gathering, and information retrieval tasks
  - ragChatAgent: For conversational AI with document context (RAG-based queries)
  - documentAgent: For document creation, editing, and file management
  - normalAgent: For general-purpose AI tasks and standard operations
  - communicationAgent: For email, messaging, and communication-related tasks
  
  Examples:
  - Research workflow: researchAgent → documentAgent
  - Document Q&A: human-input → ragChatAgent
  - Email campaign: human-input → communicationAgent → documentAgent
  
  Rules:
  1. All nodes must be connected via 'next' fields
  2. Human-input nodes cannot have agents
  3. Agent-task nodes must specify an agent
  4. The last node should omit 'next' field
  `,
  inputSchema: z.object({
    name: z.string().describe("Name of the workflow"),
    description: z.string().describe("High-level description of the workflow"),
    steps: z.array(
      z.object({
        type: z.enum(["human-input", "agent-task"]),
        description: z
          .string()
          .describe("Description of the step, no more than ten words"),
        agent: agentEnum.optional(),
      }),
    ),
  }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    schema: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      nodes: z.array(
        z.object({
          id: z.string(),
          data: z.object({
            type: z.enum(["human-input", "agent-task"]),
            agent: z.string(),
            description: z.string(),
          }),
          type: z.string(),
          position: z.object({
            x: z.number(),
            y: z.number(),
          }),
        }),
      ),
      edges: z.array(
        z.object({
          id: z.string(),
          type: z.string(),
          source: z.string(),
          target: z.string(),
        }),
      ),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
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

      const workflowId = crypto.randomUUID();
      const workflow = createMastraWorkflowFromJson({
        id: workflowId,
        description: context.description,
        nodes,
        runtimeContext,
      });

      const edges = nodes.flatMap(node =>
        (node.next || []).map(nextId => ({
          id: `edge-${node.id}-${nextId}`,
          type: 'status', // Use the correct edge type
          source: node.id,
          target: nextId,
        }))
      );

      const formattedNodes = nodes.map((node, index) => ({
        id: node.id,
        data: {
          type: node.type,
          agent: node.agent || "",
          description: node.description,
        },
        type: node.type === 'human-input' ? 'generate-text' : 'generate-text',
        position: { x: 250, y: 100 + index * 200 },
      }));

      return {
        id: workflowId,
        name: context.name,
        description: context.description,
        schema: {
          id: workflowId,
          name: context.name,
          description: context.description,
          nodes: formattedNodes,
          edges,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (e) {
      console.error("Workflow generation failed:", e);
      return {
        id: "",
        name: "",
        description: "",
        schema: {
          id: "",
          name: "",
          description: "",
          nodes: [],
          edges: [],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },
});
