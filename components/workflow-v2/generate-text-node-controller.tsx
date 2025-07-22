"use client";

import { GenerateTextNode } from "@/components/workflow-v2/generate-text-node";
import { useWorkflow } from "@/hooks/use-workflow";
import type { GenerateTextData } from "@/hooks/workflow/types";
import type { NodeExecutionState } from "@/lib/utils/workflows/workflow-execution-engine";
import type { Node, NodeProps } from "@xyflow/react";
import { useCallback } from "react";

export type GenerateTextNodeController = Node<
  Omit<GenerateTextData, "status"> & {
    executionState?: NodeExecutionState;
  },
  "generate-text"
>;

export function GenerateTextNodeController({
  id,
  data,
  ...props
}: NodeProps<GenerateTextNodeController>) {
  const deleteNode = useWorkflow((state) => state.deleteNode);

  const handleDeleteNode = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  return (
    <GenerateTextNode
      id={id}
      data={{
        status: data.executionState?.status,
        config: data.config,
      }}
      {...props}
      onDeleteNode={handleDeleteNode}
    />
  );
}
