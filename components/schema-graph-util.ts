import type { Edge, Node } from "@xyflow/react";

function getVerticalLayoutPositions(
  count: number,
  xStart = 200,
  yStart = 100,
  yGap = 160,
) {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      x: xStart,
      y: yStart + i * yGap,
    });
  }
  return positions;
}

export function extractWorkflowGraph(workflowArr: any[]): {
  nodes: Node[];
  edges: Edge[];
} {
  if (!Array.isArray(workflowArr) || workflowArr.length === 0) {
    return { nodes: [], edges: [] };
  }

  const positions = getVerticalLayoutPositions(workflowArr.length);

  const nodes: Node[] = workflowArr.map((node, idx) => ({
    id: String(node.id ?? idx + 1),
    type: "workflowNode",
    position: positions[idx],
    data: {
      type: node.type,
      description: node.description,
      agent: node?.agent,
    },
  }));

  const edges: Edge[] = [];
  for (let i = 0; i < workflowArr.length; i++) {
    const node = workflowArr[i];
    if (Array.isArray(node.next) && node.next.length > 0) {
      (node.next as (string | number)[]).forEach(
        (targetId: string | number) => {
          edges.push({
            id: `e${node.id}-${targetId}`,
            source: String(node.id ?? i + 1),
            target: String(targetId),
            type: "custom",
          });
        },
      );
    } else if (i < workflowArr.length - 1 && !node.next) {
      // This handles cases where 'next' is not defined but there's a sequential flow
      edges.push({
        id: `e${nodes[i].id}-${nodes[i + 1].id}`,
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: "custom",
      });
    }
  }

  return { nodes, edges };
}
