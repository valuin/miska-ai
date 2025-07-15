"use client";

interface WorkflowReviewProps {
  workflowName: string;
  workflowDescription: string;
  nodes: any[];
}

export function WorkflowReview({ workflowName, workflowDescription, nodes }: WorkflowReviewProps) {
  return (
    <div>
      <h3 className="font-semibold text-lg">Review Your Workflow</h3>
      <p>
        <strong>Name:</strong> {workflowName}
      </p>
      <p>
        <strong>Description:</strong> {workflowDescription || "N/A"}
      </p>
      <p>
        <strong>Nodes:</strong> {nodes.length}
      </p>
    </div>
  );
}