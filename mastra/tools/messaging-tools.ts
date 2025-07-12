import { createTool } from "@mastra/core";
import { z } from "zod";
import twilio from "twilio";
import type { MastraRuntimeContext } from "..";
import { getUserById } from "@/lib/db/queries";

const accountSid = "AC000b714e09ec7f361ab3e1a41d7c470b";
const authToken = process.env.TWILIO_AUTH_TOKEN || "";
const client = twilio(accountSid, authToken);

const FROM_NUMBER = "whatsapp:+14155238886";
const CONTENT_SID = "HX229f5a04fd0510ce1b071852155d3e75";

const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendWhatsappMessageTool = createTool({
  id: "send-whatsapp-message",
  description: "Send a message to a whatsapp number.",
  inputSchema: z.object({
    message: z.string().describe("The message to send."),
  }),
  outputSchema: z.object({}),
  execute: async ({ context, runtimeContext }) => {
    const { session } = runtimeContext as unknown as MastraRuntimeContext;
    const user = await getUserById(session.user.id);
    if (!user) throw new Error("User not found");
    if (!user.whatsapp_confirmed) throw new Error("User not confirmed");

    const { phone_number } = user;

    const code = generateCode();

    const message = await client.messages.create({
      from: FROM_NUMBER,
      to: phone_number as string,
      contentSid: CONTENT_SID,
      contentVariables: `{"1":"${code}"}`,
    });

    return {};
  },
});
