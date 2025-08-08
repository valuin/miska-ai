"use client";

import { ChatHeader } from "@/components/chat-header";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import { useVaultFilesStore } from "@/lib/store/vault-files-store";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import type { Attachment, UIMessage } from "ai";
import type { Session } from "next-auth";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { AgentCards } from "./agent-cards";
import { Artifact } from "./artifact";
import { ChatHistoryGrid } from "./chat-history-grid";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "./toast";
import type { VisibilityType } from "./visibility-selector";
import { useSidebar } from "@/components/ui/sidebar";
import { useDocumentPreviewStore } from "@/lib/store/document-preview-store";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
  onChatStarted,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
  onChatStarted?: () => void;
}) {
  const { mutate } = useSWRConfig();
  const router = useRouter();
  const { setOpen } = useSidebar();

  // Agent selection state
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  // Load persisted agent selection from localStorage on mount
  useEffect(() => {
    const persistedAgent = localStorage.getItem("selectedAgent");
    if (persistedAgent) {
      setSelectedAgent(persistedAgent);
    }
  }, []);

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => {
      const { selectedVaultFileNames } = useVaultFilesStore.getState();
      const { documentPreview } = useDocumentPreviewStore.getState();
      const lastMessage = body.messages.at(-1);

      return {
        id,
        message: {
          ...lastMessage,
          selectedVaultFileNames: selectedVaultFileNames,
          selectedAgent: selectedAgent,
          documentPreview,
        },
        messages: body.messages, // Send original messages array
        selectedChatModel: initialChatModel,
        selectedVisibilityType: visibilityType,
      };
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: "error",
          description: error.message,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: "user",
        content: query,
      });
      setHasAppendedQuery(true);
    }
  }, [query, hasAppendedQuery, append]);

  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  // Handle agent selection
  const handleAgentSelect = (agentType: string) => {
    setSelectedAgent(agentType);
    setHasStartedChat(true);

    // Close left sidebar when chat starts
    setOpen(false);

    // Add initial message with agent context
    append({
      role: "user",
      content: `Saya ingin menggunakan ${agentType} untuk membantu saya.`,
    });
  };

  // Handle chat history navigation
  const handleChatHistoryClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  // Determine if generation sidebar should be visible
  const isGenerating = status === "submitted" || status === "streaming";
  const currentAgentType = selectedAgent || "superAgent";
  const [showGenerationSidebar, setShowGenerationSidebar] = useState(false);

  // Show initial layout if no messages and no agent selected
  const showInitialLayout = messages.length === 0 && !hasStartedChat;

  // Notify when the chat has started (first user message sent)
  useEffect(() => {
    if (messages.length > 0) {
      onChatStarted?.();
    }
  }, [messages.length, onChatStarted]);

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
          onToggleGenerationSidebar={() =>
            setShowGenerationSidebar(!showGenerationSidebar)
          }
          isGenerationSidebarVisible={showGenerationSidebar}
        />

        {showInitialLayout ? (
          <div className="flex-1 flex flex-col p-6 space-y-6">
            {/* Agent Cards Row */}
            <h1 className="text-[3.25rem] mt-20 font-bold text-center whitespace-pre-wrap">
              <span className="bg-[radial-gradient(circle_at_center,_#A6E564,_#054135_40%,_#054135_80%)] bg-clip-text text-transparent inline-block">
                {"Selamat Pagi, User\nApa yang bisa saya bantu hari ini?"}
              </span>
            </h1>

            {/* Chat Input */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="max-w-4xl mx-auto w-full space-y-4">
                <form className="flex gap-2" onSubmit={handleSubmit}>
                  {!isReadonly && (
                    <MultimodalInput
                      chatId={id}
                      input={input}
                      setInput={setInput}
                      handleSubmit={handleSubmit}
                      status={status}
                      stop={stop}
                      attachments={attachments}
                      setAttachments={setAttachments}
                      messages={messages}
                      setMessages={setMessages}
                      append={append}
                      selectedVisibilityType={visibilityType}
                    />
                  )}
                </form>

                <div className="mt-12">
                  <AgentCards
                    onAgentSelect={handleAgentSelect}
                    selectedAgent={selectedAgent}
                  />
                </div>

                <div className="px-4 pb-4">
                  {/* <SuggestedActions
                    chatId={id}
                    append={append}
                    selectedVisibilityType={visibilityType}
                    onActionClick={() => setOpen(false)}
                  /> */}
                </div>
                <ChatHistoryGrid onChatClick={handleChatHistoryClick} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <Messages
              chatId={id}
              status={status}
              votes={votes}
              messages={messages}
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
              isArtifactVisible={isArtifactVisible}
              append={append}
            />

            <form
              className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl"
              onSubmit={handleSubmit}
            >
              {!isReadonly && (
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  append={append}
                  selectedVisibilityType={visibilityType}
                />
              )}
            </form>
          </>
        )}
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
      />
    </>
  );
}
