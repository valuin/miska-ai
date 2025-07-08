'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Workflow } from 'lucide-react';
import { toast } from '@/components/toast';

interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  schema: any; // The full schema object
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('/api/workflows');
        if (response.ok) {
          const data = await response.json();
          setWorkflows(data.workflows);
        } else {
          const errorData = await response.json();
          toast({
            type: 'error',
            description: `Failed to fetch workflows: ${errorData.error || response.statusText}`,
          });
        }
      } catch (error) {
        console.error('Error fetching workflows:', error);
        toast({
          type: 'error',
          description: 'An unexpected error occurred while fetching workflows.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading workflows...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutGrid className="size-8" />
          Your Workflows
        </h1>
        {/* Potentially add a "Create New Workflow" button here later */}
      </div>

      {workflows.length === 0 ? (
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No workflows saved yet.</p>
          <p className="text-sm">Create a workflow in the chat interface and save it!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {workflows.map((wf) => (
            <Link key={wf.id} href={`/workflows/${wf.id}`}>
              <Card className="h-full flex flex-col justify-between hover:bg-muted hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">{wf.name}</CardTitle>
                  <Workflow className="size-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {wf.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}