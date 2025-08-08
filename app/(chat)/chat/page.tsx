import { cookies } from "next/headers";
import { ChatWithPreview } from "@/components/chat-with-preview";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  // Check if user has completed profile setup
  const cookieStore = await cookies();
  const hasCompletedSetup = cookieStore.get("profile-setup-completed");

  if (hasCompletedSetup?.value !== "true") {
    redirect("/");
  }

  const id = generateUUID();
  const modelIdFromCookie = cookieStore.get("chat-model");

  if (!modelIdFromCookie) {
    return (
      <>
        <ChatWithPreview
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={session}
          autoResume={false}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <ChatWithPreview
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
