"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export type StatusEdge = EdgeProps & {
  data: {
    error?: boolean;
  };
};

export function StatusEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
}: StatusEdge) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: data?.error ? "#ef4444" : "#64748b",
        }}
      />
      {data?.error && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "absolute px-2 py-1 text-xs font-medium rounded-md bg-red-500 text-white",
              "transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            )}
            style={{
              left: labelX,
              top: labelY,
            }}
          >
            Error
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}