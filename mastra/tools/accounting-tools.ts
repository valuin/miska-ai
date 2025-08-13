// accounting-tools.ts - Updated version
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { queryVaultDocumentsTool } from "./document-vault-tools";
import type { RuntimeContext } from "@mastra/core/di";
import type { MastraRuntimeContext } from "..";
import { generateObject } from "ai";
import { BASE_MODEL } from "@/lib/constants";
import { openai } from "@ai-sdk/openai";
import {
  createFinancialWorkbook,
  createFinancialStepData,
  updateFinancialStepData,
  deleteFinancialStepData,
} from "@/lib/db/queries/financial";
import type {
  JurnalUmumEntry,
  BukuBesarEntry,
  NeracaSaldoEntry,
  PerhitunganPersediaanEntry,
  PenyusutanAsetEntry,
  JurnalPenyesuaianEntry,
  RekonsiliasiBank,
  LabaRugiData,
  PosisiKeuanganData,
  PerubahanEkuitasData,
  ArusKasData,
  FinalResultData,
} from "@/lib/db/schema/ai/financial.schema";
import { auth } from "@/app/(auth)/auth";

export async function classifyFinancialText(
  text: string,
  runtimeContext?: RuntimeContext<MastraRuntimeContext>
): Promise<number> {
  console.log("Classifying text:", text);
  try {
    const { object: response } = await generateObject({
      model: openai(BASE_MODEL),
      schema: z.object({
        category: z.number().describe("The category number (1-8)"),
      }),
      prompt: `You are a specialized Accounting Agent. Classify the following text and return a category number (1-8).
- Category 1: "Dokumen Dasar Akuntansi" (e.g., neraca saldo, jurnal umum, buku besar)
- Category 2: "Dokumen Penyesuaian Akuntansi" (e.g., perhitungan persediaan, penyusutan aset, jurnal penyesuaian, rekonsiliasi bank, neraca penyesuaian, neraca saldo setelah penyesuaian)
- Category 3: "Laporan Laba Rugi" (e.g., laporan laba rugi, income statement)
- Category 4: "Laporan Posisi Keuangan" (e.g., neraca, balance sheet, laporan posisi keuangan)
- Category 5: "Laporan Perubahan Ekuitas" (e.g., laporan perubahan ekuitas, statement of changes in equity)
- Category 6: "Laporan Arus Kas" (e.g., laporan arus kas, cash flow statement)
- Category 7: "Dashboard Finalisasi" (e.g., ringkasan keuangan, dashboard finalisasi, financial summary, final result)
- Category 8: "Konfirmasi Pengguna" (e.g., setuju, cocok, selesai, lanjutkan, konfirmasi)
- If the text does not fit any specific category, default to Category 1.

Text to classify: "${text}"`,
    });
    console.log("LLM Response for classification:", response);
    const category = response.category;
    console.log("Parsed category:", category);
    return category;
  } catch (error) {
    console.error("Error classifying financial text with agent:", error);
    return 1; // Default to category 1 in case of error
  }
}

// Exported for reuse in other functions
export function parseIndonesianAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleanAmount = String(amountStr)
    .replace(/Rp\.?\s*/g, "")
    .replace(/\./g, "")
    .replace(/,/g, "."); // Handle comma as decimal separator
  const parsed = parseFloat(cleanAmount);
  return isNaN(parsed) ? 0 : parsed;
}

async function parseFinancialContent(
  content: string,
  filename: string,
  documentType: string
): Promise<{
  transactions: any[];
  jurnalData: JurnalUmumEntry[];
  bukuData: BukuBesarEntry[];
  neracaData: NeracaSaldoEntry[];
  perhitunganPersediaanData: PerhitunganPersediaanEntry[];
  penyusutanAsetData: PenyusutanAsetEntry[];
  jurnalPenyesuaianData: JurnalPenyesuaianEntry[];
  rekonsiliasiBankData: RekonsiliasiBank[];
  labaRugiData: LabaRugiData[];
  posisiKeuanganData: PosisiKeuanganData[];
  perubahanEkuitasData: PerubahanEkuitasData[];
  arusKasData: ArusKasData[];
  finalResultData: FinalResultData[];
  dateRange: { start: string; end: string };
  confidence: number;
}> {
  console.log(
    `[DEBUG] Mengekstrak data keuangan dari dokumen: ${filename}, tipe: ${documentType}`
  );
  let extractedData;
  try {
    const isBukuBesar = documentType.includes("buku_besar");

    const jurnalUmumSchema = z.object({
      jurnalEntries: z
        .array(
          z.object({
            id: z
              .string()
              .describe(
                "Unique sequential ID for the transaction block (e.g., 'TRANS-001')."
              ),
            tanggal: z
              .string()
              .describe("Transaction date in YYYY-MM-DD format."),
            keterangan: z
              .string()
              .describe("Detailed description of the transaction event."),
            sumberDokumen: z
              .string()
              .describe("The source document file name."),
            entri: z
              .array(
                z.object({
                  akun: z
                    .string()
                    .describe("Account name from the Chart of Accounts."),
                  debit: z
                    .string()
                    .describe(
                      "Debit amount as a string (e.g., '1500000'). Use '0' if not applicable."
                    ),
                  kredit: z
                    .string()
                    .describe(
                      "Credit amount as a string (e.g., '1500000'). Use '0' if not applicable."
                    ),
                })
              )
              .describe(
                "An array of debit/credit entries for this transaction. Total debits must equal total credits."
              ),
          })
        )
        .optional(),
      dateRange: z.object({
        start: z.string().describe("Start date in YYYY-MM-DD format"),
        end: z.string().describe("End date in YYYY-MM-DD format"),
      }),
      confidence: z.number().describe("Confidence score from 0.0 to 1.0"),
    });

    const bukuBesarSchema = z.object({
      bukuBesarAccounts: z
        .array(
          z.object({
            namaAkun: z.string().describe("The name of the account."),
            kodeAkun: z.string().describe("The account code."),
            entri: z.array(
              z.object({
                id: z.string().describe("Transaction ID."),
                tanggal: z
                  .string()
                  .describe("Transaction date in YYYY-MM-DD format."),
                keterangan: z
                  .string()
                  .describe("Description of the transaction."),
                debit: z
                  .string()
                  .describe("Debit amount as a string. Use '0' if none."),
                kredit: z
                  .string()
                  .describe("Credit amount as a string. Use '0' if none."),
                saldo: z
                  .string()
                  .describe("The running balance after the transaction."),
              })
            ),
            totalSaldoAkhir: z
              .string()
              .describe("The final balance for the account."),
          })
        )
        .optional(),
      dateRange: z.object({
        start: z.string().describe("Start date in YYYY-MM-DD format"),
        end: z.string().describe("End date in YYYY-MM-DD format"),
      }),
      confidence: z.number().describe("Confidence score from 0.0 to 1.0"),
    });

    const neracaSaldoSchema = z.object({
      neracaSaldo: z.object({
        title: z.string(),
        companyName: z.string(),
        period: z.string(),
        accounts: z.array(
          z.object({
            kodeAkun: z.string(),
            namaAkun: z.string(),
            debit: z.string(),
            kredit: z.string(),
            kelompok: z.string(),
          })
        ),
        total: z.object({
          debit: z.string(),
          kredit: z.string(),
        }),
      }),
      dateRange: z.object({
        start: z.string().describe("Start date in YYYY-MM-DD format"),
        end: z.string().describe("End date in YYYY-MM-DD format"),
      }),
      confidence: z.number().describe("Confidence score from 0.0 to 1.0"),
    });

    const perhitunganPersediaanSchema = z.object({
      perhitunganPersediaan: z.object({
        summary: z.object({
          nilaiPersediaanAwal: z.string(),
          totalPembelian: z.string(),
          hpp: z.string(),
          nilaiPersediaanAkhir: z.string(),
        }),
        kartuPersediaan: z.array(
          z.object({
            tanggal: z.string(),
            keterangan: z.string(),
            masukUnit: z.string().optional(),
            masukHarga: z.string().optional(),
            masukTotal: z.string().optional(),
            keluarUnit: z.string().optional(),
            keluarHarga: z.string().optional(),
            keluarTotal: z.string().optional(),
            saldoUnit: z.string(),
            saldoHarga: z.string(),
            saldoTotal: z.string(),
          })
        ),
        jurnalPenyesuaian: z.array(z.object({
          debit: z.string(),
          kredit: z.string(),
        })),
      }),
       dateRange: z.object({
        start: z.string().describe("Start date in YYYY-MM-DD format"),
        end: z.string().describe("End date in YYYY-MM-DD format"),
      }),
      confidence: z.number().describe("Confidence score from 0.0 to 1.0"),
    });
    const KpiSchema = z.object({
      total: z.string().describe("Nilai total untuk periode laporan."),
      perubahanPersentase: z.string().describe("Persentase kenaikan atau penurunan dibandingkan periode sebelumnya. Sertakan '+' atau '-'. Contoh: '+15.5%' atau '-2.1%'."),
      status: z.enum(["naik", "turun", "stabil", "data tidak tersedia"]).describe("Status perubahan."),
    });
    
    const RasioSchema = z.object({
      nama: z.string().describe("Nama rasio, contoh: 'Current Ratio'."),
      nilai: z.string().describe("Nilai hasil perhitungan rasio."),
      targetMaks: z.string().describe("Nilai target maksimal untuk perbandingan."),
      interpretasi: z.string().describe("Analisis singkat kondisi rasio, contoh: 'Sehat', 'Perlu Perhatian', 'Berisiko Tinggi'."),
    });
    
    const DashboardAnalisisKeuanganSchema = z.object({
      dashboard: z.object({
        companyName: z.string().describe("Nama perusahaan."),
        period: z.string().describe("Periode laporan."),
    
        kpiUtama: z.object({
          totalPendapatan: KpiSchema,
          labaBersih: KpiSchema,
          totalAset: KpiSchema,
        }),
    
        perbandinganBulanan: z.array(z.object({
          bulan: z.string().describe("Nama bulan, contoh: 'Januari', 'Februari'."),
          totalPendapatan: z.number().describe("Total pendapatan untuk bulan tersebut."),
          labaBersih: z.number().describe("Laba bersih untuk bulan tersebut."),
        })).describe("Data untuk grafik perbandingan bulanan."),
    
        rasioKeuangan: z.object({
          currentRatio: RasioSchema,
          debtToEquityRatio: RasioSchema,
          returnOnEquity: RasioSchema,
        }),
    
        analisisKualitatif: z.object({
          ringkasanAnalisis: z.string().describe("Narasi ringkasan kinerja keuangan."),
          poinUntukDiperhatikan: z.array(z.string()).describe("Poin-poin kunci atau area risiko."),
          rekomendasiAksi: z.array(z.string()).describe("Saran konkret yang dapat ditindaklanjuti."),
        }),
      }),
      dateRange: z.object({
        start: z.string().describe("Tanggal mulai periode dalam format YYYY-MM-DD."),
        end: z.string().describe("Tanggal akhir periode dalam format YYYY-MM-DD."),
      }),
      confidence: z.number().describe("Skor kepercayaan parsing dari 0.0 hingga 1.0."),
    });

    const { object } = await generateObject({
      model: openai(BASE_MODEL),
      schema: (() : z.ZodSchema<any> => {
        if (isBukuBesar) return bukuBesarSchema;
        if (documentType.includes("neraca_saldo")) return neracaSaldoSchema;
        if (documentType.includes("perhitungan_persediaan")) return perhitunganPersediaanSchema;
        if (documentType.includes("laba_rugi") || documentType.includes("final_result")) return DashboardAnalisisKeuanganSchema;
        return jurnalUmumSchema;
      })(),
      prompt: (() => {
        if (isBukuBesar) {
          return `You are a Senior Accountant AI. Your task is to create a detailed General Ledger (Buku Besar) from the provided text documents.

        **Chart of Accounts (CoA) & Saldo Normal - YOU MUST USE THESE ACCOUNTS AND RULES:**
        *   **Aset (Debit Normal):** Kas dan Bank, Piutang Usaha, PPN Masukan, Aset Tetap - [Nama]
        *   **Beban (Debit Normal):** Beban Bahan Bangunan, Beban Subkontraktor, Beban Gaji dan Upah, Beban Jasa, Beban Penyusutan, Beban Bunga
        *   **Kewajiban (Kredit Normal):** Utang Usaha, Utang PPN Keluaran, Utang PPh 21, Utang PPh 23, Utang Bank, Utang Leasing, Akumulasi Penyusutan - [Nama]
        *   **Ekuitas (Kredit Normal):** Modal Disetor
        *   **Pendapatan (Kredit Normal):** Pendapatan Jasa Konstruksi, Pendapatan Diterima di Muka

        **Instructions:**
        1.  **Source Data:** Use the provided General Journal text as the single source for posting transactions.
        2.  **Ledger Creation:** Create a separate ledger for each account that appears in the General Journal.
        3.  **Running Balance Calculation:** For each transaction, you must calculate the running balance based on the account's normal balance.
            *   **Debit Normal Balance Formula:** New Balance = Previous Balance + Debit - Credit
            *   **Credit Normal Balance Formula:** New Balance = Previous Balance - Debit + Credit
        4.  **Starting Balance:** Assume all accounts start with a Rp 0 balance unless a starting balance is explicitly provided.
        5.  **Format Output:** Structure the output strictly according to the Zod schema. Each account's ledger must be a separate object in the 'bukuBesarAccounts' array. Ensure all fields (namaAkun, kodeAkun, entri, totalSaldoAkhir) are populated correctly.

        **Text to parse from document "${filename}":**
        ---
        ${content}
        ---
        `;
        }
        if (documentType.includes("neraca_saldo")) {
          return `You are a Senior Accountant AI. Your task is to create a Trial Balance (Neraca Saldo) from the provided text.

        **Chart of Accounts (CoA) & Saldo Normal - YOU MUST USE THESE ACCOUNTS AND RULES:**
        *   **Aset (Debit Normal):** Kas dan Bank, Piutang Usaha, PPN Masukan, Aset Tetap - [Nama]
        *   **Beban (Debit Normal):** Beban Bahan Bangunan, Beban Subkontraktor, Beban Gaji dan Upah, Beban Jasa, Beban Penyusutan, Beban Bunga
        *   **Kewajiban (Kredit Normal):** Utang Usaha, Utang PPN Keluaran, Utang PPh 21, Utang PPh 23, Utang Bank, Utang Leasing, Akumulasi Penyusutan - [Nama]
        *   **Ekuitas (Kredit Normal):** Modal Disetor
        *   **Pendapatan (Kredit Normal):** Pendapatan Jasa Konstruksi, Pendapatan Diterima di Muka

        **Instructions:**
        1.  **Source Data:** Use the final balances from the General Ledger as the primary source. If not available, extract balances from the provided text.
        2.  **Normal Balance Rule:** Place the final balance of each account in the appropriate Debit or Credit column based on its normal balance (Aset/Beban in Debit, Kewajiban/Ekuitas/Pendapatan in Credit).
        3.  **Grouping:** Group the accounts by their classification (Aset Lancar, Aset Tetap, Kewajiban, etc.) as shown in the format below.
        4.  **Validation:** Calculate the total for both the Debit and Credit columns. The two totals MUST be equal.
        5.  **Format Output:** Structure the output strictly according to the Zod schema. The final report must be a single, balanced Trial Balance.

**Text to parse from document "${filename}":**
---
${content}
---
`;
        }
       if (documentType.includes("perhitungan_persediaan")) {
  return `You are a Senior Accountant AI specializing in inventory management and cost accounting. Your task is to create a comprehensive Inventory Calculation Report by synthesizing data from ALL available financial documents in the vault.

**Task:** Generate a detailed inventory report for the specified period, calculating Cost of Goods Sold (COGS) and Ending Inventory Value. You must structure the output strictly according to the Zod schema.

**Methodology & Data Sourcing Instructions (MUST BE FOLLOWED):**
Instead of looking at a single file, you must analyze the entire collection of provided documents to find the necessary data points. Follow these steps:

1.  **Determine Beginning Inventory:**
    * **Action:** First, search all documents for terms like 'Saldo Awal Persediaan', 'Beginning Inventory', or a balance sheet from the end of the previous period.
    * **Assumption:** If no explicit starting balance is found after analyzing all documents, apply a standard accounting assumption: the beginning inventory is zero. State this assumption in your reasoning.

2.  **Identify and Aggregate Purchases:**
    * **Action:** Search for documents detailing operational costs or expenses (e.g., 'data_beban_operasional_2025.pdf'). Look for tables or sections specifically labeled 'Pembelian Bahan Bangunan', 'Material Purchases', or similar.
    * **Process:** Extract every line item from this section, noting the date, description, quantity, and total value. These will form the 'Masuk (In)' transactions for your inventory card.

3.  **Determine Cost of Goods Sold (COGS / HPP):**
    * **Action:** For a construction business model, we assume materials purchased are directly consumed by projects. Therefore, for every 'Masuk' transaction you record, create a corresponding 'Keluar (Out)' transaction for the same amount.
    * **Process:** The total of these 'Keluar' transactions will be your HPP. The valuation method to state is **FIFO**, as you are expensing the items in the order they were purchased.

4.  **Calculate Final Values & Create Inventory Card:**
    * **Ending Inventory:** Calculate using the formula: Beginning Inventory + Total Purchases - HPP. (Based on our assumption, this will be zero).
    * **Inventory Card:** Create a chronological card showing:
        * The beginning balance.
        * Each purchase transaction as a 'Masuk' entry, updating the balance.
        * Each corresponding usage transaction as a 'Keluar' entry, updating the balance.
    * **Final Adjustment Journal:** Create the journal entry to move the cost from the inventory asset to the HPP expense account.

5.  **Format Output:**
    * Structure the final JSON output strictly according to the Zod schema, populating the 'summary', 'kartuPersediaan', and 'jurnalPenyesuaian' sections based on your analysis.

**Text to parse from ALL relevant documents in the vault:**
---
${content}  // This variable should contain the aggregated text from all relevant source files.
---
`;
}
        if (documentType.includes("laba_rugi") || documentType.includes("final_result")) {
          return `Anda adalah seorang Analis Keuangan Strategis AI. Tugas Anda adalah menganalisis secara holistik kumpulan dokumen keuangan yang disediakan untuk menyusun Dashboard Analisis Keuangan yang komprehensif, mencakup KPI, rasio keuangan, perbandingan bulanan, dan analisis kualitatif.

Tugas Utama: Hasilkan output JSON yang lengkap sesuai skema DashboardAnalisisKeuanganSchema dengan melakukan analisis mendalam terhadap semua file yang diunggah pengguna untuk [Periode Laporan] dan membandingkannya dengan [Periode Pembanding] jika data tersedia.

Parameter Kunci (Dinamis):

[Periode Laporan]: Periode utama yang sedang dianalisis (Contoh: Tahun 2025).
[Periode Pembanding]: Periode sebelumnya untuk perbandingan (Contoh: Tahun 2024).

Langkah-langkah Analisis dan Kalkulasi (Wajib Diikuti):

Bagian A: Perhitungan Key Performance Indicators (KPI) Utama

1. Total Pendapatan:
   - Sumber Data: Dokumen yang berisi ringkasan pendapatan atau faktur (data_pendapatan_2025.pdf).
   - Cara Mendapatkan Nilai [Periode Laporan]: Ambil total pendapatan kotor dari aktivitas utama bisnis.
   - Cara Mendapatkan Nilai [Periode Pembanding]: Cari dokumen serupa untuk periode sebelumnya. Jika tidak ada, catat sebagai "Data Tidak Tersedia".
   - Rumus Persentase Perubahan: ((Nilai Sekarang - Nilai Lalu) / Nilai Lalu) * 100.

2. Laba Bersih:
   - Sumber Data: Hasil perhitungan Laporan Laba Rugi.
   - Cara Mendapatkan Nilai [Periode Laporan]: Lakukan perhitungan Laba Rugi lengkap untuk mendapatkan nilai final Laba Bersih.
   - Cara Mendapatkan Nilai [Periode Pembanding]: Lakukan perhitungan yang sama untuk data periode sebelumnya. Jika tidak ada, catat sebagai "Data Tidak Tersedia".
   - Rumus Persentase Perubahan: Sama seperti di atas.

3. Total Aset:
   - Sumber Data: Dokumen yang berisi daftar aset (data_aset_kewajiban_2025.pdf).
   - Cara Mendapatkan Nilai [Periode Laporan]: Jumlahkan semua Aset (Aset Tetap setelah dikurangi Akumulasi Penyusutan, ditambah Aset Lancar seperti Kas dan Piutang).
   - Cara Mendapatkan Nilai [Periode Pembanding]: Cari data neraca atau aset dari periode sebelumnya. Jika tidak ada, catat sebagai "Data Tidak Tersedia".
   - Rumus Persentase Perubahan: Sama seperti di atas.

Bagian B: Perhitungan Rasio Keuangan

1. Current Ratio:
   - Rumus: Total Aset Lancar / Total Kewajiban Lancar.
   - Cara Mendapatkan Aset Lancar: Jumlahkan Kas (dari data_arus_kas_2025.pdf), Piutang Usaha, dan Piutang Retensi (dari data_pendapatan_2025.pdf).
   - Cara Mendapatkan Kewajiban Lancar: Jumlahkan bagian utang jangka pendek dari pinjaman (dari data_aset_kewajiban_2025.pdf) dan semua utang pajak (dari data_perpajakan_2025.pdf).
   - Interpretasi: Bandingkan hasilnya dengan target (maks 3).

2. Debt to Equity Ratio:
   - Rumus: Total Kewajiban / Total Ekuitas.
   - Cara Mendapatkan Total Kewajiban: Jumlahkan semua pinjaman dan utang dari data_aset_kewajiban_2025.pdf.
   - Cara Mendapatkan Total Ekuitas: Hitung dengan rumus Total Aset - Total Kewajiban.
   - Interpretasi: Bandingkan hasilnya dengan target (maks 1).

3. Return on Equity (ROE):
   - Rumus: (Laba Bersih / Total Ekuitas) * 100.
   - Cara Mendapatkan Laba Bersih & Total Ekuitas: Gunakan nilai yang sudah dihitung di langkah-langkah sebelumnya.
   - Interpretasi: Bandingkan hasilnya dengan target (maks 100%).

Bagian C: Data Grafik Perbandingan Bulanan

- Sumber Data: Dokumen yang berisi transaksi dengan tanggal spesifik (data_pendapatan_2025.pdf, data_beban_operasional_2025.pdf, data_arus_kas_2025.pdf).
- Aksi: Lakukan agregasi data per bulan (Januari hingga Desember):
  - Untuk setiap bulan, hitung Total Pendapatan dari faktur atau termin yang jatuh tempo di bulan tersebut.
  - Untuk setiap bulan, hitung Total Beban yang relevan (HPP dan Operasional) yang terjadi di bulan tersebut.
  - Hitung Laba Bersih Bulanan (Pendapatan Bulanan - Beban Bulanan).
  - Susun hasilnya menjadi array data bulanan.

Bagian D: Analisis Kualitatif

1. Ringkasan Analisis: Tulis narasi singkat yang merangkum kinerja keuangan berdasarkan KPI dan rasio. Contoh: "Perusahaan menunjukkan pertumbuhan pendapatan yang kuat, namun profitabilitas tertekan oleh tingginya HPP. Tingkat utang masih dalam batas wajar."
2. Poin untuk Diperhatikan: Identifikasi area risiko atau masalah potensial berdasarkan analisis. Contoh: "Rasio lancar (Current Ratio) berada di bawah ambang batas sehat, mengindikasikan potensi kesulitan likuiditas." atau "ROE lebih rendah dari ekspektasi industri, menunjukkan efisiensi modal perlu ditingkatkan."
3. Rekomendasi Aksi: Berikan saran konkret yang dapat ditindaklanjuti berdasarkan poin-poin di atas. Contoh: "Rekomendasi: Lakukan negosiasi ulang dengan supplier untuk menekan HPP." atau "Fokus pada penagihan piutang untuk meningkatkan kas dan memperbaiki Current Ratio."

Output Akhir:
Hasilkan sebuah objek JSON tunggal yang valid dan lengkap sesuai dengan skema DashboardAnalisisKeuanganSchema.

**Text to parse from document "${filename}":**
---
${content}
---
`;
        }
        return `You are a Senior Accountant AI. Your task is to create a comprehensive General Journal from the provided text documents.

**Chart of Accounts (CoA) - YOU MUST USE THESE ACCOUNTS:**
*   **Aset Lancar:** Kas dan Bank, Piutang Usaha, Pendapatan Diterima di Muka, PPN Masukan
        *   **Aset Tetap:** Aset Tetap - [Nama Aset] (e.g., Aset Tetap - Excavator)
        *   **Akumulasi Penyusutan:** Akumulasi Penyusutan - [Nama Aset]
        *   **Kewajiban Lancar:** Utang Usaha, Utang PPN Keluaran, Utang PPh 21, Utang PPh 23, Utang Bank
        *   **Kewajiban Jangka Panjang:** Utang Leasing
        *   **Ekuitas:** Modal Disetor
        *   **Pendapatan:** Pendapatan Jasa Konstruksi
        *   **Beban Pokok:** Beban Bahan Bangunan, Beban Subkontraktor
        *   **Beban Operasional:** Beban Gaji dan Upah, Beban Jasa, Beban Penyusutan
        *   **Beban Lain-lain:** Beban Bunga

        **Instructions:**
        1.  **Analyze Chronologically:** Process all transactions from the text in strict date order.
        2.  **Apply Double-Entry Principle:** For each transaction, create a balanced journal entry where Total Debits equal Total Credits.
        3.  **Use Exact CoA:** Use the account names exactly as provided in the Chart of Accounts.
        4.  **Follow Journaling Rules:**
            *   **Revenue Invoice:** Debit Piutang Usaha, Credit Pendapatan Jasa Konstruksi, Credit Utang PPN Keluaran.
            *   **Cash Advance Received:** Debit Kas dan Bank, Credit Pendapatan Diterima di Muka.
            *   **Payment Received:** Debit Kas dan Bank, Credit Piutang Usaha.
            *   **Salary Payment:** Debit Beban Gaji dan Upah, Credit Utang PPh 21, Credit Kas dan Bank.
            *   **Subcontractor/Vendor Payment:** Debit Beban Subkontraktor/Beban Jasa, Credit Utang PPh 23, Credit Kas dan Bank.
            *   **Material Purchase:** Debit Beban Bahan Bangunan, Debit PPN Masukan, Credit Kas dan Bank/Utang Usaha.
            *   **Asset Purchase (Cash):** Debit Aset Tetap - [Nama Aset], Credit Kas dan Bank.
            *   **Asset Purchase (Leasing):** Debit Aset Tetap - [Nama Aset], Credit Kas dan Bank (for DP), Credit Utang Leasing.
            *   **Loan Installment:** Debit Utang Bank, Debit Beban Bunga, Credit Kas dan Bank.
            *   **Depreciation (Dec 31):** Debit Beban Penyusutan, Credit Akumulasi Penyusutan - [Nama Aset].
        5.  **Format Output:** Structure the output strictly according to the provided Zod schema. Each transaction should be a single object in the 'jurnalEntries' array, containing multiple 'entri' for each debit/credit line.

        **Text to parse from document "${filename}":**
        ---
        ${content}
        ---
        `;
      })(),
    });
    extractedData = object;
    if ("jurnalEntries" in extractedData) {
      console.log(
        `[DEBUG] Berhasil mengekstrak Jurnal Umum dengan ${
          (extractedData as any).jurnalEntries?.length || 0
        } blok transaksi.`
      );
    } else if ("bukuBesarAccounts" in extractedData) {
      console.log(
        `[DEBUG] Berhasil mengekstrak Buku Besar untuk ${
          (extractedData as any).bukuBesarAccounts?.length || 0
        } akun.`
      );
    } else if ("neracaSaldo" in extractedData) {
      console.log(
        `[DEBUG] Berhasil mengekstrak Neraca Saldo dengan ${
          (extractedData as any).neracaSaldo.accounts?.length || 0
        } akun.`
      );
    } else if ("perhitunganPersediaan" in extractedData) {
        console.log(
            `[DEBUG] Berhasil mengekstrak Perhitungan Persediaan.`
        );
    } else if ("labaRugi" in extractedData) {
        console.log(
            `[DEBUG] Berhasil mengekstrak Laporan Laba Rugi.`
        );
    }
  } catch (error) {
    console.error(
      `[ERROR] Gagal mengekstrak data keuangan dari dokumen ${filename}:`,
      error
    );
    throw error;
  }

  const jurnalBlocks = (extractedData as any).jurnalEntries || [];
  const bukuBesarAccounts = (extractedData as any).bukuBesarAccounts || [];
  const neracaSaldo = (extractedData as any).neracaSaldo;
  const perhitunganPersediaan = (extractedData as any).perhitunganPersediaan;
  const allJurnalEntries: JurnalUmumEntry[] = [];
  const allBukuBesarEntries: BukuBesarEntry[] = [];
  const allNeracaSaldoEntries: NeracaSaldoEntry[] = [];
  const allPerhitunganPersediaanEntries: PerhitunganPersediaanEntry[] = [];
  const allLabaRugiEntries: LabaRugiData[] = [];
  const transactions: any[] = [];

  if (jurnalBlocks.length > 0) {
    console.log(
      `[DEBUG] Memproses data transaksi dari ${jurnalBlocks.length} blok Jurnal Umum`
    );
    for (const block of jurnalBlocks) {
      for (const entry of block.entri) {
        allJurnalEntries.push({
          id: block.id,
          tanggal: block.tanggal,
          keterangan: block.keterangan,
          noAkun: "",
          namaAkun: entry.akun,
          debit: entry.debit,
          kredit: entry.kredit,
        });
        const amount =
          parseIndonesianAmount(entry.debit) > 0 ? entry.debit : entry.kredit;
        transactions.push({
          date: block.tanggal,
          description: block.keterangan,
          debit: entry.debit,
          credit: entry.kredit,
          account: entry.akun,
          amount: amount,
          documentSource: block.sumberDokumen,
        });
      }
    }
    console.log(
      `[DEBUG] Total ${allJurnalEntries.length} baris jurnal berhasil diproses`
    );
  }

  if (bukuBesarAccounts.length > 0) {
    console.log(
      `[DEBUG] Memproses data dari ${bukuBesarAccounts.length} akun Buku Besar`
    );
    for (const account of bukuBesarAccounts) {
      for (const entry of account.entri) {
        allBukuBesarEntries.push({
          ...entry,
          akun: account.namaAkun,
          ref: "", // Placeholder
        });
        const amount =
          parseIndonesianAmount(entry.debit) > 0 ? entry.debit : entry.kredit;
        transactions.push({
          date: entry.tanggal,
          description: entry.keterangan,
          debit: entry.debit,
          credit: entry.kredit,
          account: account.namaAkun,
          amount: amount,
          documentSource: filename,
        });
      }
    }
    console.log(
      `[DEBUG] Total ${allBukuBesarEntries.length} baris buku besar berhasil diproses`
    );
  }

  if (neracaSaldo && neracaSaldo.accounts.length > 0) {
    console.log(
      `[DEBUG] Memproses data dari ${neracaSaldo.accounts.length} akun Neraca Saldo`
    );
    for (const account of neracaSaldo.accounts) {
      allNeracaSaldoEntries.push({
        ...account,
      });
      const amount =
        parseIndonesianAmount(account.debit) > 0
          ? account.debit
          : account.kredit;
      transactions.push({
        date: neracaSaldo.period,
        description: `Saldo Akun ${account.namaAkun}`,
        debit: account.debit,
        credit: account.kredit,
        account: account.namaAkun,
        amount: amount,
        documentSource: filename,
      });
    }
    console.log(
      `[DEBUG] Total ${allNeracaSaldoEntries.length} baris neraca saldo berhasil diproses`
    );
  }

  if (perhitunganPersediaan) {
    console.log(
      `[DEBUG] Memproses data dari Perhitungan Persediaan`
    );
    allPerhitunganPersediaanEntries.push(perhitunganPersediaan);
    transactions.push({
        date: (extractedData as any).dateRange.end,
        description: `Perhitungan Persediaan Akhir`,
        debit: perhitunganPersediaan.summary.hpp,
        credit: "0",
        account: "Harga Pokok Penjualan",
        amount: perhitunganPersediaan.summary.hpp,
        documentSource: filename,
    });
     console.log(
      `[DEBUG] Total ${allPerhitunganPersediaanEntries.length} baris perhitungan persediaan berhasil diproses`
    );
  }

  if ((extractedData as any).laporanLabaRugi) {
      console.log(`[DEBUG] Memproses data dari Laporan Laba Rugi`);
      allLabaRugiEntries.push((extractedData as any).laporanLabaRugi);
      const netIncome = (extractedData as any).laporanLabaRugi.labaBersih.nilai;
      transactions.push({
          date: (extractedData as any).dateRange.end,
          description: `Laba Bersih Tahun Berjalan`,
          debit: "0",
          credit: netIncome,
          account: "Laba Bersih",
          amount: netIncome,
          documentSource: filename,
      });
      console.log(`[DEBUG] Total ${allLabaRugiEntries.length} Laporan Laba Rugi berhasil diproses`);
  }

  return {
    transactions,
    jurnalData: allJurnalEntries,
    bukuData: allBukuBesarEntries,
    neracaData: allNeracaSaldoEntries,
    perhitunganPersediaanData: allPerhitunganPersediaanEntries,
    penyusutanAsetData: [],
    jurnalPenyesuaianData: [],
    rekonsiliasiBankData: [],
    labaRugiData: allLabaRugiEntries,
    posisiKeuanganData: [],
    perubahanEkuitasData: [],
    arusKasData: [],
    finalResultData: [],
    dateRange: extractedData.dateRange,
    confidence: extractedData.confidence,
  };
}

export const parseVaultFinancialDocumentTool = createTool({
  id: "parse-vault-financial-document",
  description:
    "Parse financial documents from vault using semantic search and automatically insert into database",
  inputSchema: z.object({
    filename: z.string().describe("Filename to search for"),
    documentType: z
      .union([z.array(z.string()), z.string()])
      .describe(
        "Type of financial document(s) to parse, e.g., 'jurnal_umum' or ['jurnal_umum', 'buku_besar']"
      ),
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
    content: z.any().optional(),
    workbookId: z.string().optional(),
    databaseStatus: z
      .object({
        inserted: z.boolean(),
        stepsSaved: z.array(z.string()),
      })
      .optional(),
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

      const classifiedCategory = await classifyFinancialText(
        Array.isArray(documentType) ? documentType.join(" ") : documentType,
        runtimeContext
      );
      console.log(`[DEBUG] Input Pengguna diklasifikasikan ke Kategori: ${classifiedCategory}`);

      console.log(
        `[DEBUG] Membuat query pencarian untuk dokumen: ${filename}, tipe: ${documentType}`
      );
      let searchQueryData;
      try {
        const result = await generateObject({
          model: openai(BASE_MODEL),
          schema: z.object({
            queries: z.array(z.string()),
          }),
          prompt: `Generate 5 optimal search queries to extract financial data from a ${documentType} document named "${filename}". 
          Focus on key accounting terms in both Indonesian and English that would help retrieve the most relevant financial information.`,
        });
        searchQueryData = result.object;
        console.log(
          `[DEBUG] Berhasil membuat query pencarian:`,
          searchQueryData
        );
      } catch (error: unknown) {
        const err = error as Error;
        console.error(
          `[ERROR] Gagal membuat query pencarian untuk dokumen ${filename}:`,
          err
        );
        console.error(`[ERROR] Stack trace:`, err.stack);
        throw err;
      }

      let allContent = "";

      for (const query of searchQueryData.queries) {
        const vaultResults = await queryVaultDocumentsTool.execute({
          context: {
            query,
            topK: 5,
            filenames: [filename],
          },
          runtimeContext,
        });

        if (vaultResults.results && vaultResults.results.length > 0) {
          allContent += `${vaultResults.results
            .map((result: any) => result.text)
            .join("\n\n")}\n\n`;
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
          databaseStatus: {
            inserted: false,
            stepsSaved: [],
          },
        };
      }

      console.log(
        `[DEBUG] Memulai parsing dokumen keuangan: ${filename}, tipe: ${documentType}`
      );
      let parsedData;
      try {
        parsedData = await parseFinancialContent(
          allContent,
          filename,
          Array.isArray(documentType) ? documentType.join(", ") : documentType
        );
        console.log(`[DEBUG] Berhasil parsing dokumen keuangan:`, {
          dateRange: parsedData.dateRange,
          jurnalEntries: parsedData.jurnalData?.length || 0,
          perhitunganPersediaan: parsedData.perhitunganPersediaanData?.length || 0,
          penyusutanAset: parsedData.penyusutanAsetData?.length || 0,
          jurnalPenyesuaian: parsedData.jurnalPenyesuaianData?.length || 0,
          rekonsiliasiBank: parsedData.rekonsiliasiBankData?.length || 0,
          labaRugi: parsedData.labaRugiData?.length || 0,
          posisiKeuangan: parsedData.posisiKeuanganData?.length || 0,
          perubahanEkuitas: parsedData.perubahanEkuitasData?.length || 0,
          arusKas: parsedData.arusKasData?.length || 0,
          finalResult: parsedData.finalResultData?.length || 0,
          confidence: parsedData.confidence || "N/A",
        });
      } catch (error: unknown) {
        const err = error as Error;
        console.error(`[ERROR] Gagal parsing dokumen keuangan:`, err);
        throw err;
      }

     // Get user ID from runtime context
     const session = await auth();

     const userId = session?.user?.id;
     
     const documentPreview = runtimeContext.get('documentPreview');
     let workbookId = documentPreview?.workbookId;
     
     // Try to get chatId from documentPreview
     let chatId = documentPreview?.chatId;
      const stepsSaved = [];

      // Log parsed data information without using dataTypes property
      console.log(`[DEBUG] Berhasil parsing dokumen keuangan:`, {
        dateRange: parsedData.dateRange,
        jurnalEntries: parsedData.jurnalData?.length || 0,
        confidence: parsedData.confidence || "N/A",
      });

      if (userId) {
        if (!workbookId) {
          console.log(
            `[DEBUG] Mencoba membuat financial workbook untuk dokumen: ${filename}`
          );
          console.log(`[DEBUG] Parameter workbook:`, {
            userId,
            workbookName: `Workbook for ${filename}`,
            period: `${parsedData.dateRange.start} - ${parsedData.dateRange.end}`,
            periodType: "monthly",
            companyInfo: {},
          });
          try {
            const newWorkbook = await createFinancialWorkbook({
              userId,
              workbookName: `Workbook for ${filename}`,
              period: `${parsedData.dateRange.start} - ${parsedData.dateRange.end}`,
              periodType: "monthly",
              companyInfo: {},
            });
            console.log(
              `[DEBUG] Berhasil membuat financial workbook dengan ID: ${newWorkbook.id}`
            );
            workbookId = newWorkbook.id;
          } catch (error: unknown) {
            const err = error as Error;
            console.error(`[ERROR] Gagal membuat financial workbook:`, err);
            console.error(`[ERROR] Stack trace:`, err.stack);
            throw err; // Re-throw to handle in the main try-catch block
          }
        }

        // Dynamically save all available data types
        const allDataTypes = [
          { data: parsedData.jurnalData, type: "jurnal_umum", name: "Jurnal Umum", step: 1 },
          { data: parsedData.bukuData, type: "buku_besar", name: "Buku Besar", step: 1 },
          { data: parsedData.neracaData, type: "neraca_saldo", name: "Neraca Saldo", step: 1 },
          { data: parsedData.perhitunganPersediaanData, type: "perhitungan_persediaan", name: "Perhitungan Persediaan", step: 2 },
          { data: parsedData.penyusutanAsetData, type: "penyusutan_aset", name: "Penyusutan Aset", step: 2 },
          { data: parsedData.jurnalPenyesuaianData, type: "jurnal_penyesuaian", name: "Jurnal Penyesuaian", step: 2 },
          { data: parsedData.rekonsiliasiBankData, type: "rekonsiliasi_bank", name: "Rekonsiliasi Bank", step: 2 },
          { data: parsedData.labaRugiData, type: "laba_rugi", name: "Laba Rugi", step: 3 },
          { data: parsedData.posisiKeuanganData, type: "posisi_keuangan", name: "Posisi Keuangan", step: 4 },
          { data: parsedData.perubahanEkuitasData, type: "perubahan_ekuitas", name: "Perubahan Ekuitas", step: 4 },
          { data: parsedData.arusKasData, type: "arus_kas", name: "Arus Kas", step: 4 },
          { data: parsedData.finalResultData, type: "final_result", name: "Final Result", step: 5 },
        ];

        const dataTypesToSave = allDataTypes.filter(
          ({ data }) => data && data.length > 0
        );


        // Save all available data types
        for (const { data, type, name, step } of dataTypesToSave) {
          if (data && data.length > 0) {
            try {
              console.log(
                `[DEBUG] Mencoba menyimpan data ${name} ke database...`
              );
              console.log(
                `[DEBUG] Data ${name} yang akan disimpan:`, {
                  dataType: type,
                  entries: data.length
                }
              );
              console.log(
                `[DEBUG] workbookId: ${workbookId}, stepNumber: ${step}, dataType: ${type}`
              );
              console.log(
                `[DEBUG] Total entries untuk ${name}: ${data.length}`
              );

              const result = await createFinancialStepData({
                workbookId,
                stepNumber: step,
                stepName: name,
                dataType: type,
                jsonData: data,
                chatId: chatId,
              });

              console.log(
                `[DEBUG] Berhasil menyimpan data ${name} ke database:`,
                result
              );
              console.log(
                `[DEBUG] Database insertion timestamp: ${result.createdAt}`
              );
              console.log(`[DEBUG] Database record ID: ${result.id}`);
              stepsSaved.push(name);
            } catch (error: unknown) {
              const err = error as Error;
              console.error(
                `[ERROR] Gagal menyimpan data ${name} ke database:`,
                err
              );
              console.error(`[ERROR] Stack trace:`, err.stack);
            }
          } else {
            console.log(`[DEBUG] Tidak ada data ${name} untuk disimpan`);
          }
        }

        // Classify document to determine step
        const step = await classifyFinancialText(
          documentType || filename,
          runtimeContext
        );

        // Create result object
        const result = {
          success: true,
          transactions: parsedData.transactions,
          metadata: {
            totalTransactions: parsedData.transactions.length,
            dateRange: parsedData.dateRange,
            documentType,
            parsingConfidence: parsedData.confidence,
          },
          message: `Successfully processed ${parsedData.transactions.length} entries from ${filename} and saved to database.`,
          content: JSON.stringify({
            jurnalData: parsedData.jurnalData,
            bukuData: parsedData.bukuData,
            neracaData: parsedData.neracaData,
            perhitunganPersediaanData: parsedData.perhitunganPersediaanData,
            penyusutanAsetData: parsedData.penyusutanAsetData,
            jurnalPenyesuaianData: parsedData.jurnalPenyesuaianData,
            rekonsiliasiBankData: parsedData.rekonsiliasiBankData,
            labaRugiData: parsedData.labaRugiData,
            posisiKeuanganData: parsedData.posisiKeuanganData,
            perubahanEkuitasData: parsedData.perubahanEkuitasData,
            arusKasData: parsedData.arusKasData,
            finalResultData: parsedData.finalResultData,
          }),
          workbookId,
          databaseStatus: {
            inserted: true,
            stepsSaved,
          },
        };

        // Store preview data in runtime context
        const previewData = {
          ...result,
          step,
          timestamp: Date.now(),
        };

        runtimeContext.set("documentPreview", previewData);
        console.log(
          "✅ Vault data saved to DB and runtimeContext:",
          previewData
        );

        return result;
      } else {
        // Handle case where user ID is not available
        console.warn(
          "User ID not available in runtime context, data not saved to database"
        );
        return {
          success: true,
          transactions: parsedData.transactions,
          metadata: {
            totalTransactions: parsedData.transactions.length,
            dateRange: parsedData.dateRange,
            documentType,
            parsingConfidence: parsedData.confidence,
          },
          message: `Successfully processed ${parsedData.transactions.length} entries from ${filename}, but not saved to database (no user ID).`,
          content: {
            jurnalData: parsedData.jurnalData,
            bukuData: parsedData.bukuData,
            neracaData: parsedData.neracaData,
            perhitunganPersediaanData: parsedData.perhitunganPersediaanData,
            penyusutanAsetData: parsedData.penyusutanAsetData,
            jurnalPenyesuaianData: parsedData.jurnalPenyesuaianData,
            rekonsiliasiBankData: parsedData.rekonsiliasiBankData,
            labaRugiData: parsedData.labaRugiData,
            posisiKeuanganData: parsedData.posisiKeuanganData,
            perubahanEkuitasData: parsedData.perubahanEkuitasData,
            arusKasData: parsedData.arusKasData,
            finalResultData: parsedData.finalResultData,
          },
          databaseStatus: {
            inserted: false,
            stepsSaved: [],
          },
        };
      }
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
        databaseStatus: {
          inserted: false,
          stepsSaved: [],
        },
      };
    }
  },
});

export const updateFinancialDataTool = createTool({
  id: "update-financial-data",
  description: "Update existing financial data entries in the database.",
  inputSchema: z.object({
    stepDataId: z.string().describe("The ID of the financial step data to update."),
    updates: z.any().describe("An object containing the fields to update."),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    updatedData: z.any().optional(),
  }),
  execute: async ({ context }) => {
    const { stepDataId, updates } = context;
    try {
      const updatedData = await updateFinancialStepData(stepDataId, {
        jsonData: updates,
      });
      return {
        success: true,
        message: `Successfully updated data for step ID ${stepDataId}.`,
        updatedData,
      };
    } catch (error: any) {
      console.error(`Error updating financial data for step ID ${stepDataId}:`, error);
      return {
        success: false,
        message: `Failed to update data: ${error.message}`,
      };
    }
  },
});
