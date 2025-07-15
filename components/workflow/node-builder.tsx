"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface NodeBuilderProps {
  nodes: any[];
  currentNodeDescription: string;
  currentNodeAgent: string;
  agentNames: string[];
  onCurrentNodeDescriptionChange: (value: string) => void;
  onCurrentNodeAgentChange: (value: string) => void;
  onAddNode: () => void;
  onDeleteNode: (nodeId: string) => void;
}

export function NodeBuilder({
  nodes,
  currentNodeDescription,
  currentNodeAgent,
  agentNames,
  onCurrentNodeDescriptionChange,
  onCurrentNodeAgentChange,
  onAddNode,
  onDeleteNode,
}: NodeBuilderProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Nodes</Label>
        <div className="p-2 pt-0 border rounded-md bg-muted min-h-[100px] flex flex-col divide-y divide-white/10">
          {nodes.map((n) => (
            <div
              key={n.id}
              className="flex items-center justify-between text-sm p-1"
            >
              <span className="w-full">
                <span className="text-xs bg-white rounded-lg px-1 py-px text-[#27272a] mr-1">
                  {n.data.type === "agent-task"
                    ? n.data.agent
                    : "Human Input"}
                </span>
                <span className="text-xs">{n.data.description}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteNode(n.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="node-description">Node Description</Label>
        <Textarea
          className="overflow-x-visible"
          id="node-description"
          value={currentNodeDescription}
          onChange={(e) => onCurrentNodeDescriptionChange(e.target.value)}
          placeholder="Describe the agent's task for this node."
        />
      </div>
      <div>
        <Label htmlFor="node-agent">Select Agent</Label>
        <Select
          value={currentNodeAgent}
          onValueChange={onCurrentNodeAgentChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose an agent" />
          </SelectTrigger>
          <SelectContent>
            {agentNames.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onAddNode}>Add Node</Button>
    </div>
  );
}