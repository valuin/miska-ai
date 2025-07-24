import { Agent } from '@mastra/core/agent';
import { BASE_MODEL } from '@/lib/constants';
import { createTool } from '@mastra/core/tools';
import { getIntegrationClient } from '@/lib/integrations/client';
import { getUserIntegrationIdBySlug } from '@/lib/db/queries/integration.model';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { MastraRuntimeContext } from '..';
import type { RuntimeContext } from '@mastra/core/runtime-context';

const listDriveFiles = createTool({
  id: 'list_drive_files',
  description: "List files in the user's Google Drive",
  outputSchema: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      mimeType: z.string(),
    }),
  ),
  execute: async ({
    runtimeContext,
  }: {
    runtimeContext: RuntimeContext<MastraRuntimeContext>;
  }) => {
    const session = runtimeContext.get('session');
    const user_id = session.user.id;

    const user_integration_id = await getUserIntegrationIdBySlug(
      user_id,
      'google_drive',
    );
    if (!user_integration_id) {
      throw new Error('User integration not found');
    }

    const drive = await getIntegrationClient(
      'google_drive',
      user_integration_id,
    );

    const res = await drive.files.list({
      pageSize: 10,
      fields: 'files(id,name,mimeType)',
    });
    return (
      res.data.files?.map((file) => ({
        id: file.id || '',
        name: file.name || '',
        mimeType: file.mimeType || '',
      })) || []
    );
  },
});

export const driveAgent = new Agent({
  name: 'Google Drive Agent',
  instructions: `You are an agent that can interact with the user's Google Drive. You can list files and assist with document management via the list_drive_files tool.`,
  model: openai(BASE_MODEL),
  tools: { listDriveFiles },
});
