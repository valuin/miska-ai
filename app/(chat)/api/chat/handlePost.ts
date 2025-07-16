import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { generateTitleFromUserMessage } from "../../actions";
import { generateUUID } from "@/lib/utils";
import { getAttachmentText } from "@/lib/utils/text-extraction";
import { getStreamContext } from "./streamUtils";
import { postRequestBodySchema, type PostRequestBody } from "./schema";
import { streamWithMastraAgent } from "@/lib/ai/mastra-integration";
import type { DBMessage } from "@/lib/db/schema";
import type { Session } from "next-auth";
import {
  createStreamId,
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  uploadFile,
} from "@/lib/db/queries";
import {
  createDataStream,
  type DataStreamWriter,
  type Message,
  type Attachment,
} from "ai";
import { RuntimeContext } from "@mastra/core/di";
import type { MastraRuntimeContext } from "@/mastra";

interface ProcessAttachmentsParams {
  files: Attachment[] | undefined;
  session: Session;
}

async function processAttachments({
  files,
  session,
}: ProcessAttachmentsParams) {
  return await Promise.all(
    files?.map(async (file: Attachment, index: number) => {
      const text = await getAttachmentText(file);
      try {
        await uploadFile({
          name: file.name || `attachment-${Date.now()}-${index}`,
          url: file.url || "",
          text: text || "",
          userId: session.user.id,
        });
      } catch (error) {
        console.warn(`Failed to save attachment ${file.name}:`, error);
      }
      return text;
    }) ?? [],
  );
}

interface HandleChatStreamingParams {
  responsePipe: DataStreamWriter;
  messages: Message[];
  session: Session;
  id: string;
  selectedVaultFileNames?: string[];
}

async function handleChatStreaming({
  responsePipe,
  messages,
  session,
  id,
  selectedVaultFileNames, // Extract from parameters
}: HandleChatStreamingParams) {
  const files = messages.at(-1)?.experimental_attachments;
  await processAttachments({ files, session });

  const mastraRuntimeContext = new RuntimeContext<MastraRuntimeContext>();
  mastraRuntimeContext.set("session", session);
  mastraRuntimeContext.set("dataStream", responsePipe);
  mastraRuntimeContext.set(
    "selectedVaultFileNames",
    selectedVaultFileNames ?? [],
  ); // Use nullish coalescing for clarity

  await streamWithMastraAgent(id, messages, {
    responsePipe,
    runtimeContext: mastraRuntimeContext,
  });
}

export async function handlePost(request: Request) {
  let requestBody: PostRequestBody;
  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (error) {
    console.error("Zod validation error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return new ChatSDKError("bad_request:api").toResponse();
  }

  console.log("Request body:", requestBody);

  try {
    const { id, message, selectedVisibilityType } = requestBody;
    const selectedVaultFileNames = message.selectedVaultFileNames ?? [];

    const session = await auth();

    if (!session?.user)
      return new ChatSDKError("unauthorized:chat").toResponse();

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({ message });
      await saveChat({
        id,
        userId: session.user.id,
        title,
        visibility: selectedVisibilityType,
      });
    } else {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError("forbidden:chat").toResponse();
      }
    }

    const previousMessages: DBMessage[] = await getMessagesByChatId({ id });
    const dbMessage: DBMessage = {
      // Add type annotation here
      chatId: id,
      id: message.id,
      agentName: null,
      role: "user",
      parts: message.parts,
      attachments: message.experimental_attachments ?? [],
      createdAt: new Date(),
    };
    const messages: DBMessage[] = [...previousMessages, dbMessage];

    await saveMessages({ messages: [dbMessage] });
    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const uiMessages: Message[] = messages.map((msg) => ({
      // Renamed arg to msg to avoid conflict
      id: msg.id,
      role: msg.role as Message["role"],
      content: Array.isArray(msg.parts)
        ? msg.parts.map((part) => part?.text ?? "").join("")
        : "",
      createdAt: msg.createdAt,
    }));

    const stream = createDataStream({
      execute: (dataStream) =>
        handleChatStreaming({
          responsePipe: dataStream,
          messages: uiMessages,
          session,
          id,
          selectedVaultFileNames, // Pass the extracted value
        }),
      onError: () => "Oops, an error occurred!",
    });
    const streamContext = getStreamContext();
    if (streamContext) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      return new Response(stream);
    }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
  }
}
