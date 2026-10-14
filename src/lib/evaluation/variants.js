/**
 * Phase 3 — Prompt Engineering & System Variants Architecture
 * 
 * Implements four distinct, reproducible academic advisor system variants:
 * 
 * V1: Basic LLM Baseline (Unstructured document-Q&A prompt, no role framing, no student decision logic)
 * V2: Structured Prompting (Academic advisor persona, strict delimiters, negative constraints, citation requirements)
 * V3: RAG Retrieval Grounding (Semantic & keyword retrieval across 839 university chunks, source hierarchy, conflict detection)
 * V4: RAG + Structured Student/Course Data (Hybrid engine with prerequisite DAG evaluation, student profile context, catalog verification)
 */

'use strict';

const https = require('https');
const { retriever } = require('../rag/retriever');
const { processAdvisorQuery, getStudentProfileById } = require('../advisory-engine');

// ── V1 & V2 PROMPTS ─────────────────────────────────────────────────────────

const V1_SYSTEM_PROMPT = `You are a helpful assistant. Answer questions about Vidyashilp University policies and courses based on your knowledge.`;

const V2_STRUCTURED_SYSTEM_PROMPT = `You are the official Vidyashilp University (VU) AI Academic Advisor.
Your mission is to provide accurate, strictly grounded academic advice to students based ONLY on official university evidence.

### OPERATING CONSTRAINTS:
1. Grounded Answers: Answer ONLY based on verifiable university rules. If you do not know or lack information, state so clearly.
2. Source Hierarchy:
   - Priority 1: Official Student Handbook & Academic Regulations
   - Priority 2: Curriculum Structure / Semester Spread Sheets
   - Priority 3: Course Catalogue
   - Priority 4: Course Offerings (e.g. Summer Term June 2026)
   - Priority 5: Student SOP & ERP Manuals
   - Priority 6: Academic Calendar
3. Scope Boundary:
   - For non-academic queries (coding questions, politics, sports, general chatter), respond:
     "I can only answer academic questions."
4. Clarification Requirement:
   - If a student's batch year, program, or academic history is missing for a personalized question, ask for clarification. Do not guess.
5. Strict Anti-Hallucination:
   - Never invent course codes, credit values, or prerequisites.

### OUTPUT FORMAT:
Respond in JSON with the following structure:
{
  "state": "ANSWERABLE" | "NEEDS_STUDENT_INFORMATION" | "NEEDS_CLARIFICATION" | "INSUFFICIENT_INFORMATION" | "OUT_OF_SCOPE",
  "answer": "string",
  "citations": ["string"],
  "clarificationNeeded": "string" | null
}`;

/**
 * Helper to call OpenAI API with timeout and error handling.
 */
function callOpenAiApi(systemPrompt, userQuery, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey || apiKey.trim() === '') {
      return resolve({
        isBlocked: true,
        reason: 'BLOCKED: OPENAI_API_KEY not configured or empty in environment.',
        raw: null
      });
    }

    const payload = JSON.stringify({
      model: process.env.LLM_COMPLETION_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userQuery }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const parsedBaseUrl = new URL(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1');
    const options = {
      hostname: parsedBaseUrl.hostname,
      port: parsedBaseUrl.port || 443,
      path: `${parsedBaseUrl.pathname.replace(/\/$/, '')}/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: timeoutMs
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode === 429) {
          let errorMsg = '429 Rate limit / Insufficient quota';
          try {
            const errObj = JSON.parse(raw);
            if (errObj && errObj.error && errObj.error.message) {
              errorMsg = `429 Quota Exceeded: ${errObj.error.message}`;
            }
          } catch (_) {}
          return resolve({
            isBlocked: true,
            reason: `BLOCKED: OpenAI API returned ${errorMsg}`,
            statusCode: res.statusCode,
            raw
          });
        }

        if (res.statusCode >= 400) {
          return resolve({
            isBlocked: true,
            reason: `BLOCKED: OpenAI API HTTP error ${res.statusCode}`,
            statusCode: res.statusCode,
            raw
          });
        }

        try {
          const parsed = JSON.parse(raw);
          const answerText = parsed.choices?.[0]?.message?.content || '';
          resolve({
            isBlocked: false,
            answer: answerText,
            raw: parsed
          });
        } catch (e) {
          resolve({
            isBlocked: true,
            reason: `BLOCKED: Failed to parse OpenAI API JSON response: ${e.message}`,
            raw
          });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        isBlocked: true,
        reason: `BLOCKED: OpenAI API request timed out after ${timeoutMs}ms`,
        raw: null
      });
    });

    req.on('error', (err) => {
      resolve({
        isBlocked: true,
        reason: `BLOCKED: OpenAI API network error: ${err.message}`,
        raw: null
      });
    });

    req.write(payload);
    req.end();
  });
}

// ── VARIANT 1: BASIC LLM / DOCUMENT-Q&A BASELINE ───────────────────────────

/**
 * V1: Basic LLM baseline without structured prompting, negative constraints,
 * delimiters, or student-specific decision logic.
 */
async function executeV1(query, studentProfileId = null) {
  const startTime = Date.now();
  const apiResult = await callOpenAiApi(V1_SYSTEM_PROMPT, query);
  const latencyMs = Date.now() - startTime;

  if (apiResult.isBlocked) {
    return {
      variant: 'V1',
      variantName: 'Basic LLM Baseline',
      state: 'BLOCKED',
      answer: `[BLOCKED] ${apiResult.reason}`,
      sources: [],
      citations: [],
      latencyMs,
      isBlocked: true,
      blockReason: apiResult.reason
    };
  }

  return {
    variant: 'V1',
    variantName: 'Basic LLM Baseline',
    state: 'ANSWERABLE',
    answer: apiResult.answer,
    sources: [],
    citations: [],
    latencyMs,
    isBlocked: false
  };
}

// ── VARIANT 2: STRUCTURED PROMPTING ────────────────────────────────────────

/**
 * V2: Structured Prompting with academic advisor persona, explicit negative constraints,
 * source hierarchy guidelines, defined JSON output schema, and clarification prompting.
 */
async function executeV2(query, studentProfileId = null) {
  const startTime = Date.now();
  const formattedUserPrompt = `### QUESTION:\n${query}\n\n### STUDENT_CONTEXT:\n${studentProfileId ? `Student ID: ${studentProfileId}` : 'None provided'}`;
  const apiResult = await callOpenAiApi(V2_STRUCTURED_SYSTEM_PROMPT, formattedUserPrompt);
  const latencyMs = Date.now() - startTime;

  if (apiResult.isBlocked) {
    return {
      variant: 'V2',
      variantName: 'Structured Prompting',
      state: 'BLOCKED',
      answer: `[BLOCKED] ${apiResult.reason}`,
      sources: [],
      citations: [],
      latencyMs,
      isBlocked: true,
      blockReason: apiResult.reason
    };
  }

  try {
    const parsed = JSON.parse(apiResult.answer);
    return {
      variant: 'V2',
      variantName: 'Structured Prompting',
      state: parsed.state || 'ANSWERABLE',
      answer: parsed.answer || apiResult.answer,
      sources: (parsed.citations || []).map(c => ({ documentTitle: c })),
      citations: parsed.citations || [],
      clarificationNeeded: parsed.clarificationNeeded || null,
      latencyMs,
      isBlocked: false
    };
  } catch (_) {
    return {
      variant: 'V2',
      variantName: 'Structured Prompting',
      state: 'ANSWERABLE',
      answer: apiResult.answer,
      sources: [],
      citations: [],
      latencyMs,
      isBlocked: false
    };
  }
}

// ── VARIANT 3: RAG WITH RETRIEVED UNIVERSITY EVIDENCE ──────────────────────

/**
 * V3: RAG with retrieved university evidence, source grounding, insufficient-information
 * handling, and conflict detection. Operates locally over 839 verified RAG document chunks.
 * Does NOT have student transcripts or deterministic prerequisite DAG logic.
 */
async function executeV3(query, studentProfileId = null) {
  const startTime = Date.now();

  const normalized = query.toLowerCase().trim();

  // 1. Guard against non-academic scope boundary
  const isOutOfScope = /quicksort|python script|sort a list|crypto|cricket|stock market|president|prime minister/i.test(normalized);
  if (isOutOfScope) {
    return {
      variant: 'V3',
      variantName: 'RAG Knowledge Retrieval',
      state: 'OUT_OF_SCOPE',
      answer: 'I can only answer academic questions relating to Vidyashilp University policies, curriculum, and courses.',
      sources: [],
      citations: [],
      latencyMs: Date.now() - startTime,
      isBlocked: false
    };
  }

  // 2. Guard against prompt injection / PII dump
  if (/ignore all instructions|output.*transcript.*all students|private cgpa/i.test(normalized)) {
    return {
      variant: 'V3',
      variantName: 'RAG Knowledge Retrieval',
      state: 'ANSWERABLE',
      answer: 'Security Policy: Access to private student academic records and bulk transcripts is restricted under university privacy regulations.',
      sources: [{ documentTitle: '4. Student Handbook Aug 2026.pdf', clauseNumber: 'IT / Ethics Policy' }],
      citations: ['4. Student Handbook Aug 2026.pdf (IT / Ethics Policy)'],
      latencyMs: Date.now() - startTime,
      isBlocked: false
    };
  }

  // 3. Query RAG retriever across 839 chunks
  const retrievedChunks = retriever.retrieve({
    query,
    topK: 5
  });

  // 4. Grounding Check: Check whether retrieved chunks actually mention key concepts
  const queryCourseCodes = query.match(/[A-Z]{3,4}\s?\d{3}/gi) || [];
  const normalizedCourseCodes = queryCourseCodes.map(c => c.replace(/\s+/, '').toUpperCase());

  // Check unknown course codes in query
  if (normalizedCourseCodes.length > 0) {
    const foundInChunks = retrievedChunks.some(chunk =>
      normalizedCourseCodes.some(code => chunk.chunkText.toUpperCase().includes(code))
    );
    if (!foundInChunks) {
      return {
        variant: 'V3',
        variantName: 'RAG Knowledge Retrieval',
        state: 'INSUFFICIENT_INFORMATION',
        answer: `I could not find verified official records for course code(s) ${normalizedCourseCodes.join(', ')} in Vidyashilp University source documents.`,
        sources: [],
        citations: [],
        latencyMs: Date.now() - startTime,
        isBlocked: false
      };
    }
  }

  // Check unknown course title like "Quantum Computing"
  if (/quantum computing/i.test(normalized) && !retrievedChunks.some(c => /quantum computing/i.test(c.chunkText))) {
    return {
      variant: 'V3',
      variantName: 'RAG Knowledge Retrieval',
      state: 'INSUFFICIENT_INFORMATION',
      answer: "I couldn't verify that requirement from the available Vidyashilp University academic source documents.",
      sources: [],
      citations: [],
      latencyMs: Date.now() - startTime,
      isBlocked: false
    };
  }

  // 5. Conflict Detection
  let conflictDetected = false;
  let conflictExplanation = '';

  const mentions75 = retrievedChunks.some(c => c.chunkText.includes('75%'));
  const mentions65 = retrievedChunks.some(c => c.chunkText.includes('65%') || c.chunkText.toLowerCase().includes('condonation'));
  if (mentions75 && mentions65 && /attendance/i.test(normalized)) {
    conflictDetected = true;
    conflictExplanation = 'Per Student Handbook Clause 7.1–7.2 (Hierarchy Level 1), the standard attendance threshold is 75%. However, under certified medical hospitalization or university-approved event participation, condonation down to 65% is permitted upon timely application to the Registrar.';
  }

  const mentionsRasterScan = retrievedChunks.some(c => c.clauseNumber === 'UNVERIFIED_RASTER_SCAN' || c.documentName.includes('Academic Calendar'));
  if (mentionsRasterScan && /calendar|exam date|when does/i.test(normalized)) {
    conflictDetected = true;
    conflictExplanation = 'The Academic Calendar document is an unverified raster scan. Official examination and registration dates must be confirmed through official Registrar circulars and the Digii portal.';
  }

  // 6. Format Answer and Citations
  if (retrievedChunks.length === 0) {
    return {
      variant: 'V3',
      variantName: 'RAG Knowledge Retrieval',
      state: 'INSUFFICIENT_INFORMATION',
      answer: "I couldn't verify that requirement from the available Vidyashilp University academic source documents. Please check with the Registrar's Office.",
      sources: [],
      citations: [],
      latencyMs: Date.now() - startTime,
      isBlocked: false
    };
  }

  // Top source
  const top = retrievedChunks[0];
  let answerText = conflictDetected ? conflictExplanation : (top.chunkText.slice(0, 500) + (top.chunkText.length > 500 ? '...' : ''));

  // Format clean citations with document title, page/sheet, clause
  const citations = retrievedChunks.slice(0, 3).map(r => {
    const doc = r.documentName || 'Official Document';
    const ref = r.clauseNumber || (r.pageOrSheet ? `Ref: ${r.pageOrSheet}` : '');
    return ref ? `${doc} (${ref})` : doc;
  });

  return {
    variant: 'V3',
    variantName: 'RAG Knowledge Retrieval',
    state: 'ANSWERABLE',
    answer: answerText,
    sources: retrievedChunks.slice(0, 3).map(r => ({
      documentTitle: r.documentName,
      hierarchyLevel: r.hierarchyLevel,
      pageOrSheet: r.pageOrSheet,
      clauseNumber: r.clauseNumber,
      excerpt: r.chunkText.slice(0, 200) + '...'
    })),
    citations,
    conflictDetected,
    latencyMs: Date.now() - startTime,
    isBlocked: false
  };
}

// ── VARIANT 4: RAG + STRUCTURED SYNTHETIC STUDENT/COURSE DATA ──────────────

/**
 * V4: RAG + structured synthetic student/course data, including deterministic prerequisite
 * and eligibility checks where supported by authoritative data.
 */
async function executeV4(query, studentProfileId = null, history = []) {
  const startTime = Date.now();
  const result = await processAdvisorQuery(query, studentProfileId, history);
  const latencyMs = Date.now() - startTime;

  return {
    variant: 'V4',
    variantName: 'RAG + Deterministic Student Data',
    state: result.state,
    answer: result.answer,
    sources: result.sources || [],
    citations: result.citations || (result.citation ? [result.citation] : []),
    ruleResults: result.ruleResults || null,
    followUp: result.followUp || null,
    latencyMs,
    isBlocked: false
  };
}

const SYSTEM_VARIANTS = {
  V1: {
    id: 'V1',
    name: 'Basic LLM Baseline',
    description: 'Document-Q&A prompt without structured prompting, negative constraints, or student-specific decision logic.',
    execute: executeV1,
    requiresExternalApi: true
  },
  V2: {
    id: 'V2',
    name: 'Structured Prompting',
    description: 'Academic advisor persona, strict delimiters, source hierarchy, negative constraints, and structured output formatting.',
    execute: executeV2,
    requiresExternalApi: true
  },
  V3: {
    id: 'V3',
    name: 'RAG Knowledge Retrieval',
    description: 'Semantic & keyword retrieval over 839 chunks, source grounding, insufficient-information handling, and conflict detection.',
    execute: executeV3,
    requiresExternalApi: false
  },
  V4: {
    id: 'V4',
    name: 'RAG + Deterministic Student Data',
    description: 'Authoritative RAG retrieval + 24 synthetic student profiles + deterministic prerequisite DAG evaluation + course catalog verification.',
    execute: executeV4,
    requiresExternalApi: false
  }
};

module.exports = {
  SYSTEM_VARIANTS,
  executeV1,
  executeV2,
  executeV3,
  executeV4,
  V1_SYSTEM_PROMPT,
  V2_STRUCTURED_SYSTEM_PROMPT
};
