import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";
import type { Message } from "ai";
import { z } from "zod";

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
  
  You have the following agents available:
  - researchAgent
    - This agent is used to research the user's query, and find the most relevant information.
  - ragChatAgent
    - This agent is used to respond to user queries that require retrieval into internal documents.
  - workflowCreatorAgent
    - This agent is used to build workflows for the user; for example, building a workflow to draft an email.
  - normalAgent
    - This agent is used to respond to user queries that are very simple, and don't require any other agents.
  - documentAgent
    - This agent is used to create, update, and request suggestions for documents.
  `,
  model: openai("gpt-4o-mini"),
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
    console.log("agentType", agentType);
    return agentType;
  } catch (err) {
    return "normalAgent";
  }
}
