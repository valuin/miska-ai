import { Agent } from "@mastra/core";
import { BASE_MODEL } from "@/lib/constants";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Message } from "ai";

const agentTypeSchema = z.object({
  reasoning: z
    .string()
    .describe("The reasoning for the agent type (~20 words)")
    .max(200),
  agentType: z.enum([
    "researchAgent",
    "ragChatAgent",
    "workflowCreatorAgent",
    "normalAgent",
    "documentAgent",
  ] as const),
});
type AgentType = z.infer<typeof agentTypeSchema>["agentType"];

export const agentRouter = new Agent({
  name: "Agent Router",
  instructions: `You are an agent router. Your goal is to read the user's messages and decide which agent to use.

  Routing rules (strictly follow):
  - Any query about the "vault", saving, searching, or asking about preexisting documents (including retrieval, lookup, or questions about stored documents) must ALWAYS be routed to ragChatAgent.
  - Only requests to create, update, or get suggestions for new documents (not vault-related) should be routed to documentAgent.
  - Do NOT route vault-related queries to documentAgent.
  - if the user asks about information that requires searching the internet, use researchAgent.
  - If the user asks about both creating and searching documents, prioritize ragChatAgent for vault/search/retrieval intent.

  You have the following agents available:
  - normalAgent
    - This is the default agent, and is very versatile. It should be used to respond to user queries that are very simple, and don't require any other agents.
    - However, it should also be used to clarify the user's request if it is ambiguous, such as asking follow up questions, or including options for the user to choose from.
  - researchAgent
    - This agent is used to research the user's query, from sources online and internal documents, and find the most relevant information.
  - ragChatAgent
    - This agent is used to respond to user queries that require retrieval into internal documents or the vault, DOES NOT INCLUDE INFORMATION THAT NEEDS TO BE SEARCHED ON THE INTERNET.
  - workflowCreatorAgent
    - This agent is used to build workflows for the user; for example, building a workflow to draft an email.
  - documentAgent
    - This agent is used to create, update, and request suggestions for new documents (not vault-related).
  `,
  model: openai(BASE_MODEL),
});

export async function getAgentType(messages: Message[]): Promise<AgentType> {
  try {
    const messageContent = messages
      .slice(-3)
      .map((m) => `${m.role.toLocaleUpperCase()}: ${m.content}`)
      .join("\n");

    const response = await agentRouter.generate(
      `User conversation so far: ${messageContent}`,
      { experimental_output: agentTypeSchema },
    );
    const { agentType } = response.object;
    return agentType;
  } catch (err) {
    return "normalAgent";
  }
}
