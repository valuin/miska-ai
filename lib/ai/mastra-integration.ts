import { generateUUID } from "@/lib/utils";
import { getAgentType } from "@/mastra/agents/agent-router";
import { mastra } from "@/mastra";
import { saveMessages } from "@/lib/db/queries";
import { type DataStreamWriter, streamText, type Message } from "ai";
import { openai } from "@ai-sdk/openai";
import { optionsAgent } from "@/mastra/tools/utility-tools";

export async function streamWithMastraAgent(
  messages: Message[],
  options: {
    chatId: string;
    onToolCall?: (toolCall: any) => Promise<void>;
    runtimeContext?: Record<string, any>;
    dataStream: DataStreamWriter;
  },
) {
  const { dataStream } = options;
  const selectedAgent = await getAgentType(messages);
  const agent = mastra.getAgent(selectedAgent);

  // Set up a resourceId and threadId for Mastra memory if chatId is provided
  const resourceId = options?.chatId || generateUUID();
  const threadId = generateUUID(); // Generate a new thread for each conversation

  // Configure stream options with message saving and runtime context
  const streamOptions: any = {
    memory: {
      resource: resourceId,
      thread: threadId,
    },
    runtimeContext: options?.runtimeContext,
    onFinish: async (result: any) => {
      if (
        !result.toolCalls.some((call: any) => call.toolName === "optionsTool")
      ) {
        const optionsStream = await optionsAgent.stream(messages);
        optionsStream.mergeIntoDataStream(dataStream);
      }

      try {
        if (result.text || result.toolCalls) {
          await saveMastraMessage(
            options.chatId,
            "assistant",
            result.text || "",
            result.toolCalls,
          );
        }
      } catch (error) {
        console.error("Failed to save Mastra agent message:", error);
      }
    },
  };

  const stream = await agent.stream(messages, streamOptions);
  return stream;
}

/**
 * Save a message to the database from a Mastra agent
 */
export async function saveMastraMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string,
  toolInvocations?: any[],
) {
  const messageId = generateUUID();

  // Convert Mastra message format to your database format
  const parts: any[] = [];

  // Add text content if present
  if (content?.trim()) {
    parts.push({ type: "text", text: content });
  }

  // Add tool invocations if present
  if (toolInvocations && toolInvocations.length > 0) {
    for (const invocation of toolInvocations) {
      parts.push({
        type: "tool-call",
        toolCallId: invocation.toolCallId || generateUUID(),
        toolName: invocation.toolName,
        args: invocation.args,
      });

      // Add tool result if available
      if (invocation.result !== undefined) {
        parts.push({
          type: "tool-result",
          toolCallId: invocation.toolCallId || generateUUID(),
          result: invocation.result,
        });
      }
    }
  }

  // Ensure we have at least one part
  if (parts.length === 0) {
    parts.push({ type: "text", text: "" });
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
  outputSchema: any,
) {
  const agent = mastra.getAgent(agentName);

  if (!agent) {
    throw new Error(`Agent ${String(agentName)} not found`);
  }
  return await agent.stream(messages, {
    output: outputSchema,
  });
}

export function getAvailableAgents() {
  return Object.keys(mastra.getAgents());
}

/**
 * Direct Mastra agent API route handler (RECOMMENDED)
 * Use this for standalone Mastra-powered chat endpoints
 */
export async function createMastraAgentAPIRoute(
  agentName: keyof ReturnType<typeof mastra.getAgents>,
) {
  return async (request: Request) => {
    const { messages } = await request.json();

    const agent = mastra.getAgent(agentName);
    if (!agent) {
      return new Response("Agent not found", { status: 404 });
    }
    const stream = await agent.stream(messages);
    return stream.toDataStreamResponse();
  };
}
