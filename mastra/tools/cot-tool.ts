import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { BASE_MODEL } from "@/lib/constants";

export const planTodosTool = createTool({
  id: "planTodos",
  description:
    "Generate a concise, ordered list of todos to accomplish the given task. Each todo should have a 2-3 word title and a brief description.",
  inputSchema: z.object({
    task: z
      .string()
      .describe(
        "The overall task or goal to break down into actionable todo titles."
      ),
  }),
  outputSchema: z.object({
    todos: z
      .array(
        z.object({
          title: z
            .string()
            .describe("A 2-3 word, action-oriented todo title."),
          description: z.string().describe("A concise description of the todo.")
        })
      )
      .describe("Ordered list of todos to complete the task."),
  }),
  execute: async ({ context }: { context: { task: string } }) => {
    const { task } = context;

    const { object } = await generateObject({
      model: openai(BASE_MODEL),
      system: "You are a helpful assistant that creates a concise, ordered list of todos to accomplish the given task. Each todo should have a 2-3 word title and a brief description.",
      prompt: `Generate a todo list for the following task: ${task}`,
      schema: z.object({
        todos: z
          .array(
            z.object({
              title: z
                .string()
                .describe("A 2-3 word, action-oriented todo title."),
              description: z
                .string()
                .describe("A concise description of the todo."),
            })
          )
          .describe("Ordered list of todos to complete the task."),
      }),
    });

    return object;
  },
});
