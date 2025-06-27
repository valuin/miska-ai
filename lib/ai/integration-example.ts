import { mastra } from "@/mastra";

// Direct agent usage (RECOMMENDED by Mastra docs)
export async function recommendedMastraChatAPI(request: Request) {
  const { messages } = await request.json();

  // Use Mastra agent directly
  // Benefits: memory, observability, tool calling, agent-centric design
  const researchAgent = mastra.getAgent("researchAgent");
  const stream = await researchAgent.stream(messages);
  return stream.toDataStreamResponse();
}
