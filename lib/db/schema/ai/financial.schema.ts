import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  decimal,
  boolean,
} from 'drizzle-orm/pg-core';
import { user } from '../user.schema';
import { documentVault } from './document-vault.schema';

// Chart of Accounts table
export const chartOfAccounts = pgTable('chart_of_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountCode: text('account_code').notNull(),
  accountName: text('account_name').notNull(),
  accountType: text('account_type').notNull(), // Asset, Liability, Equity, Revenue, Expense
  parentAccountCode: text('parent_account_code'), // Store as string instead of foreign key
  isActive: boolean('is_active').default(true),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Financial transactions table
export const financialTransactions = pgTable('financial_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id').references(() => documentVault.id),
  transactionDate: timestamp('transaction_date', { withTimezone: true }).notNull(),
  description: text('description').notNull(),
  debitAmount: decimal('debit_amount', { precision: 15, scale: 2 }),
  creditAmount: decimal('credit_amount', { precision: 15, scale: 2 }),
  accountCode: text('account_code').notNull(),
  accountName: text('account_name').notNull(),
  mappedAccountId: uuid('mapped_account_id').references(() => chartOfAccounts.id),
  mappingConfidence: decimal('mapping_confidence', { precision: 3, scale: 2 }),
  isBalanced: boolean('is_balanced').default(false),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// COA mapping rules table
export const coaMappingRules = pgTable('coa_mapping_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  originalAccountName: text('original_account_name').notNull(),
  mappedAccountId: uuid('mapped_account_id')
    .notNull()
    .references(() => chartOfAccounts.id),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('1.00'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Financial reports table
export const financialReports = pgTable('financial_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  reportType: text('report_type').notNull(), // balance_sheet, income_statement, cash_flow
  reportName: text('report_name').notNull(),
  period: text('period').notNull(),
  companyData: jsonb('company_data').notNull(),
  financialData: jsonb('financial_data').notNull(),
  reportUrl: text('report_url'),
  shareUrl: text('share_url'),
  isPublic: boolean('is_public').default(false),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Financial anomalies table
export const financialAnomalies = pgTable('financial_anomalies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => financialTransactions.id),
  anomalyType: text('anomaly_type').notNull(), // unusual_amount, unusual_frequency, unusual_timing, account_mismatch
  severity: text('severity').notNull(), // low, medium, high
  description: text('description').notNull(),
  suggestedAction: text('suggested_action'),
  isResolved: boolean('is_resolved').default(false),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by').references(() => user.id),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type ChartOfAccounts = typeof chartOfAccounts.$inferSelect;
export type NewChartOfAccounts = typeof chartOfAccounts.$inferInsert;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type NewFinancialTransaction = typeof financialTransactions.$inferInsert;
export type COAMappingRule = typeof coaMappingRules.$inferSelect;
export type NewCOAMappingRule = typeof coaMappingRules.$inferInsert;
export type FinancialReport = typeof financialReports.$inferSelect;
export type NewFinancialReport = typeof financialReports.$inferInsert;
export type FinancialAnomaly = typeof financialAnomalies.$inferSelect;
export type NewFinancialAnomaly = typeof financialAnomalies.$inferInsert; 