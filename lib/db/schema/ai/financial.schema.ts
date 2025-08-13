import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { user } from "../user.schema";
import { documentVault } from "./document-vault.schema";

export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountCode: text("account_code").notNull(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(),
  accountCategory: text("account_category"),
  parentAccountCode: text("parent_account_code"),
  level: integer("level").default(1),
  isActive: boolean("is_active").default(true),
  normalBalance: text("normal_balance").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const financialWorkbooks = pgTable("financial_workbooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  workbookName: text("workbook_name").notNull(),
  period: text("period").notNull(),
  periodType: text("period_type").notNull(),
  companyInfo: jsonb("company_info").notNull(),
  status: text("status").default("draft"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const financialStepsData = pgTable("financial_steps_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  workbookId: uuid("workbook_id")
    .notNull()
    .references(() => financialWorkbooks.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  stepName: text("step_name").notNull(),
  dataType: text("data_type").notNull(),
  chatId: text("chat_id"),
  jsonData: jsonb("json_data").notNull(),
  sourceDocuments: jsonb("source_documents").default([]),
  isCompleted: boolean("is_completed").default(false),
  validationStatus: text("validation_status").default("pending"),
  validationErrors: jsonb("validation_errors").default([]),
  calculationMetadata: jsonb("calculation_metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const documentProcessingLog = pgTable("document_processing_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  workbookId: uuid("workbook_id")
    .notNull()
    .references(() => financialWorkbooks.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").references(() => documentVault.id),
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull(),
  processingStep: integer("processing_step").notNull(),
  extractedData: jsonb("extracted_data").notNull(),
  processingStatus: text("processing_status").default("success"),
  processingErrors: jsonb("processing_errors").default([]),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.80"),
  reviewedBy: uuid("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const accountMappingRules = pgTable("account_mapping_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  sourceAccountName: text("source_account_name").notNull(),
  targetAccountId: uuid("target_account_id")
    .notNull()
    .references(() => chartOfAccounts.id),
  keywords: jsonb("keywords").default([]),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("1.00"),
  isAutoApply: boolean("is_auto_apply").default(true),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const financialReports = pgTable("financial_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  workbookId: uuid("workbook_id")
    .notNull()
    .references(() => financialWorkbooks.id, { onDelete: "cascade" }),
  reportType: text("report_type").notNull(),
  reportName: text("report_name").notNull(),
  reportData: jsonb("report_data").notNull(),
  templateUsed: text("template_used"),
  reportUrl: text("report_url"),
  shareUrl: text("share_url"),
  isPublic: boolean("is_public").default(false),
  accessToken: text("access_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  downloadCount: integer("download_count").default(0),
  lastAccessed: timestamp("last_accessed", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const auditTrail = pgTable("audit_trail", {
  id: uuid("id").primaryKey().defaultRandom(),
  workbookId: uuid("workbook_id")
    .notNull()
    .references(() => financialWorkbooks.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  previousData: jsonb("previous_data"),
  newData: jsonb("new_data"),
  changeDescription: text("change_description"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const validationRules = pgTable("validation_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ruleName: text("rule_name").notNull(),
  ruleType: text("rule_type").notNull(),
  applicableSteps: jsonb("applicable_steps").default([]),
  ruleDefinition: jsonb("rule_definition").notNull(),
  errorMessage: text("error_message").notNull(),
  severity: text("severity").default("error"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type ChartOfAccounts = typeof chartOfAccounts.$inferSelect;
export type NewChartOfAccounts = typeof chartOfAccounts.$inferInsert;

export type FinancialWorkbook = typeof financialWorkbooks.$inferSelect;
export type NewFinancialWorkbook = typeof financialWorkbooks.$inferInsert;

export type FinancialStepsData = typeof financialStepsData.$inferSelect;
export type NewFinancialStepsData = typeof financialStepsData.$inferInsert;

export type DocumentProcessingLog = typeof documentProcessingLog.$inferSelect;
export type NewDocumentProcessingLog =
  typeof documentProcessingLog.$inferInsert;

export type AccountMappingRule = typeof accountMappingRules.$inferSelect;
export type NewAccountMappingRule = typeof accountMappingRules.$inferInsert;

export type FinancialReport = typeof financialReports.$inferSelect;
export type NewFinancialReport = typeof financialReports.$inferInsert;

export type AuditTrail = typeof auditTrail.$inferSelect;
export type NewAuditTrail = typeof auditTrail.$inferInsert;

export type ValidationRule = typeof validationRules.$inferSelect;
export type NewValidationRule = typeof validationRules.$inferInsert;

export interface JurnalUmumEntry {
  id: string;
  tanggal: string;
  noAkun: string;
  namaAkun: string;
  debit: string;
  kredit: string;
  keterangan: string;
  ref?: string;
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
  saldo: string;
  kategori: string;
}

export interface PerhitunganPersediaanEntry {
  summary: {
    nilaiPersediaanAwal: string;
    totalPembelian: string;
    hpp: string;
    nilaiPersediaanAkhir: string;
  };
  kartuPersediaan: Array<{
    tanggal: string;
    keterangan: string;
    masukUnit?: string;
    masukHarga?: string;
    masukTotal?: string;
    keluarUnit?: string;
    keluarHarga?: string;
    keluarTotal?: string;
    saldoUnit: string;
    saldoHarga: string;
    saldoTotal: string;
  }>;
  jurnalPenyesuaian: {
    debit: string;
    kredit: string;
  };
}

export interface PenyusutanAsetEntry {
  id: string;
  namaAset: string;
  tanggalPerolehan: string;
  hargaPerolehan: string;
  nilaiResidu: string;
  masaManfaat: number;
  metodePenyusutan: string;
  penyusutanTahunan: string;
  akumulasiPenyusutan: string;
  nilaiBuku: string;
}

export interface JurnalPenyesuaianEntry extends JurnalUmumEntry {
  jenisAdjustment: string;
}

export interface RekonsiliasiBank {
  id: string;
  bulan: string;
  saldoBukuBank: string;
  saldoBukuPerusahaan: string;
  penambahan: Array<{
    keterangan: string;
    jumlah: string;
  }>;
  pengurangan: Array<{
    keterangan: string;
    jumlah: string;
  }>;
  saldoSetelahRekonsiliasi: string;
  selisih: string;
}

export interface LabaRugiItem {
  keterangan: string;
  nilai: string;
}

export interface LabaRugiData {
  laporanLabaRugi: {
    companyName: string;
    period: string;
    pendapatanUsaha: {
      items: LabaRugiItem[];
      total: LabaRugiItem;
    };
    hpp: {
      items: LabaRugiItem[];
      total: LabaRugiItem;
    };
    labaKotor: LabaRugiItem;
    bebanOperasional: {
      items: LabaRugiItem[];
      total: LabaRugiItem;
    };
    labaUsaha: LabaRugiItem;
    pendapatanBebanLain: LabaRugiItem[];
    labaSebelumPajak: LabaRugiItem;
    bebanPajakPenghasilan: LabaRugiItem;
    labaBersih: LabaRugiItem;
  };
  dateRange: {
    start: string;
    end: string;
  };
  confidence: number;
}

export interface PosisiKeuanganData {
  periode: string;
  asetLancar: Array<{
    akun: string;
    jumlah: string;
  }>;
  totalAsetLancar: string;
  asetTetap: Array<{
    akun: string;
    jumlah: string;
  }>;
  totalAsetTetap: string;
  totalAset: string;
  kewajibanJangkaPendek: Array<{
    akun: string;
    jumlah: string;
  }>;
  totalKewajibanJangkaePendek: string;
  kewajibanJangkaPanjang: Array<{
    akun: string;
    jumlah: string;
  }>;
  totalKewajibanJangkaPanjang: string;
  totalKewajiban: string;
  ekuitas: Array<{
    akun: string;
    jumlah: string;
  }>;
  totalEkuitas: string;
  totalKewajibanDanEkuitas: string;
}

export interface PerubahanEkuitasData {
  periode: string;
  modalAwal: string;
  labaBersih: string;
  dividen: string;
  perubahanLain: Array<{
    keterangan: string;
    jumlah: string;
  }>;
  modalAkhir: string;
}

export interface ArusKasData {
  periode: string;
  aktivitasOperasi: Array<{
    keterangan: string;
    jumlah: string;
  }>;
  totalArusKasOperasi: string;
  aktivitasInvestasi: Array<{
    keterangan: string;
    jumlah: string;
  }>;
  totalArusKasInvestasi: string;
  aktivitasPendanaan: Array<{
    keterangan: string;
    jumlah: string;
  }>;
  totalArusKasPendanaan: string;
  kenaikanKasBersih: string;
  kasAwalPeriode: string;
  kasAkhirPeriode: string;
}

export interface FinalResultData {
  dashboard: {
    companyName: string;
    period: string;
    kpiUtama: {
      totalPendapatan: {
        total: string;
        perubahanPersentase: string;
        status: "naik" | "turun" | "stabil" | "data tidak tersedia";
      };
      labaBersih: {
        total: string;
        perubahanPersentase: string;
        status: "naik" | "turun" | "stabil" | "data tidak tersedia";
      };
      totalAset: {
        total: string;
        perubahanPersentase: string;
        status: "naik" | "turun" | "stabil" | "data tidak tersedia";
      };
    };
    perbandinganBulanan: Array<{
      bulan: string;
      totalPendapatan: number;
      labaBersih: number;
    }>;
    rasioKeuangan: {
      currentRatio: {
        nama: string;
        nilai: string;
        targetMaks: string;
        interpretasi: string;
      };
      debtToEquityRatio: {
        nama: string;
        nilai: string;
        targetMaks: string;
        interpretasi: string;
      };
      returnOnEquity: {
        nama: string;
        nilai: string;
        targetMaks: string;
        interpretasi: string;
      };
    };
    analisisKualitatif: {
      ringkasanAnalisis: string;
      poinUntukDiperhatikan: string[];
      rekomendasiAksi: string[];
    };
  };
  dateRange: {
    start: string;
    end: string;
  };
  confidence: number;
}
