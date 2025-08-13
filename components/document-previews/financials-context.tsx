"use client";
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useEffect,
} from "react";

interface FinancialsContextType {
  workbookId: string | null;
  setWorkbookId: (id: string | null) => void;
  chatId: string | null;
  setChatId: (id: string | null) => void;
}

const FinancialsContext = createContext<FinancialsContextType | undefined>(
  undefined
);

interface FinancialsProviderProps {
  children: ReactNode;
  chatId?: string | null;
  workbookId?: string | null;
}

export const FinancialsProvider = ({
  children,
  chatId: initialChatId,
  workbookId: initialWorkbookId,
}: FinancialsProviderProps) => {
  const [workbookId, setWorkbookId] = useState<string | null>(
    initialWorkbookId || null
  );
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);

  useEffect(() => {
    if (initialChatId) {
      setChatId(initialChatId);
    }
  }, [initialChatId]);

  useEffect(() => {
    if (initialWorkbookId) {
      setWorkbookId(initialWorkbookId);
    }
  }, [initialWorkbookId]);

  return (
    <FinancialsContext.Provider
      value={{ workbookId, setWorkbookId, chatId, setChatId }}
    >
      {children}
    </FinancialsContext.Provider>
  );
};

export const useFinancials = () => {
  const context = useContext(FinancialsContext);
  if (context === undefined) {
    throw new Error("useFinancials must be used within a FinancialsProvider");
  }
  return context;
};
