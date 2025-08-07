"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ChatSidebarContextType {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isInChatSession: boolean;
  setIsInChatSession: (inSession: boolean) => void;
}

const ChatSidebarContext = createContext<ChatSidebarContextType | undefined>(
  undefined
);

export function ChatSidebarProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInChatSession, setIsInChatSession] = useState(false);

  return (
    <ChatSidebarContext.Provider
      value={{
        isSidebarOpen,
        setIsSidebarOpen,
        isInChatSession,
        setIsInChatSession,
      }}
    >
      {children}
    </ChatSidebarContext.Provider>
  );
}

export function useChatSidebar() {
  const context = useContext(ChatSidebarContext);
  if (!context) {
    throw new Error("useChatSidebar must be used within ChatSidebarProvider");
  }
  return context;
}
