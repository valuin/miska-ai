import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { clarificationTool } from "./chain-tools";

export const optionsTool = createTool({
  id: "options",
  description: `Send a set of option buttons to the user to choose from.
    Always include an option for the user to crawl or find more detailed information, such as 'Find more detailed information from the site', or 'Write me a detailed report'.
    Other options could include 'Find me similar services.' or 'Would you like me to draft you an email?', based on the context of the conversation.`,
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
        For example in the case for a research agent, [
          { label: 'Crawl for more details', value: 'Please crawl the site for more detailed information.' },
          { label: 'Write me a detailed report', value: 'Please write me a detailed report about the topic.' }
        ]`,
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

const bypassTool = createTool({
  id: "bypass",
  description: `Bypass the options tool as the user has already been asked to clarify something.`,
  inputSchema: z.object({}),
  outputSchema: z.object({}),
});

export const optionsAgent = new Agent({
  name: "options",
  instructions: `
  You are an assistant that has the ability to respond to the user by giving them 2 - 3 helpful button options to choose from, using the optionsTool.
  You can also call the clarificationTool to ask the user clarifying questions before workflow generation.

  The difference is that optionsTool continue the workflow in another direction, while clarificationTool ensures the current workflow is complete and accurate.
  YOU DO NOT ALWAYS NEED TO CALL THE OPTIONS TOOL OR THE CLARIFICATION TOOL. 
  Make sure the user is not overwhelmed by a clarificationTool or any clarification questions already asked in the LAST GENERATED AGENT RESPONSE.
  
  If the user has already been asked to clarify something, call the bypassTool instead.

  Read the user and agent's message or question. Only choose to offer options if the user has not already been asked to clarify something.
  If the agent's response includes a complete result (such as found documents, a research report, or a draft email), you must offer options to HELP the user choose the next steps.

  1. Think of a few clear and useful next-step options the user might want.
  2. If the user is looking for information (such as after calling a researchAgent), include an option for the user to crawl or find more detailed information.
  3. Use the optionsTool to send those options back to the user.

  Do NOT answer the question directly. Always choose either the bypassTool or the optionsTool.
  `,
  model: openai("gpt-4.1-nano"),
  tools: { optionsTool, clarificationTool, bypassTool },
});
