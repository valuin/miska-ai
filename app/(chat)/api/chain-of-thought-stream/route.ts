import { createMastraAgentAPIRoute } from '@/lib/ai/mastra-integration';

// This API route will use the ragChatAgent for Chain of Thought generation
// This ensures that the CoT process itself leverages RAG capabilities.
export const POST = createMastraAgentAPIRoute('ragChatAgent');