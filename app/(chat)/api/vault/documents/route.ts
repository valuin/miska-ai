import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getUserVaultDocuments } from '@/lib/db/queries/document-vault';
import { ChatSDKError } from '@/lib/errors';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await getUserVaultDocuments(session.user.id);

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching vault documents:', error);
    
    if (error instanceof ChatSDKError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch vault documents' },
      { status: 500 }
    );
  }
}