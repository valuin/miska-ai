import { Agent } from '@mastra/core/agent';
import { BASE_MODEL } from '@/lib/constants';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Tool schemas for tax agent
const validateNPWPSchema = z.object({
  npwp: z.string().describe('NPWP number to validate'),
  companyName: z.string().describe('Company name for validation'),
});

const analyzePPNTransactionSchema = z.object({
  transactionData: z.string().describe('Transaction data in JSON or CSV format'),
  period: z.string().describe('Tax period (e.g., "Jan 2025")'),
});

const generateSPTSchema = z.object({
  companyData: z.object({
    name: z.string(),
    npwp: z.string(),
    address: z.string(),
  }),
  transactionSummary: z.object({
    totalRevenue: z.number(),
    totalPPN: z.number(),
    totalCredits: z.number(),
    period: z.string(),
  }),
});

const generateTaxInvoiceSchema = z.object({
  invoiceNumber: z.string(),
  customerData: z.object({
    name: z.string(),
    npwp: z.string(),
    address: z.string(),
  }),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
  })),
  ppnRate: z.number().default(11),
});

export const taxAgent = new Agent({
  name: 'Tax Agent',
  instructions: `
You are a specialized Tax Agent with comprehensive expertise in tax law, compliance, and planning, now enhanced with powerful tool calling capabilities.

**YOU MUST USE planTodosTool**

Your core competencies include:
- Individual and corporate tax preparation
- Tax planning and optimization strategies
- Tax law interpretation and application
- Tax compliance and filing requirements
- Deduction and credit identification
- Tax audit support and representation
- International tax considerations
- Estate and gift tax planning
- Sales and use tax compliance
- Tax research and analysis

**NEW TOOL CAPABILITIES:**
1. **NPWP Validation**: Validate NPWP numbers and company information
2. **PPN Transaction Analysis**: Analyze transaction data for PPN calculations
3. **SPT Generation**: Generate complete SPT PPN reports
4. **Tax Invoice Generation**: Create compliant tax invoices
5. **Bukti Potong Generation**: Generate withholding tax certificates

**WORKFLOW FOR TAX TASKS:**
1. **Data Collection**: Extract transaction data and NPWP information
2. **Validation**: Validate NPWP and company details
3. **Analysis**: Analyze PPN transactions and categorize properly
4. **Generation**: Generate SPT, invoices, and supporting documents
5. **Review**: Ensure compliance with current tax regulations

When responding to user queries:
- Use appropriate tools for NPWP validation, PPN analysis, and document generation
- Provide accurate tax advice based on current regulations
- Help with tax form preparation and filing
- Suggest tax-saving strategies and opportunities
- Explain complex tax concepts in clear terms
- Assist with tax software and tools
- Guide users through tax compliance requirements
- Offer guidance on tax documentation and record-keeping

Always emphasize the importance of consulting with qualified tax professionals for complex situations and ensure compliance with current tax laws.
  `,
  model: openai(BASE_MODEL),
  tools: {
    validateNPWP: {
      description: 'Validate NPWP number and company information',
      parameters: validateNPWPSchema,
      execute: async ({ npwp, companyName }: { npwp: string; companyName: string }) => {
        // Simulate NPWP validation
        const isValid = npwp.length === 15 && /^\d{2}\.\d{3}\.\d{3}\.\d{1}-\d{3}\.\d{3}$/.test(npwp);
        return {
          isValid,
          npwp,
          companyName,
          validationDate: new Date().toISOString(),
          message: isValid ? 'NPWP valid' : 'NPWP format tidak valid',
        };
      },
    },
    analyzePPNTransaction: {
      description: 'Analyze transaction data for PPN calculations',
      parameters: analyzePPNTransactionSchema,
      execute: async ({ transactionData, period }: { transactionData: string; period: string }) => {
        // Simulate PPN analysis
        return {
          period,
          totalRevenue: 10000000,
          totalPPN: 1100000,
          totalCredits: 500000,
          netPPN: 600000,
          analysis: 'Analisis PPN selesai',
        };
      },
    },
    generateSPT: {
      description: 'Generate SPT PPN report',
      parameters: generateSPTSchema,
      execute: async ({ companyData, transactionSummary }: { 
        companyData: { name: string; npwp: string; address: string }; 
        transactionSummary: { totalRevenue: number; totalPPN: number; totalCredits: number; period: string } 
      }) => {
        // Simulate SPT generation
        return {
          sptNumber: `SPT-${Date.now()}`,
          companyData,
          transactionSummary,
          generatedDate: new Date().toISOString(),
          status: 'completed',
          downloadUrl: '/api/tax/spt/download',
        };
      },
    },
    generateTaxInvoice: {
      description: 'Generate compliant tax invoice',
      parameters: generateTaxInvoiceSchema,
      execute: async ({ invoiceNumber, customerData, items, ppnRate }: { 
        invoiceNumber: string; 
        customerData: { name: string; npwp: string; address: string }; 
        items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>; 
        ppnRate: number 
      }) => {
        // Simulate invoice generation
        const subtotal = items.reduce((sum: number, item: { total: number }) => sum + item.total, 0);
        const ppn = subtotal * (ppnRate / 100);
        const total = subtotal + ppn;
        
        return {
          invoiceNumber,
          customerData,
          items,
          subtotal,
          ppn,
          total,
          generatedDate: new Date().toISOString(),
          downloadUrl: '/api/tax/invoice/download',
        };
      },
    },
  },
}); 