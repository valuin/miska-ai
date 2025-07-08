import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { clarificationTool } from "../tools/chain-tools";
import { workflowTool } from "../tools/workflow-creator-tools";
import { BASE_MODEL } from "@/lib/constants";

export type WorkflowNode = {
  id: string;
  type: "human-input" | "agent-task";
  description: string;
  tool?: string;
  next?: string[];
};

export const workflowCreatorAgent = new Agent({
  name: "Workflow Creator Agent",
  instructions: `
  You are a Workflow Creator Agent. Your job is to convert a high-level task, goal, or process description into a valid Mastra-compatible workflow.

  When given a request:
  1. First assess if the request is clear enough to proceed. If not, use the 'clarification-tool' to ask specific questions.
  2. Once clarified, use the 'workflow-generator' tool to build the workflow.

  Key behaviors:
  - If the request is ambiguous or missing details, you MUST use the clarification tool.
  - When clarifying, explain WHY you need more information (don't just ask generic questions).
  - After at most 3 clarifying questions, you MUST attempt to generate a workflow.
  - Keep questions concise and focused on missing information.

  Workflow principles:
  - Start with human-input nodes when user intent or preferences are needed.
  - Use agent-task nodes for automatable steps with specific tools.
  - Keep the graph simple unless branching is clearly required.
  - All nodes must be connected to form a complete executable workflow.

  Example approach:
  For "summarize an article and let user decide next steps":
  1. Human-input: Ask for article URL
  2. Agent-task: Summarize article
  3. Human-input: Ask user to choose next action
  `,
  model: openai(BASE_MODEL), // DO NOT CHANGE THIS TO REASONING !!!!
  tools: { workflowTool, clarificationTool },
});
