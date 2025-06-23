
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
// import { LibSQLStore } from '@mastra/libsql';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent },
  // Use in-memory storage for now to avoid LibSQL platform issues
  // storage: new LibSQLStore({
  //   url: ":memory:",
  // }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
