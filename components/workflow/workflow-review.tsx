"use client";

import { useWorkflowStore } from "@/lib/store/workflow-store";

export function WorkflowReview() {
  const { workflowName, workflowDescription, nodes } = useWorkflowStore();
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
