import { QdrantClient } from '@qdrant/js-client-rest';

export const COLLECTION_NAME = 'document_vault';
export const VECTOR_SIZE = 1536;

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});
