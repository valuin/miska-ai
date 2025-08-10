import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { DBMessage } from "@/lib/db/schema";
import type { Attachment, UIMessage } from "ai";
import { DocumentPreview } from "@/components/document-preview";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  if (chat.visibility === "private") {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb: DBMessage[] = await getMessagesByChatId({
    id,
  });

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: Array.isArray(message.parts)
        ? message.parts.map((part) => {
            if (part.type === "tool-call") {
              return {
                type: "tool-invocation",
                toolInvocation: {
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  args: part.args,
                  state: "call",
                },
              };
            }
            if (part.type === "tool-result") {
              return {
                type: "tool-invocation",
                toolInvocation: {
                  toolCallId: part.toolCallId,
                  toolName: part.toolName,
                  result: part.result,
                  state: "result",
                },
              };
            }
            return part;
          })
        : [],
      role: message.role as UIMessage["role"],
      content: "",
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  const initialChatModel = chatModelFromCookie?.value ?? DEFAULT_CHAT_MODEL;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 p-2 md:p-4">
        <div className="md:col-span-1 min-w-0">
          <Chat
            id={chat.id}
            initialMessages={convertToUIMessages(messagesFromDb)}
            initialChatModel={initialChatModel}
            initialVisibilityType={chat.visibility}
            isReadonly={session?.user?.id !== chat.userId}
            session={session}
            autoResume={true}
          />
        </div>

        <div className="md:col-span-2">
          <div className="h-dvh flex flex-col rounded-2xl border bg-card">
            <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b">
              <div className="text-sm font-medium text-muted-foreground">
                Preview
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {/* Renders active artifact/document preview or a skeleton when none selected */}
              <DocumentPreview isReadonly={session?.user?.id !== chat.userId} />
            </div>
          </div>
        </div>
      </div>
      <DataStreamHandler id={id} />
    </>
  );
}
