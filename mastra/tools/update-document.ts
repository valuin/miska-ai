// update-document tool migrated from ai-sdk to mastra integration

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { Session } from 'next-auth';
import type { DataStreamWriter } from 'ai';
import { getDocumentById } from '@/lib/db/queries';
import { documentHandlersByArtifactKind } from '@/lib/artifacts/server';

export const updateDocument = createTool({
  id: 'update-document',
  description: 'Update a document with the given description.',
  inputSchema: z.object({
    id: z.string().describe('The ID of the document to update'),
    description: z
      .string()
      .describe('The description of changes that need to be made'),
  }),
  outputSchema: z.object({
    id: z.string(),
    title: z.string(),
    kind: z.string(),
    content: z.string(),
  }),
  execute: async (context) => {
    const id = (context as any).id as string;
    const description = (context as any).description as string;
    const session = (context as any).session as Session | undefined;
    const dataStream = (context as any).dataStream as
      | DataStreamWriter
      | undefined;

    const document = await getDocumentById({ id });

    if (!document) {
      return {
        id,
        title: '',
        kind: '',
        content: 'Document not found',
      };
    }

    dataStream?.writeData({
      type: 'clear',
      content: document.title,
    });

    const documentHandler = documentHandlersByArtifactKind.find(
      (documentHandlerByArtifactKind) =>
        documentHandlerByArtifactKind.kind === document.kind,
    );

    if (!documentHandler) {
      throw new Error(`No document handler found for kind: ${document.kind}`);
    }

    if (!dataStream || !session) {
      throw new Error(
        'Both dataStream and session are required for document creation.',
      );
    }

    await documentHandler.onUpdateDocument({
      document,
      description,
      dataStream,
      session,
    });

    dataStream?.writeData({ type: 'finish', content: '' });

    return {
      id,
      title: document.title,
      kind: document.kind,
      content: 'The document has been updated successfully.',
    };
  },
});
