import { db } from "./db";
import {
  financialWorkbooks,
  financialStepsData,
  documentProcessingLog,
  NewFinancialWorkbook,
  NewFinancialStepsData,
  NewDocumentProcessingLog,
} from "../schema/ai/financial.schema";
import { eq } from "drizzle-orm";

export async function createFinancialWorkbook(
  workbook: NewFinancialWorkbook
) {
  console.log(`[DEBUG] createFinancialWorkbook: Mencoba membuat financial workbook baru`);
  console.log(`[DEBUG] createFinancialWorkbook: Parameter:`, {
    userId: workbook.userId,
    workbookName: workbook.workbookName,
    period: workbook.period,
    periodType: workbook.periodType
  });
  
  try {
    const [newWorkbook] = await db
      .insert(financialWorkbooks)
      .values(workbook)
      .returning();
    
    console.log(`[DEBUG] createFinancialWorkbook: Berhasil membuat workbook dengan ID: ${newWorkbook.id}`);
    console.log(`[DEBUG] createFinancialWorkbook: Workbook dibuat pada: ${newWorkbook.createdAt}`);
    return newWorkbook;
  } catch (error) {
    console.error(`[ERROR] createFinancialWorkbook: Gagal membuat financial workbook:`, error);
    throw error;
  }
}

export async function getFinancialWorkbook(workbookId: string) {
  const [workbook] = await db
    .select()
    .from(financialWorkbooks)
    .where(eq(financialWorkbooks.id, workbookId));
  return workbook;
}

export async function updateFinancialWorkbook(
  workbookId: string,
  updates: Partial<NewFinancialWorkbook>
) {
  const [updatedWorkbook] = await db
    .update(financialWorkbooks)
    .set(updates)
    .where(eq(financialWorkbooks.id, workbookId))
    .returning();
  return updatedWorkbook;
}

export async function createFinancialStepData(
  stepData: NewFinancialStepsData
) {
  console.log(`[DEBUG] createFinancialStepData: Mencoba menyimpan data ke tabel financial_steps_data`);
  console.log(`[DEBUG] createFinancialStepData: Parameter:`, {
    workbookId: stepData.workbookId,
    stepNumber: stepData.stepNumber,
    stepName: stepData.stepName,
    dataType: stepData.dataType,
    jsonDataLength: Array.isArray(stepData.jsonData) ? stepData.jsonData.length : 'bukan array'
  });
  
  try {
    const [newStepData] = await db
      .insert(financialStepsData)
      .values(stepData)
      .returning();
    
    console.log(`[DEBUG] createFinancialStepData: Berhasil menyimpan data ke database dengan ID: ${newStepData.id}`);
    console.log(`[DEBUG] createFinancialStepData: Data tersimpan pada: ${newStepData.createdAt}`);
    return newStepData;
  } catch (error) {
    console.error(`[ERROR] createFinancialStepData: Gagal menyimpan data ke database:`, error);
    throw error;
  }
}

export async function getFinancialStepData(workbookId: string, stepNumber: number) {
  const [stepData] = await db
    .select()
    .from(financialStepsData)
    .where(
      eq(financialStepsData.workbookId, workbookId) &&
      eq(financialStepsData.stepNumber, stepNumber)
    );
  return stepData;
}

export async function updateFinancialStepData(
  stepDataId: string,
  updates: Partial<NewFinancialStepsData>
) {
  const [updatedStepData] = await db
    .update(financialStepsData)
    .set(updates)
    .where(eq(financialStepsData.id, stepDataId))
    .returning();
  return updatedStepData;
}

export async function createDocumentProcessingLog(
  log: NewDocumentProcessingLog
) {
  const [newLog] = await db
    .insert(documentProcessingLog)
    .values(log)
    .returning();
  return newLog;
}