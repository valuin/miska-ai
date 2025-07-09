'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SchemaVisualizer from '@/components/schema-builder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Play, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Spinner } from '@/components/ui/spinner';

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

  useEffect(() => {
    if (workflowId) {
      const fetchWorkflow = async () => {
        try {
          const response = await fetch(`/api/workflows/${workflowId}`);
          if (response.ok) {
            const data = await response.json();
            setWorkflow(data.workflow);
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

      if (response.ok) {
        const result = await response.json();
        setNodeResults(result.output);
        toast.success('Workflow execution completed!', { id: runningToast });
      } else {
        const errorData = await response.json();
        toast.error(`Workflow execution failed: ${errorData.error || response.statusText}`, { id: runningToast });
      }
    } catch (error) {
      console.error('Error running workflow:', error);
      toast.error('An unexpected error occurred during workflow execution.', { id: runningToast });
    } finally {
      setIsExecuting(false);
      toast.dismiss(runningToast);
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
      <div className="md:w-2/3 h-[600px] border border-border rounded-lg">
        <SchemaVisualizer nodes={workflow.schema.nodes} edges={workflow.schema.edges} />
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
                  {JSON.stringify(result.output, null, 2)}
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