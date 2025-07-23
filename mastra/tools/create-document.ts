import { createTool } from '@mastra/core/tools';
import { generateUUID } from '@/lib/utils';
import { z } from 'zod';
import type { MastraRuntimeContext } from '..';
import {
  artifactKinds,
  documentHandlersByArtifactKind,
} from '@/lib/artifacts/server';

// @hinson i still cant figure out how to send the session and dataStream to the tool
export const createDocument = createTool({
  id: 'create-document',
  description:
    'Create a document for writing or content creation activities. This tool will call other functions that will generate the contents of the document based on the title and kind.',
  inputSchema: z.object({
    title: z.string(),
    kind: z.enum(artifactKinds),
  }),
  outputSchema: z.object({
    id: z.string(),
    title: z.string(),
    kind: z.string(),
    content: z.string(),
  }),
  execute: async ({ context, runtimeContext }) => {
    const { title, kind } = context as { title: string; kind: string };
    const { dataStream, session } =
      runtimeContext as unknown as MastraRuntimeContext;

    const id = generateUUID();
    dataStream.writeData({ type: 'kind', content: kind });
    dataStream.writeData({ type: 'id', content: id });
    dataStream.writeData({ type: 'title', content: title });
    dataStream.writeData({ type: 'clear', content: '' });

    const documentHandler = documentHandlersByArtifactKind.find(
      (documentHandlerByArtifactKind) =>
        documentHandlerByArtifactKind.kind === kind,
    );

    if (!documentHandler) {
      throw new Error(`No document handler found for kind: ${kind}`);
    }

    await documentHandler.onCreateDocument({
      id,
      title,
      dataStream,
      session,
    });

    dataStream.writeData({ type: 'finish', content: '' });

    return {
      id,
      title,
      kind,
      content: 'A document was created and is now visible to the user.',
    };
  },
});
