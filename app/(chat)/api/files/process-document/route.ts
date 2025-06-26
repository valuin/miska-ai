import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { DocumentProcessor } from '@/lib/rag/document-processor';
import { saveTempDocument } from '@/lib/db/queries/document-vault';
import { ChatSDKError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError('unauthorized:document').toResponse();
    }

    const { fileUrl, filename, contentType } = await request.json();
    
    if (!fileUrl || !filename) {
      return new ChatSDKError('bad_request:document').toResponse();
    }

    // Process document using the microservice
    const processor = new DocumentProcessor();
    const result = await processor.processDocument(
      fileUrl,
      filename,
      contentType
    );

    // Store temporarily for user decision
    const tempDocId = generateUUID();
    await saveTempDocument({
      id: tempDocId,
      userId: session.user.id,
      filename: filename,
      processedData: {
        content: result.content,
        chunks: result.chunks,
        embeddings: result.embeddings,
        metadata: result.metadata,
        fileUrl: fileUrl,
        contentType: contentType,
      },
    });

    return Response.json({
      success: true,
      document: {
        id: tempDocId,
        filename: filename,
        fileType: contentType,
        contentPreview: `${result.content.substring(0, 500)}...`,
        summary: 'Document processed successfully',
        chunkCount: result.chunks.length,
        canSaveToVault: true,
      },
    });
  } catch (error) {
    console.error('Document processing error:', error);
    return new ChatSDKError('bad_request:document').toResponse();
  }
}