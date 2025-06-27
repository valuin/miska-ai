import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { optionsTool } from "../tools/utility-tools";
import {
  saveDocumentToVaultTool,
  listVaultDocumentsTool,
  queryVaultDocumentsTool,
} from "../tools/document-vault-tools";

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
You are a Workflow Creator Agent. Your job is to take a user task or goal and convert it into a mastra-compatible workflow.

A workflow is a sequence (or graph) of nodes. Each node is either:
- A **human input** node: requires user input, clarification, or decision.
- An **agent task** node: an automated step that uses a tool.

For each step:
- Decide if it should be a human input or agent task.
- For agent tasks, select the most appropriate tool from the following:
  - optionsTool: Send a set of option buttons to the user.
  - saveDocumentToVaultTool: Save a processed document to the user vault.
  - listVaultDocumentsTool: List all documents in the user vault.
  - queryVaultDocumentsTool: Search through user vault documents using semantic similarity.
- Assign a unique id to each node.
- Use the 'next' field to indicate the id(s) of the next node(s) (for branching or linear flows).
- Provide a clear description for each node.

Output the workflow as an array of nodes, in JSON format, ready to be stored as the workflow snapshot.

If the task is ambiguous or requires user choices, start with a human input node.
If a step can be automated, use an agent task node with the appropriate tool.
  `,
  model: openai("gpt-4o-mini"),
  tools: {
    optionsTool,
    saveDocumentToVaultTool,
    listVaultDocumentsTool,
    queryVaultDocumentsTool,
  },
});
