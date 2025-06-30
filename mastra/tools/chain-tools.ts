import { createTool } from "@mastra/core";
import { z } from "zod";

const thinkingToolInputSchema = z.object({
  task: z
    .string()
    .describe(
      "What is this thought chain for? It can be for 'Summarizing response', or 'Trying to understand the question', or other tasks.",
    ),
  context: z.string(),
  questions: z
    .array(z.string())
    .describe(
      "What do I still don't know about the task? What am I trying to figure out or accomplish?",
    ),
  thinking: z
    .string()
    .max(1000)
    .describe(
      "Your extended thought chain. You may think for as long as you want, but limit it to a few paragraphs.",
    ),
});

export const thinkingTool = createTool({
  id: "thinking-tool",
  description: `Think about the user's request and provide a response.`,
  inputSchema: thinkingToolInputSchema,
  outputSchema: thinkingToolInputSchema,
  execute: async ({ context }) => {
    try {
      return context;
    } catch (error) {
      console.error("Thinking tool error:", error);
      return context;
    }
  },
});

export const clarificationTool = createTool({
  id: "clarification-tool",
  description: `
  Asks user clarifying questions before workflow generation.
  
  Rules:
  - Must ask 1-3 specific questions
  - Questions should target missing information
  - Should explain why each question is needed
  - Must be used when request is ambiguous
  `,
  inputSchema: z.object({
    questions: z.array(z.string()).min(1).max(3),
  }),
  outputSchema: z.object({ questions: z.array(z.string()) }),
  execute: async ({ context }) => {
    try {
      const { questions } = context;
      return { questions };
    } catch (error) {
      console.error("Clarification tool error:", error);
      return { questions: [] };
    }
  },
});
