import type { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getTempDocument, deleteTempDocument, saveDocumentToVault } from '@/lib/db/queries/document-vault';
import { vectorStore } from '@/lib/rag/vector-store';
import { ChatSDKError } from '@/lib/errors';
import { generateUUID } from '@/lib/utils';

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

    // Create vector index if it doesn't exist
    try {
      await vectorStore.createIndex({
        indexName: 'document_vault',
        dimension: 1536, // text-embedding-3-small dimensions
        metric: 'cosine',
      });
    } catch (error) {
      // Index might already exist, continue
      console.log('Index creation result:', error);
    }

    // Save chunks to vector database with user metadata
    const vectorIds: string[] = [];
    for (let i = 0; i < data.chunks.length; i++) {
      const chunk = data.chunks[i];
      const vectorId = generateUUID();
      
      await vectorStore.upsert({
        indexName: 'document_vault',
        vectors: [data.embeddings[i]],
        metadata: [{
          text: chunk.text,
          user_id: session.user.id,
          document_id: tempDocumentId, // Will be replaced with actual doc ID
          filename: tempDoc.filename,
          chunk_index: i,
          file_url: data.fileUrl,
          file_type: data.contentType,
          ...chunk.metadata,
        }],
        ids: [vectorId],
      });
      
      vectorIds.push(vectorId);
    }

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

    // Update vector metadata with actual document ID
    for (let i = 0; i < vectorIds.length; i++) {
      await vectorStore.updateVector({
        indexName: 'document_vault',
        id: vectorIds[i],
        update: {
          metadata: {
            text: data.chunks[i].text,
            user_id: session.user.id,
            document_id: documentId,
            filename: tempDoc.filename,
            chunk_index: i,
            file_url: data.fileUrl,
            file_type: data.contentType,
            ...data.chunks[i].metadata,
          },
        },
      });
    }

    // Clean up temp document
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