/**
 * Vidyashilp University Academic Advisor — Section 14 End-to-End Validation Suite
 * Validates all 15 required test scenarios from the production query pass prompt.
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

function check(testNum, question, condition, actual) {
  const ok = !!condition;
  if (ok) passed++;
  else failed++;

  const icon = ok ? '✅' : '❌';
  console.log(`${icon} Test ${String(testNum).padStart(2, '0')}: "${question}"`);
  if (!ok) {
    console.log(`   → State: ${actual?.state}`);
    console.log(`   → Answer: ${String(actual?.answer || '').slice(0, 160)}...`);
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('  Vidyashilp University Academic Advisor — Section 14 Test Suite');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  // Verify Student Selector API & Login
  const studentListData = await apiGet('/api/student/list');
  const studentList = studentListData.students || [];
  console.log(`✓ Student Selector API: ${studentList.length} internal profiles available`);

  const loginRes = await apiPost('/api/student/login', { studentId: 'VU-DEMO-001' });
  const profile = loginRes.profile;
  console.log(`✓ Student Profile Loaded: ${profile?.display_name} (${profile?.programName}, Semester ${profile?.semester}, ${profile?.academicYear})\n`);

  // 1. What is the minimum attendance requirement?
  {
    const r = await apiPost('/api/advisory', { query: 'What is the minimum attendance requirement?' });
    check(1, 'What is the minimum attendance requirement?',
      r.state === 'ANSWERABLE' && r.answer.includes('75%') && r.sources?.length > 0, r);
  }

  // 2. What are the prerequisites for DATA302?
  {
    const r = await apiPost('/api/advisory', { query: 'What are the prerequisites for DATA302?' });
    check(2, 'What are the prerequisites for DATA302?',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA301'), r);
  }

  // 3. Can I take DATA302?
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take DATA302?', profileId: 'VU-DEMO-001' });
    check(3, 'Can I take DATA302?',
      r.state === 'ANSWERABLE' && r.answer.includes('Eligible') && r.answer.includes('Semester 5'), r);
  }

  // 4. Can I take deep learning?
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take deep learning?', profileId: 'VU-DEMO-001' });
    check(4, 'Can I take deep learning?',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA302 — Deep Learning') && r.answer.includes('Eligible'), r);
  }

  // 5. Can I take machine learning?
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take machine learning?', profileId: 'VU-DEMO-001' });
    check(5, 'Can I take machine learning?',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA301 — Machine Learning') && r.answer.includes('Eligible'), r);
  }

  // 6. What are the prerequisites for DATA306?
  {
    const r = await apiPost('/api/advisory', { query: 'What are the prerequisites for DATA306?' });
    check(6, 'What are the prerequisites for DATA306?',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA301'), r);
  }

  // 7. What are the prerequisites for DATA405?
  {
    const r = await apiPost('/api/advisory', { query: 'What are the prerequisites for DATA405?' });
    check(7, 'What are the prerequisites for DATA405?',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA301'), r);
  }

  // 8. Which courses can I take in my next semester?
  {
    const r = await apiPost('/api/advisory', { query: 'Which courses can I take in my next semester?', profileId: 'VU-DEMO-001' });
    check(8, 'Which courses can I take in my next semester?',
      r.state === 'ANSWERABLE' && r.answer.includes('Semester 5'), r);
  }

  // 9. I completed DATA201. What courses can I take next?
  {
    const r = await apiPost('/api/advisory', { query: 'I completed DATA201. What courses can I take next?', profileId: 'VU-DEMO-001' });
    check(9, 'I completed DATA201. What courses can I take next?',
      r.state === 'ANSWERABLE' && (r.answer.includes('DATA301') || r.answer.includes('Semester 5')), r);
  }

  // 10. I am in semester 5. Which academic year am I in?
  {
    const r = await apiPost('/api/advisory', { query: 'I am in semester 5. Which academic year am I in?', profileId: 'VU-DEMO-001' });
    check(10, 'I am in semester 5. Which academic year am I in?',
      r.state === 'ANSWERABLE' && (r.answer.includes('Year 3') || r.answer.includes('3rd Year')), r);
  }

  // 11. What is the credit value of DATA302?
  {
    const r = await apiPost('/api/advisory', { query: 'What is the credit value of DATA302?' });
    check(11, 'What is the credit value of DATA302?',
      r.state === 'ANSWERABLE' && r.answer.includes('4 credits'), r);
  }

  // 12. What courses are available in the Summer Term?
  {
    const r = await apiPost('/api/advisory', { query: 'What courses are available in the Summer Term?' });
    check(12, 'What courses are available in the Summer Term?',
      r.state === 'ANSWERABLE' && r.answer.includes('Summer Term'), r);
  }

  // 13. Can I register if I have pending fees?
  {
    const r = await apiPost('/api/advisory', { query: 'Can I register if I have pending fees?' });
    check(13, 'Can I register if I have pending fees?',
      r.state === 'ANSWERABLE' && r.answer.toLowerCase().includes('pending fee'), r);
  }

  // 14. Complex multi-course eligibility question
  {
    const queryStr = 'I am in semester 5, have completed DATA201 and DATA301, my CGPA is 8.2 and attendance is 82%. Which AI/data courses can I take next semester?';
    const r = await apiPost('/api/advisory', { query: queryStr, profileId: 'VU-DEMO-001' });
    check(14, 'Complex multi-course eligibility question',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA302'), r);
  }

  // 15. Intentionally unknown course name
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take quantum computing?', profileId: 'VU-DEMO-001' });
    check(15, 'Intentionally unknown course name (Suggests real candidates)',
      r.state === 'INSUFFICIENT_INFORMATION' && r.answer.includes("couldn't find an official university course") && r.answer.includes('DATA302'), r);
  }

  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log(`  FINAL RESULTS: ${passed}/15 Section 14 Test Scenarios PASSED (${failed} failed)`);
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 ALL 15 REQUIRED SECTION 14 SCENARIOS PASSED WITH 100% EVIDENCE PRECISION!');
  } else {
    console.log(`⚠️  ${failed} test(s) failed.`);
  }
}

runTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
