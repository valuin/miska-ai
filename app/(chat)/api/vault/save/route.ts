import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  getTempDocument,
  deleteTempDocument,
  saveDocumentToVault,
} from "@/lib/db/queries/document-vault";
import {
  qdrantClient,
  COLLECTION_NAME,
  VECTOR_SIZE,
} from "@/lib/rag/vector-store";
import { ChatSDKError } from "@/lib/errors";
import { generateUUID } from "@/lib/utils";

async function ensureCollection() {
  const collections = await qdrantClient.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === COLLECTION_NAME
  );
  if (!exists) {
    await qdrantClient.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
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
      console.error("Vault Save Error: Unauthorized user.");
      return new ChatSDKError("unauthorized:document").toResponse();
    }

    const { tempDocumentId } = await request.json();

    if (!tempDocumentId) {
      console.error("Vault Save Error: Missing tempDocumentId.");
      return new ChatSDKError("bad_request:document").toResponse();
    }

    // Get temp document data
    const tempDoc = await getTempDocument(tempDocumentId, session.user.id);
    if (!tempDoc) {
      console.error(
        `Vault Save Error: Temporary document ${tempDocumentId} not found or expired.`
      );
      return Response.json(
        {
          error: "Temporary document not found or expired",
        },
        { status: 404 }
      );
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
    try {
      await ensureCollection();
    } catch (e) {
      console.error("Vault Save Error: Failed to ensure Qdrant collection.", e);
      throw e;
    }

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

    if (points.length === 0) {
      console.warn(
        `Vault Save Warning: No points to save for document ${tempDocumentId}.`
      );
      return Response.json({ error: "No points to save" }, { status: 400 });
    }

    try {
      await qdrantClient.upsert(COLLECTION_NAME, {
        wait: true,
        points,
      });
    } catch (e) {
      console.error("Vault Save Error: Failed to upsert points to Qdrant.", e);
      throw e;
    }

    const vectorIds = points.map((p) => p.id);

    // Save to database
    let documentId;
    try {
      documentId = await saveDocumentToVault({
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
    } catch (e) {
      console.error(
        "Vault Save Error: Failed to save document to database.",
        e
      );
      throw e;
    }

    for (let i = 0; i < vectorIds.length; i++) {
      try {
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
      } catch (e) {
        console.error(
          `Vault Save Error: Failed to set payload for vector ${vectorIds[i]}.`,
          e
        );
        throw e;
      }
    }

    try {
      await deleteTempDocument(tempDocumentId);
    } catch (e) {
      console.error(
        `Vault Save Error: Failed to delete temporary document ${tempDocumentId}.`,
        e
      );
      // Do not rethrow, as the main operation was successful
    }

    return Response.json({
      success: true,
      documentId,
      message: `Document "${tempDoc.filename}" saved to vault successfully`,
    });
  } catch (error) {
    console.error("Vault Save Error: Unhandled exception.", error);
    return Response.json(
      {
        error: "Failed to save document to vault",
      },
      { status: 500 }
    );
  }
}
