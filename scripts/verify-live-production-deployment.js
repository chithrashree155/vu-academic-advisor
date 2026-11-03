'use strict';

const https = require('https');

const LIVE_URL = 'https://vu-academic-advisor-ecru.vercel.app';

function queryLive(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query });
    const req = https.request(`${LIVE_URL}/api/advisory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'VU-Live-Verifier/1.0'
      },
      timeout: 25000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: `JSON Parse error: ${e.message}`, raw: data.substring(0, 200) });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timed out'));
    });
    req.write(postData);
    req.end();
  });
}

function getLiveUrl(path) {
  return new Promise((resolve, reject) => {
    https.get(`${LIVE_URL}${path}`, { timeout: 20000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runLiveVerification() {
  console.log('================================================================');
  console.log('LIVE VERCEL PRODUCTION VERIFICATION');
  console.log(`URL: ${LIVE_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Root page health check
  try {
    const root = await getLiveUrl('/');
    if (root.status === 200 && root.body.includes('docPreviewModal') && root.body.includes('Vidyashilp University')) {
      console.log('✓ TEST 1 [Live Page]: Root loads (200 OK), contains docPreviewModal DOM element.');
      passed++;
    } else {
      console.log(`✗ TEST 1 [Live Page]: Failed (Status: ${root.status})`);
      failed++;
    }
  } catch (e) {
    console.log(`✗ TEST 1 [Live Page]: Error: ${e.message}`);
    failed++;
  }

  // 2. Document preview endpoint for Minor Courses workbook
  try {
    const previewRes = await getLiveUrl('/api/document-preview?doc=minor_courses&sheet=Law%20Minor');
    const json = JSON.parse(previewRes.body);
    if (json.status === 'success' && json.sheets.includes('Law Minor') && json.rows.length > 5) {
      console.log('✓ TEST 2 [Doc Preview Endpoint]: /api/document-preview returns 7 sheets & structured table rows for Law Minor.');
      passed++;
    } else {
      console.log('✗ TEST 2 [Doc Preview Endpoint]: Unexpected response format.');
      failed++;
    }
  } catch (e) {
    console.log(`✗ TEST 2 [Doc Preview Endpoint]: Error: ${e.message}`);
    failed++;
  }

  // 3. Document preview endpoint for Semester Spread workbook
  try {
    const previewRes = await getLiveUrl('/api/document-preview?doc=semester_spread&sheet=Sem_Spread_2024');
    const json = JSON.parse(previewRes.body);
    if (json.status === 'success' && json.sheets.includes('Sem_Spread_2024') && json.rows.length > 10) {
      console.log('✓ TEST 3 [Doc Preview Endpoint]: /api/document-preview returns structured rows for Semester Spread 2024.');
      passed++;
    } else {
      console.log('✗ TEST 3 [Doc Preview Endpoint]: Unexpected response format.');
      failed++;
    }
  } catch (e) {
    console.log(`✗ TEST 3 [Doc Preview Endpoint]: Error: ${e.message}`);
    failed++;
  }

  // Test set of live queries
  const liveQueries = [
    {
      id: 4,
      name: 'List minors available for the 2023 batch',
      query: 'List minors available for the 2023 batch',
      check: (res) => {
        const a = res.answer || '';
        return a.includes('Law') && a.includes('Design') && a.includes('Psychology') && a.includes('Start-up') && a.includes('Not Offered');
      }
    },
    {
      id: 5,
      name: 'List the Law minor for 2023',
      query: 'List the Law minor for 2023',
      check: (res) => {
        const a = res.answer || '';
        return a.includes('LAWM305') && a.includes('LAWE200') && a.includes('5') && (a.includes("Don't Know") || a.includes('Don’t Know') || a.includes('undecided'));
      }
    },
    {
      id: 6,
      name: 'Explain why the Law minor is not offered for 2022',
      query: 'Explain why the Law minor is not offered for 2022',
      check: (res) => {
        const a = res.answer || '';
        const low = a.toLowerCase();
        return low.includes('law') && (low.includes('not offered') || low.includes('no block')) && low.includes('2022');
      }
    },
    {
      id: 7,
      name: 'List the Psychology minor for 2025',
      query: 'List the Psychology minor for 2025',
      check: (res) => {
        const a = res.answer || '';
        return a.includes('PSYC306') && a.includes('PSYC241') && a.includes('24');
      }
    },
    {
      id: 8,
      name: 'Explain the Economics minor status for 2024',
      query: 'Explain the Economics minor status for 2024',
      check: (res) => {
        const a = res.answer || '';
        return (a.includes('No Students') || a.includes('Not Running') || a.includes('not running'));
      }
    },
    {
      id: 9,
      name: 'Explain the Start-up minor status for 2026',
      query: 'Explain the Start-up minor status for 2026',
      check: (res) => {
        const a = res.answer || '';
        return (a.includes('Not Offered') || a.includes('not offered') || a.includes('only offered'));
      }
    },
    {
      id: 10,
      name: 'What are the prerequisites for PSYC306 in 2025?',
      query: 'What are the prerequisites for PSYC306 in 2025?',
      check: (res) => {
        const a = res.answer || '';
        const low = a.toLowerCase();
        return a.includes('PSYC101') && a.includes('PSYC201') && (low.includes('not offered') || low.includes('psyc102') || low.includes('confirm'));
      }
    },
    {
      id: 11,
      name: 'What are the prerequisites for ECON301 in 2026?',
      query: 'What are the prerequisites for ECON301 in 2026?',
      check: (res) => {
        const a = res.answer || '';
        return a.includes('ECON201') && a.includes('ECON202') && (a.includes('does not exist') || a.includes('ECON208') || a.includes('confirmation'));
      }
    },
    {
      id: 12,
      name: 'Explain the prerequisite issue for MGMT210 in Finance 2025',
      query: 'Explain the prerequisite issue for MGMT210 in Finance 2025',
      check: (res) => {
        const a = res.answer || '';
        const low = a.toLowerCase();
        return a.includes('FINA333') && (low.includes('not offered to the 2025 batch') || low.includes('not offered to 2025'));
      }
    },
    {
      id: 13,
      name: 'Explain the prerequisite issue for MGMT302 in Marketing 2025',
      query: 'Explain the prerequisite issue for MGMT302 in Marketing 2025',
      check: (res) => {
        const a = res.answer || '';
        const low = a.toLowerCase();
        return a.includes('MKTG201') && (low.includes('not offered to the 2025 batch') || low.includes('not offered to 2025'));
      }
    },
    {
      id: 14,
      name: 'Explain the Design 2024 credit discrepancy',
      query: 'Explain the Design 2024 credit discrepancy',
      check: (res) => {
        const a = res.answer || '';
        return a.includes('CDES217') && a.includes('2-3-0') && a.includes('4');
      }
    },
    {
      id: 15,
      name: 'Explain the Marketing 2025 credit discrepancy',
      query: 'Explain the Marketing 2025 credit discrepancy',
      check: (res) => {
        const a = res.answer || '';
        return a.includes('MGMT302') && a.includes('2-1-0') && a.includes('4');
      }
    },
    {
      id: 16,
      name: 'How many credits are still undecided in Law 2026?',
      query: 'How many credits are still undecided in Law 2026?',
      check: (res) => {
        const a = res.answer || '';
        return a.includes('24') && (a.includes('TBA') || a.includes('TBD') || a.includes('undecided'));
      }
    },
    {
      id: 17,
      name: 'How many credits are still undecided in Finance 2026?',
      query: 'How many credits are still undecided in Finance 2026?',
      check: (res) => {
        const a = res.answer || '';
        return a.includes('20') && (a.includes('MGMT330') || a.includes('4 decided'));
      }
    },
    {
      id: 18,
      name: 'What does 1-0-4 mean in DATA103?',
      query: 'What does 1-0-4 mean in DATA103?',
      check: (res) => {
        const a = res.answer || '';
        return a.includes('1') && a.includes('4') && a.includes('3 credits') && (a.includes('contact') || a.includes('hours'));
      }
    },
    {
      id: 19,
      name: 'What is the difference between L-T-P and credits?',
      query: 'What is the difference between L-T-P and credits?',
      check: (res) => {
        const a = res.answer || '';
        return (a.includes('Lecture') || a.includes('weekly')) && a.includes('credit') && !a.includes('Batch 2024 vs Batch 2025');
      }
    },
    {
      id: 20,
      name: 'Sanitized sources check (no internal assignment filename)',
      query: 'What is the semester structure for Batch 2024?',
      check: (res) => {
        const sources = res.sources || [];
        const hasLeakedName = sources.some(s => 
          (s.documentTitle && s.documentTitle.toLowerCase().includes('all the info for gai')) ||
          (s.documentName && s.documentName.toLowerCase().includes('all the info for gai'))
        );
        return !hasLeakedName;
      }
    },
    {
      id: 21,
      name: 'Token display check (promptTokens, completionTokens, totalTokens, model)',
      query: 'What does L-T-P mean?',
      check: (res) => {
        const t = res.tokens;
        return t && typeof t.totalTokens === 'number' && typeof t.model === 'string';
      }
    }
  ];

  for (const t of liveQueries) {
    try {
      const res = await queryLive(t.query);
      if (res.error) {
        console.log(`✗ TEST ${t.id} [${t.name}]: Failed — ${res.error}`);
        failed++;
        continue;
      }
      const ok = t.check(res);
      if (ok) {
        console.log(`✓ TEST ${t.id} [${t.name}]: Passed.`);
        passed++;
      } else {
        console.log(`✗ TEST ${t.id} [${t.name}]: Failed check.`);
        console.log('   Preview:', (res.answer || '').substring(0, 160).replace(/\n/g, ' '));
        failed++;
      }
    } catch (err) {
      console.log(`✗ TEST ${t.id} [${t.name}]: Network error — ${err.message}`);
      failed++;
    }
  }

  console.log('\n================================================================');
  console.log(`LIVE PRODUCTION TEST SUMMARY: ${passed} PASSED | ${failed} FAILED (Total: ${passed + failed})`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runLiveVerification();
