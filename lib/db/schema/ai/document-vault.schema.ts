import { pgTable, text, integer, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';
import { user } from '../user.schema';

export const documentVault = pgTable('document_vault', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  fileUrl: text('file_url').notNull(),
  contentPreview: text('content_preview'),
  metadata: jsonb('metadata').default({}),
  vectorIndexName: text('vector_index_name').notNull().default('document_vault'),
  chunkCount: integer('chunk_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documentVault.id, { onDelete: 'cascade' }),
  vectorId: text('vector_id').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content').notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const tempDocuments = pgTable('temp_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  filename: text('filename').notNull(),
  processedData: jsonb('processed_data').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).default(new Date(Date.now() + 60 * 60 * 1000)), // 1 hour from now
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type DocumentVault = typeof documentVault.$inferSelect;
export type NewDocumentVault = typeof documentVault.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;
export type TempDocument = typeof tempDocuments.$inferSelect;
export type NewTempDocument = typeof tempDocuments.$inferInsert;