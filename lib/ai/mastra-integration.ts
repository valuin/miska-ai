import { mastra } from '@/mastra';
import { saveMessages } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

export async function streamWithMastraAgent(
  agentName: keyof ReturnType<typeof mastra.getAgents>,
  messages: any[],
  options?: {
    chatId?: string;
    onToolCall?: (toolCall: any) => Promise<void>;
  }
) {
  const agent = mastra.getAgent(agentName);
  
  if (!agent) {
    throw new Error(`Agent ${String(agentName)} not found`);
  }

  // Set up a resourceId and threadId for Mastra memory if chatId is provided
  const resourceId = options?.chatId || generateUUID();
  const threadId = generateUUID(); // Generate a new thread for each conversation

  // Configure stream options with message saving
  const streamOptions: any = {
    memory: {
      resource: resourceId,
      thread: threadId,
    },
  };

  // Add onFinish callback to save messages if chatId is provided
  if (options?.chatId) {
    streamOptions.onFinish = async (result: any) => {
      try {
        // Save the assistant message after the stream completes
        if (result.text || result.toolCalls) {
          await saveMastraMessage(
            options.chatId!,
            'assistant',
            result.text || '',
            result.toolCalls
          );
        }
      } catch (error) {
        console.error('Failed to save Mastra agent message:', error);
      }
    };
  }

  // agent.stream() returns AI SDK compatible stream
  const stream = await agent.stream(messages, streamOptions);

  return stream;
}

/**
 * Enhanced stream function that saves tool calls to database
 */
export async function streamWithMastraAgentAndSave(
  agentName: keyof ReturnType<typeof mastra.getAgents>,
  messages: any[],
  chatId: string
) {
  const agent = mastra.getAgent(agentName);
  
  if (!agent) {
    throw new Error(`Agent ${String(agentName)} not found`);
  }

  // Use chatId as resourceId for Mastra memory continuity
  const threadId = generateUUID(); // Generate a new thread for each conversation
  
  const stream = await agent.stream(messages, { 
    memory: {
      resource: chatId,
      thread: threadId,
    },
    onFinish: async (result: any) => {
      try {
        // Save the assistant message with tool calls
        await saveMastraMessage(
          chatId,
          'assistant',
          result.text || '',
          result.toolCalls
        );
      } catch (error) {
        console.error('Failed to save Mastra agent message:', error);
      }
    },
  });

  return stream;
}

/**
 * Save a message to the database from a Mastra agent
 */
export async function saveMastraMessage(
  chatId: string,
  role: 'user' | 'assistant',
  content: string,
  toolInvocations?: any[]
) {
  const messageId = generateUUID();
  
  // Convert Mastra message format to your database format
  const parts: any[] = [];
  
  // Add text content if present
  if (content && content.trim()) {
    parts.push({ type: 'text', text: content });
  }
  
  // Add tool invocations if present
  if (toolInvocations && toolInvocations.length > 0) {
    for (const invocation of toolInvocations) {
      parts.push({
        type: 'tool-call',
        toolCallId: invocation.toolCallId || generateUUID(),
        toolName: invocation.toolName,
        args: invocation.args,
      });
      
      // Add tool result if available
      if (invocation.result !== undefined) {
        parts.push({
          type: 'tool-result',
          toolCallId: invocation.toolCallId || generateUUID(),
          result: invocation.result,
        });
      }
    }
  }
  
  // Ensure we have at least one part
  if (parts.length === 0) {
    parts.push({ type: 'text', text: '' });
  }

  const dbMessage = {
    id: messageId,
    chatId,
    role,
    parts,
    attachments: [],
    createdAt: new Date(),
  };

  await saveMessages({ messages: [dbMessage] });
  return messageId;
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
