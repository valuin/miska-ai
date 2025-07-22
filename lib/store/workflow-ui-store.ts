import { create } from 'zustand';

type ActiveHumanInput = {
  id: string;
  description: string;
};

type WorkflowUiState = {
  activeHumanInputNode: ActiveHumanInput | null;
  setActiveHumanInputNode: (node: ActiveHumanInput | null) => void;
};

export const useWorkflowUiState = create<WorkflowUiState>((set) => ({
  activeHumanInputNode: null,
  setActiveHumanInputNode: (node) => set({ activeHumanInputNode: node }),
}));