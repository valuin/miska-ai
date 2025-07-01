import { BaseEdge, getBezierPath, Position } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";

export default function SchemaEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition || Position.Bottom,
    targetX,
    targetY,
    targetPosition: targetPosition || Position.Top,
  });

  return <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />;
}
