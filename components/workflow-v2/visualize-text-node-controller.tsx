"use client";

import { VisualizeTextNode } from "@/components/workflow-v2/visualize-text-node";
import { useWorkflow } from "@/hooks/use-workflow";
import type { NodeExecutionState } from "@/lib/utils/workflows/workflow-execution-engine";
import type { NodeProps } from "@xyflow/react";
import { useCallback } from "react";

export type VisualizeTextNodeController = Omit<VisualizeTextNode, "data"> & {
  type: "visualize-text";
  data: {
    executionState?: NodeExecutionState;
  };
};

export function VisualizeTextNodeController({
  id,
  data,
  ...props
}: NodeProps<VisualizeTextNodeController>) {
  const deleteNode = useWorkflow((state) => state.deleteNode);

  const handleDeleteNode = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  return (
    <VisualizeTextNode
      id={id}
      data={{
        input: data.executionState?.targets?.input,
        status: data.executionState?.status,
      }}
      onDeleteNode={handleDeleteNode}
      {...props}
    />
  );
}
