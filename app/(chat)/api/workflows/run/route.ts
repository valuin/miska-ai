import { communicationAgent } from "@/mastra/agents/communication-agent";
import { documentAgent } from "@/mastra/agents/document-agent";
import { NextResponse } from "next/server";
import { normalAgent } from "@/mastra/agents/normal-agent";
import { ragChatAgent } from "@/mastra/agents/rag-chat-agent";
import { researchAgent } from "@/mastra/agents/research-agent";
import { workflowCreatorAgent } from "@/mastra/agents/workflow-creator-agent";
import type { Agent } from "@mastra/core/agent";


interface WorkflowNode {
  id: string;
  data: {
    type: string;
    agent?: string;
    description?: string;
    config?: {
      value?: string;
      model?: string;
    };
  };
  type: string;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  type: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

const agentMap: Record<string, Agent<any>> = {
  researchAgent: researchAgent as Agent<any>,
  ragChatAgent: ragChatAgent as Agent<any>,
  workflowCreatorAgent: workflowCreatorAgent as Agent<any>,
  normalAgent: normalAgent as Agent<any>,
  documentAgent: documentAgent as Agent<any>,
  communicationAgent: communicationAgent as Agent<any>,
};

// Remove the deterministic node type to agent mapping entirely
// Agent selection is now fully dynamic based on node.data.agent

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

        const nodeResults: any[] = [];
        const effectiveInput = inputQuery?.trim() || workflowSchema.description || "Execute workflow step";
        let currentInput: any = effectiveInput;

        console.log(
          `Executing workflow: ${workflowSchema.name} (ID: ${workflowId}) with effective query: "${effectiveInput}"`,
        );

        // Send initial event
        const initialEvent = {
          type: "workflow_started",
          message: `Starting workflow: ${workflowSchema.name}`,
          totalNodes: workflowSchema.nodes.length
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialEvent)}\n\n`));

        // Transform nodes to their executable types (generate-text or text-input)
        const transformedNodes = workflowSchema.nodes.map((node: WorkflowNode) => {
          if (node.type === 'workflowNode') {
            let newType = 'generate-text';
            const agent = node.data.agent || 'normalAgent';
            if (agent === 'human' || agent === 'user') {
              newType = 'text-input';
            }
            return {
              ...node,
              type: newType,
            };
          }
          return node;
        });

        // Filter for executable nodes after transformation
        const executableNodes = transformedNodes.filter(
          (node: WorkflowNode) => node.type === "generate-text" || node.type === "text-input"
        );
        console.log("Executable nodes after filter:", executableNodes);

        for (const node of executableNodes) {
          const agentName = node.data.agent || "normalAgent";
          const agentDescription = node.data.description || node.data.config?.value || `Execute ${node.type} node`;
          
          // For text-input nodes, use the config value as the prompt, but still execute
          let nodePrompt = agentDescription;
          if (node.type === "text-input" && node.data.config?.value) {
            nodePrompt = node.data.config.value;
          }

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
                content: `${nodePrompt}\n\nInput: ${JSON.stringify(currentInput)}`,
              },
            ]);

            console.log(`Agent ${agentName} raw result:`, result);

            let output: string;
            if (result && typeof result === "object" && "text" in result) {
              output = (result as { text: string }).text;
            } else if (typeof result === "string") {
              output = result;
            } else {
              output = JSON.stringify(result, null, 2);
            }
            console.log(`Agent ${agentName} processed output:`, output);

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
