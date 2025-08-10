import { MDocument } from '@mastra/rag';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { getAttachmentText } from '@/lib/utils/text-extraction';

export class DocumentProcessor {
  /**
   * Processes uploaded files using the text extraction microservice
   * @param fileUrl - URL of the uploaded file
   * @param filename - Original filename
   * @param contentType - File MIME type
   */
  async processDocument(
    fileUrl: string,
    filename: string,
    contentType?: string,
  ): Promise<{
    content: string;
    chunks: any[];
    embeddings: number[][];
    metadata: any;
  }> {
    // Extract text using the microservice
    const content = await getAttachmentText({
      url: fileUrl,
      name: filename,
      contentType,
    });

    if (!content) {
    }

    // Create MDocument and chunk following Mastra patterns
    const doc = MDocument.fromText(content, {
      filename,
      uploadedAt: new Date().toISOString(),
      fileType: contentType,
      source: fileUrl,
    });

    const strategy = this.getChunkingStrategy(contentType);

    let chunks;
    if (strategy === 'markdown') {
      chunks = await doc.chunk({
        strategy: 'markdown',
        size: 512,
        overlap: 50,
      });
    } else if (strategy === 'html') {
      chunks = await doc.chunk({
        strategy: 'html',
        size: 512,
        overlap: 50,
        sections: [],
      });
    } else {
      chunks = await doc.chunk({
        strategy: 'recursive',
        size: 512,
        overlap: 50,
      });
    }

    // Generate embeddings using AI SDK
    const { embeddings } = await embedMany({
      model: openai.embedding('text-embedding-3-small'),
      values: chunks.map((chunk) => chunk.text),
    });

    return {
      content,
      chunks,
      embeddings,
      metadata: {
        filename,
        fileType: contentType,
        source: fileUrl,
        processedAt: new Date().toISOString(),
        chunkCount: chunks.length,
      },
    };
  }

  private getChunkingStrategy(
    fileType?: string,
  ): 'markdown' | 'html' | 'recursive' {
    if (fileType === 'text/markdown') return 'markdown';
    if (fileType === 'text/html') return 'html';
    return 'recursive';
  }
}
