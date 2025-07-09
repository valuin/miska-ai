import { documentAgent } from "./agents/document-agent";
import { Mastra } from "@mastra/core/mastra";
import { normalAgent } from "./agents/normal-agent";
import { PinoLogger } from "@mastra/loggers";
import { ragChatAgent } from "./agents/rag-chat-agent";
import { researchAgent } from "./agents/research-agent";
import type { DataStreamWriter } from "ai";
import type { Session } from "next-auth";
import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";
import { workflowCreatorAgent } from "./agents/workflow-creator-agent";

export type MastraRuntimeContext = {
  session: Session;
  dataStream: DataStreamWriter;
  selectedVaultFileNames: string[];
  mastra: Mastra<any>;
};

export const memory = new Memory({
  storage: new PostgresStore({
    connectionString: process.env.POSTGRES_URL || "",
  }),
});

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
