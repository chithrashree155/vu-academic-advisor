/**
 * VU Faculty Advisor — Comprehensive Test Suite
 * Tests all 15 required scenarios across multiple synthetic students
 */

'use strict';

const BASE = 'http://localhost:3000';

async function apiPost(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function apiGet(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`);
  return res.json();
}

let passed = 0;
let failed = 0;
const results = [];

function check(testNum, label, condition, actual) {
  const ok = !!condition;
  if (ok) passed++;
  else failed++;

  const icon = ok ? '✅' : '❌';
  const line = `${icon} Test ${String(testNum).padStart(2,'0')}: ${label}`;
  results.push({ testNum, label, ok, actual });
  console.log(line);
  if (!ok) {
    console.log(`   → State: ${actual?.state}`);
    console.log(`   → Answer: ${String(actual?.answer || '').slice(0, 120)}...`);
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VU Faculty Advisor — Test Suite (15 Tests)');
  console.log('═══════════════════════════════════════════════════════\n');

  // First, verify profiles endpoint
  const profilesData = await apiGet('/api/profiles');
  const profiles = profilesData.profiles || [];
  console.log(`✓ Profiles loaded: ${profiles.length} synthetic students\n`);

  // ── TEST 1: Attendance question (no profile) ──
  {
    const r = await apiPost('/api/advisory', { query: 'What is the minimum attendance requirement?' });
    check(1, 'Attendance requirement (no profile)',
      r.state === 'ANSWERABLE' && r.answer.includes('75') && r.sources?.length > 0,
      r
    );
  }

  // ── TEST 2: Registration rules question ──
  {
    const r = await apiPost('/api/advisory', { query: 'What are the course registration rules?' });
    check(2, 'Course registration rules',
      r.state === 'ANSWERABLE' && r.answer.toLowerCase().includes('digii') && r.sources?.length > 0,
      r
    );
  }

  // ── TEST 3: DATA302 prerequisite question ──
  {
    const r = await apiPost('/api/advisory', { query: 'What is the prerequisite for DATA302?' });
    check(3, 'DATA302 prerequisite',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA301') && r.sources?.length > 0,
      r
    );
  }

  // ── TEST 4: DATA302 eligibility — Aarav Mehta (Student 01, eligible, has DATA301) ──
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take DATA302?', profileId: 'VU-DEMO-001' });
    check(4, 'DATA302 eligibility — Aarav Mehta (eligible)',
      r.state === 'ANSWERABLE' && r.answer.includes('Eligible') && r.ruleResults?.eligible === true,
      r
    );
  }

  // ── TEST 5: DATA302 eligibility — Ananya Rao (Student 02, not eligible, missing DATA301) ──
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take DATA302?', profileId: 'VU-DEMO-002' });
    check(5, 'DATA302 eligibility — Ananya Rao (not eligible)',
      r.state === 'ANSWERABLE' && r.ruleResults?.eligible === false,
      r
    );
  }

  // ── TEST 6: Summer Term course offerings ──
  {
    const r = await apiPost('/api/advisory', { query: 'What courses are offered in Summer Term 2026?' });
    check(6, 'Summer Term course offerings',
      r.state === 'ANSWERABLE' && (r.answer.includes('73') || r.answer.includes('Summer')) && r.sources?.length > 0,
      r
    );
  }

  // ── TEST 7: Missing student information (no profile, eligibility question) ──
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take DATA302?' });
    check(7, 'Missing student info — NEEDS_STUDENT_INFORMATION',
      r.state === 'NEEDS_STUDENT_INFORMATION',
      r
    );
  }

  // ── TEST 8: Unknown / unsupported course ──
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take XYZ999?', profileId: 'VU-DEMO-001' });
    check(8, 'Unknown course — INSUFFICIENT_INFORMATION',
      r.state === 'INSUFFICIENT_INFORMATION',
      r
    );
  }

  // ── TEST 9: Program information question ──
  {
    const r = await apiPost('/api/advisory', { query: 'What programs are offered at Vidyashilp University?' });
    check(9, 'Program information',
      r.state === 'ANSWERABLE' && r.answer.includes('B.Tech') && r.answer.includes('BMS'),
      r
    );
  }

  // ── TEST 10: Psychology program question — Aditya Sharma (Student 07) ──
  {
    const r = await apiPost('/api/advisory', { query: 'What courses are in the Psychology curriculum?', profileId: 'VU-DEMO-007' });
    check(10, 'Psychology program question — INSUFFICIENT_INFORMATION',
      r.state === 'INSUFFICIENT_INFORMATION' && r.answer.toLowerCase().includes('psychology'),
      r
    );
  }

  // ── TEST 11: Economics program question — Vihaan Patel (Student 09) ──
  {
    const r = await apiPost('/api/advisory', { query: 'What are the prerequisite courses for Economics?', profileId: 'VU-DEMO-009' });
    check(11, 'Economics program question — INSUFFICIENT_INFORMATION',
      r.state === 'INSUFFICIENT_INFORMATION' && r.answer.toLowerCase().includes('economics'),
      r
    );
  }

  // ── TEST 12: BMS program question — Ishita Kapoor (Student 04) ──
  {
    const r = await apiPost('/api/advisory', { query: 'What courses are in the BMS curriculum?', profileId: 'VU-DEMO-004' });
    check(12, 'BMS program question — INSUFFICIENT_INFORMATION',
      r.state === 'INSUFFICIENT_INFORMATION' && r.answer.toLowerCase().includes('bms'),
      r
    );
  }

  // ── TEST 13: Design program question — Siddharth Joshi (Student 11) ──
  {
    const r = await apiPost('/api/advisory', { query: 'What are the B.Des Communication Design courses?', profileId: 'VU-DEMO-011' });
    check(13, 'Design program question — INSUFFICIENT_INFORMATION',
      r.state === 'INSUFFICIENT_INFORMATION' && r.answer.toLowerCase().includes('design'),
      r
    );
  }

  // ── TEST 14: Law program question — Tanvi Malhotra (Student 12) ──
  {
    const r = await apiPost('/api/advisory', { query: 'What are the LLB course prerequisites?', profileId: 'VU-DEMO-012' });
    check(14, 'Law program question — INSUFFICIENT_INFORMATION',
      r.state === 'INSUFFICIENT_INFORMATION',
      r
    );
  }

  // ── TEST 15: Out-of-scope question ──
  {
    const r = await apiPost('/api/advisory', { query: 'What is the weather like today?' });
    check(15, 'Out-of-scope question — OUT_OF_SCOPE',
      r.state === 'OUT_OF_SCOPE',
      r
    );
  }

  // ── Bonus: Attendance with Arjun Menon (Student 05, fees pending, att 77.5%) ──
  {
    const r = await apiPost('/api/advisory', { query: 'What is the attendance requirement?', profileId: 'VU-DEMO-005' });
    const ok = r.state === 'ANSWERABLE' && r.answer.includes('75');
    console.log(`${ok ? '✅' : '❌'} Bonus: Attendance with Arjun Menon (BMS, Sem 5)`);
  }

  // ── Bonus: Diya Srinivasan (Student 14, Psychology Research, Sem 7) attendance ──
  {
    const r = await apiPost('/api/advisory', { query: 'Am I meeting the attendance requirement?', profileId: 'VU-DEMO-014' });
    const ok = r.state === 'ANSWERABLE' && r.answer.includes('93.5');
    console.log(`${ok ? '✅' : '❌'} Bonus: Attendance check — Diya Srinivasan (BA Psych Research)`);
  }

  // ── Bonus: Pending fees — Arjun Menon (Student 05) ──
  {
    const r = await apiPost('/api/advisory', { query: 'Can I register with pending fees?', profileId: 'VU-DEMO-005' });
    const ok = r.state === 'ANSWERABLE' && r.answer.toLowerCase().includes('pending');
    console.log(`${ok ? '✅' : '❌'} Bonus: Pending fees — Arjun Menon`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed / ${failed} failed out of 15 required tests`);
  console.log('═══════════════════════════════════════════════════════');

  // Profile count check
  console.log(`\n📊 Synthetic students: ${profiles.length}/18`);
  if (profiles.length === 18) {
    console.log('  ✅ All 15 synthetic students present');
  } else {
    console.log(`  ❌ Expected 15, got ${profiles.length}`);
  }

  // Program diversity check
  const programSet = new Set(profiles.map(p => p.program));
  console.log(`  Programs represented: ${programSet.size}`);
  [...programSet].forEach(p => console.log(`    • ${p}`));

  // Source citation check
  const answeredWithSources = results.filter(r => r.ok && r.actual?.sources?.length > 0);
  console.log(`\n📚 Tests with source citations: ${answeredWithSources.length}`);

  console.log('\n═══════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 ALL 15 TESTS PASSED');
  } else {
    console.log(`⚠️  ${failed} test(s) failed`);
  }
  console.log('\nRun: npm run dev');
  console.log('URL: http://localhost:3000\n');
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
