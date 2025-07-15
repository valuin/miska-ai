import type { Node, Edge } from '@xyflow/react';

// fallback data for initial nodes

export const initialNodes: Node[] = [
  {
    id: '1',
    type: 'workflowNode',
    position: { x: 200, y: 100 },
    data: {
      type: 'human-input',
      description: 'User provides input data',
      tool: undefined,
    },
  },
  {
    id: '2',
    type: 'workflowNode',
    position: { x: 200, y: 300 },
    data: {
      type: 'agent-task',
      description: 'Agent processes the input',
      tool: 'AI Processor',
    },
  },
  {
    id: '3',
    type: 'workflowNode',
    position: { x: 200, y: 500 },
    data: {
      type: 'agent-task',
      description: 'Agent generates report',
      tool: 'Report Generator',
    },
  },
];

// Define the edges between workflow nodes
export const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', type: 'custom' },
  { id: 'e2-3', source: '2', target: '3', type: 'custom' },
];
