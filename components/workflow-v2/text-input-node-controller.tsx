"use client";

import { TextInputNode } from "@/components/workflow-v2/text-input-node";
import { useWorkflow } from "@/hooks/use-workflow";
import type { NodeExecutionState } from "@/lib/utils/workflows/workflow-execution-engine";
import type { NodeProps } from "@xyflow/react";
import { useCallback } from "react";

export type TextInputNodeController = Omit<TextInputNode, "data"> & {
  type: "text-input";
  data: Omit<TextInputNode["data"], "status"> & {
    executionState?: NodeExecutionState;
  };
};

export function TextInputNodeController({
  id,
  data,
  ...props
}: NodeProps<TextInputNodeController>) {
  const updateNode = useWorkflow((state) => state.updateNode);
  const deleteNode = useWorkflow((state) => state.deleteNode);

  const handleTextChange = useCallback(
    (value: string) => {
      updateNode(id, "text-input", { config: { value } });
    },
    [id, updateNode]
  );

  const handleDeleteNode = useCallback(() => {
    deleteNode(id);
  }, [id, deleteNode]);

  return (
    <TextInputNode
      id={id}
      data={{
        status: data.executionState?.status,
        config: data.config,
      }}
      {...props}
      onTextChange={handleTextChange}
      onDeleteNode={handleDeleteNode}
    />
  );
}
