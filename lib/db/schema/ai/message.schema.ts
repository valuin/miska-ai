import { pgTable, uuid, timestamp, varchar, json } from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';
import { chat } from './chat.schema';

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  agentName: varchar('agentName'),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;
