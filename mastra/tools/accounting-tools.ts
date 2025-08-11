import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getAttachmentText } from "@/lib/utils/text-extraction";
import { queryVaultDocumentsTool } from "./document-vault-tools";
import type { RuntimeContext } from "@mastra/core/di";
import type { MastraRuntimeContext } from "..";

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
  fileUrl: z.string().describe("URL of the uploaded financial document"),
  filename: z.string().describe("Original filename"),
  contentType: z.string().describe("MIME type of the file"),
  documentType: z
    .enum(["journal", "ledger", "mixed"])
    .describe("Type of financial document"),
});


import { generateText } from "ai";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";
import { BASE_MODEL } from "@/lib/constants";
import { openai } from "@ai-sdk/openai";

export async function classifyFinancialText(
  text: string,
  runtimeContext?: RuntimeContext<MastraRuntimeContext>
): Promise<number> {
  try {
    const { text: response } = await generateText({
      model: openai(BASE_MODEL),
      system: `You are a specialized Accounting Agent with comprehensive expertise in financial accounting, bookkeeping, and financial reporting. When classifying text, respond with a category number (1-4) and a description.
- Category 1: "Dokumen Dasar Akuntansi" (e.g., neraca saldo, jurnal umum, buku besar)
- Category 2: "Dokumen Penyesuaian Akuntansi" (e.g., perhitungan persediaan, penyusutan aset, jurnal penyesuaian, rekonsiliasi bank, neraca penyesuaian, neraca saldo setelah penyesuaian)
- Category 3: "Laporan Keuangan" (e.g., laporan laba rugi, laporan perubahan ekuitas, laporan posisi keuangan, laporan arus kas, catatan atas laporan keuangan)
- Category 4: "Konfirmasi Pengguna" (e.g., setuju, cocok, selesai, lanjutkan, konfirmasi)
- If the text does not fit any specific category, default to Category 1: "Dokumen Dasar Akuntansi (default)".`,
      prompt: `Classify the following text: ${text}`,
    });
    const categoryMatch = response.match(/Category (\d+):/);
    if (categoryMatch?.[1]) {
      return Number.parseInt(categoryMatch[1], 10);
    } else {
      console.warn("Could not parse category from agent response:", response);
      return 1; // Default to category 1 if parsing fails
    }
  } catch (error) {
    console.error("Error classifying financial text with agent:", error);
    return 1; // Default to category 1 in case of error
  }
}

export const parseFinancialDocumentTool: any = createTool({
  id: "parse-financial-document",
  description:
    "Parse financial documents (CSV, Excel, PDF) containing journal entries and general ledger data",
  inputSchema: parseFinancialDocumentSchema,
  outputSchema: z.object({
    success: z.boolean(),
    transactions: z.array(
      z.object({
        date: z.string(),
        description: z.string(),
        debit: z.string().optional(),
        credit: z.string().optional(),
        account: z.string(),
        amount: z.string(),
        documentSource: z.string(),
      })
    ),
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
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: any;
    runtimeContext: RuntimeContext<MastraRuntimeContext>;
  }): Promise<any> => {
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
            "pendapatan revenue income",
            "perpajakan tax",
            "arus kas cash flow",
            "beban operasional operational expense",
            "aset asset kewajiban liability",
          ];

          let vaultContent = "";
          for (const query of vaultSearchQueries) {
            if (filename.toLowerCase().includes(query.split(" ")[0])) {
              const vaultResults = await queryVaultDocumentsTool.execute({
                context: {
                  query: query,
                  topK: 10,
                  filenames: [filename],
                },
                runtimeContext,
              });

              if (vaultResults.results && vaultResults.results.length > 0) {
                vaultContent = vaultResults.results
                  .map((result) => result.text)
                  .join("\n\n");
                break;
              }
            }
          }

          if (vaultContent) {
            extractedContent = vaultContent;
            console.log(
              `Successfully retrieved content from vault for ${filename}`
            );
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
            dateRange: { start: "", end: "" },
            documentType,
            parsingConfidence: 0,
          },
          message: `Failed to extract content from ${filename}. Try uploading the file in Excel or CSV format.`,
        };
      }

      const parsedData = parseFinancialContent(
        extractedContent,
        filename,
        documentType
      );

      const result = {
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

      if (runtimeContext) {
        const mastraContext = runtimeContext.get("documentPreview");

        // Use the async classifyFinancialText function
        const step = documentType
          ? await classifyFinancialText(documentType, runtimeContext)
          : 1;

        if (mastraContext) {
          runtimeContext.set("documentPreview", {
            step,
            content: result.content,
            metadata: result.metadata,
            jurnalData: parsedData.jurnalData,
            bukuData: parsedData.bukuData,
            neracaData: parsedData.neracaData,
          });

          // Update the Zustand store
          const { setDocumentPreview } = useDocumentPreviewStore.getState();
          setDocumentPreview({
            step,
            content: result.content,
            metadata: result.metadata,
            jurnalData: parsedData.jurnalData,
            bukuData: parsedData.bukuData,
            neracaData: parsedData.neracaData,
          });
        }
      }

      return result;
    } catch (error: any) {
      console.error(`Error parsing ${context.filename}:`, error);
      return {
        success: false,
        transactions: [],
        metadata: {
          totalTransactions: 0,
          dateRange: { start: "", end: "" },
          documentType: context.documentType,
          parsingConfidence: 0,
        },
        message: `Failed to parse ${context.filename}: ${error.message}`,
      };
    }
  },
});

function parseFinancialContent(
  content: string,
  filename: string,
  documentType: string
) {
  const transactions: any[] = [];
  const jurnalData: JurnalEntry[] = [];
  const bukuData: BukuBesarEntry[] = [];
  const neracaData: NeracaSaldoEntry[] = [];

  const amountRegex = /Rp[\s]?([0-9.,]+)/g;
  const amounts: any[] = [];
  let match;

  while (true) {
    match = amountRegex.exec(content);
    if (match === null) break;
    const amount = match[1].replace(/[.,]/g, "");
    amounts.push(Number.parseInt(amount));
  }

  const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g;
  const dates: string[] = [];
  let dateMatch;

  while (true) {
    dateMatch = dateRegex.exec(content);
    if (dateMatch === null) break;
    dates.push(dateMatch[1]);
  }

  const defaultDate = dates.length > 0 ? dates[0] : "01-01-2025";

  if (
    filename.toLowerCase().includes("pendapatan") ||
    content.toLowerCase().includes("pendapatan")
  ) {
    const revenueItems = [
      "Pendapatan dari Faktur Penagihan",
      "Penerimaan Uang Muka Proyek",
      "Pembayaran Berdasarkan Progres",
      "Retensi Proyek",
    ];

    revenueItems.forEach((item, index) => {
      if (content.includes(item) && index < amounts.length) {
        const amount = amounts[index];
        transactions.push({
          date: defaultDate,
          description: item,
          credit: amount.toString(),
          account: "Pendapatan",
          amount: amount.toString(),
          documentSource: filename,
        });

        jurnalData.push({
          id: (index + 1).toString(),
          tanggal: defaultDate,
          keterangan: item,
          noAkun: `400${index + 1}`,
          namaAkun: "Pendapatan",
          debit: "0",
          kredit: amount.toString(),
        });

        bukuData.push({
          id: (index + 1).toString(),
          tanggal: defaultDate,
          ref: `REV${index + 1}`,
          keterangan: item,
          akun: "Pendapatan",
          debit: "0",
          kredit: amount.toString(),
          saldo: amount.toString(),
        });

        const existingNeracaEntry = neracaData.find(
          (entry) => entry.namaAkun === "Pendapatan"
        );
        if (existingNeracaEntry) {
          existingNeracaEntry.kredit = (
            Number.parseInt(existingNeracaEntry.kredit || "0") + amount
          ).toString();
        } else {
          neracaData.push({
            kodeAkun: `400${index + 1}`,
            namaAkun: "Pendapatan",
            debit: "0",
            kredit: amount.toString(),
            total: amount.toString(),
            kategori: "Pendapatan",
          });
        }
      }
    });
  }

  if (
    filename.toLowerCase().includes("beban") ||
    content.toLowerCase().includes("beban") ||
    content.toLowerCase().includes("biaya")
  ) {
    const expenseItems = [
      "Beban Gaji",
      "Beban Operasional",
      "Beban Sewa",
      "Beban Utilitas",
      "Beban Pemasaran",
    ];

    expenseItems.forEach((item, index) => {
      if (
        (content.includes(item) ||
          content.toLowerCase().includes(item.toLowerCase())) &&
        index < amounts.length
      ) {
        const amount = amounts[index];
        transactions.push({
          date: defaultDate,
          description: item,
          debit: amount.toString(),
          account: item,
          amount: amount.toString(),
          documentSource: filename,
        });

        jurnalData.push({
          id: (jurnalData.length + 1).toString(),
          tanggal: defaultDate,
          keterangan: item,
          noAkun: `500${index + 1}`,
          namaAkun: item,
          debit: amount.toString(),
          kredit: "0",
        });

        bukuData.push({
          id: (bukuData.length + 1).toString(),
          tanggal: defaultDate,
          ref: `EXP${index + 1}`,
          keterangan: item,
          akun: item,
          debit: amount.toString(),
          kredit: "0",
          saldo: amount.toString(),
        });

        neracaData.push({
          kodeAkun: `500${index + 1}`,
          namaAkun: item,
          debit: amount.toString(),
          kredit: "0",
          total: amount.toString(),
          kategori: "Beban",
        });
      }
    });
  }

  if (
    filename.toLowerCase().includes("aset") ||
    content.toLowerCase().includes("aset") ||
    content.toLowerCase().includes("asset")
  ) {
    const assetItems = ["Kas", "Bank", "Piutang", "Persediaan", "Peralatan"];

    assetItems.forEach((item, index) => {
      if (
        (content.includes(item) ||
          content.toLowerCase().includes(item.toLowerCase())) &&
        index < amounts.length
      ) {
        const amount = amounts[index];
        transactions.push({
          date: defaultDate,
          description: `Pencatatan ${item}`,
          debit: amount.toString(),
          account: item,
          amount: amount.toString(),
          documentSource: filename,
        });

        jurnalData.push({
          id: (jurnalData.length + 1).toString(),
          tanggal: defaultDate,
          keterangan: `Pencatatan ${item}`,
          noAkun: `100${index + 1}`,
          namaAkun: item,
          debit: amount.toString(),
          kredit: "0",
        });

        bukuData.push({
          id: (bukuData.length + 1).toString(),
          tanggal: defaultDate,
          ref: `AST${index + 1}`,
          keterangan: `Pencatatan ${item}`,
          akun: item,
          debit: amount.toString(),
          kredit: "0",
          saldo: amount.toString(),
        });

        neracaData.push({
          kodeAkun: `100${index + 1}`,
          namaAkun: item,
          debit: amount.toString(),
          kredit: "0",
          total: amount.toString(),
          kategori: "Aset",
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
      start: "2025-01-01",
      end: "2025-12-31",
    },
    confidence: transactions.length > 0 ? 0.8 : 0.3,
  };
}

export const parseVaultFinancialDocumentTool = createTool({
  id: "parse-vault-financial-document",
  description: "Parse financial documents from vault using semantic search",
  inputSchema: z.object({
    filename: z.string().describe("Filename to search for"),
    documentType: z
      .enum(["journal", "ledger", "mixed"])
      .describe("Type of financial document"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    transactions: z.array(
      z.object({
        date: z.string(),
        description: z.string(),
        debit: z.string().optional(),
        credit: z.string().optional(),
        account: z.string(),
        amount: z.string(),
        documentSource: z.string(),
      })
    ),
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
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: any;
    runtimeContext: RuntimeContext<MastraRuntimeContext>;
  }): Promise<any> => {
    try {
      const { filename, documentType } = context;

      const searchQueries = [
        "pendapatan revenue total amount",
        "kas cash flow arus",
        "beban expense operasional",
        "aset asset kewajiban liability",
        "pajak tax perpajakan",
      ];

      let allContent = "";

      for (const query of searchQueries) {
        const vaultResults = await queryVaultDocumentsTool.execute({
          context: {
            query: query,
            topK: 5,
            filenames: [filename],
          },
          runtimeContext,
        });

        if (vaultResults.results && vaultResults.results.length > 0) {
          allContent += `${vaultResults.results.map((result) => result.text).join("\n\n")}\n\n`;
        }
      }

      if (!allContent.trim()) {
        return {
          success: false,
          transactions: [],
          metadata: {
            totalTransactions: 0,
            dateRange: { start: "", end: "" },
            documentType,
            parsingConfidence: 0,
          },
          message: `No content found in vault for ${filename}`,
        };
      }

      const parsedData = parseFinancialContent(
        allContent,
        filename,
        documentType
      );

      const result = {
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

      if (runtimeContext) {
        const mastraContext = runtimeContext.get("documentPreview");

        // Use the async classifyFinancialText function
        const step = documentType
          ? await classifyFinancialText(documentType, runtimeContext)
          : 1;

        if (mastraContext) {
          runtimeContext.set("documentPreview", {
            step,
            content: result.content,
            metadata: result.metadata,
            jurnalData: parsedData.jurnalData,
            bukuData: parsedData.bukuData,
            neracaData: parsedData.neracaData,
          });
        }
      }

      return result;
    } catch (error: any) {
      console.error(`Error parsing vault document ${context.filename}:`, error);
      return {
        success: false,
        transactions: [],
        metadata: {
          totalTransactions: 0,
          dateRange: { start: "", end: "" },
          documentType: context.documentType,
          parsingConfidence: 0,
        },
        message: `Failed to parse ${context.filename} from vault: ${error.message}`,
      };
    }
  },
});
