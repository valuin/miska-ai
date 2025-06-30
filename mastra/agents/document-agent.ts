// Document CRUD Agent for Mastra

import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { createDocument } from "../tools/create-document";
import { updateDocument } from "../tools/update-document";
import { requestSuggestions } from "../tools/request-suggestions";
import { clarificationTool } from "../tools/workflow-creator-tools";

/**
 * This agent handles document creation, updating, and suggestion requests.
 * Tool names are aligned with UI expectations for correct rendering.
 *
 * Tools:
 * - createDocument: Create a new document.
 * - updateDocument: Update an existing document.
 * - requestSuggestions: Request suggestions for improving a document.
 *
 * See Mastra documentation for tool schemas and usage.
 */
export const documentAgent = new Agent({
  name: "Document CRUD Agent",
  instructions: `
You are a Document CRUD Agent. Your job is to help users create, update, and request suggestions for documents.

- ClarificationTool is available to ask clarifying questions before creating a document; if the user's request is ambiguous, use this tool to ask clarifying questions.
  - For example, if specific data needs to be integrated, use this tool to ask what/where it might be found.
- Use 'createDocument' to create a new document with a title and kind.
- Use 'updateDocument' to update an existing document with a description of changes.
- Use 'requestSuggestions' to provide suggestions for improving a document.

Always call the appropriate tool for the user's intent. Respond clearly and concisely.
  `,
  model: openai("gpt-4o"),
  tools: {
    createDocument,
    updateDocument,
    requestSuggestions,
    clarificationTool,
  },
});
