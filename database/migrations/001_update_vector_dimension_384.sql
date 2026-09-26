-- Migration: Update document_chunks embedding vector dimension from 1536 to 384
-- For local HuggingFace all-MiniLM-L6-v2 embeddings

DROP INDEX IF EXISTS idx_document_chunks_embedding;

ALTER TABLE document_chunks 
  ALTER COLUMN embedding TYPE vector(384);

CREATE INDEX idx_document_chunks_embedding ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
