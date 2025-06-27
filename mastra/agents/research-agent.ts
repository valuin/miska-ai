import { Agent } from "@mastra/core/agent";
import { createMastraTools } from "@agentic/mastra";
import { openai } from "@ai-sdk/openai";
import { SearxngClient } from "@agentic/searxng";
import { optionsTool } from "../tools/utility-tools";

const searxng = new SearxngClient({
  apiBaseUrl: "https://searxng-railway-production.up.railway.app",
});

export const researchAgent = new Agent({
  name: "research",
  instructions: `
      You are a helpful web assistant that can search the web and extract information using the Searxng search tool.

      Your primary functions are:
      - Perform web searches using Searxng
      - Retrieve and summarize information from search results
      - Guide the user to provide more specific queries if needed

      When responding:
      - Ask for a specific query if none is provided
      - Be specific about what information you are searching for
      - When presenting results, summarize and cite the most relevant findings

      Use the Searxng search tool to perform web searches and answer user questions. Include the search citations as links throughout your response.
  `,
  model: openai("gpt-4o-mini"),
  tools: { ...createMastraTools(searxng), optionsTool },
  defaultGenerateOptions: { maxSteps: 4 },
});
