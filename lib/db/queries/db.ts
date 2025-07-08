import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as chatSchema from '../schema/ai/chat.schema';
import * as documentVaultSchema from '../schema/ai/document-vault.schema';
import * as documentSchema from '../schema/ai/document.schema';
import * as messageSchema from '../schema/ai/message.schema';
import * as streamSchema from '../schema/ai/stream.schema';
import * as suggestionSchema from '../schema/ai/suggestion.schema';
import * as uploadSchema from '../schema/ai/upload.schema';
import * as voteSchema from '../schema/ai/vote.schema';
import * as workflowSchema from '../schema/ai/workflow.schema';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client, {
  schema: {
    ...chatSchema,
    ...documentVaultSchema,
    ...documentSchema,
    ...messageSchema,
    ...streamSchema,
    ...suggestionSchema,
    ...uploadSchema,
    ...voteSchema,
    ...workflowSchema,
  },
});
