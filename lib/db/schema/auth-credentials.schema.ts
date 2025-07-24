import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { userIntegrations } from './user-integrations.schema';

export const authCredentials = pgTable(
  'auth_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    user_integration_id: uuid('user_integration_id')
      .notNull()
      .references(() => userIntegrations.id),
    key: varchar('key', { length: 255 }).notNull(),
    value_encrypted: text('value_encrypted').notNull(),
    expires_at: timestamp('expires_at'),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    integration_key_idx: uniqueIndex('integration_key_idx').on(
      table.user_integration_id,
      table.key,
    ),
  }),
);
