/**
 * Live Verification Script for Complete Academic Explanation PDF Integration
 * URL: https://vu-academic-advisor-ecru.vercel.app
 */

async function main() {
  const baseUrl = 'https://vu-academic-advisor-ecru.vercel.app';
  console.log(`================================================================`);
  console.log(`LIVE PRODUCTION VERIFICATION: ${baseUrl}`);
  console.log(`================================================================\n`);

  // 1. Health check
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log(`[Health Check] Status: ${healthData.status} | Chunks Loaded: ${healthData.ragChunksLoaded} | File Size: ${healthData.fileSize}`);
  } catch (err) {
    console.error('[Health Check Error]:', err.message);
  }

  // 2. Document endpoint verification
  try {
    const docRes = await fetch(`${baseUrl}/documents/all%20the%20info%20for%20gai%20assignment.pdf`, { method: 'HEAD' });
    console.log(`[Document Serve Check] PDF Status: ${docRes.status} | Content-Type: ${docRes.headers.get('content-type')} | Length: ${docRes.headers.get('content-length')} bytes`);
  } catch (err) {
    console.error('[Document Serve Error]:', err.message);
  }

  // 3. 18 Core Academic Guide Questions
  const testQueries = [
    { id: 1, q: 'What does L-T-P mean?' },
    { id: 2, q: 'Explain L-T-P 3-0-2.' },
    { id: 3, q: 'What is the difference between lecture and practical hours?' },
    { id: 4, q: 'What are credits?' },
    { id: 5, q: 'How are credits calculated?' },
    { id: 6, q: 'Why does a course have credits but no weekly contact hours?' },
    { id: 7, q: 'What is the difference between semester spread and credit structure?' },
    { id: 8, q: 'What is a basket?' },
    { id: 9, q: 'What does Foundation mean?' },
    { id: 10, q: 'What is Program Honors?' },
    { id: 11, q: 'What is a specialization track?' },
    { id: 12, q: 'What does NIL mean?' },
    { id: 13, q: 'What does a prerequisite mean?' },
    { id: 14, q: 'What does TBA mean?' },
    { id: 15, q: 'What is the difference between an elective and an open/minor course?' },
    { id: 16, q: 'How many semesters are in the curriculum?' },
    { id: 17, q: 'What is the total degree credit requirement?' },
    { id: 18, q: 'Why does a course appear in one semester for one batch and another semester for a different batch?' }
  ];

  console.log(`\nTesting ${testQueries.length} Academic Explanation Queries against Live API...\n`);

  let passCount = 0;

  for (const t of testQueries) {
    try {
      const res = await fetch(`${baseUrl}/api/advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: t.q })
      });
      const data = await res.json();
      const stateOk = data.state === 'ANSWERABLE';
      const hasAnswer = data.answer && data.answer.length > 50;
      const sources = data.sources || [];
      const tokens = data.tokenUsage || { total_tokens: 0 };

      const pass = stateOk && hasAnswer && sources.length > 0;
      if (pass) passCount++;

      console.log(`[${pass ? 'PASS' : 'FAIL'}] Test ${String(t.id).padStart(2, '0')}: "${t.q}"`);
      console.log(`       -> State: ${data.state} | Sources (${sources.length}): ${sources.map(s => s.documentTitle).join(', ')} | Tokens: ${tokens.total_tokens || 0}`);
      console.log(`       -> Excerpt: ${(data.answer || '').slice(0, 140).replace(/\n/g, ' ')}...`);
    } catch (err) {
      console.log(`[ERROR] Test ${t.id}: ${err.message}`);
    }
  }

  console.log(`\n================================================================`);
  console.log(`LIVE VERIFICATION RESULT: ${passCount} / ${testQueries.length} PASSED`);
  console.log(`================================================================\n`);
}

main();

