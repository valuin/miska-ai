import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { ChatWithPreview } from "@/components/chat-with-preview"; // Import ChatWithPreview
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { DBMessage } from "@/lib/db/schema";
import type { Attachment, UIMessage } from "ai";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      <div className="bg-slate-100 grid grid-cols-1">
        <div className="md:col-span-1 min-w-0 rounded-t-lg">
          {/* Extract latest document-related tool result or args */}
          {(() => {
            let latestDocumentResult: any = null;
            let latestDocumentArgs: any = null;

            for (let i = messagesFromDb.length - 1; i >= 0; i--) {
              const message = messagesFromDb[i];
              if (message.parts && Array.isArray(message.parts)) {
                for (let j = message.parts.length - 1; j >= 0; j--) {
                  const part = message.parts[j];
                  if (
                    part.type === "tool-result" &&
                    [
                      "createDocument",
                      "updateDocument",
                      "queryVaultDocumentsTool",
                    ].includes(part.toolName)
                  ) {
                    latestDocumentResult = part.result;
                    break;
                  }
                  if (
                    part.type === "tool-call" &&
                    ["createDocument", "updateDocument"].includes(part.toolName)
                  ) {
                    latestDocumentArgs = part.args;
                    break;
                  }
                }
              }
              if (latestDocumentResult || latestDocumentArgs) {
                break;
              }
            }

            return (
              <ChatWithPreview // Use ChatWithPreview
                id={chat.id}
                initialMessages={convertToUIMessages(messagesFromDb)}
                initialChatModel={initialChatModel}
                initialVisibilityType={chat.visibility}
                isReadonly={session?.user?.id !== chat.userId}
                session={session}
                autoResume={true}
              />
            );
          })()}
        </div>
      </div>
      <DataStreamHandler id={id} />
    </>
  );
}
