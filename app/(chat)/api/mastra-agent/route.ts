import { mastra } from '@/mastra';
import type { NextRequest } from 'next/server';

/**
 * Pure Mastra Agent API Route
 * This demonstrates the RECOMMENDED approach from Mastra documentation
 * for creating agent-powered chat endpoints
 */

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Direct Mastra agent usage - RECOMMENDED pattern
    const weatherAgent = mastra.getAgent('weatherAgent');

    if (!weatherAgent) {
      return new Response('Weather agent not available', { status: 503 });
    }

    // Use agent.stream() - returns AI SDK compatible stream
    const stream = await weatherAgent.stream(messages);

    // Perfect compatibility with AI SDK frontend hooks
    return stream.toDataStreamResponse({
      headers: {
        'X-Powered-By': 'Mastra',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Mastra agent API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
