'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Play, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Spinner } from '@/components/ui/spinner';
import { Flow } from '@/components/workflow-detail-flow';
import { useWorkflow } from '@/hooks/use-workflow';
import { shallow } from 'zustand/shallow';

interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  schema: {
    id: string;
    name: string;
    description: string | null;
    nodes: any[];
    edges: any[];
  };
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowDetailPage() {
  const { workflowId } = useParams();
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputQuery, setInputQuery] = useState('');
  const [nodeResults, setNodeResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState<Map<string, { status: 'pending' | 'running' | 'completed' | 'error', output?: string, error?: string, description?: string }>>(new Map());

  const store = useWorkflow(
    (store) => ({
      nodes: store.nodes,
      edges: store.edges,
      onNodesChange: store.onNodesChange,
      onEdgesChange: store.onEdgesChange,
      onConnect: store.onConnect,
      startExecution: store.startExecution,
      createNode: store.createNode,
      workflowExecutionState: store.workflowExecutionState,
      initializeWorkflow: store.initializeWorkflow,
    }),
    shallow
  );

  useEffect(() => {
    if (workflowId) {
      const fetchWorkflow = async () => {
        try {
          const response = await fetch(`/api/workflows/${workflowId}`);
          if (response.ok) {
            const data = await response.json();
            setWorkflow(data.workflow);
            
            if (data.workflow?.schema?.nodes && data.workflow?.schema?.edges) {
              // Transform existing nodes
              const baseNodes = data.workflow.schema.nodes.map((node: any) => {
                if (node.type === 'workflowNode') {
                  const agentType = node.data.agent || 'normalAgent';
                  const description = node.data.description || '';
                  // Use text-input for human input, generate-text for agent tasks
                  let newType = 'generate-text';
                  const agent = node.data.agent || 'normalAgent';
                  if (agent === 'human' || agent === 'user') {
                    newType = 'text-input';
                  }
                  
                  return {
                    id: node.id,
                    type: newType,
                    position: node.position,
                    data: {
                      config: {
                        value: description,
                        model: 'llama-3.1-8b-instant',
                        agent: node.data.agent || 'normalAgent',
                        description: node.data.description || 'Agent task'
                      },
                      dynamicHandles: {
                        tools: [],
                        'template-tags': []
                      },
                      executionState: {
                        status: 'idle',
                        timestamp: new Date().toISOString()
                      }
                    },
                    width: 300,
                    height: 200
                  };
                }
                return node;
              });

              // Add result node (renamed from visualize-text)
              const resultNodeId = `result-${Date.now()}`;
              const resultNode = {
                id: resultNodeId,
                type: 'visualize-text',
                position: { x: 400, y: 300 },
                data: {
                  status: 'idle',
                  input: 'Workflow results will appear here'
                },
                width: 300,
                height: 200
              };

              const transformedNodes = [...baseNodes, resultNode];

              // Connect last node to result node
              const lastNode = baseNodes[baseNodes.length - 1];
              const resultEdge = {
                id: `edge-${lastNode.id}-${resultNodeId}`,
                type: 'status',
                source: lastNode.id,
                target: resultNodeId,
                sourceHandle: 'result',
                targetHandle: 'input',
                data: {
                  executionState: {
                    status: 'idle',
                    timestamp: new Date().toISOString()
                  }
                }
              };

              const transformedEdges = [
                ...data.workflow.schema.edges.map((edge: any) => ({
                  id: edge.id,
                  type: 'status',
                  source: edge.source,
                  target: edge.target,
                  sourceHandle: 'result',
                  targetHandle: 'prompt',
                  data: {
                    executionState: {
                      status: 'idle',
                      timestamp: new Date().toISOString()
                    }
                  }
                })),
                resultEdge
              ];

              store.initializeWorkflow(transformedNodes, transformedEdges);
            }
          } else {
            const errorData = await response.json();
            toast.error(`Failed to fetch workflow: ${errorData.error || response.statusText}`);
          }
        } catch (error) {
          console.error('Error fetching workflow:', error);
          toast.error('An unexpected error occurred while fetching the workflow.');
        } finally {
          setLoading(false);
        }
      };
      fetchWorkflow();
    }
  }, [workflowId]);

  const handleRunWorkflow = async () => {
    if (!workflow) {
      toast.error('Workflow not loaded.');
      return;
    }

    setIsExecuting(true);
    setNodeResults([]);
    setWorkflowProgress(new Map());
    const runningToast = toast.info(`Running workflow: ${workflow.name}`, {
      description: 'Please wait, this may take a moment...',
      duration: Number.POSITIVE_INFINITY,
    });

    try {
      const response = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowId: workflow.id,
          workflowSchema: workflow.schema,
          inputQuery,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Workflow execution failed: ${errorData.error || response.statusText}`, { id: runningToast });
        setIsExecuting(false);
        return;
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }

      const newNodeResults: any[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'workflow_started':
                  toast.info(data.message, { id: runningToast });
                  break;
                  
                case 'node_started':
                  setWorkflowProgress(prev => new Map(prev).set(data.nodeId, {
                    status: 'running',
                    description: data.description
                  }));
                  break;
                  
                case 'node_completed':
                  setWorkflowProgress(prev => new Map(prev).set(data.nodeId, {
                    status: 'completed',
                    output: data.output,
                    description: data.description
                  }));
                  newNodeResults.push({
                    nodeId: data.nodeId,
                    agentName: data.agentName,
                    description: data.description,
                    output: data.output,
                  });
                  break;
                  
                case 'node_error':
                  setWorkflowProgress(prev => new Map(prev).set(data.nodeId, {
                    status: 'error',
                    error: data.error,
                    description: data.description
                  }));
                  toast.error(`Error: ${data.error}`, { id: runningToast });
                  break;
                  
                case 'workflow_completed':
                  toast.success('Workflow execution completed!', { id: runningToast });
                  break;
                  
                case 'error':
                  toast.error(data.message, { id: runningToast });
                  break;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      setNodeResults(newNodeResults);
      setIsExecuting(false);
    } catch (error) {
      console.error('Error running workflow:', error);
      toast.error('An unexpected error occurred during workflow execution.', { id: runningToast });
      setIsExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading workflow details...</p>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Workflow not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full p-4 gap-4">
      <div className="md:w-2/3 border border-border rounded-lg">
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </div>

      <div className="md:w-1/3 flex flex-col gap-4">
        <div className="border border-border rounded-lg p-4 flex-grow">
          <h2 className="text-xl font-semibold mb-4">Workflow Details</h2>
          <p className="text-lg font-medium">{workflow.name}</p>
          <p className="text-sm text-muted-foreground mb-4">{workflow.description || 'No description.'}</p>

          <h3 className="text-lg font-semibold mb-2">Input Query</h3>
          <Input
            placeholder="Enter your query here..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="mb-4"
          />
            <Button
            onClick={handleRunWorkflow}
            className={`w-full ${isExecuting ? 'bg-transparent text-white' : ''}`}
            disabled={isExecuting}
            >
            {isExecuting ? (
              <>
              <Spinner size="lg" className="mr-2" />
              Running Workflow
              </>
            ) : (
              <>
              <Play className="mr-2 size-4" />
              Run Workflow
              </>
            )}
            </Button>

          {nodeResults.map((result, index) => (
            <Collapsible key={result.nodeId} className="w-full mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Node #{index + 1} Output <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-2 border border-border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-auto max-h-60">
                <pre className="text-sm whitespace-pre-wrap break-all">
                  {result.output}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          ))}

          {nodeResults.length > 0 && workflow?.schema.nodes.length === nodeResults.length && (
            <Collapsible className="w-full mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  Final Workflow Output <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 p-2 border border-border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-auto max-h-60">
                <pre className="text-sm whitespace-pre-wrap break-all">
                  {JSON.stringify(nodeResults, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}