export const steps = [
  { id: "step-1", title: "Workflow Details", description: "Name and describe" },
  { id: "step-2", title: "Add Nodes", description: "Build your workflow" },
  {
    id: "step-3",
    title: "Review & Save",
    description: "Finalize your workflow",
  },
];

export const workflowDetailSchema = {
  workflowName: { min: 1, message: "Workflow name is required." },
  workflowDescription: { optional: true },
};

export const nodeSchema = {
  currentNodeDescription: { min: 1, message: "Node description is required." },
  currentNodeAgent: { min: 1, message: "An agent is required." },
};