import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { createDataStream } from 'ai';
import { generateUUID } from '@/lib/utils';
import { mastra } from '@/mastra';
import { RuntimeContext } from '@mastra/core/di';
import { workflowCreatorAgent } from '@/mastra/agents/workflow-creator-agent';
import type { NextRequest } from 'next/server';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    // TODO: Handle file uploads if necessary
    // const file = formData.get("file") as File | null;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await auth();

    const stream = createDataStream({
      execute: async (dataStream) => {
        const sendUpdate = (message: string, progress: number) => {
          dataStream.writeMessageAnnotation({
            type: 'progress',
            progress,
            message,
          });
        };

        const runtimeContext = new RuntimeContext();
        runtimeContext.set('mastra', mastra);
        runtimeContext.set('session', session);
        runtimeContext.set('dataStream', dataStream);

        const resourceId = `workflow-creator-agent-${generateUUID()}`;
        const threadId = `workflow-creator-agent-${generateUUID()}`;

        sendUpdate('Retrieving available agents...', 40);

        setTimeout(() => {
          sendUpdate('Thinking about task...', 60);
        }, 800);

        setTimeout(() => {
          sendUpdate('Planning agent steps...', 80);
        }, 1400);

        setTimeout(() => {
          sendUpdate('Generating workflow...', 95);
        }, 2200);
        const stream = await workflowCreatorAgent.stream(
          [{ role: 'user', content: prompt }],
          {
            toolChoice: 'required',
            runtimeContext,
            maxSteps: 1,
            onFinish: (result) => {
              // Access toolResults from the first step
              const toolResult = result.steps?.[0]?.toolResults?.find(
                (r) => r.toolName === 'workflowTool',
              );
              if (toolResult) {
                const fullSchema = JSON.stringify(toolResult.result);
                const chunkSize = 512;
                for (let i = 0; i < fullSchema.length; i += chunkSize) {
                  const chunk = fullSchema.substring(i, i + chunkSize);
                  dataStream.writeData({ type: 'schema_chunk', chunk });
                }
              } else {
                dataStream.writeMessageAnnotation({
                  type: 'progress',
                  progress: 100,
                  message: 'Could not generate a valid workflow schema.',
                });
              }
              sendUpdate('Done!', 100);
            },
            memory: { resource: resourceId, thread: threadId },
          },
        );
        stream.mergeIntoDataStream(dataStream);
      },
      onError: (error) => {
        return 'Oops, an error occurred!';
      },
    });

    return new Response(stream);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
