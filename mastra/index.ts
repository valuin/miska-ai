import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { researchAgent } from "./agents/research-agent";
import { ragChatAgent } from "./agents/rag-chat-agent";

export const mastra = new Mastra({
  agents: { researchAgent, ragChatAgent },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
