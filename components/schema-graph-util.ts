import type { Edge, Node } from "@xyflow/react";

// Arrange nodes in columns: 2 per column, then next column
function getColumnLayoutPositions(count: number, xStart = 200, yStart = 100, xGap = 300, yGap = 180, perCol = 2) {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const col = Math.floor(i / perCol);
    const row = i % perCol;
    positions.push({
      x: xStart + col * xGap,
      y: yStart + row * yGap,
    });
  }
  return positions;
}

export function extractWorkflowGraph(result: any): { nodes: Node[]; edges: Edge[] } {
  let workflowArr = Array.isArray(result?.workflow)
    ? result.workflow
    : Array.isArray(result?.steps)
      ? result.steps
      : undefined;

  if (!workflowArr && typeof result === "object" && result !== null) {
    if (Array.isArray(result.workflow)) workflowArr = result.workflow;
    else if (Array.isArray(result.steps)) workflowArr = result.steps;
  }

  if (!workflowArr && typeof result?.result === "object" && result.result !== null) {
    if (Array.isArray(result.result.workflow)) workflowArr = result.result.workflow;
    else if (Array.isArray(result.result.steps)) workflowArr = result.result.steps;
  }

  if (!Array.isArray(workflowArr) || workflowArr.length === 0) {
    return { nodes: [], edges: [] };
  }

  const positions = getColumnLayoutPositions(workflowArr.length);

  const nodes: Node[] = workflowArr.map((node, idx) => ({
    id: String(node.id ?? idx + 1),
    type: "workflowNode",
    position: positions[idx],
    data: {
      type: node.type,
      description: node.description,
      tool: node.tool,
    },
  }));

  const edges: Edge[] = [];
  for (let i = 0; i < workflowArr.length; i++) {
    const node = workflowArr[i];
    if (Array.isArray(node.next) && node.next.length > 0) {
      (node.next as (string | number)[]).forEach((targetId: string | number) => {
        edges.push({
          id: `e${node.id}-${targetId}`,
          source: String(node.id ?? i + 1),
          target: String(targetId),
          type: "custom",
        });
      });
    } else if (i < workflowArr.length - 1 && !workflowArr[i].next) {
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