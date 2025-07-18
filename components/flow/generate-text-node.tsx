import { type Node, type NodeProps, Position } from "@xyflow/react";

import {
  NodeHeader,
  NodeHeaderAction,
  NodeHeaderActions,
  NodeHeaderIcon,
  NodeHeaderTitle,
} from "@/components/flow/node-header";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BaseNode } from "@/components/flow/base-node";
import { LabeledHandle } from "@/components/flow/labeled-handle";
import { NodeHeaderStatus } from "@/components/flow/node-header-status";
import { Bot, Trash, User } from "lucide-react";

export type GenerateTextData = {
  status: "processing" | "error" | "success" | "idle" | undefined;
  config: {
    agent: string;
    type: "human-input" | "agent-task";
    description: string;
  };
};

export type GenerateTextNode = Node<GenerateTextData, "generate-text">;

interface GenerateTextNodeProps extends NodeProps<GenerateTextNode> {
  onDeleteNode: () => void;
}

export function GenerateTextNode({
  id,
  selected,
  deletable,
  data,
  onDeleteNode,
}: GenerateTextNodeProps) {
  return (
    <BaseNode
      selected={selected}
      className={cn("w-[600px] p-0 hover:ring-orange-500", {
        "border-orange-500": data.status === "processing",
        "border-red-500": data.status === "error",
      })}
    >
      <div className="flex flex-col gap-2 min-w-0">
        <LabeledHandle
          id="prompt"
          title="Prompt"
          type="target"
          position={Position.Top}
          className="col-span-2"
        />
      </div>
      <NodeHeader className="m-0">
        <NodeHeaderIcon className="mr-2">
          {data.config.type === "human-input" ? <User /> : <Bot />}
        </NodeHeaderIcon>
        <NodeHeaderTitle>
          {data.config?.description || "Generate Text"}
        </NodeHeaderTitle>
        <NodeHeaderActions>
          <NodeHeaderStatus status={data.status} />
          {deletable && (
            <NodeHeaderAction
              onClick={onDeleteNode}
              variant="ghost"
              label="Delete node"
            >
              <Trash />
            </NodeHeaderAction>
          )}
        </NodeHeaderActions>
      </NodeHeader>
      <Separator />
      <div className="p-4 flex flex-col gap-4">
        <div className="text-sm text-muted-foreground">
          {data.config?.description || "Agent task"}
        </div>
      </div>

      <div className="flex justify-center">
        <LabeledHandle
          id="result"
          title="Result"
          type="source"
          position={Position.Bottom}
        />
      </div>
    </BaseNode>
  );
}
