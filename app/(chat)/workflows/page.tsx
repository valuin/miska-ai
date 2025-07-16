"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Workflow } from "lucide-react";
import { toast } from "sonner";
import { ManualWorkflowDialog } from "@/components/manual-workflow-dialog";
import { useQuery } from "@tanstack/react-query";

interface WorkflowData {
  id: string;
  name: string;
  description: string | null;
  schema: any; // The full schema object
  createdAt: string;
  updatedAt: string;
}

const fetchWorkflows = async (): Promise<WorkflowData[]> => {
  const response = await fetch("/api/workflows");
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || response.statusText);
  }
  const data = await response.json();
  return data.workflows;
};

export default function WorkflowsPage() {
  const {
    data: workflows,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["workflows"],
    queryFn: fetchWorkflows,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading workflows...</p>
      </div>
    );
  }

  if (error) {
    toast.error(`Failed to fetch workflows: ${error.message}`);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Error loading workflows. Please try again.</p>
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
        <ManualWorkflowDialog onWorkflowCreated={refetch} />
      </div>

      {workflows?.length === 0 ? (
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No workflows saved yet.</p>
          <p className="text-sm">
            Create a workflow in the chat interface and save it!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {workflows?.map((wf) => (
            <Link key={wf.id} href={`/workflows/${wf.id}`}>
              <Card className="h-full flex flex-col justify-between hover:bg-muted hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">
                    {wf.name}
                  </CardTitle>
                  <Workflow className="size-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {wf.description || "No description provided."}
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
