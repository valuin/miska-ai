import { mastra } from '@/mastra';


// Direct agent usage (RECOMMENDED by Mastra docs)
export async function recommendedMastraChatAPI(request: Request) {
  const { messages } = await request.json();
  
  // Use Mastra agent directly
  // Benefits: memory, observability, tool calling, agent-centric design
  const weatherAgent = mastra.getAgent("weatherAgent");
  const stream = await weatherAgent.stream(messages);
  return stream.toDataStreamResponse();
}