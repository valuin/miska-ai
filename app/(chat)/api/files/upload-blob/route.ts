import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { uploadFile } from '@/lib/db/queries';
import { allowedContentTypes } from './content-types';
import { getAttachmentText } from '@/lib/utils/text-extraction';

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [...allowedContentTypes],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        try {
          const text = await getAttachmentText({
            url: blob.url,
            name: blob.pathname,
          });
          await uploadFile({
            name: blob.pathname,
            url: blob.url,
            text,
            userId: session.user.id,
          });
        } catch (error) {
          throw new Error('Could not upload file');
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
