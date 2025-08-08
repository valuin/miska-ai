import { create } from 'zustand';

interface DocumentPreviewState {
  documentPreview: any | null;
  setDocumentPreview: (preview: any | null) => void;
}

export const useDocumentPreviewStore = create<DocumentPreviewState>((set) => ({
  documentPreview: null,
  setDocumentPreview: (preview) => set({ documentPreview: preview }),
}));