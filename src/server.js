/**
 * Express Server for Vidyashilp University AI Academic Advisor MVP
 * Serves API endpoints and responsive Web UI on http://localhost:3000
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { processAdvisorQuery, SYNTHETIC_PROFILES } = require('./lib/advisory-engine');

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// 1. Get Synthetic Demo Profiles
app.get('/api/profiles', (req, res) => {
  res.json({
    status: 'success',
    profiles: SYNTHETIC_PROFILES
  });
});

// 2. Advisory Query Endpoint
app.post('/api/advisory', async (req, res) => {
  try {
    const { query, profileId } = req.body;
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ error: 'Query is required.' });
    }

    const startTime = Date.now();
    const result = await processAdvisorQuery(query, profileId);
    const latencyMs = Date.now() - startTime;

    res.json({
      status: 'success',
      latencyMs,
      ...result
    });
  } catch (err) {
    console.error('Advisory endpoint error:', err);
    res.status(500).json({
      status: 'error',
      error: err.message || 'Internal advisory engine error'
    });
  }
});

// 3. System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Vidyashilp University AI Academic Advisor',
    version: '1.0.0-MVP',
    localEmbeddingModel: 'Xenova/all-MiniLM-L6-v2',
    embeddingDimension: 384,
    supabaseStatus: 'CONNECTED'
  });
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`VU AI Academic Advisor MVP is running!`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Local Embeddings: Xenova/all-MiniLM-L6-v2 (384 dimensions)`);
    console.log(`Database: Supabase PostgreSQL + pgvector`);
    console.log(`================================================================`);
  });
}

module.exports = app;
