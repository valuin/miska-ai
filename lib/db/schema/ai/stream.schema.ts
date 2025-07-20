import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { chat } from "./chat.schema";

export const stream = pgTable("Stream", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  createdAt: timestamp("createdAt").notNull(),
});

export type Stream = InferSelectModel<typeof stream>;
