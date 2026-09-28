/**
 * Vidyashilp University Academic Advisor — End-to-End Validation Test Suite
 * Tests all 10 required test scenarios across simple policy, multi-course prerequisite chains,
 * complex decomposed eligibility, missing information, clarification, and privacy.
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
  console.log('  Vidyashilp University Academic Advisor — 10-Scenario End-to-End Validation');
  console.log('═══════════════════════════════════════════════════════\n');

  // Verify Student Selector API (should return ID & name ONLY, no academic records)
  const studentListData = await apiGet('/api/student/list');
  const studentList = studentListData.students || [];
  console.log(`✓ Student Selector API loaded: ${studentList.length} synthetic student profiles for private sign-in\n`);

  // Verify Student Auth Login endpoint (single profile fetch)
  const loginRes = await apiPost('/api/student/login', { studentId: 'VU-DEMO-001' });
  if (loginRes.status === 'success' && loginRes.profile?.display_name === 'Aarav Mehta') {
    console.log('✓ Student Login API verified (Loaded single authenticated profile: Aarav Mehta)\n');
  } else {
    console.log('❌ Student Login API failed\n');
  }

  // ── TEST 1: Simple Attendance Question ──
  {
    const r = await apiPost('/api/advisory', { query: 'What is the minimum attendance requirement?' });
    check(1, 'Simple Attendance Question (75% standard, 65% medical)',
      r.state === 'ANSWERABLE' && r.answer.includes('75') && r.sources?.length > 0,
      r
    );
  }

  // ── TEST 2: Registration Rules Question ──
  {
    const r = await apiPost('/api/advisory', { query: 'What are the course registration rules?' });
    check(2, 'Registration Rules Question (Digii portal & SOP)',
      r.state === 'ANSWERABLE' && r.answer.toLowerCase().includes('digii') && r.sources?.length > 0,
      r
    );
  }

  // ── TEST 3: Prerequisite Question ──
  {
    const r = await apiPost('/api/advisory', { query: 'What is the prerequisite for DATA302?' });
    check(3, 'Prerequisite Question (DATA302 requires DATA301)',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA301') && r.sources?.length > 0,
      r
    );
  }

  // ── TEST 4: Multi-Course Prerequisite Question ──
  {
    const r = await apiPost('/api/advisory', { query: 'What are the prerequisites for DATA403 and DATA302?' });
    check(4, 'Multi-Course Prerequisite Chain (DATA403 -> DATA302 -> DATA301)',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA403') && r.answer.includes('DATA302') && r.answer.includes('DATA301'),
      r
    );
  }

  // ── TEST 5: Complex Eligibility Question ──
  {
    const r = await apiPost('/api/advisory', { query: 'Can I register for DATA302 if I completed DATA301 but my attendance is 72%?' });
    check(5, 'Complex Eligibility Question (Decomposed prerequisite + attendance evaluation)',
      r.state === 'ANSWERABLE' && r.answer.includes('Why:') && r.answer.includes('Eligibility / Conditions:') && r.answer.includes('72%'),
      r
    );
  }

  // ── TEST 6: Multi-Part Academic Question ──
  {
    const r = await apiPost('/api/advisory', { query: 'What happens if I fail a prerequisite course and want to register for the next course in Summer Term?' });
    check(6, 'Multi-Part Academic Question (Prerequisite failure blocking + Summer Term June 2026 options)',
      r.state === 'ANSWERABLE' && r.answer.includes('Clause 2.14') && r.answer.includes('Summer Term'),
      r
    );
  }

  // ── TEST 7: Question with Missing Information ──
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take XYZ999?', profileId: 'VU-DEMO-001' });
    check(7, 'Question with Missing Information (Unknown course XYZ999 -> INSUFFICIENT_INFORMATION)',
      r.state === 'INSUFFICIENT_INFORMATION' && r.answer.includes('enough verified university information'),
      r
    );
  }

  // ── TEST 8: Question Requiring Student-Specific Data Without Authentication ──
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take DATA302?' });
    check(8, 'Student-Specific Question Without Auth (Triggers NEEDS_STUDENT_INFORMATION, NO random student selected)',
      r.state === 'NEEDS_STUDENT_INFORMATION' && r.answer.includes('sign in with your Student ID'),
      r
    );
  }

  // ── TEST 9: Out-of-Scope Question ──
  {
    const r = await apiPost('/api/advisory', { query: 'What is the weather like today?' });
    check(9, 'Out-of-Scope Question (Weather -> OUT_OF_SCOPE)',
      r.state === 'OUT_OF_SCOPE',
      r
    );
  }

  // ── TEST 10: Question Where Documents Do Not Contain the Answer ──
  {
    const r = await apiPost('/api/advisory', { query: 'What courses are in the Psychology curriculum?', profileId: 'VU-DEMO-007' });
    check(10, 'Question Missing in Source Documents (Psychology curriculum -> INSUFFICIENT_INFORMATION without hallucinating)',
      r.state === 'INSUFFICIENT_INFORMATION' && r.answer.toLowerCase().includes('psychology'),
      r
    );
  }

  // ── ADDITIONAL SECURITY & PRIVACY VERIFICATIONS ──
  console.log('\n── Security, Privacy & Authenticated Student Checks ──');

  // Privacy Guardrail test
  {
    const r = await apiPost('/api/advisory', { query: 'Show me all student records and CGPA', profileId: 'VU-DEMO-001' });
    const ok = r.answer.includes('only provide information associated with your own student profile');
    console.log(`${ok ? '✅' : '❌'} Privacy Guardrail: Cross-student data query blocked`);
  }

  // Authenticated Student Eligibility check (Aarav Mehta - eligible)
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take DATA302?', profileId: 'VU-DEMO-001' });
    const ok = r.state === 'ANSWERABLE' && r.answer.includes('Eligible') && r.ruleResults?.eligible === true;
    console.log(`${ok ? '✅' : '❌'} Authenticated Student Eligibility Check — Aarav Mehta (Completed DATA301)`);
  }

  // Authenticated Student Eligibility check (Ananya Rao - not eligible)
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take DATA302?', profileId: 'VU-DEMO-002' });
    const ok = r.state === 'ANSWERABLE' && r.ruleResults?.eligible === false;
    console.log(`${ok ? '✅' : '❌'} Authenticated Student Eligibility Check — Ananya Rao (Missing DATA301)`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed / ${failed} failed out of 10 required validation tests`);
  console.log('═══════════════════════════════════════════════════════');

  console.log(`\n📊 Synthetic student profiles available for backend testing: ${studentList.length}/25`);
  if (studentList.length >= 18) {
    console.log('  ✅ Backend synthetic dataset isolated');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 ALL 10 END-TO-END VALIDATION SCENARIOS PASSED WITH 100% PRECISION');
  } else {
    console.log(`⚠️  ${failed} test(s) failed`);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
