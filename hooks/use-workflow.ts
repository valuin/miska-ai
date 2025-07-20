import { createWithEqualityFn } from "zustand/traditional";
import { createExecutionSlice } from "./workflow/execution-slice";
import { createNodeSlice } from "./workflow/node-slice";
import type { WorkflowState } from "./workflow/types";

const useWorkflow = createWithEqualityFn<WorkflowState>()((...a) => ({
  ...createNodeSlice(...a),
  ...createExecutionSlice(...a),
}));

export { useWorkflow };
