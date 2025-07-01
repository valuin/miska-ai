import { generateUUID } from "@/lib/utils";
import { getAgentType } from "@/mastra/agents/agent-router";
import { mastra, type MastraRuntimeContext } from "@/mastra";
import { optionsAgent } from "@/mastra/tools/utility-tools";
import { saveMessages } from "@/lib/db/queries";
import type { DataStreamWriter, Message, StepResult } from "ai";
import type { RuntimeContext } from "@mastra/core/di";

type onFinishResult = Omit<StepResult<any>, "stepType" | "isContinued"> & {
  readonly steps: StepResult<any>[];
};

type StepText = {
  type: "text";
  text: string;
};

type ToolCall = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
};

type ToolResult = {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  result: Record<string, any>;
};

type Step = StepText | ToolCall | ToolResult;

export async function streamWithMastraAgent(
  chatId: string,
  messages: Message[],
  options: {
    onToolCall?: (toolCall: any) => Promise<void>;
    runtimeContext?: RuntimeContext<MastraRuntimeContext>;
    responsePipe: DataStreamWriter;
  },
): Promise<void> {
  const { responsePipe } = options; 
  const selectedAgent = await getAgentType(messages);
  const agent = mastra.getAgent(selectedAgent);

  if (selectedAgent !== "normalAgent") {
    const agentMap = {
      researchAgent: "Initiating Research Agent...",
      ragChatAgent: "Initiating Vault Search Agent...",
      workflowCreatorAgent: "Initiating Workflow Agent...",
      documentAgent: "Initiating Document Agent...",
    };
    const agentChoice = agentMap[selectedAgent];
    if (!agentChoice) return;
    responsePipe.writeMessageAnnotation({
      type: "agent-choice",
      agentChoice,
    });
  }

  const resourceId = chatId || generateUUID();
  const threadId = generateUUID();

  const saveMessage = async (result: any[]) => {
    try {
      const steps: Step[] = [];
      for (const step of result) {
        if (step.text) steps.push({ type: "text", text: step.text });
        if (step.toolCalls && step.toolCalls.length > 0) {
          for (const toolCall of step.toolCalls) {
            steps.push({
              type: "tool-call",
              toolCallId: toolCall.toolCallId,
              toolName: toolCall.toolName,
              args: toolCall.args,
            });
          }
        }
        if (step.toolResults && step.toolResults.length > 0) {
          for (const toolResult of step.toolResults) {
            steps.push({
              type: "tool-result",
              toolCallId: toolResult.toolCallId,
              toolName: toolResult.toolName,
              result: toolResult.result,
            });
          }
        }
      }

      const filteredSteps = steps.filter((step) => {
        if (step.type !== "tool-call") return true;
        if (
          steps.find(
            (s) => s.type === "tool-result" && s.toolCallId === step.toolCallId,
          )
        ) {
          return false;
        }
        return true;
      });

      await saveMastraMessage(
        selectedAgent,
        chatId,
        "assistant",
        filteredSteps,
      );
    } catch (error) {
      console.error("Failed to save Mastra agent message:", error);
    }
  };

  const streamOptions: any = {
    memory: {
      resource: resourceId,
      thread: threadId,
    },
    runtimeContext: options?.runtimeContext,
    onFinish: async (result: onFinishResult) => {
      const lastMessage = {
        id: "LAST GENERATED AGENT RESPONSE",
        role: "assistant" as const,
        content: JSON.stringify(result.response.messages),
      };
      const content = [...messages, lastMessage];
      const optionsStream = await optionsAgent.stream(content, {
        onFinish: async (_result: onFinishResult) => {
          await saveMessage([...result.steps, ..._result.steps]);
        },
      });
      optionsStream.mergeIntoDataStream(responsePipe);
    },
  };

  const stream = await agent.stream(messages, streamOptions);
  stream.mergeIntoDataStream(responsePipe, { experimental_sendFinish: false });
}

/**
 * Save a message to the database from a Mastra agent
 */
export async function saveMastraMessage(
  agentName: string,
  chatId: string,
  role: "user" | "assistant",
  parts: Step[],
) {
  const messageId = generateUUID();

  // Ensure we have at least one part
  if (parts.length === 0) {
    parts.push({ type: "text", text: "" });
  }

  const dbMessage = {
    id: messageId,
    chatId,
    agentName,
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

