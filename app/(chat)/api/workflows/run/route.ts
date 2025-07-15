import { communicationAgent } from "@/mastra/agents/communication-agent";
import { documentAgent } from "@/mastra/agents/document-agent";
import { NextResponse } from "next/server";
import { normalAgent } from "@/mastra/agents/normal-agent";
import { ragChatAgent } from "@/mastra/agents/rag-chat-agent";
import { researchAgent } from "@/mastra/agents/research-agent";
import { workflowCreatorAgent } from "@/mastra/agents/workflow-creator-agent";
import type { Agent } from "@mastra/core/agent";

// Define a type for the workflow schema for better type safety
interface WorkflowNode {
  id: string;
  data: {
    type: string;
    agent: string;
    description: string;
  };
  type: string;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  type: string;
  source: string;
  target: string;
}

// Map agent names to their imported instances
const agentMap: Record<string, Agent<any>> = {
  researchAgent: researchAgent as Agent<any>,
  ragChatAgent: ragChatAgent as Agent<any>,
  workflowCreatorAgent: workflowCreatorAgent as Agent<any>,
  normalAgent: normalAgent as Agent<any>,
  documentAgent: documentAgent as Agent<any>,
  communicationAgent: communicationAgent as Agent<any>,
};

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await req.json();
        console.log("Received request body:", body);

        const { workflowId, workflowSchema, inputQuery } = body;

        if (
          !workflowId ||
          !workflowSchema ||
          inputQuery === null ||
          inputQuery === undefined
        ) {
          console.error("Missing required fields in request body:", {
            hasWorkflowId: !!workflowId,
            hasWorkflowSchema: !!workflowSchema,
            hasInputQuery: !!inputQuery,
          });
          
          const errorData = {
            type: "error",
            message: "Missing workflowId, workflowSchema, or inputQuery"
          };
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          controller.close();
          return;
        }

        console.log(
          `Executing workflow: ${workflowSchema.name} (ID: ${workflowId}) with query: "${inputQuery}"`,
        );

        const nodeResults: any[] = [];
        let currentInput: any = inputQuery;

        // Send initial event
        const initialEvent = {
          type: "workflow_started",
          message: `Starting workflow: ${workflowSchema.name}`,
          totalNodes: workflowSchema.nodes.length
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialEvent)}\n\n`));

        for (const node of workflowSchema.nodes) {
          const agentName = node.data.agent;
          const agentDescription = node.data.description;

          const agent = agentMap[agentName];
          if (!agent) {
            console.warn(`Agent "${agentName}" not found for node ID: ${node.id}`);
            const errorData = {
              type: "node_error",
              nodeId: node.id,
              message: `Agent "${agentName}" not found`,
              description: agentDescription
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
            controller.close();
            return;
          }

          // Send node started event
          const startedEvent = {
            type: "node_started",
            nodeId: node.id,
            agentName,
            description: agentDescription
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(startedEvent)}\n\n`));

          try {
            const systemPrompt = `You are running in a predefined workflow. Do not ask clarifying questions or use the options tool. Execute the task as described.`;
            const result = await agent.generate([
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `${agentDescription}\n\nInput: ${JSON.stringify(currentInput)}`,
              },
            ]);

            console.log(`Agent ${agentName} raw output:`, result);

            const output =
              result && typeof result === "object" && "text" in result
                ? (result as { text: string }).text
                : JSON.stringify(result);

            nodeResults.push({
              nodeId: node.id,
              agentName,
              description: agentDescription,
              output,
            });

            // Send node completed event
            const completedEvent = {
              type: "node_completed",
              nodeId: node.id,
              agentName,
              description: agentDescription,
              output
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(completedEvent)}\n\n`));

            currentInput = output;
          } catch (agentError) {
            console.error(
              `Error executing agent ${agentName} for node ID ${node.id}:`,
              agentError,
            );
            
            const errorData = {
              type: "node_error",
              nodeId: node.id,
              agentName,
              description: agentDescription,
              error: `Agent execution failed for ${agentName}: ${agentError}`
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
            controller.close();
            return;
          }
        }

        // Send workflow completed event
        const completedEvent = {
          type: "workflow_completed",
          message: "Workflow execution completed successfully",
          output: nodeResults
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(completedEvent)}\n\n`));
        controller.close();
      } catch (error) {
        console.error("Error in workflow execution API:", error);
        
        const errorData = {
          type: "error",
          message: "Internal Server Error",
          error: error instanceof Error ? error.message : String(error)
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
