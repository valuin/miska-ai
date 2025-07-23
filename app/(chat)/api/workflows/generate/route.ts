import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { createDataStream } from "ai";
import { generateUUID } from "@/lib/utils";
import { mastra } from "@/mastra";
import { RuntimeContext } from "@mastra/core/di";
import { workflowCreatorAgent } from "@/mastra/agents/workflow-creator-agent";
import type { NextRequest } from "next/server";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get("prompt") as string;
    // TODO: Handle file uploads if necessary
    // const file = formData.get("file") as File | null;

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

        console.log("Calling workflowCreatorAgent.stream...");
        const stream = await workflowCreatorAgent.stream(
          [{ role: "user", content: prompt }],
          {
            toolChoice: "required",
            runtimeContext,
            maxSteps: 1,
            onFinish: (result) => {
              console.log("onFinish callback triggered. Full Result object:", JSON.stringify(result, null, 2));
              console.log("Tool Calls in first step:", JSON.stringify(result.steps?.[0]?.toolCalls, null, 2));
              console.log("Tool Results in first step:", JSON.stringify(result.steps?.[0]?.toolResults, null, 2));

              // Access toolResults from the first step
              const toolResult = result.steps?.[0]?.toolResults?.find(
                (r) => r.toolName === "workflowTool",
              );
              if (toolResult) {
                console.log("Tool result 'workflowTool' found:", toolResult);
                const fullSchema = JSON.stringify(toolResult.result);
                console.log("Full schema generated (first 100 chars):", fullSchema.substring(0, 100));
                const chunkSize = 512;
                for (let i = 0; i < fullSchema.length; i += chunkSize) {
                  const chunk = fullSchema.substring(i, i + chunkSize);
                  dataStream.writeData({ type: "schema_chunk", chunk });
                }
              } else {
                console.warn("Tool result 'create-workflow-tool' not found in toolResults array.");
                dataStream.writeMessageAnnotation({
                  type: "progress",
                  progress: 100,
                  message: "Could not generate a valid workflow schema.",
                });
              }
              sendUpdate("Done!", 100);
              console.log("Workflow generation process finished.");
            },
            memory: { resource: resourceId, thread: threadId },
          },
        );
        console.log("workflowCreatorAgent.stream call completed.");

        console.log("Merging agent stream into dataStream...");
        stream.mergeIntoDataStream(dataStream);
        console.log("Agent stream merged into dataStream.");
      },
      onError: (error) => {
        console.error("createDataStream onError:", error);
        return "Oops, an error occurred!";
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error("Workflow generation API error:", error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
