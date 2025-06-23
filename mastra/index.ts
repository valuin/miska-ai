
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent },
  storage: new PostgresStore({
    connectionString: process.env.POSTGRES_URL!,
    schemaName: 'mastra', // Use a dedicated schema for Mastra data
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
