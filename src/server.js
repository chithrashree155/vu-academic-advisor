/**
 * Express Server for Vidyashilp University VU Advisor
 * Serves secure API endpoints and responsive Web UI on http://localhost:3000
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { processAdvisorQuery, getStudentProfileById, getStudentIdList } = require('./lib/advisory-engine');

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

// 3. Advisory Query Endpoint
app.post('/api/advisory', async (req, res) => {
  try {
    const { query, profileId } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required.' });
    }

    console.log(`[API /api/advisory] Query: "${query.substring(0, 80)}" | Profile: ${profileId || 'None'}`);
    const startTime = Date.now();
    const result = await processAdvisorQuery(query, profileId);
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
      answer: "I'm having trouble accessing the academic knowledge base right now. Please try again in a moment.",
      sources: [],
      showRetry: true
    });
  }
});

// 4. System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Vidyashilp University Academic Advisor',
    version: '2.0.0',
    localEmbeddingModel: 'Xenova/all-MiniLM-L6-v2',
    embeddingDimension: 384,
    supabaseStatus: 'CONNECTED'
  });
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
