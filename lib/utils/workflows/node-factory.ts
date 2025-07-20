import type { GenerateTextNodeController } from '@/components/workflow-v2/generate-text-node-controller';
import type { PromptCrafterNodeController } from '@/components/workflow-v2/prompt-crafter-node-controller';
import type { TextInputNodeController } from '@/components/workflow-v2/text-input-node-controller';
import type { VisualizeTextNodeController } from '@/components/workflow-v2/visualize-text-node-controller';
import type { FlowNode } from '@/lib/utils/workflows/workflow';
import { nanoid } from 'nanoid';

export type NodePosition = {
  x: number;
  y: number;
};

export const nodeFactory = {
  'generate-text': (position: NodePosition): GenerateTextNodeController => ({
    id: nanoid(),
    type: 'generate-text',
    position,
    data: {
      config: {
        agent: 'normalAgent',
        type: 'agent-task',
        description: 'Generate Text',
        model: 'llama-3.1-8b-instant',
      },
      dynamicHandles: {
        tools: [],
      },
    },
  }),

  'prompt-crafter': (position: NodePosition): PromptCrafterNodeController => ({
    id: nanoid(),
    type: 'prompt-crafter',
    position,
    data: {
      config: {
        template: '',
      },
      dynamicHandles: {
        'template-tags': [],
      },
    },
  }),

  'visualize-text': (position: NodePosition): VisualizeTextNodeController => ({
    id: nanoid(),
    type: 'visualize-text',
    position,
    data: {},
    width: 350,
    height: 300,
  }),

  'text-input': (position: NodePosition): TextInputNodeController => ({
    id: nanoid(),
    type: 'text-input',
    position,
    data: {
      config: {
        value: '',
      },
    },
    width: 350,
    height: 300,
  }),
};

export function createNode(
  nodeType: FlowNode['type'],
  position: NodePosition,
): FlowNode {
  if (!nodeType) {
    throw new Error('Node type is required');
  }
  const factory = nodeFactory[nodeType];
  if (!factory) {
    throw new Error(`Unknown node type: ${nodeType}`);
  }
  return factory(position);
}
