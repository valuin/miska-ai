import { createTool } from "@mastra/core/tools";
import { embed } from "ai";
import { getUserVaultDocuments } from "@/lib/db/queries/document-vault";
import { openai } from "@ai-sdk/openai";
import { qdrantClient, COLLECTION_NAME } from "@/lib/rag/vector-store";
import { z } from "zod";
import type { MastraRuntimeContext } from "..";

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
  execute: async () => {
    try {
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
        url: z.string(),
        createdAt: z.string(),
        chunkCount: z.number(),
        contentPreview: z.string(),
      }),
    ),
    totalCount: z.number(),
  }),
  execute: async ({ runtimeContext }) => {
    try {
      const { session } = runtimeContext as unknown as MastraRuntimeContext;
      // Get user ID from runtime context (set by the chat handler)
      const userId = session?.user?.id;
      if (!userId) return { documents: [], totalCount: 0 };

      const documents = await getUserVaultDocuments(userId);
      return {
        documents: documents.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          fileType: doc.fileType || "",
          url: doc.fileUrl,
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

// Extract the Zod result schema for reuse
const VaultDocumentResultSchema = z.object({
  text: z.string(),
  score: z.number(),
  filename: z.string(),
  chunkIndex: z.number(),
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
    results: z.array(VaultDocumentResultSchema),
    totalResults: z.number(),
  }),
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: any;
    runtimeContext: any;
  }): Promise<{
    results: Array<z.infer<typeof VaultDocumentResultSchema>>;
    totalResults: number;
  }> => {
    try {
      const { query, topK } = context;
      const { session } = runtimeContext as unknown as MastraRuntimeContext;

      if (!session?.user?.id) return { results: [], totalResults: 0 };

      const { embedding } = await embed({
        value: query,
        model: openai.embedding("text-embedding-3-small"),
      });

      const searchResults = await qdrantClient.search(COLLECTION_NAME, {
        vector: embedding,
        limit: topK,
        filter: {
          must: [{ key: "user_id", match: { value: session.user.id } }],
        },
      });

      // console.log("Vault query debug:", {
      //   query,
      //   userId,
      //   embedding,
      //   searchResults,
      // });

      const results = searchResults;

      return {
        results: results.map((result: any) => {
          const parsed = VaultDocumentResultSchema.safeParse(
            result.payload ?? {},
          );
          if (parsed.success) return parsed.data;
          return {
            text: "",
            score: 0,
            filename: "",
            chunkIndex: 0,
          };
        }),
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
