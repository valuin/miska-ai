import {
  pgTable,
  uuid,
  timestamp,
  text,
  boolean,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { integrations } from './integrations.schema';
import { user } from './user.schema';

export const userIntegrations = pgTable(
  'user_integrations',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    user_id: uuid('user_id')
      .references(() => user.id)
      .notNull(),
    enabled: boolean('enabled').notNull().default(false),
    integration_id: uuid('integration_id')
      .references(() => integrations.id)
      .notNull(),
    authenticated: boolean('authenticated').notNull().default(false),
    account_label: text('account_label'),
    connected_at: timestamp('connected_at'),
  },
  (table) => ({
    user_integration_user_id_idx: uniqueIndex(
      'user_integration_user_id_idx',
    ).on(table.user_id, table.integration_id),
  }),
);
