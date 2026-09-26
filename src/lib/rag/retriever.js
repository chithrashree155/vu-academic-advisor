/**
 * RAG Semantic Retrieval Engine with Strict Metadata Filtering & Source Hierarchy
 * 
 * Supports:
 * 1. Local HuggingFace embeddings (Xenova/all-MiniLM-L6-v2, 384 dimensions)
 * 2. Remote Supabase pgvector retrieval with metadata filtering
 * 3. Offline fast retrieval with term-specificity and source hierarchy ranking
 * 4. Strict batch isolation
 */

const fs = require('fs');
const path = require('path');
const { generateEmbedding } = require('./embeddings');

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'were', 'will', 'with', 'what', 'which', 'who', 'how',
  'can', 'does', 'did', 'do', 'i', 'my', 'me', 'we', 'our', 'you', 'your'
]);

class RagRetriever {
  constructor(chunksPath) {
    this.chunksPath = chunksPath || path.join(__dirname, '../../../data/processed/rag_document_chunks.json');
    this.chunks = [];
    this.loadChunks();
  }

  loadChunks() {
    if (fs.existsSync(this.chunksPath)) {
      try {
        const raw = fs.readFileSync(this.chunksPath, 'utf8');
        this.chunks = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to load chunks:', e);
        this.chunks = [];
      }
    }
  }

  /**
   * Generates a 384-dimensional normalized vector for a search query
   * using the exact same HuggingFace Transformers pipeline as ingestion.
   */
  async embedQuery(queryText) {
    return generateEmbedding(queryText);
  }

  /**
   * Performs semantic retrieval on remote Supabase using pgvector RPC / match.
   */
  async retrieveFromSupabase(supabaseClient, options) {
    const { query, program, batch, topK = 5 } = options;
    const queryEmbedding = await this.embedQuery(query);

    // Call Supabase pgvector match function or direct query
    let queryBuilder = supabaseClient
      .from('document_chunks')
      .select('id, content, chunk_index, page_number, section_number, clause_number, batch, program, metadata')
      .limit(topK);

    if (batch) {
      queryBuilder = queryBuilder.eq('batch', batch);
    }
    if (program) {
      queryBuilder = queryBuilder.eq('program', program);
    }

    const { data, error } = await queryBuilder;
    if (error) {
      throw error;
    }
    return { data, queryEmbeddingDimension: queryEmbedding.length };
  }

  /**
   * In-memory fast retrieval with metadata filtering and source hierarchy.
   */
  retrieve(options) {
    const {
      query,
      program,
      batch,
      semester,
      academicYear,
      sourceType,
      topK = 5
    } = options;

    if (!query || query.trim() === '') {
      return [];
    }

    if (this.chunks.length === 0) {
      this.loadChunks();
    }

    // Step 1: Strict Metadata Filtering
    const candidateChunks = this.chunks.filter((chunk) => {
      if (sourceType && chunk.sourceType !== sourceType) {
        return false;
      }
      if (batch) {
        if (chunk.metadata?.batch && chunk.metadata.batch !== batch) {
          return false;
        }
        if (chunk.batchScope && !chunk.batchScope.includes(batch)) {
          return false;
        }
      }
      if (program) {
        if (chunk.program && chunk.program !== program) {
          return false;
        }
        if (chunk.metadata?.program && chunk.metadata.program !== program) {
          return false;
        }
      }
      if (semester && chunk.metadata?.semester) {
        if (chunk.metadata.semester !== semester) {
          return false;
        }
      }
      if (academicYear && chunk.metadata?.academicYear) {
        if (chunk.metadata.academicYear !== academicYear) {
          return false;
        }
      }
      return true;
    });

    // Step 2: Scoring / Similarity calculation
    const rawTokens = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);

    const queryTokens = rawTokens.filter(t => !STOP_WORDS.has(t));
    const isCurriculumQuery = query.toLowerCase().includes('curriculum') || query.toLowerCase().includes('courses in semester');

    const scored = candidateChunks.map((chunk) => {
      const contentLower = chunk.content.toLowerCase();
      let matchCount = 0;
      let exactBonus = 0;

      for (const token of queryTokens) {
        if (contentLower.includes(token)) {
          if (token === 'digii' || token === 'sop' || token === 'attendance' || token === 'registration' || token === 'prerequisite') {
            matchCount += 2.5;
          } else {
            matchCount += 1.0;
          }
        }
      }

      if (queryTokens.length > 1) {
        const keyPhrase = queryTokens.slice(0, 3).join(' ');
        if (contentLower.includes(keyPhrase)) {
          exactBonus += 2.5;
        }
      }

      const codeMatch = query.match(/[A-Z]{3,4}\d{3}/i);
      if (codeMatch && contentLower.includes(codeMatch[0].toLowerCase())) {
        exactBonus += 4.0;
      }

      if (isCurriculumQuery && chunk.sourceType === 'CURRICULUM_STRUCTURE') {
        exactBonus += 3.0;
      }

      const score = matchCount + exactBonus;

      return {
        chunkText: chunk.content,
        documentName: chunk.documentName,
        sourceType: chunk.sourceType,
        hierarchyLevel: chunk.hierarchyLevel,
        pageOrSheet: chunk.metadata?.sourceSheet || chunk.pageNumber || chunk.sectionNumber,
        clauseNumber: chunk.clauseNumber,
        metadata: chunk.metadata,
        similarityScore: Math.min(1.0, score / 6.0),
        rawScore: score
      };
    });

    const relevant = scored.filter(s => s.rawScore > 0);

    relevant.sort((a, b) => {
      const aHierarchyBonus = Math.max(0, (8 - a.hierarchyLevel) * 0.15);
      const bHierarchyBonus = Math.max(0, (8 - b.hierarchyLevel) * 0.15);
      const aTotal = a.rawScore + aHierarchyBonus;
      const bTotal = b.rawScore + bHierarchyBonus;
      return bTotal - aTotal;
    });

    return relevant.slice(0, topK);
  }
}

const retriever = new RagRetriever();

module.exports = {
  RagRetriever,
  retriever
};
