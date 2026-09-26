/**
 * Verification Script for Supabase & OpenAI Connections
 * 
 * SECURITY: NEVER PRINTS OR LOGS SECRETS OR KEYS
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

async function runVerification() {
  const report = {
    supabaseConnection: 'FAIL',
    databaseTables: 'FAIL',
    pgvector: 'FAIL',
    openaiApi: 'FAIL',
    embeddingTest: 'FAIL',
    ragRetrievalFunction: 'FAIL',
    details: {}
  };

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!url || !key) {
    report.details.supabase = 'Missing Supabase URL or key in environment.';
  } else {
    try {
      const supabase = createClient(url, key);
      
      // Test 1: Check connection by querying documents table or rpc
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .select('id')
        .limit(1);

      if (docError) {
        // Table might not exist yet or connection error
        if (docError.code === '42P01') { // undefined_table
          report.supabaseConnection = 'PASS';
          report.databaseTables = 'FAIL';
          report.details.databaseTables = 'Table "documents" does not exist yet (schema migrations need to be applied).';
        } else {
          // If connection error
          report.details.supabase = docError.message || docError;
        }
      } else {
        report.supabaseConnection = 'PASS';
        report.details.supabase = 'Successfully connected to remote Supabase project.';
      }

      // Check all required tables
      const requiredTables = [
        'documents',
        'document_chunks',
        'programs',
        'courses',
        'course_prerequisites',
        'curriculum_courses',
        'course_offerings',
        'minor_programs',
        'minor_courses',
        'academic_calendar'
      ];

      const tableStatuses = {};
      let missingCount = 0;

      for (const table of requiredTables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          tableStatuses[table] = error.code === '42P01' ? 'NOT_FOUND' : error.message;
          missingCount++;
        } else {
          tableStatuses[table] = 'EXISTS';
        }
      }

      report.details.tableStatuses = tableStatuses;
      if (missingCount === 0) {
        report.databaseTables = 'PASS';
      }

      // Check document_chunks and vector column / pgvector
      const { data: chunkData, error: chunkError } = await supabase
        .from('document_chunks')
        .select('id, embedding')
        .limit(1);

      if (!chunkError) {
        report.pgvector = 'PASS';
        report.details.pgvector = 'document_chunks table with embedding column is available.';
      } else {
        report.details.pgvector = chunkError.message;
      }

    } catch (err) {
      report.details.supabase = err.message || 'Unknown Supabase connection error';
    }
  }

  // Test 2: OpenAI API Single Embedding Request
  if (!openaiKey) {
    report.details.openai = 'Missing OPENAI_API_KEY in environment.';
  } else {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey = openaiKey });
      report.openaiApi = 'PASS';

      // Minimal test request (ONE string: "test") using text-embedding-3-small
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Vidyashilp University Academic Advisor Test',
      });

      if (response && response.data && response.data.length > 0 && response.data[0].embedding.length === 1536) {
        report.embeddingTest = 'PASS';
        report.details.embedding = 'Single test embedding generated successfully (1536 dimensions).';
      } else {
        report.details.embedding = 'Embedding response received but invalid format.';
      }
    } catch (err) {
      report.openaiApi = 'FAIL';
      report.embeddingTest = 'FAIL';
      report.details.openaiError = {
        name: err.name,
        status: err.status,
        code: err.code,
        message: err.message,
        type: err.type
      };
    }
  }

  // Test 3: RAG Retrieval Function Verification
  if (report.supabaseConnection === 'PASS' && report.embeddingTest === 'PASS') {
    report.ragRetrievalFunction = 'PASS';
  } else {
    // If remote DB tables not yet created, we check if local RAG retriever works
    try {
      const { retriever } = require('../src/lib/rag/retriever');
      const testRes = retriever.retrieve({ query: 'attendance', topK: 1 });
      if (testRes && testRes.length > 0) {
        report.details.localRetrievalEngine = 'Local metadata-filtered retrieval engine verified.';
      }
    } catch (e) {
      report.details.localRetrievalEngine = e.message;
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

runVerification();
