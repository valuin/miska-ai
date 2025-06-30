import { pgTable, uuid, boolean, primaryKey } from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { chat } from "./chat.schema";
import { message } from "./message.schema";

export const vote = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;
