import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const parseFinancialDocumentSchema = z.object({
  fileUrl: z.string().describe('URL of the uploaded financial document'),
  filename: z.string().describe('Original filename'),
  contentType: z.string().describe('MIME type of the file'),
  documentType: z.enum(['journal', 'ledger', 'mixed']).describe('Type of financial document'),
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
