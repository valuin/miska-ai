"use client";

import { AGENT_TYPES } from "@/mastra/agents/agent-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const nodeSchema = z.object({
  currentNodeDescription: z.string().min(1, "Node description is required."),
  currentNodeAgent: z.string().min(1, "An agent is required."),
});

export function NodeBuilder() {
  const {
    nodes,
    edges,
    currentNodeDescription,
    currentNodeAgent,
    setCurrentNodeDescription,
    setCurrentNodeAgent,
    setNodes,
    setEdges,
  } = useWorkflowStore();

  const addNode = () => {
    const result = nodeSchema.safeParse({
      currentNodeDescription,
      currentNodeAgent,
    });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    const newNodeId = `node-${nodes.length + 1}`;
    const newNode = {
      id: newNodeId,
      type: "workflowNode",
      position: { x: 250, y: 100 + nodes.length * 250 },
      data: {
        type: "agent-task",
        description: currentNodeDescription,
        agent: currentNodeAgent,
      },
    };

    setNodes([...nodes, newNode]);

    if (nodes.length > 0) {
      const prevNodeId = nodes[nodes.length - 1].id;
      const newEdge = {
        id: `edge-${prevNodeId}-${newNodeId}`,
        source: prevNodeId,
        target: newNodeId,
        type: "custom",
      };
      setEdges([...edges, newEdge]);
    }

    setCurrentNodeDescription("");
    setCurrentNodeAgent("");
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter((node) => node.id !== nodeId));
    setEdges(
      edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg">Nodes</Label>
        <div className="border rounded-md bg-muted min-h-[100px] max-h-[220px] flex flex-col divide-y divide-white/10 overflow-x-hidden overflow-y-auto">
          {nodes.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between text-sm hover:bg-muted-foreground/10 px-2"
            >
              <span className="w-full">
                <span className="text-xs bg-white rounded-lg px-1 py-px text-[#27272a] mr-1">
                  {n.data.type === "agent-task" ? n.data.agent : "Human Input"}
                </span>
                <span className="text-xs">{n.data.description}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteNode(n.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-lg">Create a new node</Label>
        <div className="flex flex-col gap-2">
          <Label htmlFor="node-agent">Select Agent</Label>
          <Select value={currentNodeAgent} onValueChange={setCurrentNodeAgent}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an agent" />
            </SelectTrigger>
            <SelectContent>
              {AGENT_TYPES.map((agent) => (
                <SelectItem key={agent} value={agent}>
                  {agent}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="node-description">Node Description</Label>
          <Textarea
            className="overflow-x-visible"
            id="node-description"
            value={currentNodeDescription}
            onChange={(e) => setCurrentNodeDescription(e.target.value)}
            placeholder="Describe the agent's task for this node."
          />
          <Button onClick={addNode}>Add Node</Button>
        </div>
      </div>
    </div>
  );
}
