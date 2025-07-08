'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SchemaVisualizer from '@/components/schema-builder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Play } from 'lucide-react';

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

  const handleRunWorkflow = () => {
    toast.info(`Running workflow: ${workflow?.name || 'Unknown Workflow'} with query: "${inputQuery}"`);
    // TODO: Implement actual workflow execution logic here
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
          <Button onClick={handleRunWorkflow} className="w-full">
            <Play className="mr-2 size-4" /> Run Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}