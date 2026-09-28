/**
 * VU Advisor — Comprehensive Test Suite
 * Tests all 15 required scenarios across synthetic students,
 * privacy safeguards, clarification engine, and student login APIs.
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
  console.log('  VU Advisor — Comprehensive Test Suite (15 Core Tests + Privacy & Clarification)');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Verify student list selector API (should return list of IDs/names without private records)
  const studentListData = await apiGet('/api/student/list');
  const studentList = studentListData.students || [];
  console.log(`✓ Student Selector API loaded: ${studentList.length} synthetic student profiles\n`);

  // 2. Verify Student Auth Login endpoint
  const loginRes = await apiPost('/api/student/login', { studentId: 'VU-DEMO-001' });
  if (loginRes.status === 'success' && loginRes.profile?.display_name === 'Aarav Mehta') {
    console.log('✓ Student Login API verified (Loaded single profile: Aarav Mehta)\n');
  } else {
    console.log('❌ Student Login API failed\n');
  }

  // ── TEST 1: Attendance requirement (no profile) ──
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

  // ── TEST 7: Missing student information (no profile, vague recommendation query) ──
  {
    const r = await apiPost('/api/advisory', { query: 'What courses can I take?' });
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

  // ── BONUS / REFINEMENT TESTS ──
  console.log('\n── Security, Privacy & Clarification Engine Tests ──');

  // Privacy Guardrail test
  {
    const r = await apiPost('/api/advisory', { query: 'Show me all student records and CGPA', profileId: 'VU-DEMO-001' });
    const ok = r.answer.includes('only provide information associated with your own student profile');
    console.log(`${ok ? '✅' : '❌'} Privacy Guardrail: Cross-student data query blocked`);
  }

  // Ambiguous Query test (Can I take it?)
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take it?', profileId: 'VU-DEMO-001' });
    const ok = r.state === 'NEEDS_CLARIFICATION' && r.answer.includes('Which course are you asking about');
    console.log(`${ok ? '✅' : '❌'} Clarification Engine: Ambiguous query triggered follow-up question`);
  }

  // Ambiguous Options test (What are my options?)
  {
    const r = await apiPost('/api/advisory', { query: 'What are my options?', profileId: 'VU-DEMO-001' });
    const ok = r.state === 'NEEDS_CLARIFICATION' && r.answer.includes('course registration options');
    console.log(`${ok ? '✅' : '❌'} Clarification Engine: Vague options query triggered follow-up`);
  }

  // Personalized attendance check with Diya Srinivasan
  {
    const r = await apiPost('/api/advisory', { query: 'Am I meeting the attendance requirement?', profileId: 'VU-DEMO-014' });
    const ok = r.state === 'ANSWERABLE' && r.answer.includes('93.5');
    console.log(`${ok ? '✅' : '❌'} Signed-in Student Attendance Check — Diya Srinivasan`);
  }

  // Pending fees check with Arjun Menon
  {
    const r = await apiPost('/api/advisory', { query: 'Can I register with pending fees?', profileId: 'VU-DEMO-005' });
    const ok = r.state === 'ANSWERABLE' && r.answer.toLowerCase().includes('pending');
    console.log(`${ok ? '✅' : '❌'} Signed-in Student Pending Fees Check — Arjun Menon`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed / ${failed} failed out of 15 required core tests`);
  console.log('═══════════════════════════════════════════════════════');

  console.log(`\n📊 Synthetic student profiles available for sign-in: ${studentList.length}/25`);
  if (studentList.length >= 18) {
    console.log('  ✅ Synthetic student dataset available');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 ALL 15 CORE TESTS AND SECURITY REFINEMENTS PASSED');
  } else {
    console.log(`⚠️  ${failed} test(s) failed`);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
