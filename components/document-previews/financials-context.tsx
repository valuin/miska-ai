"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";

interface FinancialsContextType {
  workbookId: string | null;
  chatId: string | null;
  isLoading: boolean;
}

const FinancialsContext = createContext<FinancialsContextType | undefined>(
  undefined
);

export const FinancialsProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const { documentPreview } = useDocumentPreviewStore();
  const [workbookId, setWorkbookId] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const pathParts = pathname.split("/");
    const idFromPath = pathParts.find((part) => part.length === 36); // Basic UUID check

    if (idFromPath) {
      setChatId(idFromPath);
    }

    if (documentPreview) {
      if (documentPreview.workbookId) {
        setWorkbookId(documentPreview.workbookId);
      }
      if (documentPreview.chatId) {
        setChatId(documentPreview.chatId);
      }
    }

    setIsLoading(false);
  }, [pathname, documentPreview]);

  return (
    <FinancialsContext.Provider value={{ workbookId, chatId, isLoading }}>
      {children}
    </FinancialsContext.Provider>
  );
};

export const useFinancials = (): FinancialsContextType => {
  const context = useContext(FinancialsContext);
  if (context === undefined) {
    throw new Error("useFinancials must be used within a FinancialsProvider");
  }
  return context;
};
