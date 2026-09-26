/**
 * Types for Retrieval-Augmented Generation (RAG) and Chunking
 */

import { SourceHierarchyType } from './system';

export interface ChunkMetadata {
  documentId: string;
  filename: string;
  sourceType: SourceHierarchyType;
  hierarchyLevel: number;
  academicYear?: string;
  batchScope?: string[];
  pageNumber?: number;
  sectionNumber?: string;
  clauseNumber?: string;
  isRasterScan?: boolean;
}

export interface TextChunk {
  content: string;
  metadata: ChunkMetadata;
  tokenCount: number;
}

export interface RetrievalFilter {
  sourceTypes?: SourceHierarchyType[];
  batch?: string;
  program?: string;
  maxHierarchyLevel?: number;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  metadata: ChunkMetadata;
}

export interface HybridSearchQuery {
  queryText: string;
  embeddingVector?: number[];
  filter?: RetrievalFilter;
  topK?: number;
}
