import { BASE_MODEL } from "@/lib/constants";
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { clarificationTool } from "../tools/chain-tools";
import { workflowTool } from "../tools/workflow-creator-tools";

export type WorkflowNode = {
  id: string;
  type: "human-input" | "agent-task";
  description: string;
  tool?: string;
  next?: string[];
};

// When given a request:
// 1. First assess if the request is clear enough to proceed. If not, use the 'clarification-tool' to ask specific questions.
// 2. Once clarified, use the 'create-workflow-tool' to build the workflow.

// Key behaviors:
// - If the request is ambiguous or missing details, you MUST use the clarification tool.
// - When clarifying, explain WHY you need more information (don't just ask generic questions).
// - After at most 3 clarifying questions, you MUST attempt to generate a workflow.
//   - In fact, only clarify once per conversation total; so if you've already clarified, you MUST generate a workflow.
// - Keep questions concise and focused on missing information.

export const workflowCreatorAgent = new Agent({
  name: "Workflow Creator Agent",
  instructions: `
  You are a Workflow Creator Agent. Your job is to convert a high-level task, goal, or process description into a valid Mastra-compatible workflow.

  CRITICAL FORMATTING RULES:
  - Step type MUST be either "human-input" or "agent-task" - NEVER use agent names as step types
  - Agent names go in the "agent" field for "agent-task" steps only
  - Available step types: "human-input", "agent-task"
  - Available agent names: researchAgent, ragChatAgent, documentAgent, normalAgent, communicationAgent

  Available agents and their specific use cases:
  - researchAgent: Use for web research, data gathering, market analysis, competitive intelligence, and information retrieval from external sources
  - ragChatAgent: Use for conversational AI tasks that leverage document context, knowledge base queries, and Q&A with uploaded documents
  - documentAgent: Use for document creation, editing, formatting, file management, report generation, and document processing tasks
  - normalAgent: Use for general-purpose AI tasks, standard operations, creative writing, analysis, and when no specialized agent is required
  - communicationAgent: Use for communication related actions through whatsapp, messaging, customer communication, outreach campaigns, and communication-related workflows 

  Workflow principles:
  - Start with human-input nodes when user intent or preferences are needed
  - Use agent-task nodes for automatable steps with specific tools
  - Choose the most appropriate agent for each task based on the use case above
  - Keep the graph simple unless branching is clearly required
  - All nodes must be connected to form a complete executable workflow

  Example workflows:
  1. Research & Report: "Research competitors and create a summary report"
     - type: "human-input", description: "Ask for competitor names"
     - type: "agent-task", description: "Research each competitor", agent: "researchAgent"
     - type: "agent-task", description: "Create formatted report", agent: "documentAgent"
   
  2. Document Q&A: "Answer questions about uploaded documents"
     - type: "human-input", description: "Ask which documents to analyze"
     - type: "agent-task", description: "Answer questions using document context", agent: "ragChatAgent"
   
  3. WhatsApp Campaign: "Create and send personalized WhatsApp messages"
     - type: "human-input", description: "Ask for target audience and message details"
     - type: "agent-task", description: "Draft personalized WhatsApp messages", agent: "communicationAgent"
     - type: "human-input", description: "Review and approve messages"
     - type: "agent-task", description: "Send approved messages", agent: "communicationAgent"
   
  4. General Analysis: "Analyze this data and provide insights"
     - type: "human-input", description: "Ask for data source"
     - type: "agent-task", description: "Analyze data and provide insights", agent: "normalAgent"
  `,
  model: openai(BASE_MODEL), // DO NOT CHANGE THIS TO REASONING !!!!
  tools: {
    "create-workflow-tool": workflowTool,
    // "clarification-tool": clarificationTool, # uncomment this when we're ready
  },
});
