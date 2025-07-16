import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { createDataStream } from "ai";
import { generateUUID } from "@/lib/utils";
import { mastra } from "@/mastra";
import { RuntimeContext } from "@mastra/core/di";
import { workflowCreatorAgent } from "@/mastra/agents/workflow-creator-agent";
import { z } from "zod";
import type { NextRequest } from "next/server";

const generateWorkflowSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
});

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = generateWorkflowSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: validationResult.error.flatten() }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { messages } = validationResult.data;
    const prompt = messages.at(-1)?.content;
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await auth();

    const stream = createDataStream({
      execute: async (dataStream) => {
        const sendUpdate = (message: string, progress: number) => {
          dataStream.writeMessageAnnotation({
            type: "progress",
            progress,
            message,
          });
        };

        const runtimeContext = new RuntimeContext();
        runtimeContext.set("mastra", mastra);
        runtimeContext.set("session", session);
        runtimeContext.set("dataStream", dataStream);

        const resourceId = `workflow-creator-agent-${generateUUID()}`;
        const threadId = `workflow-creator-agent-${generateUUID()}`;

        sendUpdate("Retrieving available agents...", 40);

        setTimeout(() => {
          sendUpdate("Thinking about task...", 60);
        }, 800);

        setTimeout(() => {
          sendUpdate("Planning agent steps...", 80);
        }, 1400);

        setTimeout(() => {
          sendUpdate("Generating workflow...", 95);
        }, 2200);

        const stream = await workflowCreatorAgent.stream(
          [{ role: "user", content: prompt }],
          {
            toolChoice: "required",
            runtimeContext,
            maxSteps: 1,
            onFinish: () => sendUpdate("Done!", 100),
            memory: { resource: resourceId, thread: threadId },
          },
        );

        stream.mergeIntoDataStream(dataStream);
      },
      onError: () => "Oops, an error occurred!",
    });

    return new Response(stream);
  } catch (error) {
    console.error("Workflow generation API error:", error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}
