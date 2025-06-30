import { NextResponse } from "next/server";
import { db } from "@/lib/db/queries/db";
import { message } from "@/lib/db/schema/ai/message.schema";

const colorMap: Record<string, string> = {
  "create-document": "hsl(210, 100%, 80%)",
  "request-suggestions": "hsl(215, 90%, 70%)",
  "update-document": "hsl(220, 85%, 60%)",
  "utility-tools": "hsl(225, 80%, 50%)",
  "other": "hsl(230, 75%, 40%)",
};

export async function GET() {
  const messages = await db.select().from(message);

  const toolUsage: Record<string, number> = {};

  for (const msg of messages) {
    if (!Array.isArray(msg.parts)) continue;
    for (const part of msg.parts) {
      if (
        (part.type === "tool-call" || part.type === "tool-result") &&
        typeof part.toolName === "string"
      ) {
        const tool = part.toolName || "other";
        toolUsage[tool] = (toolUsage[tool] || 0) + 1;
      }
    }
  }

  const data = Object.entries(toolUsage).map(([tool, usage], i) => ({
    tool,
    usage,
    fill: colorMap[tool] ?? colorMap.other,
  }));

  return NextResponse.json(data);
}