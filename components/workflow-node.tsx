import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

interface WorkflowNodeData extends Record<string, unknown> {
  type: "human-input" | "agent-task";
  description: string;
  tool?: string;
  selected?: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
}

type WorkflowNodeType = Node<WorkflowNodeData, "workflowNode">;

function WorkflowNode({ data, selected }: NodeProps<WorkflowNodeType>) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card shadow w-96 p-4 flex flex-col items-center border",
        selected ? "ring-2 ring-primary ring-offset-2" : "",
      )}
    >
      <div className="text-sm uppercase text-muted-foreground font-semibold mb-1">
        {data.type === "human-input" ? "🧍 Human Input" : "🤖 Agent Task"}
      </div>
      <div className="text-base font-medium text-center">
        {data.description}
      </div>
      {data.tool && (
        <div className="text-xs text-muted-foreground mt-1 italic">
          Tool: {data.tool}
        </div>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(WorkflowNode);
