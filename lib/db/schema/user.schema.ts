import { pgTable, uuid, varchar, boolean } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  phone_number: varchar("phone_number", { length: 15 }),
  whatsapp_confirmed: boolean("whatsapp_confirmed").notNull().default(false),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;
