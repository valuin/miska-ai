import { mastra } from '@/mastra';
export async function streamWithMastraAgent(
  agentName: keyof ReturnType<typeof mastra.getAgents>,
  messages: any[]
) {
  const agent = mastra.getAgent(agentName);
  
  if (!agent) {
    throw new Error(`Agent ${String(agentName)} not found`);
  }

  // agent.stream() returns AI SDK compatible stream
  return await agent.stream(messages);
}

/**
 * Use Mastra agent with structured output (for useObject hook)
 */
export async function streamWithStructuredOutput(
  agentName: keyof ReturnType<typeof mastra.getAgents>,
  messages: any[],
  outputSchema: any
) {
  const agent = mastra.getAgent(agentName);
  
  if (!agent) {
    throw new Error(`Agent ${String(agentName)} not found`);
  }
  return await agent.stream(messages, {
    output: outputSchema,
  });
}

/**
 * Route messages to appropriate agent based on content
 * smart routing as recommended in documentation
 */
export function selectAgentForMessages(messages: any[]): keyof ReturnType<typeof mastra.getAgents> | null {
  if (!messages || messages.length === 0) return null;
  
  const lastMessage = messages[messages.length - 1]?.content || '';
  const weatherKeywords = ['weather', 'temperature', 'forecast', 'climate', 'rain', 'snow', 'sunny'];
  
  // Route to weather agent for weather-related queries
  if (weatherKeywords.some(keyword => 
    lastMessage.toLowerCase().includes(keyword)
  )) {
    return 'weatherAgent';
  }
  return null;
}

export function getAvailableAgents() {
  return Object.keys(mastra.getAgents());
}

/**
 * Direct Mastra agent API route handler (RECOMMENDED)
 * Use this for standalone Mastra-powered chat endpoints
 */
export async function createMastraAgentAPIRoute(
  agentName: keyof ReturnType<typeof mastra.getAgents>
) {
  return async function(request: Request) {
    const { messages } = await request.json();
    
    const agent = mastra.getAgent(agentName);
    if (!agent) {
      return new Response('Agent not found', { status: 404 });
    }
    const stream = await agent.stream(messages);
    return stream.toDataStreamResponse();
  };
}
