import { Agent } from "@mastra/core/agent";
import { BASE_MODEL } from "@/lib/constants";
import { createTool } from "@mastra/core/tools";
import { getIntegrationClient } from "@/lib/integrations/client";
import { getUserIntegrationIdBySlug } from "@/lib/db/queries/integration.model";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { MastraRuntimeContext } from "..";
import type { RuntimeContext } from "@mastra/core/runtime-context";

const getGmailClient = async (
  runtimeContext: RuntimeContext<MastraRuntimeContext>,
) => {
  const session = runtimeContext.get("session");
  const user_id = session.user.id;

  const user_integration_id = await getUserIntegrationIdBySlug(
    user_id,
    "google_gmail",
  );
  if (!user_integration_id) {
    throw new Error("User integration not found");
  }

  const gmail = await getIntegrationClient("google_gmail", user_integration_id);
  return gmail;
};

const listGmailMessages = createTool({
  id: "list_gmail_messages",
  description: "List recent Gmail messages for the authenticated user",
  inputSchema: z.object({
    maxResults: z.number().optional(),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      snippet: z.string(),
    }),
  ),
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: { maxResults?: number };
    runtimeContext: RuntimeContext<MastraRuntimeContext>;
  }) => {
    const gmail = await getGmailClient(runtimeContext);
    const { maxResults } = context;

    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: maxResults ?? 5,
    });
    const emails = await Promise.all(
      (res.data.messages ?? []).map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: "me",
          id: msg.id ?? "",
        });

        return {
          id: msg.id ?? "",
          snippet: detail.data.snippet ?? "",
        };
      }),
    );

    return emails;
  },
});

const readGmailMessage = createTool({
  id: "read_gmail_message",
  description: "Read a Gmail message",
  inputSchema: z.object({
    id: z.string(),
  }),
  outputSchema: z.object({
    id: z.string(),
    emailBody: z.string(),
  }),
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: { id: string };
    runtimeContext: RuntimeContext<MastraRuntimeContext>;
  }) => {
    const { id } = context;
    const gmail = await getGmailClient(runtimeContext);

    const res = await gmail.users.messages.get({
      userId: "me",
      id,
    });
    return { id, emailBody: res.data.payload?.parts?.[0]?.body?.data ?? "" };
  },
});

const sendGmailMessage = createTool({
  id: "send_gmail_message",
  description:
    "Send a Gmail message. For safety, the message will be sent as a draft and the user will need to review and send it. The agent will not send the message directly.",
  inputSchema: z.object({
    to: z.string(),
    subject: z.string(),
    body: z.string(),
  }),
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: { to: string; subject: string; body: string };
    runtimeContext: RuntimeContext<MastraRuntimeContext>;
  }) => {
    const gmail = await getGmailClient(runtimeContext);
    const user = await gmail.users.getProfile({ userId: "me" });
    const { to, subject, body } = context;

    const messageLines = [
      `To: ${to}`,
      `From: ${user.data.emailAddress}`,
      `Subject: ${subject}`,
      "",
      body,
    ];
    const message = messageLines.join("\r\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    try {
      const draftResponse = await gmail.users.drafts.create({
        userId: "me",
        requestBody: {
          message: { raw: encodedMessage },
        },
      });

      console.log(`Draft id: ${draftResponse.data.id}`);
      console.log(`Draft message:`, draftResponse.data.message);
      return draftResponse.data;
    } catch (err) {
      console.error("An error occurred while creating draft:", err);
      return {};
    }
  },
});

export const gmailAgent = new Agent({
  name: "Gmail Agent",
  instructions: `You are an agent that can access the user's Gmail account and retrieve recent emails using the list_gmail_messages tool.`,
  model: openai(BASE_MODEL),
  tools: { listGmailMessages, readGmailMessage, sendGmailMessage },
});
