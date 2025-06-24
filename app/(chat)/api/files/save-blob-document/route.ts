import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { uploadFile } from '@/lib/db/queries';
import { z } from 'zod';

// Use Blob instead of File since File is not available in Node.js environment
const SaveBlobDocument = z.object({
  name: z.string(),
  url: z.string(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = SaveBlobDocument.parse(await request.json());

  try {
    const { id } = await uploadFile({
      name: body.name,
      url: body.url,
      userId: session.user.id,
    });

    return NextResponse.json({ id });
  } catch (error) {
    throw new Error('Could not upload file');
  }
}
