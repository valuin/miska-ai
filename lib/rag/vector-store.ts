import { QdrantVector, QDRANT_PROMPT } from "@mastra/qdrant";

export const vectorStore = new QdrantVector({
  url: process.env.QDRANT_URL || "http://localhost:6333",
  apiKey: process.env.QDRANT_API_KEY,
  https: true,
});

export { QDRANT_PROMPT };
