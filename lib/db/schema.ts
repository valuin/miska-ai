import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  bigint,
  integer,
  jsonb,
  pgSchema,
} from 'drizzle-orm/pg-core';

// Create Mastra schema
export const mastraSchema = pgSchema('mastra');

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

// Mastra schema tables
export const mastraThreads = mastraSchema.table('threads', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  resourceId: text('resourceId').notNull(),
  title: text('title').notNull(),
  metadata: text('metadata').default('{}'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type MastraThread = InferSelectModel<typeof mastraThreads>;

export const mastraMessages = mastraSchema.table('messages', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  threadId: uuid('thread_id')
    .notNull()
    .references(() => mastraThreads.id, { onDelete: 'cascade' }),
  resourceId: uuid('resourceId'),
  content: text('content').notNull(),
  role: varchar('role', { enum: ['user', 'assistant'] }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type MastraMessage = InferSelectModel<typeof mastraMessages>;

export const mastraWorkflows = mastraSchema.table(
  'workflows',
  {
    workflowName: text('workflow_name').notNull(),
    runId: uuid('run_id').notNull(),
    snapshot: text('snapshot').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.workflowName, table.runId] }),
  }),
);

export type MastraWorkflow = InferSelectModel<typeof mastraWorkflows>;

export const mastraEvalDatasets = mastraSchema.table('eval_datasets', {
  input: text('input').notNull(),
  output: text('output').notNull(),
  result: jsonb('result').notNull(),
  agentName: text('agent_name').notNull(),
  metricName: text('metric_name').notNull(),
  instructions: text('instructions').notNull(),
  testInfo: jsonb('test_info').notNull(),
  globalRunId: uuid('global_run_id').notNull(),
  runId: uuid('run_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type MastraEvalDataset = InferSelectModel<typeof mastraEvalDatasets>;

export const mastraTraces = mastraSchema.table('traces', {
  id: text('id').primaryKey().notNull(),
  parentSpanId: text('parentSpanId'),
  name: text('name').notNull(),
  traceId: text('traceId').notNull(),
  scope: text('scope').notNull(),
  kind: integer('kind').notNull(),
  attributes: jsonb('attributes'),
  status: jsonb('status'),
  events: jsonb('events'),
  links: jsonb('links'),
  other: text('other'),
  startTime: bigint('startTime', { mode: 'number' }).notNull(),
  endTime: bigint('endTime', { mode: 'number' }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type MastraTrace = InferSelectModel<typeof mastraTraces>;
