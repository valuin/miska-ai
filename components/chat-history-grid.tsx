"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Clock,
  Landmark,
  BarChart3,
  SearchCheck,
  FileText,
} from "lucide-react";
import { fetcher } from "@/lib/utils";
import type { Chat } from "@/lib/db/schema";
import useSWRInfinite from "swr/infinite";

export interface ChatHistory {
  chats: Array<Chat>;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

export const GradientIcon = ({
  Icon,
  size = 32,
}: {
  Icon: any;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${size} ${size}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="iconGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#054135" />
        <stop offset="100%" stopColor="#A6E564" />
      </linearGradient>
    </defs>
    <Icon
      stroke="url(#iconGradient)"
      fill="url(#iconGradient)"
      strokeWidth={1.5}
    />
  </svg>
);

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory
) {
  if (pageIndex === 0) {
    return `/api/history?limit=${PAGE_SIZE}`;
  }

  if (!previousPageData?.chats?.length) {
    return null;
  }

  const firstChatFromPage = previousPageData.chats[0];
  return `/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

export function ChatHistoryGrid({
  onChatClick,
}: {
  onChatClick?: (chatId: string) => void;
}) {
  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
  } = useSWRInfinite<ChatHistory>(getChatHistoryPaginationKey, fetcher, {
    fallbackData: [],
  });

  const chatsFromHistory =
    paginatedChatHistories?.flatMap(
      (paginatedChatHistory) => paginatedChatHistory.chats
    ) || [];

  const getTypeIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();

    if (
      lowerTitle.includes("akuntan") ||
      lowerTitle.includes("laporan") ||
      lowerTitle.includes("keuangan")
    ) {
      return <GradientIcon Icon={Landmark} />;
    } else if (
      lowerTitle.includes("pajak") ||
      lowerTitle.includes("ppn") ||
      lowerTitle.includes("spt")
    ) {
      return <GradientIcon Icon={BarChart3} />;
    } else if (
      lowerTitle.includes("audit") ||
      lowerTitle.includes("compliance")
    ) {
      return <GradientIcon Icon={SearchCheck} />;
    } else {
      return <GradientIcon Icon={FileText} />;
    }
  };

  const getStatusColor = (chat: Chat) => {
    return "text-green-600 bg-green-100";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Riwayat Chat</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (chatsFromHistory.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Riwayat Chat</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="size-12 mx-auto mb-4 text-gray-300" />
          <p>Belum ada riwayat chat</p>
          <p className="text-sm">Mulai chat untuk melihat riwayat di sini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Riwayat Chat</h3>
        <Button variant="outline" size="sm">
          Lihat Semua
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {chatsFromHistory.slice(0, 8).map((chat) => (
          <Card
            key={chat.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onChatClick?.(chat.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-lime-50 self-center pl-2 pt-2">
                  {getTypeIcon(chat.title)}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusColor(chat)}`}
                >
                  Selesai
                </span>
              </div>
              <CardTitle className="text-sm line-clamp-2">
                {chat.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="size-3 mr-1" />
                {formatDate(chat.createdAt.toString())}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {chatsFromHistory.length > 24 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setSize(setSize.length + 1)}
            disabled={isValidating}
          >
            {isValidating ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
