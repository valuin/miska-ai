import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  text,
  jsonb,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';

export const workflow = pgTable('Workflow', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: varchar('name').notNull(),
  description: text('description'),
  schema: jsonb('schema').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt')
    .notNull()
    .$onUpdate(() => new Date()),
});

export type DBWorkflow = InferSelectModel<typeof workflow>;
