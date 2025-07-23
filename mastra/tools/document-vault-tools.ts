import { createTool } from '@mastra/core/tools';
import { embed } from 'ai';
import { getUserVaultDocuments } from '@/lib/db/queries/document-vault';
import { openai } from '@ai-sdk/openai';
import { qdrantClient, COLLECTION_NAME } from '@/lib/rag/vector-store';
import { z } from 'zod';
import type { MastraRuntimeContext } from '..';
import type { RuntimeContext } from '@mastra/core/di';

export const saveDocumentToVaultTool = createTool({
  id: 'save-document-to-vault',
  description:
    'Save a processed document to the user vault for future retrieval',
  inputSchema: z.object({
    tempDocumentId: z.string().describe('Temporary document ID to save'),
    userId: z.string().describe('User ID who owns the document'),
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
          'Please use the chat interface to save documents to vault. This tool requires user authentication.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to save document to vault',
      };
    }
  },
});

export const listVaultDocumentsTool = createTool({
  id: 'list-vault-documents',
  description: 'List all documents in user vault',
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
      const concreteRuntimeContext =
        runtimeContext as RuntimeContext<MastraRuntimeContext>;
      const session = concreteRuntimeContext.get('session');
      const userId = session?.user?.id;
      if (!userId) {
        return { documents: [], totalCount: 0 };
      }

      const documents = await getUserVaultDocuments(userId);
      return {
        documents: documents.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          fileType: doc.fileType || '',
          url: doc.fileUrl,
          createdAt: doc.createdAt?.toISOString() || '',
          chunkCount: doc.chunkCount || 0,
          contentPreview: doc.contentPreview || '',
        })),
        totalCount: documents.length,
      };
    } catch (error) {
        '[listVaultDocumentsTool] Error listing vault documents:',
        error,
      );
      return {
        documents: [],
        totalCount: 0,
      };
    }
  },
});

const VaultDocumentResultSchema = z.object({
  text: z.string(),
  score: z.number(),
  filename: z.string(),
  chunkIndex: z.number(),
});

export const queryVaultDocumentsTool = createTool({
  id: 'query-vault-documents',
  description: 'Search through user vault documents using semantic similarity',
  inputSchema: z.object({
    query: z.string().describe('Search query to find relevant documents'),
    topK: z
      .number()
      .optional()
      .default(5)
      .describe('Number of results to return'),
    filenames: z
      .array(z.string())
      .optional()
      .describe('Optional list of filenames to filter the search results'),
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
    runtimeContext: RuntimeContext<MastraRuntimeContext>;
  }): Promise<{
    results: Array<z.infer<typeof VaultDocumentResultSchema>>;
    totalResults: number;
  }> => {
    try {
      const { query, topK } = context;
      const session = runtimeContext.get('session');
      const selectedVaultFileNames = runtimeContext.get(
        'selectedVaultFileNames',
      );

      if (!session?.user?.id) {
        return { results: [], totalResults: 0 };
      }

      const { embedding } = await embed({
        value: query,
        model: openai.embedding('text-embedding-3-small'),
      });
        query,
        userId: session.user.id,
        embedding,
        selectedVaultFileNames,
      });

      const searchResults = await qdrantClient.search(COLLECTION_NAME, {
        vector: embedding,
        limit: topK,
        filter: {
          must: [
            { key: 'user_id', match: { value: session.user.id } },
            ...(selectedVaultFileNames && selectedVaultFileNames.length > 0
              ? [{ key: 'filename', match: { any: selectedVaultFileNames } }]
              : []),
          ],
        },
      });
      //   query,
      //   userId: session.user.id,
      //   embedding,
      //   searchResults,
      // });

      const results = searchResults;

      return {
        results: results.map((result) => ({
          text:
            typeof result.payload?.text === 'string' ? result.payload.text : '',
          score: result.score,
          filename:
            typeof result.payload?.filename === 'string'
              ? result.payload.filename
              : '',
          chunkIndex:
            typeof result.payload?.chunk_index === 'number'
              ? result.payload.chunk_index
              : 0,
        })),
        totalResults: results.length,
      };
    } catch (error) {
      return {
        results: [],
        totalResults: 0,
      };
    }
  },
});
