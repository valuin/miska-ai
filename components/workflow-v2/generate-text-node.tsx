import { type NodeProps, Position } from "@xyflow/react";
import {
  NodeHeader,
  NodeHeaderAction,
  NodeHeaderActions,
  NodeHeaderIcon,
  NodeHeaderTitle,
} from "@/components/workflow-v2/node-header";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BaseNode } from "@/components/workflow-v2/base-node";
import { LabeledHandle } from "@/components/workflow-v2/labeled-handle";
import { NodeHeaderStatus } from "@/components/workflow-v2/node-header-status";
import { AlertTriangle, Bot, Trash, User } from "lucide-react";
import { useWorkflowUiState } from "@/lib/store/workflow-ui-store";
import { useWorkflow } from "@/hooks/use-workflow";
import type { GenerateTextNode } from "@/hooks/workflow/types";

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
  const { setActiveHumanInputNode, activeHumanInputNode } =
    useWorkflowUiState();
  const { nodeUserInputs } = useWorkflow();

  const isHumanInput = data.config.type === "human-input";
  const isActive = activeHumanInputNode?.id === id;
  const isInputMissing = isHumanInput && !nodeUserInputs[id]?.trim();

  const handleNodeClick = () => {
    if (isHumanInput) {
      setActiveHumanInputNode({ id, description: data.config.description });
    } else {
      setActiveHumanInputNode(null);
    }
  };

  return (
    <BaseNode
      selected={selected}
      onClick={handleNodeClick}
      className={cn("w-[600px] p-0", {
        "hover:ring-orange-500": isHumanInput,
        "ring-2 ring-orange-500": isActive,
        "border-orange-500": data.status === "running",
        "border-red-500": data.status === "error" || isInputMissing,
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
          {data.config.type === "human-input"
            ? "Human Input"
            : data.config?.agent || "Generate Text"}
        </NodeHeaderTitle>
        <NodeHeaderActions>
          <NodeHeaderStatus status={data.status} />
          {isInputMissing && (
            <div className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="size-4" />
              <span className="text-xs">Input Required</span>
            </div>
          )}
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
          {data.config.type === "human-input"
            ? data.config?.description || "Human input required"
            : data.config?.description || "Agent task"}
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
