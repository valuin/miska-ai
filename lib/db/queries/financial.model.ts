import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from './db';
import {
  chartOfAccounts,
  financialTransactions,
  coaMappingRules,
  financialReports,
  financialAnomalies,
  type ChartOfAccounts,
  type NewChartOfAccounts,
  type FinancialTransaction,
  type NewFinancialTransaction,
  type COAMappingRule,
  type NewCOAMappingRule,
  type FinancialReport,
  type NewFinancialReport,
  type FinancialAnomaly,
  type NewFinancialAnomaly,
} from '../schema/ai/financial.schema';

// Chart of Accounts queries
export async function getChartOfAccounts(userId: string): Promise<ChartOfAccounts[]> {
  const results = await db
    .select()
    .from(chartOfAccounts)
    .where(and(eq(chartOfAccounts.userId, userId), eq(chartOfAccounts.isActive, true)))
    .orderBy(asc(chartOfAccounts.accountCode));
  return results;
}

export async function createChartOfAccount(data: NewChartOfAccounts): Promise<ChartOfAccounts> {
  const [result] = await db.insert(chartOfAccounts).values(data).returning();
  return result;
}

export async function updateChartOfAccount(id: string, data: Partial<ChartOfAccounts>): Promise<ChartOfAccounts | null> {
  const [result] = await db
    .update(chartOfAccounts)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(chartOfAccounts.id, id))
    .returning();
  return result || null;
}

export async function deleteChartOfAccount(id: string): Promise<boolean> {
  const [result] = await db
    .update(chartOfAccounts)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(chartOfAccounts.id, id))
    .returning();
  return !!result;
}

// Financial Transactions queries
export async function getFinancialTransactions(userId: string, limit = 100): Promise<FinancialTransaction[]> {
  return await db
    .select()
    .from(financialTransactions)
    .where(eq(financialTransactions.userId, userId))
    .orderBy(desc(financialTransactions.transactionDate))
    .limit(limit);
}

export async function createFinancialTransaction(data: NewFinancialTransaction): Promise<FinancialTransaction> {
  const [result] = await db.insert(financialTransactions).values(data).returning();
  return result;
}

export async function createFinancialTransactions(data: NewFinancialTransaction[]): Promise<FinancialTransaction[]> {
  return await db.insert(financialTransactions).values(data).returning();
}

export async function getTransactionsByDocument(documentId: string): Promise<FinancialTransaction[]> {
  return await db
    .select()
    .from(financialTransactions)
    .where(eq(financialTransactions.documentId, documentId))
    .orderBy(asc(financialTransactions.transactionDate));
}

export async function getTransactionsByDateRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<FinancialTransaction[]> {
  return await db
    .select()
    .from(financialTransactions)
    .where(
      and(
        eq(financialTransactions.userId, userId),
        sql`${financialTransactions.transactionDate} >= ${startDate}`,
        sql`${financialTransactions.transactionDate} <= ${endDate}`
      )
    )
    .orderBy(asc(financialTransactions.transactionDate));
}

// COA Mapping Rules queries
export async function getCOAMappingRules(userId: string): Promise<COAMappingRule[]> {
  return await db
    .select()
    .from(coaMappingRules)
    .where(and(eq(coaMappingRules.userId, userId), eq(coaMappingRules.isActive, true)))
    .orderBy(asc(coaMappingRules.originalAccountName));
}

export async function createCOAMappingRule(data: NewCOAMappingRule): Promise<COAMappingRule> {
  const [result] = await db.insert(coaMappingRules).values(data).returning();
  return result;
}

export async function updateCOAMappingRule(id: string, data: Partial<COAMappingRule>): Promise<COAMappingRule | null> {
  const [result] = await db
    .update(coaMappingRules)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(coaMappingRules.id, id))
    .returning();
  return result || null;
}

export async function deleteCOAMappingRule(id: string): Promise<boolean> {
  const [result] = await db
    .update(coaMappingRules)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(coaMappingRules.id, id))
    .returning();
  return !!result;
}

// Financial Reports queries
export async function getFinancialReports(userId: string): Promise<FinancialReport[]> {
  return await db
    .select()
    .from(financialReports)
    .where(eq(financialReports.userId, userId))
    .orderBy(desc(financialReports.createdAt));
}

export async function createFinancialReport(data: NewFinancialReport): Promise<FinancialReport> {
  const [result] = await db.insert(financialReports).values(data).returning();
  return result;
}

export async function getFinancialReport(id: string): Promise<FinancialReport | null> {
  const [result] = await db
    .select()
    .from(financialReports)
    .where(eq(financialReports.id, id));
  return result || null;
}

export async function updateFinancialReport(id: string, data: Partial<FinancialReport>): Promise<FinancialReport | null> {
  const [result] = await db
    .update(financialReports)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(financialReports.id, id))
    .returning();
  return result || null;
}

// Financial Anomalies queries
export async function getFinancialAnomalies(userId: string, resolved = false): Promise<FinancialAnomaly[]> {
  return await db
    .select()
    .from(financialAnomalies)
    .where(and(eq(financialAnomalies.userId, userId), eq(financialAnomalies.isResolved, resolved)))
    .orderBy(desc(financialAnomalies.createdAt));
}

export async function createFinancialAnomaly(data: NewFinancialAnomaly): Promise<FinancialAnomaly> {
  const [result] = await db.insert(financialAnomalies).values(data).returning();
  return result;
}

export async function resolveFinancialAnomaly(id: string, resolvedBy: string): Promise<FinancialAnomaly | null> {
  const [result] = await db
    .update(financialAnomalies)
    .set({ 
      isResolved: true, 
      resolvedAt: new Date(), 
      resolvedBy,
      updatedAt: new Date() 
    })
    .where(eq(financialAnomalies.id, id))
    .returning();
  return result || null;
}

// Utility functions
export async function getTransactionSummary(userId: string, startDate: Date, endDate: Date) {
  const transactions = await getTransactionsByDateRange(userId, startDate, endDate);
  
  const summary = {
    totalTransactions: transactions.length,
    totalDebits: 0,
    totalCredits: 0,
    accountSummary: {} as Record<string, { debits: number; credits: number; balance: number }>,
  };

  transactions.forEach(transaction => {
    const debit = Number(transaction.debitAmount) || 0;
    const credit = Number(transaction.creditAmount) || 0;
    
    summary.totalDebits += debit;
    summary.totalCredits += credit;
    
    if (!summary.accountSummary[transaction.accountName]) {
      summary.accountSummary[transaction.accountName] = { debits: 0, credits: 0, balance: 0 };
    }
    
    summary.accountSummary[transaction.accountName].debits += debit;
    summary.accountSummary[transaction.accountName].credits += credit;
    summary.accountSummary[transaction.accountName].balance += (debit - credit);
  });

  return summary;
} 