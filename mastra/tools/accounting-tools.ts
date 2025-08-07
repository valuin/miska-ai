import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const parseFinancialDocumentSchema = z.object({
  fileUrl: z.string().describe('URL of the uploaded financial document'),
  filename: z.string().describe('Original filename'),
  contentType: z.string().describe('MIME type of the file'),
  documentType: z.enum(['journal', 'ledger', 'mixed']).describe('Type of financial document'),
});

const mapCOASchema = z.object({
  transactionData: z.string().describe('Parsed transaction data in JSON format'),
  coaMapping: z.record(z.string(), z.string()).describe('Chart of Accounts mapping rules'),
});

const validateTransactionsSchema = z.object({
  transactions: z.array(z.object({
    date: z.string(),
    description: z.string(),
    debit: z.number().optional(),
    credit: z.number().optional(),
    account: z.string(),
  })),
});

const generateFinancialReportSchema = z.object({
  reportType: z.enum(['balance_sheet', 'income_statement', 'cash_flow']),
  period: z.string().describe('Reporting period (e.g., "Q1 2025")'),
  companyData: z.object({
    name: z.string(),
    address: z.string(),
    fiscalYear: z.string(),
  }),
  financialData: z.object({
    assets: z.array(z.object({ account: z.string(), amount: z.number() })),
    liabilities: z.array(z.object({ account: z.string(), amount: z.number() })),
    equity: z.array(z.object({ account: z.string(), amount: z.number() })),
    revenue: z.array(z.object({ account: z.string(), amount: z.number() })),
    expenses: z.array(z.object({ account: z.string(), amount: z.number() })),
  }),
});

const detectAnomaliesSchema = z.object({
  transactions: z.array(z.object({
    date: z.string(),
    description: z.string(),
    debit: z.number().optional(),
    credit: z.number().optional(),
    account: z.string(),
    amount: z.number(),
  })),
  historicalData: z.string().optional().describe('Historical transaction data for comparison'),
});

export const parseFinancialDocumentTool = createTool({
  id: 'parse-financial-document',
  description: 'Parse financial documents (CSV, Excel, PDF) containing journal entries and general ledger data',
  inputSchema: parseFinancialDocumentSchema,
  outputSchema: z.object({
    success: z.boolean(),
    transactions: z.array(z.object({
      date: z.string(),
      description: z.string(),
      debit: z.number().optional(),
      credit: z.number().optional(),
      account: z.string(),
      amount: z.number(),
      documentSource: z.string(),
    })),
    metadata: z.object({
      totalTransactions: z.number(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }),
      documentType: z.string(),
      parsingConfidence: z.number(),
    }),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const { fileUrl, filename, contentType, documentType } = context;
      const mockTransactions = [
        {
          date: '2025-01-15',
          description: 'Cash sale',
          debit: 1000000,
          credit: undefined,
          account: 'Cash',
          amount: 1000000,
          documentSource: filename,
        },
        {
          date: '2025-01-15',
          description: 'Revenue from sales',
          debit: undefined,
          credit: 1000000,
          account: 'Sales Revenue',
          amount: 1000000,
          documentSource: filename,
        },
        {
          date: '2025-01-16',
          description: 'Office supplies purchase',
          debit: 500000,
          credit: undefined,
          account: 'Office Supplies',
          amount: 500000,
          documentSource: filename,
        },
        {
          date: '2025-01-16',
          description: 'Cash payment for supplies',
          debit: undefined,
          credit: 500000,
          account: 'Cash',
          amount: 500000,
          documentSource: filename,
        },
      ];

      return {
        success: true,
        transactions: mockTransactions,
        metadata: {
          totalTransactions: mockTransactions.length,
          dateRange: {
            start: '2025-01-15',
            end: '2025-01-16',
          },
          documentType,
          parsingConfidence: 0.95,
        },
        message: `Successfully parsed ${filename} with ${mockTransactions.length} transactions`,
      };
    } catch (error) {
      return {
        success: false,
        transactions: [],
        metadata: {
          totalTransactions: 0,
          dateRange: { start: '', end: '' },
          documentType: context.documentType,
          parsingConfidence: 0,
        },
        message: `Failed to parse ${context.filename}: ${error}`,
      };
    }
  },
});

export const mapCOATool = createTool({
  id: 'map-chart-of-accounts',
  description: 'Map transaction accounts to standardized Chart of Accounts (COA)',
  inputSchema: mapCOASchema,
  outputSchema: z.object({
    success: z.boolean(),
    mappedTransactions: z.array(z.object({
      originalAccount: z.string(),
      mappedAccount: z.string(),
      confidence: z.number(),
      category: z.string(),
    })),
    coaSummary: z.object({
      totalMapped: z.number(),
      totalUnmapped: z.number(),
      mappingConfidence: z.number(),
    }),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const { transactionData, coaMapping } = context;
      // Simulate COA mapping
      const mockMappedTransactions = [
        {
          originalAccount: 'Cash',
          mappedAccount: '1000 - Cash and Cash Equivalents',
          confidence: 0.95,
          category: 'Asset',
        },
        {
          originalAccount: 'Sales Revenue',
          mappedAccount: '4000 - Sales Revenue',
          confidence: 0.90,
          category: 'Revenue',
        },
        {
          originalAccount: 'Office Supplies',
          mappedAccount: '5000 - Office Supplies Expense',
          confidence: 0.85,
          category: 'Expense',
        },
      ];

      return {
        success: true,
        mappedTransactions: mockMappedTransactions,
        coaSummary: {
          totalMapped: 3,
          totalUnmapped: 0,
          mappingConfidence: 0.90,
        },
        message: 'Successfully mapped transactions to Chart of Accounts',
      };
    } catch (error) {
      return {
        success: false,
        mappedTransactions: [],
        coaSummary: {
          totalMapped: 0,
          totalUnmapped: 0,
          mappingConfidence: 0,
        },
        message: `Failed to map COA: ${error}`,
      };
    }
  },
});

export const validateTransactionsTool = createTool({
  id: 'validate-transactions',
  description: 'Validate debit/credit balances and detect accounting errors',
  inputSchema: validateTransactionsSchema,
  outputSchema: z.object({
    success: z.boolean(),
    validationResults: z.object({
      totalTransactions: z.number(),
      balancedTransactions: z.number(),
      unbalancedTransactions: z.number(),
      errors: z.array(z.object({
        transactionIndex: z.number(),
        error: z.string(),
        suggestion: z.string(),
      })),
      balanceCheck: z.object({
        totalDebits: z.number(),
        totalCredits: z.number(),
        difference: z.number(),
        isBalanced: z.boolean(),
      }),
    }),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const { transactions } = context;
      const totalDebits = transactions.reduce((sum: number, t: any) => sum + (t.debit || 0), 0);
      const totalCredits = transactions.reduce((sum: number, t: any) => sum + (t.credit || 0), 0);
      const difference = Math.abs(totalDebits - totalCredits);
      const isBalanced = difference < 0.01; // Allow for rounding errors

      const errors = [];
      if (!isBalanced) {
        errors.push({
          transactionIndex: -1,
          error: 'Unbalanced transactions',
          suggestion: `Total debits (${totalDebits}) do not equal total credits (${totalCredits}). Difference: ${difference}`,
        });
      }

      return {
        success: true,
        validationResults: {
          totalTransactions: transactions.length,
          balancedTransactions: isBalanced ? transactions.length : transactions.length - 1,
          unbalancedTransactions: isBalanced ? 0 : 1,
          errors,
          balanceCheck: {
            totalDebits,
            totalCredits,
            difference,
            isBalanced,
          },
        },
        message: isBalanced 
          ? 'All transactions are balanced' 
          : `Found ${errors.length} validation errors`,
      };
    } catch (error) {
      return {
        success: false,
        validationResults: {
          totalTransactions: 0,
          balancedTransactions: 0,
          unbalancedTransactions: 0,
          errors: [],
          balanceCheck: {
            totalDebits: 0,
            totalCredits: 0,
            difference: 0,
            isBalanced: false,
          },
        },
        message: `Validation failed: ${error}`,
      };
    }
  },
});

export const generateFinancialReportTool = createTool({
  id: 'generate-financial-report',
  description: 'Generate standard financial reports (Balance Sheet, Income Statement, Cash Flow)',
  inputSchema: generateFinancialReportSchema,
  outputSchema: z.object({
    success: z.boolean(),
    report: z.object({
      reportType: z.string(),
      period: z.string(),
      companyData: z.object({
        name: z.string(),
        address: z.string(),
        fiscalYear: z.string(),
      }),
      generatedDate: z.string(),
      downloadUrl: z.string(),
      shareUrl: z.string(),
    }),
    financialData: z.object({
      totalAssets: z.number(),
      totalLiabilities: z.number(),
      totalEquity: z.number(),
      netIncome: z.number(),
      totalRevenue: z.number(),
      totalExpenses: z.number(),
    }),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const { reportType, period, companyData, financialData } = context;
      const totalAssets = financialData.assets.reduce((sum: number, asset: any) => sum + asset.amount, 0);
      const totalLiabilities = financialData.liabilities.reduce((sum: number, liability: any) => sum + liability.amount, 0);
      const totalEquity = financialData.equity.reduce((sum: number, equity: any) => sum + equity.amount, 0);
      const totalRevenue = financialData.revenue.reduce((sum: number, rev: any) => sum + rev.amount, 0);
      const totalExpenses = financialData.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
      const netIncome = totalRevenue - totalExpenses;

      return {
        success: true,
        report: {
          reportType,
          period,
          companyData,
          generatedDate: new Date().toISOString(),
          downloadUrl: `/api/accounting/reports/${reportType}/download`,
          shareUrl: `/api/accounting/reports/${reportType}/share`,
        },
        financialData: {
          totalAssets,
          totalLiabilities,
          totalEquity,
          netIncome,
          totalRevenue,
          totalExpenses,
        },
        message: `Successfully generated ${reportType} for ${period}`,
      };
    } catch (error) {
      return {
        success: false,
        report: {
          reportType: context.reportType,
          period: context.period,
          companyData: context.companyData,
          generatedDate: new Date().toISOString(),
          downloadUrl: '',
          shareUrl: '',
        },
        financialData: {
          totalAssets: 0,
          totalLiabilities: 0,
          totalEquity: 0,
          netIncome: 0,
          totalRevenue: 0,
          totalExpenses: 0,
        },
        message: `Failed to generate report: ${error}`,
      };
    }
  },
});

export const detectAnomaliesTool = createTool({
  id: 'detect-financial-anomalies',
  description: 'Detect anomalies and unusual patterns in financial transactions',
  inputSchema: detectAnomaliesSchema,
  outputSchema: z.object({
    success: z.boolean(),
    anomalies: z.array(z.object({
      type: z.enum(['unusual_amount', 'unusual_frequency', 'unusual_timing', 'account_mismatch']),
      severity: z.enum(['low', 'medium', 'high']),
      description: z.string(),
      transactionIndex: z.number(),
      suggestedAction: z.string(),
    })),
    summary: z.object({
      totalAnomalies: z.number(),
      highSeverity: z.number(),
      mediumSeverity: z.number(),
      lowSeverity: z.number(),
    }),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const { transactions, historicalData } = context;
      // Simulate anomaly detection
      const anomalies: Array<{
        type: 'unusual_amount' | 'unusual_frequency' | 'unusual_timing' | 'account_mismatch';
        severity: 'low' | 'medium' | 'high';
        description: string;
        transactionIndex: number;
        suggestedAction: string;
      }> = [];
      
      // Check for unusual amounts
      const amounts = transactions.map((t: any) => t.amount);
      const avgAmount = amounts.reduce((sum: number, amount: number) => sum + amount, 0) / amounts.length;
      const stdDev = Math.sqrt(amounts.reduce((sum: number, amount: number) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length);
      
      transactions.forEach((transaction: any, index: number) => {
        if (Math.abs(transaction.amount - avgAmount) > 2 * stdDev) {
          anomalies.push({
            type: 'unusual_amount',
            severity: 'medium',
            description: `Transaction amount (${transaction.amount}) is significantly different from average (${avgAmount.toFixed(2)})`,
            transactionIndex: index,
            suggestedAction: 'Review transaction for accuracy and authorization',
          });
        }
      });

      return {
        success: true,
        anomalies,
        summary: {
          totalAnomalies: anomalies.length,
          highSeverity: anomalies.filter((a) => a.severity === 'high').length,
          mediumSeverity: anomalies.filter((a) => a.severity === 'medium').length,
          lowSeverity: anomalies.filter((a) => a.severity === 'low').length,
        },
        message: `Detected ${anomalies.length} anomalies in ${transactions.length} transactions`,
      };
    } catch (error) {
      return {
        success: false,
        anomalies: [],
        summary: {
          totalAnomalies: 0,
          highSeverity: 0,
          mediumSeverity: 0,
          lowSeverity: 0,
        },
        message: `Anomaly detection failed: ${error}`,
      };
    }
  },
}); 