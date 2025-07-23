import { auth } from '@/app/(auth)/auth';
import { getStreamContext } from './streamUtils';
import {
  getChatById,
  getMessagesByChatId,
  getStreamIdsByChatId,
} from '@/lib/db/queries';
import { createDataStream } from 'ai';
import { differenceInSeconds } from 'date-fns';
import { ChatSDKError } from '@/lib/errors';
import type { Chat } from '@/lib/db/schema';

export async function handleGet(request: Request) {
  const streamContext = getStreamContext();
  const resumeRequestedAt = new Date();

  if (!streamContext) return new Response(null, { status: 204 });

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chatId');

  if (!chatId) return new ChatSDKError('bad_request:api').toResponse();

  const session = await auth();

  if (!session?.user) return new ChatSDKError('unauthorized:chat').toResponse();

  let chat: Chat;

  try {
    chat = await getChatById({ id: chatId });
  } catch {
    return new ChatSDKError('not_found:chat').toResponse();
  }

  if (!chat) return new ChatSDKError('not_found:chat').toResponse();

  if (chat.visibility === 'private' && chat.userId !== session.user.id)
    return new ChatSDKError('forbidden:chat').toResponse();

  const streamIds = await getStreamIdsByChatId({ chatId });

  if (!streamIds.length)
    return new ChatSDKError('not_found:stream').toResponse();

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) return new ChatSDKError('not_found:stream').toResponse();

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  if (!stream) {
    const messages = await getMessagesByChatId({ id: chatId });
    const mostRecentMessage = messages.at(-1);

    if (!mostRecentMessage) {
      return new Response(emptyDataStream, { status: 200 });
    }

    if (mostRecentMessage.role !== 'assistant') {
      return new Response(emptyDataStream, { status: 200 });
    }

    const messageCreatedAt = new Date(mostRecentMessage.createdAt);

    if (differenceInSeconds(resumeRequestedAt, messageCreatedAt) > 15) {
      return new Response(emptyDataStream, { status: 200 });
    }

    const restoredStream = createDataStream({
      execute: (buffer) => {
        buffer.writeData({
          type: 'append-message',
          message: JSON.stringify(mostRecentMessage),
        });
      },
    });

    return new Response(restoredStream, { status: 200 });
  }

  return new Response(stream, { status: 200 });
}
