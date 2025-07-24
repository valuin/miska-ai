import { create } from 'zustand';

interface VaultFilesState {
  selectedVaultFileNames: string[];
  setSelectedVaultFileNames: (fileNames: string[]) => void;
}

export const useVaultFilesStore = create<VaultFilesState>((set) => ({
  selectedVaultFileNames: [],
  setSelectedVaultFileNames: (fileNames) =>
    set({ selectedVaultFileNames: fileNames }),
}));
