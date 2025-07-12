'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import { ZoomIn, ZoomOut, Maximize2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WorkflowNode from './workflow-node';
import SchemaEdge from './schema-edge';
import { initialNodes, initialEdges } from '@/lib/schema-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';


const nodeTypes = {
  workflowNode: WorkflowNode,
};

const edgeTypes = {
  custom: SchemaEdge,
};

type SchemaVisualizerProps = {
  nodes?: any[];
  edges?: any[];
  height?: string;
};

function SchemaVisualizerInner({ nodes: propNodes, edges: propEdges, height = 'h-[600px]' }: SchemaVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(propNodes ?? initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(propEdges ?? initialEdges);

  useEffect(() => {
    if (propNodes) {
      setNodes(propNodes);
    }
    if (propEdges) {
      setEdges(propEdges);
    }
  }, [propNodes, propEdges, setNodes, setEdges]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut, getNodes, getEdges } = useReactFlow();
  const [isSaving, setIsSaving] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      const currentNodes = getNodes();
      const currentEdges = getEdges();

      if (!workflowName) {
        toast.error('Workflow name cannot be empty.');
        setIsSaving(false);
        return;
      }

      const workflowData = {
        id: uuidv4(),
        name: workflowName,
        description: workflowDescription,
        nodes: currentNodes.map(node => ({
          id: node.id,
          type: node.type,
          data: node.data,
          position: node.position,
        })),
        edges: currentEdges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          data: edge.data,
        })),
      };

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schema: workflowData, name: workflowName, description: workflowDescription }),
      });

      if (response.ok) {
        toast.success('Workflow saved successfully!');
        setWorkflowName('');
        setWorkflowDescription('');
        setIsModalOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(`Failed to save workflow: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('An unexpected error occurred while saving the workflow.');
    } finally {
      setIsSaving(false);
    }
  };

  const onFitView = useCallback(() => {
    fitView({ padding: 0.2 });
  }, [fitView]);

  return (
   <main className="flex-1 flex items-stretch">
     <div className={`w-full ${height} border border-border rounded-lg bg-background`} ref={reactFlowWrapper}>
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
           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
             <DialogTrigger asChild>
               <Button
                 variant="outline"
                 size="icon"
                 className="text-muted-foreground/80 hover:text-muted-foreground rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg size-10 focus-visible:z-10 bg-card"
                 aria-label="Save Workflow"
               >
                 <Save className="size-5" aria-hidden="true" />
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-[425px]">
               <DialogHeader>
                 <DialogTitle>Save Workflow</DialogTitle>
                 <DialogDescription>
                   Enter a name and description for your workflow.
                 </DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="name" className="text-right">
                     Name
                   </Label>
                   <Input
                     id="name"
                     value={workflowName}
                     onChange={(e) => setWorkflowName(e.target.value)}
                     className="col-span-3"
                   />
                 </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="description" className="text-right">
                     Description
                   </Label>
                   <Input
                     id="description"
                     value={workflowDescription}
                     onChange={(e) => setWorkflowDescription(e.target.value)}
                     className="col-span-3"
                   />
                 </div>
               </div>
               <DialogFooter>
                 <Button onClick={handleSaveWorkflow} disabled={isSaving}>
                   {isSaving ? 'Saving...' : 'Save Workflow'}
                 </Button>
               </DialogFooter>
             </DialogContent>
           </Dialog>
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
