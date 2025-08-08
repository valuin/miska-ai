"use client";

import React, { useState, useEffect } from "react";
import { Chat } from "@/components/chat";
import { DocumentPreview } from "@/components/document-preview";
import type { Session } from "next-auth";
import type { UIMessage } from "ai";
import { create } from "zustand";
import {
  VisibilityType,
} from "@/components/visibility-selector";

type MessageCountStore = {
  messageCount: number,
  setMessageCount: (count: number) => void,
  increment: () => void,
};

export const useMessageCountStore = create<MessageCountStore>((set) => ({
  messageCount: 0,
  setMessageCount: (count: number) => set({ messageCount: count }),
  increment: () =>
    set((state: MessageCountStore) => ({
      messageCount: state.messageCount + 1,
    })),
}));

type ChatWithPreviewProps = {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session,
  autoResume: boolean;
};

export function ChatWithPreview({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: ChatWithPreviewProps) {
  const [started, setStarted] = useState(initialMessages.length > 0);
  const { messageCount, setMessageCount, increment } = useMessageCountStore();

  React.useEffect(() => {
    // Reset the message count to 0 when the component unmounts
    return () => {
      setMessageCount(0);
    };
  }, [setMessageCount]);

  React.useEffect(() => {
    setMessageCount(initialMessages.length);
  }, [initialMessages.length, setMessageCount]);

  if (!started) {
    return (
      <Chat
        id={id}
        initialMessages={initialMessages}
        initialChatModel={initialChatModel}
        initialVisibilityType={initialVisibilityType} isReadonly={isReadonly}
        session={session} autoResume={autoResume}
        onChatStarted={() => {
          setStarted(true);
        }} />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-2 md:px-4 py-2 md:py-4">
      <div className="md:col-span-1 min-w-0 flex-1 overflow-hidden">
        <Chat
          id={id}
          initialMessages={initialMessages}
          initialChatModel={initialChatModel}
        initialVisibilityType={initialVisibilityType} isReadonly={isReadonly}
          session={session} autoResume={autoResume} />
      </div>

      <div className="md:col-span-2 flex-1 overflow-hidden">
        <div className="h-dvh flex flex-col rounded-2xl border bg-card">
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b">
            <div className="text-sm font-medium text-muted-foreground">Preview</div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {(() => { console.log("[ChatWithPreview] Rendering DocumentPreview with messageCount:", messageCount); return null; })()}
            <DocumentPreview isReadonly={isReadonly} />
          </div>
        </div>
      </div>
    </div>
  );
}
