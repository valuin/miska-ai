import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserUploads } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const uploads = await getUserUploads({ userId: session.user.id });

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error('Error fetching user uploads:', error);
    
    if (error instanceof ChatSDKError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}