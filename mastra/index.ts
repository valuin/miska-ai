import { Mastra } from "@mastra/core/mastra";
import { normalAgent } from "./agents/normal-agent";
import { PinoLogger } from "@mastra/loggers";
import { ragChatAgent } from "./agents/rag-chat-agent";
import { researchAgent } from "./agents/research-agent";
import { workflowCreatorAgent } from "./agents/workflow-creator-agent";

export const mastra = new Mastra({
  agents: { researchAgent, ragChatAgent, normalAgent, workflowCreatorAgent },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
