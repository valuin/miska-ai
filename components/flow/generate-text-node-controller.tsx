"use client";

import { GenerateTextNode } from "@/components/flow/generate-text-node";
import { useWorkflow } from "@/hooks/use-workflow";
import type { NodeExecutionState } from "@/lib/utils/workflows/workflow-execution-engine";
import type { NodeProps } from "@xyflow/react";
import { useCallback } from "react";

export type GenerateTextNodeController = Omit<GenerateTextNode, "data"> & {
  type: "generate-text";
  data: Omit<GenerateTextNode["data"], "status"> & {
    executionState?: NodeExecutionState;
  };
};

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
