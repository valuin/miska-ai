import { db } from "@/lib/db/queries/db";
import { financialStepsData } from "@/lib/db/schema/ai/financial.schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { workbookId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const { workbookId } = params;
    if (!workbookId) {
      return NextResponse.json(
        { error: "Workbook ID is required" },
        { status: 400 }
      );
    }
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const stepsData = await db
      .select()
      .from(financialStepsData)
      .where(
        and(
          eq(financialStepsData.workbookId, workbookId),
          eq(financialStepsData.chatId, chatId)
        )
      );

    if (!stepsData || stepsData.length === 0) {
      return NextResponse.json(
        { error: "No data found for this workbook and chat session" },
        { status: 404 }
      );
    }

    const responseData: { [key: string]: any } = {};
    for (const step of stepsData) {
      if (step.dataType) {
        // Menggunakan camelCase untuk nama properti, contoh: jurnal_umum -> jurnalUmum
        const propertyName = step.dataType.replace(/_([a-z])/g, (g) => g.toUpperCase());
        responseData[propertyName] = step.jsonData || [];
      }
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error fetching financial data:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}