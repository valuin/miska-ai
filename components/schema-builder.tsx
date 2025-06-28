'use client';

import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WorkflowNode from './workflow-node';
import SchemaEdge from './schema-edge';
import { initialNodes, initialEdges } from '@/lib/schema-data';


const nodeTypes = {
  workflowNode: WorkflowNode,
};

const edgeTypes = {
  custom: SchemaEdge,
};

type SchemaVisualizerProps = {
  nodes?: any[];
  edges?: any[];
};

function SchemaVisualizerInner({ nodes: propNodes, edges: propEdges }: SchemaVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(propNodes ?? initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(propEdges ?? initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const onFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  return (
   <main className="flex-1 flex items-stretch">
     <div className="w-full h-[600px] border border-border rounded-lg bg-background" ref={reactFlowWrapper}>
       <ReactFlow
         nodes={nodes}
         edges={edges}
         onNodesChange={onNodesChange}
         onEdgesChange={onEdgesChange}
         nodeTypes={nodeTypes}
         edgeTypes={edgeTypes}
         fitView
         minZoom={0.5}
         maxZoom={1}
         defaultEdgeOptions={{
           type: 'custom',
           style: { stroke: '#888', strokeWidth: 2, opacity: 1 },
         }}
         style={
           {
             '--xy-background-pattern-dots-color-default':
               'var(--color-border)',
             '--xy-edge-stroke-width-default': 1.5,
             '--xy-edge-stroke-default': 'var(--color-foreground)',
             '--xy-edge-stroke-selected-default': 'var(--color-foreground)',
             '--xy-attribution-background-color-default': 'transparent',
           } as React.CSSProperties
         }
         attributionPosition="bottom-left"
       >
         <Background color="rgba(204,204,204,0.2)" variant={BackgroundVariant.Dots} gap={20} size={2} />

         <Panel
           position="bottom-right"
           className="inline-flex -space-x-px rounded-md shadow-xs rtl:space-x-reverse"
         >
           <Button
             variant="outline"
             size="icon"
             className="text-muted-foreground/80 hover:text-muted-foreground rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg size-10 focus-visible:z-10 bg-card"
             onClick={() => zoomIn()}
             aria-label="Zoom in"
           >
             <ZoomIn className="size-5" aria-hidden="true" />
           </Button>
           <Button
             variant="outline"
             size="icon"
             className="text-muted-foreground/80 hover:text-muted-foreground rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg size-10 focus-visible:z-10 bg-card"
             onClick={() => zoomOut()}
             aria-label="Zoom out"
           >
             <ZoomOut className="size-5" aria-hidden="true" />
           </Button>
           <Button
             variant="outline"
             size="icon"
             className="text-muted-foreground/80 hover:text-muted-foreground rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg size-10 focus-visible:z-10 bg-card"
             onClick={onFitView}
             aria-label="Fit view"
           >
             <Maximize2 className="size-5" aria-hidden="true" />
           </Button>
         </Panel>
       </ReactFlow>
     </div>
   </main>
  );
}

export default function SchemaVisualizer(props: SchemaVisualizerProps) {
  return (
    <ReactFlowProvider>
      <SchemaVisualizerInner {...props} />
    </ReactFlowProvider>
  );
}
