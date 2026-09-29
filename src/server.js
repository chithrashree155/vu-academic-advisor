/**
 * Express Server for Vidyashilp University VU Advisor
 * Serves secure API endpoints and responsive Web UI on http://localhost:3000
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { processAdvisorQuery, getStudentProfileById, getStudentIdList } = require('./lib/advisory-engine');
const { retriever } = require('./lib/rag/retriever');

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 1. Secure Student Login / Single Profile Fetch Endpoint
app.post('/api/student/login', (req, res) => {
  const { studentId } = req.body;
  if (!studentId) {
    return res.status(400).json({ status: 'error', message: 'Student ID is required.' });
  }

  const profile = getStudentProfileById(studentId);
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

// 3. Advisory Query Endpoint
app.post('/api/advisory', async (req, res) => {
  try {
    const { query, profileId, history } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required.' });
    }

    console.log(`[API /api/advisory] Query: "${query.substring(0, 80)}" | Profile: ${profileId || 'None'} | History: ${Array.isArray(history) ? history.length : 0}`);
    const startTime = Date.now();
    const result = await processAdvisorQuery(query, profileId, history);
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

    if (retriever && (!retriever.chunks || retriever.chunks.length === 0)) {
      retriever.loadChunks();
    }

    const chunkCount = (retriever && Array.isArray(retriever.chunks)) ? retriever.chunks.length : 0;
    const chunkPath = retriever ? retriever.chunksPath : null;

    res.json({
      status: 'healthy',
      system: 'Vidyashilp University Academic Advisor',
      version: '2.0.0',
      directPath,
      fileExists,
      fileSize,
      ragChunksLoaded: chunkCount,
      ragChunksPath: chunkPath,
      loadError: retriever ? retriever.lastLoadError : null,
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
