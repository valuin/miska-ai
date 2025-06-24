import { text, jsonb, uuid, timestamp } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';
import { mastraSchema } from './mastra';

export const mastraEvalDatasets = mastraSchema.table('eval_datasets', {
  input: text('input').notNull(),
  output: text('output').notNull(),
  result: jsonb('result').notNull(),
  agentName: text('agent_name').notNull(),
  metricName: text('metric_name').notNull(),
  instructions: text('instructions').notNull(),
  testInfo: jsonb('test_info').notNull(),
  globalRunId: uuid('global_run_id').notNull(),
  runId: uuid('run_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type MastraEvalDataset = InferSelectModel<typeof mastraEvalDatasets>;
