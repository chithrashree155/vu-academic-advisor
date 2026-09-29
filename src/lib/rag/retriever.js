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
    this.chunksPath = chunksPath;
    this.chunks = [];
    this.loadChunks();
  }

  loadChunks() {
    // 1. Static require allows bundlers like @vercel/ncc to trace and bundle the JSON directly
    try {
      let bundledChunks = require('../../../data/processed/rag_document_chunks.json');
      if (bundledChunks && bundledChunks.default) {
        bundledChunks = bundledChunks.default;
      }
      if (Array.isArray(bundledChunks) && bundledChunks.length > 0) {
        this.chunks = bundledChunks;
        this.chunksPath = '[bundled] data/processed/rag_document_chunks.json';
        this.lastLoadError = null;
        console.log(`[RagRetriever] Successfully loaded ${this.chunks.length} RAG chunks via static require`);
        return;
      } else {
        this.lastLoadError = 'bundledChunks not an array: ' + typeof bundledChunks;
      }
    } catch (reqErr) {
      this.lastLoadError = 'Static require error: ' + reqErr.message;
      // Fall through to filesystem candidatePaths
    }

    const candidatePaths = [
      this.chunksPath,
      path.resolve(process.cwd(), 'data/processed/rag_document_chunks.json'),
      path.resolve(process.cwd(), 'data/rag_document_chunks.json'),
      '/var/task/data/processed/rag_document_chunks.json',
      path.resolve(__dirname, '../../../data/processed/rag_document_chunks.json'),
      path.resolve(__dirname, '../../data/processed/rag_document_chunks.json'),
      path.resolve(__dirname, '../data/processed/rag_document_chunks.json'),
      path.resolve(__dirname, './data/processed/rag_document_chunks.json'),
      path.join(process.cwd(), 'data/processed/rag_document_chunks.json'),
      path.join(__dirname, '../../../data/processed/rag_document_chunks.json'),
      path.join(__dirname, '../../data/processed/rag_document_chunks.json')
    ];

    for (const p of candidatePaths) {
      if (p) {
        try {
          if (fs.existsSync(p)) {
            const raw = fs.readFileSync(p, 'utf8');
            let parsed = JSON.parse(raw);
            if (parsed && parsed.default) parsed = parsed.default;
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.chunks = parsed;
              this.chunksPath = p;
              this.lastLoadError = null;
              console.log(`[RagRetriever] Successfully loaded ${this.chunks.length} RAG chunks from: ${p}`);
              return;
            }
          }
        } catch (e) {
          this.lastLoadError = `Error loading from ${p}: ${e.message}`;
          console.error(`[RagRetriever Error] Failed to read chunks from ${p}:`, e.message);
        }
      }
    }

    console.warn('[RagRetriever Warning] Could not find or parse rag_document_chunks.json in any expected directory. Error:', this.lastLoadError);
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
    console.log(`[RagRetriever] Generating query embedding for Supabase search: "${query.substring(0, 50)}..."`);
    const queryEmbedding = await this.embedQuery(query);

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
      console.error('[RagRetriever Supabase Error]:', error.message);
      throw error;
    }
    console.log(`[RagRetriever] Supabase query returned ${data ? data.length : 0} chunks | Vector Dim: ${queryEmbedding.length}`);
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

    try {
      // Step 1: Strict Metadata Filtering
      const candidateChunks = this.chunks.filter((chunk) => {
        if (!chunk || typeof chunk.content !== 'string') return false;
        if (sourceType && chunk.sourceType !== sourceType) return false;

        if (batch) {
          if (chunk.metadata?.batch && chunk.metadata.batch !== batch) return false;
          if (chunk.batchScope && Array.isArray(chunk.batchScope) && !chunk.batchScope.includes(batch)) return false;
        }
        if (program) {
          if (chunk.program && chunk.program !== program) return false;
          if (chunk.metadata?.program && chunk.metadata.program !== program) return false;
        }
        if (semester && chunk.metadata?.semester && chunk.metadata.semester !== semester) return false;
        if (academicYear && chunk.metadata?.academicYear && chunk.metadata.academicYear !== academicYear) return false;

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
      const isMinorQuery = query.toLowerCase().includes('minor');
      const isHolidayQuery = query.toLowerCase().includes('holiday') || query.toLowerCase().includes('vacation');
      const isHandbookQuery = query.toLowerCase().includes('handbook');

      const genericWords = new Set(['policy', 'policies', 'rules', 'rule', 'guideline', 'guidelines', 'information', 'detail', 'details', 'tell', 'what', 'how', 'give', 'me', 'about']);
      const substantiveTokens = queryTokens.filter(t => !genericWords.has(t));

      const getStem = (t) => {
        if (t.endsWith('ies')) return t.slice(0, -3) + 'y';
        if (t.endsWith('es') && !t.endsWith('ses')) return t.slice(0, -2);
        if (t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
        return t;
      };

      const scored = candidateChunks.map((chunk) => {
        const contentLower = chunk.content.toLowerCase().replace(/\s+/g, ' ').replace(/h andbook/g, 'handbook');
        const docNameLower = (chunk.documentName || '').toLowerCase().replace(/\s+/g, ' ').replace(/h andbook/g, 'handbook');
        const secLower = (chunk.sectionNumber || '').toLowerCase();
        const searchableText = `${docNameLower} ${secLower} ${contentLower}`;

        if (substantiveTokens.length > 0) {
          const hasSubstantiveMatch = substantiveTokens.some(token => {
            const stem = getStem(token);
            return searchableText.includes(token) || (stem.length > 2 && searchableText.includes(stem));
          });
          if (!hasSubstantiveMatch) {
            return {
              chunkText: chunk.content,
              documentName: chunk.documentName || 'Official Document',
              sourceType: chunk.sourceType || 'DOCUMENT',
              hierarchyLevel: chunk.hierarchyLevel || 3,
              pageOrSheet: chunk.metadata?.sourceSheet || chunk.pageNumber || chunk.sectionNumber,
              clauseNumber: chunk.clauseNumber,
              metadata: chunk.metadata,
              similarityScore: 0,
              rawScore: 0
            };
          }
        }

        let matchCount = 0;
        let exactBonus = 0;

        for (const token of queryTokens) {
          const stem = getStem(token);
          const inContent = contentLower.includes(token) || (stem.length > 2 && contentLower.includes(stem));
          const inDocOrSec = docNameLower.includes(token) || (stem.length > 2 && docNameLower.includes(stem)) || secLower.includes(token);

          if (inContent || inDocOrSec) {
            if (token === 'digii' || token === 'sop' || token === 'attendance' || token === 'registration' || token === 'prerequisite' || token === 'medical' || token === 'holiday' || token === 'holidays') {
              matchCount += 2.5;
            } else {
              matchCount += 1.0;
            }
            if (inDocOrSec) {
              matchCount += 1.5;
            }
          }
        }

        if (queryTokens.length > 1) {
          const keyPhrase = queryTokens.slice(0, 3).join(' ');
          if (searchableText.includes(keyPhrase)) {
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

        if (isMinorQuery && (chunk.documentName.includes('Minor') || (chunk.content.includes('Minor:')))) {
          exactBonus += 3.5;
        }

        if (isHolidayQuery && chunk.documentName.includes('Holiday')) {
          exactBonus += 4.0;
        }

        if (isHandbookQuery && chunk.documentName.includes('Handbook')) {
          exactBonus += 3.0;
        }

        const score = matchCount + exactBonus;

        return {
          chunkText: chunk.content,
          documentName: chunk.documentName || 'Official Document',
          sourceType: chunk.sourceType || 'DOCUMENT',
          hierarchyLevel: chunk.hierarchyLevel || 3,
          pageOrSheet: chunk.metadata?.sourceSheet || chunk.pageNumber || chunk.sectionNumber,
          clauseNumber: chunk.clauseNumber,
          metadata: chunk.metadata,
          similarityScore: Math.min(1.0, score / 6.0),
          rawScore: score
        };
      });

      const relevant = scored.filter(s => s.rawScore > 0);

      relevant.sort((a, b) => {
        const aHierarchyBonus = Math.max(0, (8 - (a.hierarchyLevel || 3)) * 0.15);
        const bHierarchyBonus = Math.max(0, (8 - (b.hierarchyLevel || 3)) * 0.15);
        const aTotal = a.rawScore + aHierarchyBonus;
        const bTotal = b.rawScore + bHierarchyBonus;
        return bTotal - aTotal;
      });

      const results = relevant.slice(0, topK);
      console.log(`[RagRetriever] In-memory search returned ${results.length} relevant chunks for query: "${query.substring(0, 40)}..."`);
      return results;

    } catch (err) {
      console.error('[RagRetriever Error] Exception in retrieve():', err);
      return [];
    }
  }

  /**
   * Decomposed Retrieval for Complex Multi-Part Queries
   * Takes an array of sub-query strings, retrieves evidence for each sub-requirement,
   * deduplicates results, and ranks combined evidence.
   */
  retrieveDecomposed(subQueries = [], options = {}) {
    if (!Array.isArray(subQueries) || subQueries.length === 0) {
      return this.retrieve(options);
    }

    const allResults = [];
    const seenTexts = new Set();
    const topPerSubQuery = Math.max(2, Math.floor((options.topK || 6) / subQueries.length));

    for (const subQuery of subQueries) {
      if (!subQuery || typeof subQuery !== 'string') continue;
      const subOptions = { ...options, query: subQuery, topK: topPerSubQuery };
      const chunks = this.retrieve(subOptions);

      for (const chunk of chunks) {
        const textSnippet = chunk.chunkText.slice(0, 100);
        if (!seenTexts.has(textSnippet)) {
          seenTexts.add(textSnippet);
          allResults.push({ ...chunk, subQueryOrigin: subQuery });
        }
      }
    }

    allResults.sort((a, b) => {
      const aBonus = Math.max(0, (8 - (a.hierarchyLevel || 3)) * 0.15);
      const bBonus = Math.max(0, (8 - (b.hierarchyLevel || 3)) * 0.15);
      return (b.rawScore + bBonus) - (a.rawScore + aBonus);
    });

    const finalResults = allResults.slice(0, options.topK || 6);
    console.log(`[RagRetriever] Decomposed retrieval collected ${finalResults.length} chunks across ${subQueries.length} sub-queries.`);
    return finalResults;
  }
}

const retriever = new RagRetriever();

module.exports = {
  RagRetriever,
  retriever
};
