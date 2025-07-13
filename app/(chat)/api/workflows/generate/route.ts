import { mastra } from '@/mastra';
import { RuntimeContext } from '@mastra/core/di';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const generateWorkflowSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required.'),
});

export const maxDuration = 5;

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

    const workflowCreatorAgent = mastra.getAgent('workflowCreatorAgent');

    if (!workflowCreatorAgent) {
      return new Response('Workflow Creator Agent not available', {
        status: 503,
      });
    }

    const runtimeContext = new RuntimeContext();
    runtimeContext.set('mastra', mastra);

    const result = await workflowCreatorAgent.generate(
      [{ role: 'user', content: prompt }],
      {
        toolChoice: 'required',
        runtimeContext,
      },
    );

    const toolCall = result.toolCalls?.[0];

    if (!toolCall) {
      console.error(
        'Agent did not return a tool call. Final text:',
        result.text,
      );
      return new Response(
        JSON.stringify({
          error:
            'Failed to generate workflow. Agent did not return a tool call.',
          text: result.text,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (toolCall.toolName === 'clarification-tool') {
      return new Response(
        JSON.stringify({
          type: 'clarification',
          questions: toolCall.args.questions,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const workflow = toolCall.args;

    return new Response(JSON.stringify({ type: 'workflow', ...workflow }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Workflow generation API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
