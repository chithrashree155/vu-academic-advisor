/**
 * Express Server for Vidyashilp University VU Advisor
 * Serves secure API endpoints and responsive Web UI on http://localhost:3000
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { processAdvisorQuery, getStudentProfileById, getStudentIdList } = require('./lib/advisory-engine');
const { generateCourseInfographic, getSupportedPrograms } = require('./lib/multimodal/infographic');
const { runAgenticAdvisingWorkflow } = require('./lib/agent/workflow');
const ragModule = require('./lib/rag/retriever.js');
const retriever = ragModule.retriever || (ragModule.default && ragModule.default.retriever) || ragModule;

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Security guardrail patterns
const SENSITIVE_PROMPT_PATTERNS = [
  {
    regex: /ignore (all )?instructions/i,
    type: 'INJECTION',
    message: 'Access Denied: In accordance with Vidyashilp University Data Privacy and IT Ethics regulations, confidential student records, internal system prompts, and administrative credentials cannot be accessed or disclosed. Only verified academic policies are available.'
  },
  {
    regex: /system administrator override/i,
    type: 'ADMIN_OVERRIDE',
    message: 'Access Denied: Unauthorized administrative command. Administrative overrides and access to external student disciplinary/financial records are prohibited through the student advisory interface.'
  },
  {
    regex: /developer mode/i,
    type: 'JAILBREAK',
    message: 'Access Denied: System modifications, developer mode overrides, and bypassing academic regulations are strictly prohibited.'
  },
  {
    regex: /(env(ironment)?\s*var|api[_\s]?key|secret|credentials|supabase_service_role_key|openai_api_key)/i,
    type: 'CREDENTIAL_LEAK_PROBE',
    message: 'Access Denied: Internal system environment variables, API credentials, and database keys cannot be disclosed.'
  }
];

// 1. Secure Student Login / Single Profile Fetch Endpoint
app.post('/api/student/login', (req, res) => {
  const { studentId } = req.body;
  if (!studentId || typeof studentId !== 'string') {
    return res.status(400).json({ status: 'error', message: 'Student ID is required and must be a valid string.' });
  }

  // Strict format validation for synthetic student IDs (e.g. VU-DEMO-001)
  const sanitizedId = studentId.trim().toUpperCase();
  if (!/^VU-[A-Z0-9-]+$/.test(sanitizedId) || sanitizedId.length > 20) {
    return res.status(400).json({ status: 'error', message: 'Invalid Student ID format. Expected format: VU-DEMO-XXX' });
  }

  const profile = getStudentProfileById(sanitizedId);
  if (!profile) {
    return res.status(404).json({ status: 'error', message: 'Student record not found.' });
  }

  res.json({
    status: 'success',
    profile
  });
});

// 2. Student List for ID selector ONLY (returns ID & Name only, NO private CGPA/attendance/courses)
app.get('/api/student/list', (req, res) => {
  res.json({
    status: 'success',
    students: getStudentIdList()
  });
});

app.get('/api/profiles', (req, res) => {
  res.json({
    status: 'success',
    profiles: getStudentIdList()
  });
});

// 3. Multimodal: Course Structure Infographic Endpoints
app.get('/api/curriculum/programs', (req, res) => {
  res.json({
    status: 'success',
    programs: getSupportedPrograms()
  });
});

app.get('/api/curriculum/infographic', (req, res) => {
  try {
    const { program = 'BTECH_DS', batch = '2024', term = 'ALL' } = req.query;
    const sanitizedProgram = String(program).toUpperCase().replace(/[^A-Z_]/g, '');
    const sanitizedBatch = String(batch).replace(/[^0-9]/g, '');
    const sanitizedTerm = String(term).toUpperCase();

    const result = generateCourseInfographic({
      programCode: sanitizedProgram || 'BTECH_DS',
      batch: sanitizedBatch || '2024',
      termFilter: sanitizedTerm === 'SUMMER_2026' ? 'SUMMER_2026' : 'ALL'
    });

    res.json({
      status: 'success',
      ...result
    });
  } catch (err) {
    console.error('[API /api/curriculum/infographic Error]:', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to generate course infographic.' });
  }
});

// 4. Agentic Extension: 5-Stage Auditable Workflow Endpoint
app.post('/api/advising-workflow', async (req, res) => {
  try {
    const { query, profileId } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required.' });
    }

    const cleanQuery = query.trim().substring(0, 1000);
    const result = await runAgenticAdvisingWorkflow(cleanQuery, profileId);
    res.json(result);
  } catch (err) {
    console.error('[API /api/advising-workflow Error]:', err.message);
    res.status(500).json({
      status: 'error',
      state: 'INSUFFICIENT_INFORMATION',
      answer: "An error occurred during workflow execution. Please consult your Academic Advisor.",
      sources: []
    });
  }
});

// 5. Advisory Query Endpoint (Secured with Security Guardrails)
app.post('/api/advisory', async (req, res) => {
  try {
    const { query, profileId, history, mode } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required.' });
    }

    const cleanQuery = query.trim().substring(0, 1000);

    // Security Check: Prompt injection / administrative leakage
    for (const pattern of SENSITIVE_PROMPT_PATTERNS) {
      if (pattern.regex.test(cleanQuery)) {
        console.warn(`[SECURITY ALERT] Flagged pattern: ${pattern.type} in query: "${cleanQuery.substring(0, 60)}"`);
        return res.json({
          status: 'success',
          latencyMs: 1,
          state: pattern.type === 'INJECTION' ? 'ANSWERABLE' : 'INSUFFICIENT_INFORMATION',
          answer: pattern.message,
          sources: [],
          citations: ['VU Student Handbook IT / Ethics Policy & Privacy Isolation Architecture']
        });
      }
    }

    // Check if client requested agentic mode
    if (mode === 'agentic') {
      const result = await runAgenticAdvisingWorkflow(cleanQuery, profileId);
      return res.json(result);
    }

    console.log(`[API /api/advisory] Query: "${cleanQuery.substring(0, 80)}" | Profile: ${profileId || 'None'} | History: ${Array.isArray(history) ? history.length : 0}`);
    const startTime = Date.now();
    const result = await processAdvisorQuery(cleanQuery, profileId, history);
    const latencyMs = Date.now() - startTime;
    console.log(`[API /api/advisory] Success | Latency: ${latencyMs}ms | State: ${result.state} | Sources: ${result.sources ? result.sources.length : 0}`);

    res.json({
      status: 'success',
      latencyMs,
      ...result
    });
  } catch (err) {
    console.error('[API /api/advisory Error]:', err.stack || err);
    res.status(500).json({
      status: 'error',
      state: 'INSUFFICIENT_INFORMATION',
      answer: "I couldn't verify that requirement from the available Vidyashilp University academic source documents. Please check with the Registrar's Office or your Academic Advisor.",
      sources: [],
      showRetry: true
    });
  }
});

// 4. System Health Check
app.get('/api/health', (req, res) => {
  try {
    const fs = require('fs');
    const directPath = path.join(process.cwd(), 'data', 'processed', 'rag_document_chunks.json');
    const fileExists = fs.existsSync(directPath);
    let fileSize = 0;
    if (fileExists) {
      try {
        fileSize = fs.statSync(directPath).size;
      } catch (e) {
        fileSize = e.message;
      }
    }

    let directFileReadCount = -1;
    if (fileExists) {
      try {
        const raw = fs.readFileSync(directPath, 'utf8');
        const parsed = JSON.parse(raw);
        directFileReadCount = Array.isArray(parsed) ? parsed.length : (parsed && parsed.default ? parsed.default.length : -2);
      } catch (e) {
        directFileReadCount = e.message;
      }
    }

    const ragModule = require('./lib/rag/retriever.js');
    const ragKeys = Object.keys(ragModule || {});
    let activeRetriever = ragModule.retriever || (ragModule.default && ragModule.default.retriever);
    if (!activeRetriever && typeof ragModule.RagRetriever === 'function') {
      activeRetriever = new ragModule.RagRetriever();
    } else if (!activeRetriever && typeof ragModule === 'function') {
      activeRetriever = new ragModule();
    }

    if (activeRetriever && (!activeRetriever.chunks || activeRetriever.chunks.length === 0) && typeof activeRetriever.loadChunks === 'function') {
      activeRetriever.loadChunks();
    }

    const chunkCount = (activeRetriever && Array.isArray(activeRetriever.chunks)) ? activeRetriever.chunks.length : 0;
    const chunkPath = activeRetriever ? activeRetriever.chunksPath : null;

    res.json({
      status: 'healthy',
      system: 'Vidyashilp University Academic Advisor',
      version: '2.0.2',
      directPath,
      fileExists,
      fileSize,
      directFileReadCount,
      ragKeys,
      hasActiveRetriever: !!activeRetriever,
      ragChunksLoaded: chunkCount,
      ragChunksPath: chunkPath,
      loadError: activeRetriever ? activeRetriever.lastLoadError : null,
      cwd: process.cwd()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack
    });
  }
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`VU Advisor (Vidyashilp University) is running!`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Local Embeddings: Xenova/all-MiniLM-L6-v2 (384 dimensions)`);
    console.log(`Database: Supabase PostgreSQL + pgvector`);
    console.log(`================================================================`);
  });
}

module.exports = app;
