import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getTempDocument, deleteTempDocument, saveDocumentToVault } from '@/lib/db/queries/document-vault';
import { qdrantClient, COLLECTION_NAME, VECTOR_SIZE } from '@/lib/rag/vector-store';
import { ChatSDKError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';


async function ensureCollection() {
  const collections = await qdrantClient.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === COLLECTION_NAME
  );
  if (!exists) {
    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    });
  }

  await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
    field_name: "filename",
    field_schema: "keyword",
  });
  await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
    field_name: "user_id",
    field_schema: "keyword",
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new ChatSDKError('unauthorized:document').toResponse();
    }

    const { tempDocumentId } = await request.json();
    
    if (!tempDocumentId) {
      return new ChatSDKError('bad_request:document').toResponse();
    }

    // Get temp document data
    const tempDoc = await getTempDocument(tempDocumentId, session.user.id);
    if (!tempDoc) {
      return Response.json({
        error: 'Temporary document not found or expired',
      }, { status: 404 });
    }

    const { processedData } = tempDoc;
    
    // Type assertion for processedData
    const data = processedData as {
      content: string;
      chunks: Array<{ text: string; metadata?: any }>;
      embeddings: number[][];
      metadata: any;
      fileUrl: string;
      contentType: string;
    };

    // Ensure Qdrant collection exists
    await ensureCollection();
    const points = data.chunks.map((chunk, i) => {
      const vectorId = generateUUID();
      return {
        id: vectorId,
        vector: data.embeddings[i],
        payload: {
          text: chunk.text,
          user_id: session.user.id,
          document_id: tempDocumentId,
          filename: tempDoc.filename,
          chunk_index: i,
          file_url: data.fileUrl,
          file_type: data.contentType,
          ...chunk.metadata,
        },
      };
    });

    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    const vectorIds = points.map((p) => p.id);

    // Save to database
    const documentId = await saveDocumentToVault({
      userId: session.user.id,
      filename: tempDoc.filename,
      fileType: data.contentType,
      fileSize: data.metadata?.fileSize,
      fileUrl: data.fileUrl,
      contentPreview: data.content.substring(0, 500),
      metadata: data.metadata,
      chunkCount: data.chunks.length,
      vectorIds,
    });

    for (let i = 0; i < vectorIds.length; i++) {
      await qdrantClient.setPayload(COLLECTION_NAME, {
        points: [vectorIds[i]],
        payload: {
          text: data.chunks[i].text,
          user_id: session.user.id,
          document_id: documentId,
          filename: tempDoc.filename,
          chunk_index: i,
          file_url: data.fileUrl,
          file_type: data.contentType,
          ...data.chunks[i].metadata,
        },
      });
    }

    await deleteTempDocument(tempDocumentId);

    return Response.json({
      success: true,
      documentId,
      message: `Document "${tempDoc.filename}" saved to vault successfully`,
    });
  } catch (error) {
    console.error('Error saving document to vault:', error);
    return Response.json({
      error: 'Failed to save document to vault',
    }, { status: 500 });
  }
}
