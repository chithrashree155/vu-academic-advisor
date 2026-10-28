/**
 * Live API Verification for 500-Question Academic Audit
 * Tests distributed queries across all 7 categories against https://vu-academic-advisor-ecru.vercel.app/api/advisory
 */

const fs = require('fs');

async function testLiveAPI() {
  const dataset = JSON.parse(fs.readFileSync('tests/academic-audit-500.json', 'utf8'));
  const liveUrl = 'https://vu-academic-advisor-ecru.vercel.app/api/advisory';

  // Sample 5 questions per category = 35 diverse live questions
  const categories = {};
  for (const q of dataset) {
    if (!categories[q.category]) categories[q.category] = [];
    if (categories[q.category].length < 5) categories[q.category].push(q);
  }

  const sample = Object.values(categories).flat();
  console.log(`Testing ${sample.length} live sample questions against ${liveUrl}...\n`);

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < sample.length; i++) {
    const q = sample[i];
    try {
      const response = await fetch(liveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.question })
      });

      if (!response.ok) {
        console.error(`[FAIL] ${q.id}: HTTP ${response.status}`);
        failed++;
        continue;
      }

      const data = await response.json();
      const stateMatch = q.expected_behavior === 'insufficient_information'
        ? data.state === 'INSUFFICIENT_INFORMATION'
        : q.expected_behavior === 'needs_clarification'
        ? data.state === 'NEEDS_CLARIFICATION'
        : data.state === 'ANSWERABLE';

      // Verify no raw markdown heading hashes
      const noHeadingHashes = !/^[ \t]*#{1,6}[ \t]+/m.test(data.answer || '');

      if (stateMatch && noHeadingHashes) {
        passed++;
        console.log(`[PASS] (${i + 1}/${sample.length}) [${q.id}] ${q.category}: "${q.question.slice(0, 50)}..."`);
      } else {
        failed++;
        console.log(`[FAIL] [${q.id}] State match: ${stateMatch}, Hashes: ${noHeadingHashes}`);
      }
    } catch (err) {
      console.error(`[ERROR] ${q.id}: ${err.message}`);
      failed++;
    }
  }

  const liveAccuracy = ((passed / sample.length) * 100).toFixed(1);
  console.log(`\n========================================================`);
  console.log(`Live API Verification Results: ${passed} / ${sample.length} passed (${liveAccuracy}%)`);
  console.log(`========================================================\n`);

  return { passed, failed, total: sample.length, liveAccuracy };
}

testLiveAPI().catch(console.error);
