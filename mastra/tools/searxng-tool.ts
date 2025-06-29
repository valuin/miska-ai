import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { SearxngClient } from "@agentic/searxng";

const searxng = new SearxngClient({
  apiBaseUrl: "https://searxng-railway-production.up.railway.app",
});

export const searxngTool = createTool({
  id: "searxng",
  description: "Search the web using Searxng and return results.",
  inputSchema: z.object({
    query: z.string().describe("The search query to use."),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string().optional(),
      })
    ),
  }),
  execute: async (context) => {
    const query =
      (context as any).query ??
      (context as any).input?.query ??
      (context as any).context?.query ??
      "";
    console.log("SearxngTool context:", context);
    if (typeof query !== "string") {
      console.error("SearxngTool: query is not a string", query);
      throw new Error("Query must be a string");
    }
    const searchResponse = await searxng.search({ query });
    return {
      results: (searchResponse.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
      })),
    };
  },
});