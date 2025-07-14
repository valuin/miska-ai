import { createTool } from "@mastra/core";
import { z } from "zod";
import twilio from "twilio";
import type { MastraRuntimeContext } from "..";
import { getUserById } from "@/lib/db/queries";

const accountSid = "AC000b714e09ec7f361ab3e1a41d7c470b";
const authToken = process.env.TWILIO_AUTH_TOKEN || "";
const client = twilio(accountSid, authToken);

const FROM_NUMBER = "whatsapp:+14155238886";
const DEFAULT_PHONE_NUMBER = "whatsapp:+12369799236";

const SEND_MESSAGE_CONTENT_SID = "HX69639b0a4f913f812701a864379172dd";
// const WORKFLOW_COMPLETED_CONTENT_SID = "HX8cea597a1d3b96f8a70305d9f55d082a";

const sendWhatsappMessage = async (
  contentSid: string,
  contentVariables: string,
  to: string,
) => {
  await client.messages.create({
    from: FROM_NUMBER,
    to: to,
    contentSid: contentSid,
    contentVariables: contentVariables,
  });
};

export const whatsappMessageTool = createTool({
  id: "send-whatsapp-message",
  description: "Send a message to a whatsapp number.",
  inputSchema: z.object({
    message: z.string().describe("The message to send."),
  }),
  outputSchema: z.object({}),
  execute: async ({ context, runtimeContext }) => {
    const { message } = context;
    const { session } = runtimeContext as unknown as MastraRuntimeContext;
    const user = await getUserById(session.user.id);
    if (!user) throw new Error("User not found");
    const { phone_number } = user;
    const to = phone_number || DEFAULT_PHONE_NUMBER;
    await sendWhatsappMessage(
      SEND_MESSAGE_CONTENT_SID,
      `{"1":"${message}"}`,
      to,
    );
    return {};
  },
});

export const whatsappWorkflowCompletedTool = createTool({
  id: "send-whatsapp-workflow-completed-message",
  description:
    "Send a message to a whatsapp number when a workflow is completed.",
  inputSchema: z.object({
    message: z.string().describe("The message to send."),
  }),
  outputSchema: z.object({}),
  execute: async ({ context, runtimeContext }) => {
    // const { message } = context;
    const { session } = runtimeContext as unknown as MastraRuntimeContext;
    const user = await getUserById(session.user.id);
    if (!user) throw new Error("User not found");
    const { phone_number } = user;
    const to = phone_number || DEFAULT_PHONE_NUMBER;
    await sendWhatsappMessage(
      SEND_MESSAGE_CONTENT_SID,
      `{"1":"*Workflow completed!* Click here: https://futurity-search.up.railway.app to view the results."}`,
      to,
    );
    return {};
  },
});
