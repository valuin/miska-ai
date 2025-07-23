import { type Node, type NodeProps, Position } from '@xyflow/react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { LabeledHandle } from '@/components/workflow-v2/labeled-handle';
import {
  NodeHeader,
  NodeHeaderAction,
  NodeHeaderActions,
  NodeHeaderIcon,
  NodeHeaderTitle,
} from '@/components/workflow-v2/node-header';
import { ResizableNode } from '@/components/workflow-v2/resizable-node';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { Eye, Trash } from 'lucide-react';

export type VisualizeTextNode = Node<
  {
    status: 'processing' | 'error' | 'success' | 'idle' | undefined;
    input: string | undefined;
  },
  'visualize-text'
>;

interface VisualizeTextProps extends NodeProps<VisualizeTextNode> {
  onDeleteNode?: () => void;
}

export function VisualizeTextNode({
  id,
  selected,
  data,
  onDeleteNode,
}: VisualizeTextProps) {
  return (
    <ResizableNode
      selected={selected}
      className={cn('flex flex-col', {
        'border-orange-500': data.status === 'processing',
        'border-red-500': data.status === 'error',
      })}
    >
      <div className="flex justify-center">
        <LabeledHandle
          id="input"
          title="Input"
          type="target"
          position={Position.Top}
        />
      </div>
      <NodeHeader className="m-0">
        <NodeHeaderIcon>
          <Eye />
        </NodeHeaderIcon>
        <NodeHeaderTitle>Visualize Text</NodeHeaderTitle>
        <NodeHeaderActions>
          <NodeHeaderAction
            onClick={onDeleteNode}
            variant="ghost"
            label="Delete node"
          >
            <Trash />
          </NodeHeaderAction>
        </NodeHeaderActions>
      </NodeHeader>
      <Separator />
      <div className="p-2 flex-1 overflow-auto flex flex-col">
        <div className="flex-1 overflow-auto nodrag nopan nowheel border border-border rounded-md p-2 select-text cursor-auto">
          <MarkdownContent
            id={id}
            content={data.input ? data.input : 'No text to display'}
          />
        </div>
      </div>
    </ResizableNode>
  );
}
