import { mastra } from '@/mastra';
import { RuntimeContext } from '@mastra/core/di';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const generateWorkflowSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required.'),
});

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = generateWorkflowSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: validationResult.error.flatten() }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { prompt } = validationResult.data;

    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        };

        try {
          const workflowCreatorAgent = mastra.getAgent('workflowCreatorAgent');

          if (!workflowCreatorAgent) {
            sendEvent('error', { message: 'Workflow Creator Agent not available' });
            controller.close();
            return;
          }

          const runtimeContext = new RuntimeContext();
          runtimeContext.set('mastra', mastra);

          // Send initial progress
          sendEvent('progress', { message: 'Starting workflow generation...' });

          // Stream the generation process
          const result = await workflowCreatorAgent.generate(
            [{ role: 'user', content: prompt }],
            {
              toolChoice: 'required',
              runtimeContext,
            },
          );

          const toolCall = result.toolCalls?.[0];

          if (!toolCall) {
            sendEvent('error', { 
              message: 'Failed to generate workflow. Agent did not return a tool call.',
              text: result.text 
            });
            controller.close();
            return;
          }

          if (toolCall.toolName === 'clarification-tool') {
            sendEvent('clarification', { 
              questions: toolCall.args.questions 
            });
            controller.close();
            return;
          }

          const workflow = toolCall.args;
          
          // Send the complete workflow
          sendEvent('workflow', workflow);
          sendEvent('complete', { message: 'Workflow generation completed' });
          
          controller.close();
        } catch (error) {
          console.error('Workflow generation error:', error);
          sendEvent('error', { 
            message: error instanceof Error ? error.message : 'Unknown error occurred' 
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Workflow generation API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
