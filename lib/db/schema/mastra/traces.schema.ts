import { text, integer, jsonb, bigint, timestamp } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';
import { mastraSchema } from './mastra';

export const mastraTraces = mastraSchema.table('traces', {
  id: text('id').primaryKey().notNull(),
  parentSpanId: text('parentSpanId'),
  name: text('name').notNull(),
  traceId: text('traceId').notNull(),
  scope: text('scope').notNull(),
  kind: integer('kind').notNull(),
  attributes: jsonb('attributes'),
  status: jsonb('status'),
  events: jsonb('events'),
  links: jsonb('links'),
  other: text('other'),
  startTime: bigint('startTime', { mode: 'number' }).notNull(),
  endTime: bigint('endTime', { mode: 'number' }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type MastraTrace = InferSelectModel<typeof mastraTraces>;
