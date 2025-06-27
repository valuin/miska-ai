import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { vectorStore } from "@/lib/rag/vector-store";
import { getUserVaultDocuments } from "@/lib/db/queries/document-vault";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";

export const saveDocumentToVaultTool = createTool({
  id: "save-document-to-vault",
  description:
    "Save a processed document to the user vault for future retrieval",
  inputSchema: z.object({
    tempDocumentId: z.string().describe("Temporary document ID to save"),
    userId: z.string().describe("User ID who owns the document"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    documentId: z.string().optional(),
    message: z.string(),
  }),
  execute: async ({ context, mastra }) => {
    try {
      const { tempDocumentId } = context;

      // This would be called from the chat interface where session is available
      // For now, return a helpful message
      return {
        success: false,
        message:
          "Please use the chat interface to save documents to vault. This tool requires user authentication.",
      };
    } catch (error) {
      console.error("Error saving document to vault:", error);
      return {
        success: false,
        message: "Failed to save document to vault",
      };
    }
  },
});

export const listVaultDocumentsTool = createTool({
  id: "list-vault-documents",
  description: "List all documents in user vault",
  inputSchema: z.object({}),
  outputSchema: z.object({
    documents: z.array(
      z.object({
        id: z.string(),
        filename: z.string(),
        fileType: z.string().optional(),
        createdAt: z.string(),
        chunkCount: z.number(),
        contentPreview: z.string(),
      }),
    ),
    totalCount: z.number(),
  }),
  execute: async ({ context, mastra, runtimeContext }) => {
    try {
      // Get user ID from runtime context (set by the chat handler)
      let userId: string | undefined;
      if (typeof runtimeContext?.get === "function") {
        userId = runtimeContext.get("userId");
      } else if (
        runtimeContext &&
        typeof runtimeContext === "object" &&
        "userId" in runtimeContext
      ) {
        userId = (runtimeContext as any).userId;
      }
      if (!userId) {
        return {
          documents: [],
          totalCount: 0,
        };
      }

      const documents = await getUserVaultDocuments(userId);
      return {
        documents: documents.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          fileType: doc.fileType || "",
          createdAt: doc.createdAt?.toISOString() || "",
          chunkCount: doc.chunkCount || 0,
          contentPreview: doc.contentPreview || "",
        })),
        totalCount: documents.length,
      };
    } catch (error) {
      console.error("Error listing vault documents:", error);
      return {
        documents: [],
        totalCount: 0,
      };
    }
  },
});

export const queryVaultDocumentsTool = createTool({
  id: "query-vault-documents",
  description: "Search through user vault documents using semantic similarity",
  inputSchema: z.object({
    query: z.string().describe("Search query to find relevant documents"),
    topK: z
      .number()
      .optional()
      .default(5)
      .describe("Number of results to return"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        text: z.string(),
        score: z.number(),
        filename: z.string(),
        chunkIndex: z.number(),
      }),
    ),
    totalResults: z.number(),
  }),
  execute: async ({ context, mastra, runtimeContext }) => {
    try {
      const { query, topK } = context;

      let userId: string | undefined;
      if (typeof runtimeContext?.get === "function") {
        userId = runtimeContext.get("userId");
      } else if (
        runtimeContext &&
        typeof runtimeContext === "object" &&
        "userId" in runtimeContext
      ) {
        userId = (runtimeContext as any).userId;
      }
      if (!userId) {
        return {
          results: [],
          totalResults: 0,
        };
      }

      const { embedding } = await embed({
        value: query,
        model: openai.embedding("text-embedding-3-small"),
      });

      const results = await vectorStore.query({
        indexName: "document_vault",
        queryVector: embedding,
        topK,
        filter: {
          user_id: userId,
        },
      });

      return {
        results: results.map((result) => ({
          text: result.metadata?.text || "",
          score: result.score,
          filename: result.metadata?.filename || "",
          chunkIndex: result.metadata?.chunk_index || 0,
        })),
        totalResults: results.length,
      };
    } catch (error) {
      console.error("Error querying vault documents:", error);
      return {
        results: [],
        totalResults: 0,
      };
    }
  },
});
