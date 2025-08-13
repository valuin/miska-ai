import { db } from "@/lib/db/queries/db";
import { financialStepsData } from "@/lib/db/schema/ai/financial.schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createDataStream } from "ai";

export const dynamic = "force-dynamic";

async function getFinancialData(workbookId: string, chatId: string) {
  const stepsData = await db
    .select()
    .from(financialStepsData)
    .where(
      and(
        eq(financialStepsData.workbookId, workbookId),
        eq(financialStepsData.chatId, chatId)
      )
    );

  const responseData: { [key: string]: any } = {};
  for (const step of stepsData) {
    if (step.dataType) {
      const propertyName = step.dataType
        .replace(/_([a-z])/g, (g) => g.toUpperCase());
      responseData[propertyName] = step.jsonData || [];
    }
  }
  return responseData;
}

export async function GET(
  request: Request,
  { params }: { params: { workbookId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const { workbookId } = params;

    if (!workbookId || !chatId) {
      return NextResponse.json(
        { error: "Workbook ID and Chat ID are required" },
        { status: 400 }
      );
    }

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    const sendData = (data: any) => {
      writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    (async () => {
      try {
        const initialData = await getFinancialData(workbookId, chatId);
        sendData({ type: "initial-data", data: initialData });

        const interval = setInterval(async () => {
          try {
            const updatedData = await getFinancialData(workbookId, chatId);
            sendData({ type: "update-data", data: updatedData });
          } catch (error) {
            console.error("Error fetching updated financial data:", error);
            sendData({ type: "error", error: "Failed to fetch updated data" });
          }
        }, 5000);

        request.signal.onabort = () => {
          clearInterval(interval);
          writer.close();
        };
      } catch (error) {
        console.error("Error in streaming process:", error);
        sendData({ type: "error", error: "Failed to start stream" });
        writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in financial data stream:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}