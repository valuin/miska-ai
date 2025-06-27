import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core";

export const agentRouter = new Agent({
  name: "Agent Router",
  instructions: `You are an agent router. Your goal is to read the user's messages and decide which agent to use.
  
  You have the following agents available:
  - researchAgent
    - This agent is used to research the user's query, and find the most relevant information.
    
  - ragChatAgent
  - workflowBuilderAgent
  `,
  model: openai("gpt-4o-mini"),
});
