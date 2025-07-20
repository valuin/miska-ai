import { pgTable, uuid, varchar, boolean, text } from "drizzle-orm/pg-core";

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  auth_type: varchar("auth_type", { length: 255 }).notNull().default("none"),
  icon: text("icon").notNull().default(""),
  description: text("description").notNull(),
  requires_auth: boolean("requires_auth").notNull().default(false),
  redirect_url: text("redirect_url"),
});
