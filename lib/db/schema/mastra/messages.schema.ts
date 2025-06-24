import { text, uuid, timestamp, varchar } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';
import { mastraSchema } from './mastra';
import { mastraThreads } from './threads.schema';

export const mastraMessages = mastraSchema.table('messages', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  threadId: uuid('thread_id')
    .notNull()
    .references(() => mastraThreads.id, { onDelete: 'cascade' }),
  resourceId: uuid('resourceId'),
  content: text('content').notNull(),
  role: varchar('role', { enum: ['user', 'assistant'] }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type MastraMessage = InferSelectModel<typeof mastraMessages>;
