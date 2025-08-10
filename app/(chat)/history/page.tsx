"use client";
import { ChatHistoryGrid } from "@/components/chat-history-grid";
import { useRouter } from "next/navigation";

export default function History() {
  const router = useRouter();

  const handleChatHistoryClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };
  return (
    <div className="mx-4">
      <ChatHistoryGrid onChatClick={handleChatHistoryClick} />
    </div>
  );
}
