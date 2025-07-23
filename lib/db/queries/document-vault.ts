import 'server-only';

import { and, desc, eq, lt } from 'drizzle-orm';
import { ChatSDKError } from '../../errors';
import { documentVault, documentChunks, tempDocuments } from '../schema';
import { generateUUID } from '../../utils';
import { db } from './db';

export async function saveTempDocument(data: {
  id: string;
  userId: string;
  filename: string;
  processedData: any;
}) {
  try {
    return await db.insert(tempDocuments).values(data);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save temporary document',
    );
  }
}

export async function getTempDocument(id: string, userId: string) {
  try {
    const [result] = await db
      .select()
      .from(tempDocuments)
      .where(and(eq(tempDocuments.id, id), eq(tempDocuments.userId, userId)))
      .limit(1);

    return result;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get temporary document',
    );
  }
}

export async function deleteTempDocument(id: string) {
  try {
    return await db.delete(tempDocuments).where(eq(tempDocuments.id, id));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete temporary document',
    );
  }
}

export async function saveDocumentToVault(data: {
  userId: string;
  filename: string;
  fileType?: string;
  fileSize?: number;
  fileUrl: string;
  contentPreview: string;
  metadata: any;
  chunkCount: number;
  vectorIds: string[];
}) {
  try {
    const documentId = generateUUID();

    // Save document
    await db.insert(documentVault).values({
      id: documentId,
      userId: data.userId,
      filename: data.filename,
      fileType: data.fileType,
      fileSize: data.fileSize,
      fileUrl: data.fileUrl,
      contentPreview: data.contentPreview,
      metadata: data.metadata,
      chunkCount: data.chunkCount,
    });

    // Save chunk references
    if (data.vectorIds.length > 0) {
      const chunkData = data.vectorIds.map((vectorId, index) => ({
        id: generateUUID(),
        documentId,
        vectorId,
        chunkIndex: index,
        content: '', // Content is in vector store
        metadata: {},
      }));

      await db.insert(documentChunks).values(chunkData);
    }

    return documentId;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save document to vault',
    );
  }
}

export async function getUserVaultDocuments(userId: string) {
  try {
    return await db
      .select({
        id: documentVault.id,
        filename: documentVault.filename,
        fileType: documentVault.fileType,
        fileUrl: documentVault.fileUrl,
        createdAt: documentVault.createdAt,
        chunkCount: documentVault.chunkCount,
        contentPreview: documentVault.contentPreview,
      })
      .from(documentVault)
      .where(eq(documentVault.userId, userId))
      .orderBy(desc(documentVault.createdAt));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get user vault documents',
    );
  }
}

export async function deleteDocumentFromVault(
  documentId: string,
  userId: string,
) {
  try {
    // Get vector IDs before deletion for cleanup
    const chunks = await db
      .select({ vectorId: documentChunks.vectorId })
      .from(documentChunks)
      .innerJoin(documentVault, eq(documentChunks.documentId, documentVault.id))
      .where(
        and(eq(documentVault.id, documentId), eq(documentVault.userId, userId)),
      );

    // Delete document (chunks will be deleted by CASCADE)
    const [deletedDoc] = await db
      .delete(documentVault)
      .where(
        and(eq(documentVault.id, documentId), eq(documentVault.userId, userId)),
      )
      .returning();

    return {
      deletedDocument: deletedDoc,
      vectorIds: chunks.map((c) => c.vectorId),
    };
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete document from vault',
    );
  }
}

// Cleanup expired temp documents (run as cron job)
export async function cleanupExpiredTempDocuments() {
  try {
    return await db
      .delete(tempDocuments)
      .where(lt(tempDocuments.expiresAt, new Date()));
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to cleanup expired temporary documents',
    );
  }
}
