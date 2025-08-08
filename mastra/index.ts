import { accountingAgent } from './agents/accounting-agent';
import { Mastra } from '@mastra/core/mastra';
import { Memory } from '@mastra/memory';
import { normalAgent } from './agents/normal-agent';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import { taxAgent } from './agents/tax-agent';
import type { DataStreamWriter } from 'ai';
import type { Session } from 'next-auth';

export type MastraRuntimeContext = {
  session: Session;
  dataStream: DataStreamWriter;
  selectedVaultFileNames: string[];
  documentPreview: any;
  mastra: Mastra<any>;
};

export const memory = new Memory({
  storage: new PostgresStore({
    connectionString: process.env.POSTGRES_URL || '',
  }),
});

export const agents = {
  accountingAgent,
  taxAgent,
  normalAgent,
};

export const mastra = new Mastra({
  agents,
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
