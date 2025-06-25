import {
  pgTable,
  uuid,
  timestamp,
  text,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel } from 'drizzle-orm';
import { user } from '../user.schema';

export const upload = pgTable(
  'Upload',
  {
    id: uuid('id').notNull().defaultRandom(),
    name: text('name').notNull(),
    url: text('url').notNull(),
    text: text('text').notNull().default(''),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Upload = InferSelectModel<typeof upload>;
