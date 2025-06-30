import { documentAgent } from "./agents/document-agent";
import { Mastra } from "@mastra/core/mastra";
import { normalAgent } from "./agents/normal-agent";
import { PinoLogger } from "@mastra/loggers";
import { ragChatAgent } from "./agents/rag-chat-agent";
import { researchAgent } from "./agents/research-agent";
import { workflowCreatorAgent } from "./agents/workflow-creator-agent";
import type { DataStreamWriter } from "ai";
import type { Session } from "next-auth";

// Define the shape of your runtime context
export type MastraRuntimeContext = {
  session: Session;
  dataStream: DataStreamWriter;
};

export const mastra = new Mastra({
  agents: {
    researchAgent,
    ragChatAgent,
    normalAgent,
    workflowCreatorAgent,
    documentAgent,
  },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
