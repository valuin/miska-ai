import { memo } from "react";
import { Handle, Position, type NodeProps, type Node, useUpdateNodeInternals } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useReactFlow } from '@xyflow/react';

interface WorkflowNodeData extends Record<string, unknown> {
  type: "human-input" | "agent-task";
  description: string;
  agent?: string;
  tool?: string;
  selected?: boolean;
  humanFeedback?: string;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
}

type WorkflowNodeType = Node<WorkflowNodeData, "workflowNode">;

function WorkflowNode({ id, data, selected }: NodeProps<WorkflowNodeType>) {
  const { setNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const handleHumanFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newFeedback = e.target.value;
    
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              humanFeedback: newFeedback,
            },
          };
        }
        return node;
      })
    );
    
    updateNodeInternals(id);
  };

  return (
    <div
      className={cn(
        "rounded-xl bg-card shadow w-96 p-4 flex flex-col items-center border mb-6",
        selected ? "ring-2 ring-primary ring-offset-2" : "",
      )}
    >
      <div className="text-sm uppercase text-muted-foreground font-semibold mb-1">
        {data.type === "human-input" ? "🧍 Human Input" : "🤖 Agent Task"}
      </div>
      <div className="text-base font-medium text-center">
        {data.description}
      </div>
      <div>
        {data.agent && (
          <span className="text-xs text-muted-foreground mt-1">
            Agent: {data.agent}
          </span>
        )}
      </div>
      {data.tool && (
        <div className="text-xs text-muted-foreground mt-1 italic">
          Tool: {data.tool}
        </div>
      )}
      
      {data.type === "human-input" && (
        <div className="w-full mt-3">
          <Textarea
            placeholder="Enter human feedback..."
            value={data.humanFeedback || ""}
            onChange={handleHumanFeedbackChange}
            onClick={(e) => e.stopPropagation()}
            className="text-sm"
          />
        </div>
      )}
      
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(WorkflowNode);
