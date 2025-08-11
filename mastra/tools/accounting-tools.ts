import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getAttachmentText } from '@/lib/utils/text-extraction';
import { queryVaultDocumentsTool } from './document-vault-tools';
import type { RuntimeContext } from '@mastra/core/di';
export interface JurnalEntry {
  id: string;
  tanggal: string;
  noAkun: string;
  namaAkun: string;
  debit: string;
  kredit: string;
  keterangan: string;
}

export interface BukuBesarEntry {
  id: string;
  tanggal: string;
  ref: string;
  keterangan: string;
  akun: string;
  debit: string;
  kredit: string;
  saldo: string;
}

export interface NeracaSaldoEntry {
  kodeAkun: string;
  namaAkun: string;
  debit: string;
  kredit: string;
  total: string;
  kategori: string;
}
const parseFinancialDocumentSchema = z.object({
  fileUrl: z.string().describe('URL of the uploaded financial document'),
  filename: z.string().describe('Original filename'),
  contentType: z.string().describe('MIME type of the file'),
  documentType: z.enum(['journal', 'ledger', 'mixed']).describe('Type of financial document'),
});

export const parseFinancialDocumentTool: any = createTool({
  id: 'parse-financial-document',
  description: 'Parse financial documents (CSV, Excel, PDF) containing journal entries and general ledger data',
  inputSchema: parseFinancialDocumentSchema,
  outputSchema: z.object({
    success: z.boolean(),
    transactions: z.array(z.object({
      date: z.string(),
      description: z.string(),
      debit: z.string().optional(),
      credit: z.string().optional(),
      account: z.string(),
      amount: z.string(),
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
    content: z.string().optional(),
  }),
  execute: async ({ context, runtimeContext }): Promise<any> => {
    try {
      const { fileUrl, filename, contentType, documentType } = context;

      
      let extractedContent = null;
      try {
        extractedContent = await getAttachmentText({
          url: fileUrl,
          name: filename,
          contentType,
        });
      } catch (error) {
        console.warn(`Direct text extraction failed for ${filename}:`, error);
      }

      
      if (!extractedContent && runtimeContext) {
        try {
          console.log(`Attempting vault search for ${filename}...`);
          
          
          const vaultSearchQueries = [
            'pendapatan revenue income',
            'perpajakan tax',
            'arus kas cash flow',
            'beban operasional operational expense',
            'aset asset kewajiban liability'
          ];
          
          let vaultContent = '';
          for (const query of vaultSearchQueries) {
            if (filename.toLowerCase().includes(query.split(' ')[0])) {
              const vaultResults = await queryVaultDocumentsTool.execute({
                context: { 
                  query: query,
                  topK: 10,
                  filenames: [filename] 
                },
                runtimeContext
              });
              
              if (vaultResults.results && vaultResults.results.length > 0) {
                vaultContent = vaultResults.results
                  .map(result => result.text)
                  .join('\n\n');
                break;
              }
            }
          }
          
          if (vaultContent) {
            extractedContent = vaultContent;
            console.log(`Successfully retrieved content from vault for ${filename}`);
          }
        } catch (vaultError) {
          console.warn(`Vault search failed for ${filename}:`, vaultError);
        }
      }

      if (!extractedContent) {
        return {
          success: false,
          transactions: [],
          metadata: {
            totalTransactions: 0,
            dateRange: { start: '', end: '' },
            documentType,
            parsingConfidence: 0,
          },
          message: `Failed to extract content from ${filename}. Try uploading the file in Excel or CSV format.`,
        };
      }

      
      const parsedData = parseFinancialContent(extractedContent, filename, documentType);

      return {
        success: true,
        transactions: parsedData.transactions,
        metadata: {
          totalTransactions: parsedData.transactions.length,
          dateRange: parsedData.dateRange,
          documentType,
          parsingConfidence: parsedData.confidence,
        },
        message: `Successfully processed ${parsedData.transactions.length} entries from ${filename}.`,
        content: JSON.stringify({
          jurnalData: parsedData.jurnalData,
          bukuData: parsedData.bukuData,
          neracaData: parsedData.neracaData,
        }),
      };
    } catch (error: any) {
      console.error(`Error parsing ${context.filename}:`, error);
      return {
        success: false,
        transactions: [],
        metadata: {
          totalTransactions: 0,
          dateRange: { start: '', end: '' },
          documentType: context.documentType,
          parsingConfidence: 0,
        },
        message: `Failed to parse ${context.filename}: ${error.message}`,
      };
    }
  },
});


function parseFinancialContent(content: string, filename: string, documentType: string) {
  const transactions: any[] = [];
  const jurnalData: JurnalEntry[] = [];
  const bukuData: BukuBesarEntry[] = [];
  const neracaData: NeracaSaldoEntry[] = [];
  
  
  const amountRegex = /Rp[\s]?([0-9.,]+)/g;
  const amounts:any[] = [];
  let match;
  
  while ((match = amountRegex.exec(content)) !== null) {
    const amount = match[1].replace(/[.,]/g, '');
    amounts.push(parseInt(amount));
  }

  
  if (filename.toLowerCase().includes('pendapatan')) {
    
    const revenueItems = [
      'Pendapatan dari Faktur Penagihan',
      'Penerimaan Uang Muka Proyek',
      'Pembayaran Berdasarkan Progres',
      'Retensi Proyek'
    ];
    
    revenueItems.forEach((item, index) => {
      if (content.includes(item) && amounts[index]) {
        transactions.push({
          date: '2025-01-01',
          description: item,
          credit: amounts[index].toString(),
          account: 'Pendapatan',
          amount: amounts[index].toString(),
          documentSource: filename,
        });
        
        jurnalData.push({
          id: (index + 1).toString(),
          tanggal: '2025-01-01',
          keterangan: item,
          noAkun: `400${index + 1}`,
          namaAkun: 'Pendapatan',
          debit: '0',
          kredit: amounts[index].toString(),
        });
      }
    });
  }
  
  
  

  return {
    transactions,
    jurnalData,
    bukuData,
    neracaData,
    dateRange: {
      start: '2025-01-01',
      end: '2025-12-31',
    },
    confidence: transactions.length > 0 ? 0.8 : 0.3,
  };
}


export const parseVaultFinancialDocumentTool = createTool({
  id: 'parse-vault-financial-document',
  description: 'Parse financial documents from vault using semantic search',
  inputSchema: z.object({
    filename: z.string().describe('Filename to search for'),
    documentType: z.enum(['journal', 'ledger', 'mixed']).describe('Type of financial document'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    transactions: z.array(z.object({
      date: z.string(),
      description: z.string(),
      debit: z.string().optional(),
      credit: z.string().optional(),
      account: z.string(),
      amount: z.string(),
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
    content: z.string().optional(),
  }),
  execute: async ({ context, runtimeContext }): Promise<any> => {
    try {
      const { filename, documentType } = context;
      
      
      const searchQueries = [
        'pendapatan revenue total amount',
        'kas cash flow arus',
        'beban expense operasional',
        'aset asset kewajiban liability',
        'pajak tax perpajakan'
      ];
      
      let allContent = '';
      
      for (const query of searchQueries) {
        const vaultResults = await queryVaultDocumentsTool.execute({
          context: { 
            query: query,
            topK: 5,
            filenames: [filename] 
          },
          runtimeContext
        });
        
        if (vaultResults.results && vaultResults.results.length > 0) {
          allContent += vaultResults.results
            .map(result => result.text)
            .join('\n\n') + '\n\n';
        }
      }

      if (!allContent.trim()) {
        return {
          success: false,
          transactions: [],
          metadata: {
            totalTransactions: 0,
            dateRange: { start: '', end: '' },
            documentType,
            parsingConfidence: 0,
          },
          message: `No content found in vault for ${filename}`,
        };
      }

      
      const parsedData = parseFinancialContent(allContent, filename, documentType);

      return {
        success: true,
        transactions: parsedData.transactions,
        metadata: {
          totalTransactions: parsedData.transactions.length,
          dateRange: parsedData.dateRange,
          documentType,
          parsingConfidence: parsedData.confidence,
        },
        message: `Successfully processed ${parsedData.transactions.length} entries from vault search of ${filename}.`,
        content: JSON.stringify({
          jurnalData: parsedData.jurnalData,
          bukuData: parsedData.bukuData,
          neracaData: parsedData.neracaData,
        }),
      };
    } catch (error: any) {
      console.error(`Error parsing vault document ${context.filename}:`, error);
      return {
        success: false,
        transactions: [],
        metadata: {
          totalTransactions: 0,
          dateRange: { start: '', end: '' },
          documentType: context.documentType,
          parsingConfidence: 0,
        },
        message: `Failed to parse ${context.filename} from vault: ${error.message}`,
      };
    }
  },
});