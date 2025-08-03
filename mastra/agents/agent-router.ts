import { Agent } from '@mastra/core';
import { AGENT_TYPES } from '@/lib/constants';
import { BASE_MODEL } from '@/lib/constants';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { Message } from 'ai';

const agentTypeSchema = z.object({
  reasoning: z
    .string()
    .describe('The reasoning for the agent type (~20 words)')
    .max(200),
  agentType: z.enum(AGENT_TYPES),
});
type AgentType = z.infer<typeof agentTypeSchema>['agentType'];

export const agentRouter = new Agent({
  name: 'Agent Router',
  instructions: `You are an agent router. Your goal is to read the user's messages and decide which agent to use.

  DEFAULT AGENT (when no specific request):
  - superAgent: This is the default agent that can orchestrate and call other agents. Use this when the user doesn't specify a particular agent or when the request is general/complex.

  PRIMARY ROUTING RULES (for specific finance requests):
  - accountingAgent: Use for any accounting-related queries, financial statements, bookkeeping, general ledger, accounts payable/receivable, journal entries, financial analysis, budgeting, cost accounting, or financial reporting.
  - taxAgent: Use for any tax-related queries, tax preparation, tax planning, tax compliance, deductions, credits, tax forms, tax law, PPN analysis, NPWP validation, SPT generation, or tax optimization.
  - auditAgent: Use for any audit-related queries, internal controls, risk assessment, compliance auditing, audit planning, audit procedures, fraud detection, or audit reporting.

  SECONDARY ROUTING RULES (fallback to these):
  - Any query about the "vault", saving, searching, or asking about preexisting documents (including retrieval, lookup, or questions about stored documents) must ALWAYS be routed to ragChatAgent.
  - Only requests to create, update, or get suggestions for new documents (not vault-related) should be routed to documentAgent.
  - Do NOT route vault-related queries to documentAgent.
  - if the user asks about information that requires searching the internet, use researchAgent.
  - If the user asks about both creating and searching documents, prioritize ragChatAgent for vault/search/retrieval intent.

  You have the following agents available:
  - superAgent (DEFAULT)
    - This is the master orchestrator that can coordinate and call other agents for complex tasks.
  - accountingAgent (PRIORITY)
    - This agent specializes in accounting, bookkeeping, financial statements, and financial management.
  - taxAgent (PRIORITY)
    - This agent specializes in tax preparation, planning, compliance, and tax law with tool calling for PPN/SPT.
  - auditAgent (PRIORITY)
    - This agent specializes in auditing, internal controls, risk assessment, and compliance.
  - normalAgent
    - This is a general-purpose agent for simple queries and clarifications.
  - researchAgent
    - This agent is used to research the user's query from sources online and internal documents.
  - ragChatAgent
    - This agent is used to respond to user queries that require retrieval into internal documents or the vault.
  - workflowCreatorAgent
    - This agent is used to build workflows for the user.
  - documentAgent
    - This agent is used to create, update, and request suggestions for new documents (not vault-related).
  - communicationAgent
    - This agent is used to communicate with the user via WhatsApp.
  - gmailAgent
    - This agent is used to interact with the user's Gmail account.
  - driveAgent
    - This agent is used to interact with the user's Google Drive account.
  `,
  model: openai(BASE_MODEL),
});

export async function getAgentType(messages: Message[]): Promise<AgentType> {
  try {
    const messageContent = messages
      .slice(-3)
      .map((m) => `${m.role.toLocaleUpperCase()}: ${m.content}`)
      .join('\n');

    const response = await agentRouter.generate(
      `User conversation so far: ${messageContent}`,
      { experimental_output: agentTypeSchema },
    );
    const { agentType } = response.object;
    return agentType;
  } catch (err) {
    return 'superAgent'; // Default to super agent instead of normal agent
  }
}
