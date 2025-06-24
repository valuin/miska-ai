import { text, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';
import { mastraSchema } from './mastra';

export const mastraWorkflows = mastraSchema.table(
  'workflows',
  {
    workflowName: text('workflow_name').notNull(),
    runId: uuid('run_id').notNull(),
    snapshot: text('snapshot').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workflowName, table.runId] }),
  }),
);

export type MastraWorkflow = InferSelectModel<typeof mastraWorkflows>;
