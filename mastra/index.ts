import { accountingAgent } from './agents/accounting-agent';
import { auditAgent } from './agents/audit-agent';
import { communicationAgent } from './agents/communication-agent';
import { documentAgent } from './agents/document-agent';
import { gmailAgent } from './agents/gmail-agent';
import { driveAgent } from './agents/drive-agent';
import { Mastra } from '@mastra/core/mastra';
import { Memory } from '@mastra/memory';
import { normalAgent } from './agents/normal-agent';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import { ragChatAgent } from './agents/rag-chat-agent';
import { researchAgent } from './agents/research-agent';
import { superAgent } from './agents/super-agent';
import { taxAgent } from './agents/tax-agent';
import { workflowCreatorAgent } from './agents/workflow-creator-agent';
import type { DataStreamWriter } from 'ai';
import type { Session } from 'next-auth';

export type MastraRuntimeContext = {
  session: Session;
  dataStream: DataStreamWriter;
  selectedVaultFileNames: string[];
  mastra: Mastra<any>;
};

export const memory = new Memory({
  storage: new PostgresStore({
    connectionString: process.env.POSTGRES_URL || '',
  }),
});

export const agents = {
  superAgent,
  accountingAgent,
  taxAgent,
  auditAgent,
  researchAgent,
  ragChatAgent,
  normalAgent,
  workflowCreatorAgent,
  documentAgent,
  communicationAgent,
  gmailAgent,
  driveAgent,
};

export const mastra = new Mastra({
  agents,
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
