import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { userIntegrations } from "./user-integrations.schema";

export const authCredentials = pgTable("auth_credentials", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_integration_id: uuid("user_integration_id").references(
    () => userIntegrations.id,
  ),
  key: varchar("key", { length: 255 }),
  value_encrypted: text("value_encrypted"),
  expires_at: timestamp("expires_at"),
});
