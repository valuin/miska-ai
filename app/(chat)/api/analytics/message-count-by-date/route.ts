import { NextResponse } from "next/server";
import { db } from "@/lib/db/queries/db";
import { message } from "@/lib/db/schema/ai/message.schema";

export async function GET() {
  const messages = await db.select().from(message);

  const counts: Record<string, number> = {};
  for (const msg of messages) {
    const date = msg.createdAt.toISOString().slice(0, 10);
    counts[date] = (counts[date] || 0) + 1;
  }

  const data = Object.entries(counts)
    .map(([date, messages]) => ({ date, messages }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(data);
}