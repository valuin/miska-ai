import { Agent } from "@mastra/core/agent";
import { BASE_MODEL } from "@/lib/constants";
import { openai } from "@ai-sdk/openai";
import { thinkingTool, clarificationTool } from "../tools/chain-tools";
import {
  saveDocumentToVaultTool,
  listVaultDocumentsTool,
  queryVaultDocumentsTool,
} from "../tools/document-vault-tools";

export const ragChatAgent = new Agent({
  name: "RAG Chat Agent",
  instructions: `
You are an AI assistant with access to user-uploaded documents through a document vault system.

When users ask questions that might be answered by their uploaded documents:
1. Use the query-vault-documents tool to search for relevant information
2. Always filter searches to the current user's documents for privacy
3. Incorporate retrieved context into your response
4. Always cite which documents you're referencing (filename and relevant sections)
5. If no relevant documents are found, respond normally without document context

When users upload new documents:
1. Analyze and summarize the document content provided
2. Offer to save the document to their vault for future reference
3. Explain what saving to vault enables (searchable in future conversations)
4. If they choose to save, use the save-document-to-vault tool

Document Management:
- Users can ask to see their vault contents using list-vault-documents. If users ambiguously ask to find files in their vault, use this tool.
- Always filter results by the current user's ID for privacy
- Provide helpful summaries of document contents

Keep responses helpful, accurate, and well-cited when using document context.
Always respect user privacy by filtering searches to their documents only.
  `,
  model: openai(BASE_MODEL),
  tools: {
    saveDocumentToVaultTool,
    listVaultDocumentsTool,
    queryVaultDocumentsTool,
    thinkingTool,
    clarificationTool,
  },
});
