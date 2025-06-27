import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const optionsTool = createTool({
  id: "options",
  description: "Send a set of option buttons to the user to choose from.",
  inputSchema: z.object({
    options: z
      .array(
        z.object({
          label: z.string().describe("The label of the option"),
          value: z.string().describe("The value of the option"),
        }),
      )
      .describe(
        `An array of option objects to display to the user. 
        For example, [{ label: 'Search the web!', value: 'Can you help me find more sources?' }, { label: 'Summarize in a report', value: 'Summarize the information in a report.' }]`,
      ),
  }),
  outputSchema: z.object({
    options: z.array(
      z.object({
        label: z.string(),
        value: z.string(),
      }),
    ),
  }),
  execute: async ({ context }) => {
    try {
      const { options } = context;
      return { options: options };
    } catch (error) {
      return { options: [] };
    }
  },
});

export const optionsAgent = new Agent({
  name: "options",
  instructions: `
  You are an assistant that always responds to the user by giving them 2–3 helpful button options to choose from, using the optionsTool.

  1. Read the user's message or question.
  2. Think of a few clear and useful next-step options the user might want.
  3. Use the optionsTool to send those options back to the user.

  Do NOT answer the question directly. Always call optionsTool with relevant choices instead.
  `,
  model: openai("gpt-4.1-nano"),
  tools: { optionsTool },
});
