"use client";

import { StatusEdge } from "@/components/flow/status-edge";
import type { EdgeExecutionState } from "@/lib/utils/workflows/workflow-execution-engine";
import type { EdgeProps } from "@xyflow/react";

export type StatusEdgeController = Omit<StatusEdge, "data"> & {
  type: "status";
  data: {
    executionState?: EdgeExecutionState;
  };
};

export function StatusEdgeController({
  data,
  ...props
}: EdgeProps<StatusEdgeController>) {
  return (
    <StatusEdge
      {...props}
      data={{
        error: !!data.executionState?.error,
      }}
    />
  );
}
