/**  this file isnt necessary but the MCP Course / docs generated this
 *  for AI SDK integration and it helped me learn the concept 
 *  and i think ppl reading this would appreciate it as well
*/


import { createDataStream } from 'ai';
import { mastra } from '@/mastra';

/**
 * RECOMMENDED: Replace AI SDK streamText with Mastra agent
 * This is the pattern shown in official Mastra documentation
 */
export function createMastraStream(messages: any[], streamId: string) {
  return createDataStream({
    execute: async (dataStream) => {
      try {
        // Use Mastra agent directly - recommended approach
        const weatherAgent = mastra.getAgent('weatherAgent');
        const agentStream = await weatherAgent.stream(messages);
        
        // Merge agent stream into data stream
        agentStream.mergeIntoDataStream(dataStream);
        
      } catch (error) {
        console.error('Mastra agent error:', error);
        dataStream.writeData({ error: 'Agent temporarily unavailable' });
      }
    },
    onError: (error) => {
      console.error('Stream error:', error);
      return 'An error occurred while processing your request.';
    },
  });
}

/**
 * FRONTEND COMPATIBILITY
 * Your existing frontend hooks work unchanged with Mastra agents:
 * 
 * useChat() - Works with agent.stream().toDataStreamResponse()
 * useCompletion() - Works with agent.stream().toDataStreamResponse()  
 * useObject() - Works with agent.stream(messages, { output: schema }).toTextStreamResponse()
 */
