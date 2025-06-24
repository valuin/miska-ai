import { uuid, text, timestamp } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';
import { mastraSchema } from './mastra';

export const mastraThreads = mastraSchema.table('threads', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  resourceId: text('resourceId').notNull(),
  title: text('title').notNull(),
  metadata: text('metadata').default('{}'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type MastraThread = InferSelectModel<typeof mastraThreads>;
