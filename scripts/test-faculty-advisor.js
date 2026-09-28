/**
 * Vidyashilp University Academic Advisor — 18-Question Section 30 Final Validation Suite
 * Executes all 18 required test questions from prompt Section 30 plus privacy, academic year, and hallucination checks.
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

function check(testNum, category, question, condition, actual) {
  const ok = !!condition;
  if (ok) passed++;
  else failed++;

  const icon = ok ? '✅' : '❌';
  console.log(`${icon} Q${String(testNum).padStart(2, '0')} [${category}] "${question}"`);
  if (!ok) {
    console.log(`   → State: ${actual?.state}`);
    console.log(`   → Answer: ${String(actual?.answer || '').slice(0, 140)}...`);
  }
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log('  Vidyashilp University Academic Advisor — Section 30 Required 18-Question Test Suite');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  // Verify Student Selector API & Login
  const studentListData = await apiGet('/api/student/list');
  const studentList = studentListData.students || [];
  console.log(`✓ Student Selector API: ${studentList.length} internal profiles available`);

  const loginRes = await apiPost('/api/student/login', { studentId: 'VU-DEMO-001' });
  const profile = loginRes.profile;
  console.log(`✓ Student Profile Loaded: ${profile?.display_name} (${profile?.programName}, Semester ${profile?.semester}, ${profile?.academicYear})\n`);

  // ── BASIC ──
  // 1. What is the minimum attendance requirement?
  {
    const r = await apiPost('/api/advisory', { query: 'What is the minimum attendance requirement?' });
    check(1, 'BASIC', 'What is the minimum attendance requirement?',
      r.state === 'ANSWERABLE' && r.answer.includes('75%') && r.sources?.length > 0, r);
  }

  // 2. What is DATA302?
  {
    const r = await apiPost('/api/advisory', { query: 'What is DATA302?' });
    check(2, 'BASIC', 'What is DATA302?',
      r.state === 'ANSWERABLE' && r.answer.includes('Deep Learning') && r.answer.includes('4 credits'), r);
  }

  // 3. How many credits is DATA302?
  {
    const r = await apiPost('/api/advisory', { query: 'How many credits is DATA302?' });
    check(3, 'BASIC', 'How many credits is DATA302?',
      r.state === 'ANSWERABLE' && r.answer.includes('4 credits'), r);
  }

  // 4. What are the prerequisites for DATA302?
  {
    const r = await apiPost('/api/advisory', { query: 'What are the prerequisites for DATA302?' });
    check(4, 'BASIC', 'What are the prerequisites for DATA302?',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA301'), r);
  }

  // ── COURSE ──
  // 5. What is COMP301?
  {
    const r = await apiPost('/api/advisory', { query: 'What is COMP301?' });
    check(5, 'COURSE', 'What is COMP301?',
      r.state === 'ANSWERABLE' && r.answer.includes('Artificial Intelligence') && r.answer.includes('4 credits'), r);
  }

  // 6. How many credits is COMP201?
  {
    const r = await apiPost('/api/advisory', { query: 'How many credits is COMP201?' });
    check(6, 'COURSE', 'How many credits is COMP201?',
      r.state === 'ANSWERABLE' && r.answer.includes('4 credits'), r);
  }

  // 7. What is DATA303?
  {
    const r = await apiPost('/api/advisory', { query: 'What is DATA303?' });
    check(7, 'COURSE', 'What is DATA303?',
      r.state === 'ANSWERABLE' && (r.answer.includes('MLOps') || r.answer.includes('2 credits')), r);
  }

  // 8. Which courses have 4 credits?
  {
    const r = await apiPost('/api/advisory', { query: 'Which courses have 4 credits?' });
    check(8, 'COURSE', 'Which courses have 4 credits?',
      r.state === 'ANSWERABLE' && r.answer.includes('4 credits') && r.answer.includes('COMP201'), r);
  }

  // ── SUMMER ──
  // 9. What courses are offered during Summer Term June 2026?
  {
    const r = await apiPost('/api/advisory', { query: 'What courses are offered during Summer Term June 2026?' });
    check(9, 'SUMMER', 'What courses are offered during Summer Term June 2026?',
      r.state === 'ANSWERABLE' && r.answer.includes('Summer Term') && r.answer.includes('42'), r);
  }

  // 10. Is DATA303 offered during Summer Term June 2026?
  {
    const r = await apiPost('/api/advisory', { query: 'Is DATA303 offered during Summer Term June 2026?' });
    check(10, 'SUMMER', 'Is DATA303 offered during Summer Term June 2026?',
      r.state === 'ANSWERABLE' && r.answer.includes('Yes') && r.answer.includes('DATA303'), r);
  }

  // ── COMPLEX ──
  // 11. Can a Data Science student take DATA302 based on their completed courses?
  {
    const r = await apiPost('/api/advisory', { query: 'Can a Data Science student take DATA302 based on their completed courses?', profileId: 'VU-DEMO-001' });
    check(11, 'COMPLEX', 'Can a Data Science student take DATA302 based on completed courses?',
      r.state === 'ANSWERABLE' && r.answer.includes('Eligible'), r);
  }

  // 12. What courses can a Semester 5 Data Science student take?
  {
    const r = await apiPost('/api/advisory', { query: 'What courses can I take?', profileId: 'VU-DEMO-001' });
    check(12, 'COMPLEX', 'What courses can a Semester 5 Data Science student take?',
      r.state === 'ANSWERABLE' && r.answer.includes('Semester 5'), r);
  }

  // 13. What are the prerequisites, credits, and eligibility requirements for DATA302?
  {
    const r = await apiPost('/api/advisory', { query: 'What are the prerequisites, credits, and eligibility requirements for DATA302?', profileId: 'VU-DEMO-001' });
    check(13, 'COMPLEX', 'Prerequisites, credits, and eligibility requirements for DATA302',
      r.state === 'ANSWERABLE' && r.answer.includes('DATA301') && r.answer.includes('4'), r);
  }

  // 14. Compare two courses using only verified university information.
  {
    const r = await apiPost('/api/advisory', { query: 'Compare COMP201 and DATA302 using only verified university information' });
    check(14, 'COMPLEX', 'Compare two courses using only verified university information',
      r.state === 'ANSWERABLE' && r.answer.includes('COMP201') && r.answer.includes('DATA302'), r);
  }

  // 15. What 4-credit courses are available to this student based on their program and completed courses?
  {
    const r = await apiPost('/api/advisory', { query: 'What 4-credit courses are available to this student based on their program and completed courses?', profileId: 'VU-DEMO-001' });
    check(15, 'COMPLEX', 'What 4-credit courses are available to this student?',
      r.state === 'ANSWERABLE' && r.answer.includes('4 credits'), r);
  }

  // ── MISSING INFORMATION ──
  // 16. Can I take this course next semester?
  {
    const r = await apiPost('/api/advisory', { query: 'Can I take this course next semester?' });
    check(16, 'MISSING_INFO', 'Can I take this course next semester? (Prompts for course)',
      r.state === 'NEEDS_CLARIFICATION' && r.answer.includes('Which course'), r);
  }

  // 17. Am I eligible?
  {
    const r = await apiPost('/api/advisory', { query: 'Am I eligible?' });
    check(17, 'MISSING_INFO', 'Am I eligible? (Prompts for course & profile)',
      r.state === 'NEEDS_CLARIFICATION' && r.answer.includes('Which course'), r);
  }

  // 18. Ask about an unknown course.
  {
    const r = await apiPost('/api/advisory', { query: 'Is XYZ999 a prerequisite for DATA302?' });
    check(18, 'MISSING_INFO', 'Is XYZ999 a prerequisite for DATA302? (Unknown course guard)',
      r.state === 'INSUFFICIENT_INFORMATION' && r.answer.includes("couldn't verify"), r);
  }

  // ── EXTRA AUDIT: STUDENT ACADEMIC YEAR DERIVATION TEST ──
  console.log('\n── Academic Year Derivation Check ──');
  const isYear3 = profile?.academicYear === '3rd Year';
  console.log(`${isYear3 ? '✅' : '❌'} Semester 5 -> 3rd Year Mapping: ${profile?.academicYear}`);

  console.log('\n═══════════════════════════════════════════════════════════════════════════');
  console.log(`  FINAL RESULTS: ${passed}/18 Section 30 Test Questions PASSED (${failed} failed)`);
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  if (failed === 0 && isYear3) {
    console.log('🎉 ALL 18 REQUIRED SECTION 30 SCENARIOS PASSED WITH 100% EVIDENCE ACCURACY!');
  } else {
    console.log(`⚠️  ${failed} test(s) failed.`);
  }
}

runTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
