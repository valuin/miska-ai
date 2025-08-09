import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { generateTitleFromUserMessage } from "../../actions";
import { generateUUID } from "@/lib/utils";
import { getAttachmentText } from "@/lib/utils/text-extraction";
import { getStreamContext } from "./streamUtils";
import { postRequestBodySchema, } from "./schema";
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
} from 'ai';
import { RuntimeContext } from '@mastra/core/di';
import type { MastraRuntimeContext } from '@/mastra';

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
      } catch (error) {}
      return text;
    }) ?? []
  );
}

interface HandleChatStreamingParams {
  responsePipe: DataStreamWriter;
  messages: Message[];
  session: Session;
  id: string;
  selectedVaultFileNames?: string[];
  documentPreview?: any;
}

async function handleChatStreaming({
  responsePipe,
  messages,
  session,
  id,
  selectedVaultFileNames, // Extract from parameters
  documentPreview,
}: HandleChatStreamingParams) {
  const files = messages.at(-1)?.experimental_attachments;
  await processAttachments({ files, session });

  const mastraRuntimeContext = new RuntimeContext<MastraRuntimeContext>();
  mastraRuntimeContext.set('session', session);
  mastraRuntimeContext.set('dataStream', responsePipe);
  mastraRuntimeContext.set(
    'selectedVaultFileNames',
    selectedVaultFileNames ?? [],
  ); // Use nullish coalescing for clarity
  if (documentPreview) {
    mastraRuntimeContext.set('documentPreview', documentPreview);
    console.log(
      '[Mastra HandleChat] successfully set documentPreview in runtimeContext:',
      JSON.stringify(documentPreview, null, 2),
    );
  }

  await streamWithMastraAgent(id, messages, {
    responsePipe,
    runtimeContext: mastraRuntimeContext,
  });
}

export async function handlePost(request: Request) {
  try {
    const json = await request.json();
    const { id, message, selectedVisibilityType } =
       postRequestBodySchema.parse(json);
     const { documentPreview } = message;
 
     // Debug: Show what we will forward to the streaming handler
     try {
       console.log(
         '[handlePost] message selectedVaultFileNames:', 
         JSON.stringify(message.selectedVaultFileNames, null, 2),
       );
     } catch {}
  
    // Debug: Show what we will forward to the streaming handler
    try {
      console.log(
        '[handlePost] extracted data for streaming',
        JSON.stringify({ 
          selectedVaultFileNames: message.selectedVaultFileNames,
          documentPreview,
        }, null, 2)
      );
    } catch {}
    
    const session = await auth();
  
    if (!session?.user)
      return new ChatSDKError('unauthorized:chat').toResponse();

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
        return new ChatSDKError('forbidden:chat').toResponse();
      }
    }

    const previousMessages: DBMessage[] = await getMessagesByChatId({ id });
    const dbMessage: DBMessage = {
      chatId: id,
      id: message.id,
      agentName: null,
      role: 'user',
      parts: message.parts,
      attachments: message.experimental_attachments ?? [],
      createdAt: new Date(),
    };
    const messages: DBMessage[] = [...previousMessages, dbMessage];

    await saveMessages({ messages: [dbMessage] });
    const streamId = generateUUID();
    await createStreamId({ streamId, chatId: id });

    const uiMessages: Message[] = messages.map((msg) => {
       const content = Array.isArray(msg.parts)
         ? msg.parts.map((part) => (part as any)?.text ?? '').join('')
         : '';
       return {
         id: msg.id,
         role: msg.role as Message['role'],
         content,
         createdAt: msg.createdAt,
       };
     });
     let finalUiMessages = uiMessages;
 
     // Attempt to recover documentPreview from hidden marker if body dropped by client
     const markerRegex = /\[\[__DOC_PREVIEW__:(.*?)\]\]/s;
     try {
       const lastIdx = finalUiMessages.length - 1;
       if (lastIdx >= 0) {
         const last = finalUiMessages[lastIdx];
         const m = markerRegex.exec(last.content || '');
         if (m?.[1]) {
           // Strip marker from the last message before sending to agent
           finalUiMessages = finalUiMessages.map((msg, i) =>
             i === lastIdx
               ? { ...msg, content: (msg.content || '').replace(markerRegex, '').trim() }
               : msg,
           );
         }
       }
     } catch (e) {
       console.log('[handlePost] Error parsing __DOC_PREVIEW__ marker:', e);
     }
 
     try {
       console.log(
         '[handlePost] Final docPreview forwarded:',
         typeof documentPreview === 'object'
           ? JSON.stringify(documentPreview).slice(0, 400) + '…'
           : typeof documentPreview,
       );
     } catch { }
 
    const stream = createDataStream({
      execute: (dataStream) =>
        handleChatStreaming({
          responsePipe: dataStream,
          messages: finalUiMessages,
          session,
          id,
          selectedVaultFileNames: message.selectedVaultFileNames ?? [],
          documentPreview,
        }),
      onError: () => 'Oops, an error occurred!',
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
