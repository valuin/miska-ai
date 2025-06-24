import { MDocument } from "@mastra/rag";
import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import pdfParse from "pdf-parse";

export class DocumentProcessor {
  async processDocument(file: File): Promise<{
    content: string;
    chunks: any[];
    embeddings: number[][];
    metadata: any;
  }> {
    const content = await this.extractText(file);

    const doc = MDocument.fromText(content, {
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      fileType: file.type,
      size: file.size,
    });

    const chunks = await doc.chunk({
      strategy: this.getChunkingStrategy(file.type),
      size: 512,
      overlap: 50,
      extract: {
        summary: true,
        keywords: true,
      },
    });

    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks.map((chunk) => chunk.text),
    });

    return {
      content,
      chunks,
      embeddings,
      metadata: {
        filename: file.name,
        fileType: file.type,
        size: file.size,
        processedAt: new Date().toISOString(),
        chunkCount: chunks.length,
      },
    };
  }

  private async extractText(file: File): Promise<string> {
    if (file.type === "application/pdf") {
      const buffer = await file.arrayBuffer();

      const data = await pdfParse(Buffer.from(buffer));

      return data.text;
    } else if (file.type === "text/plain") {
      return await file.text();
    } else if (file.type === "text/markdown") {
      return await file.text();
    }

    throw new Error(`Unsupported file type: ${file.type}`);
  }

  private getChunkingStrategy(
    fileType: string
  ): "markdown" | "html" | "recursive" {
    if (fileType === "text/markdown") return "markdown";

    if (fileType === "text/html") return "html";

    return "recursive";
  }
}
