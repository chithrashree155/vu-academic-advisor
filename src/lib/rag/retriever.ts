/**
 * RAG Retriever Contract & Hierarchy Sorter
 * Enforces the university source hierarchy when ranking retrieved context.
 */

import { RetrievedChunk, RetrievalFilter } from '../types/rag';
import { EvidenceCitation } from '../types/system';

export class EvidenceRetriever {
  /**
   * Sorts retrieved evidence chunks strictly according to the University Source Hierarchy:
   * Level 1: Student Handbook
   * Level 2: Curriculum Structure / Spread
   * Level 3: Master Course Catalogue
   * Level 4: Course Offerings
   * Level 5: Student SOP
   * Level 6: Academic Calendar
   * Level 7: Supporting Portal Info
   */
  public sortEvidenceByHierarchy(chunks: RetrievedChunk[]): RetrievedChunk[] {
    return [...chunks].sort((a, b) => {
      if (a.metadata.hierarchyLevel !== b.metadata.hierarchyLevel) {
        return a.metadata.hierarchyLevel - b.metadata.hierarchyLevel;
      }
      return b.similarity - a.similarity;
    });
  }

  public toEvidenceCitations(chunks: RetrievedChunk[]): EvidenceCitation[] {
    return chunks.map((chunk) => ({
      documentTitle: chunk.metadata.filename,
      sourceType: chunk.metadata.sourceType,
      hierarchyLevel: chunk.metadata.hierarchyLevel,
      sectionOrSheet: chunk.metadata.sectionNumber,
      clauseNumber: chunk.metadata.clauseNumber,
      pageNumber: chunk.metadata.pageNumber,
      batchScope: chunk.metadata.batchScope,
      excerpt: chunk.content,
      confidence: chunk.similarity,
    }));
  }

  public validateBatchConsistency(chunks: RetrievedChunk[], requestedBatch?: string): boolean {
    if (!requestedBatch) return true;
    for (const chunk of chunks) {
      if (chunk.metadata.batchScope && chunk.metadata.batchScope.length > 0) {
        if (!chunk.metadata.batchScope.includes(requestedBatch)) {
          return false; // Cross-batch pollution detected
        }
      }
    }
    return true;
  }
}

export const evidenceRetriever = new EvidenceRetriever();
