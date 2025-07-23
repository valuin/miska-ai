import { Agent } from '@mastra/core/agent';
import { clarificationTool } from './chain-tools';
import { createTool } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
import { TINY_MODEL } from '@/lib/constants';
import { z } from 'zod';

export const optionsTool = createTool({
  id: 'options',
  description: `Send a set of option buttons to the user to choose from.
    Always include an option for the user to crawl or find more detailed information, such as 'Find more detailed information from the site', or 'Write me a detailed report'.
    Other options could include 'Find me similar services.' or 'Would you like me to draft you an email?', based on the context of the conversation.`,
  inputSchema: z.object({
    options: z
      .array(
        z.object({
          label: z.string().describe('The label of the option'),
          value: z.string().describe('The value of the option'),
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
  id: 'bypass',
  description: `Bypass the options tool as the user has already been asked to clarify something.`,
  inputSchema: z.object({}),
  outputSchema: z.object({}),
});

export const workflowModifierAgent = new Agent({
  name: 'workflow-modifier',
  instructions: `
  You are an assistant that has the ability to modify and manipulate the workflow in conversation.
  You have access to the following tools:

  - optionsTool: Send a set of option buttons to the user to choose from.
  - clarificationTool: Ask the user clarifying questions before workflow generation.
  - bypassTool: Bypass the options tool as the user has already been asked to clarify something.

  The difference is that optionsTool continue the workflow in another direction, while clarificationTool ensures the current workflow is complete and accurate.
  YOU DO NOT ALWAYS NEED TO CALL THE OPTIONS TOOL OR THE CLARIFICATION TOOL. 
  Make sure the user is not overwhelmed by a clarificationTool or any clarification questions already asked in the LAST GENERATED AGENT RESPONSE.

  If the user has already been asked to clarify something, call the bypassTool instead.

  Read the user and agent's message or question.
  
  If the agent's response includes a complete result (such as found documents, a research report, or a draft email), you must use optionsTool to HELP the user choose the next steps.
  If the user's response is ambiguous, or the agent's response requests clarification WITHOUT an existing clarificationTool call, you must call the clarificationTool.
  If the user's response is not ambiguous, and the agent's response is not requesting clarification, you must call the bypassTool.
  `,
  model: openai(TINY_MODEL),
  tools: { optionsTool, clarificationTool, bypassTool },
});
