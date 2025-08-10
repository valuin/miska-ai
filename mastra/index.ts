import { accountingAgent } from './agents/accounting-agent';
import { Mastra } from '@mastra/core/mastra';
import { normalAgent } from './agents/normal-agent';
import { PinoLogger } from '@mastra/loggers';
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
