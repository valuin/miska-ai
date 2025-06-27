import { createTool } from "@mastra/core/tools";
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
      .describe("An array of option objects to display to the user"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    try {
      const { options } = context;
      console.log("options", options);
      return {
        success: true,
        message: "Options sent to user successfully.",
      };
    } catch (error) {
      console.error("Error sending options:", error);
      return {
        success: false,
        message: "Failed to send options.",
      };
    }
  },
});
