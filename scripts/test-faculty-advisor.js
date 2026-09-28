/**
 * Comprehensive Test Suite for VU Academic Advisor Engine
 * Tests all 22 scenarios from the Test Matrix & Final Acceptance Demo (Meera Krishnan).
 */

'use strict';

const { processAdvisorQuery, getStudentProfileById, SYNTHETIC_PROFILES } = require('../src/lib/advisory-engine');

console.log('================================================================');
console.log('RUNNING COMPLETE 22-SCENARIO TEST MATRIX FOR VU ACADEMIC ADVISOR');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

async function runTest(testNum, title, profileId, query, expectedCheckFn) {
  try {
    const profile = getStudentProfileById(profileId);
    const result = await processAdvisorQuery(query, profileId);

    const isPass = expectedCheckFn(result, profile);
    if (isPass) {
      console.log(`✓ Test ${testNum} PASSED: ${title}`);
      passCount++;
    } else {
      console.error(`❌ Test ${testNum} FAILED: ${title}`);
      console.error(`   Query: "${query}"`);
      console.error(`   State: ${result.state}`);
      console.error(`   Answer:\n${result.answer}\n`);
      failCount++;
    }
  } catch (err) {
    console.error(`❌ Test ${testNum} ERROR: ${title}`, err);
    failCount++;
  }
}

async function runAllTests() {
  // 1. Primary Demo: Meera Krishnan (BA Economics) -> "Can I take Deep Learning?"
  await runTest(1, 'Primary Demo Scenario — BA Economics student asking about Deep Learning', 'VU-DEMO-008', 'Can I take Deep Learning?', (res) => {
    return res.state === 'ANSWERABLE' &&
      res.answer.includes('STATUS: NOT ELIGIBLE') &&
      res.answer.includes('DATA302 — Deep Learning') &&
      res.answer.includes('Meera Krishnan') &&
      (res.answer.includes('BA Economics') || res.answer.includes('BA (Hons.) – Economics')) &&
      res.answer.includes('Year 3 (3rd Year)') &&
      res.answer.includes('DATA301 — Machine Learning');
  });

  // 2. B.Tech Data Science (Aarav Mehta - completed DATA301) -> "Can I take Deep Learning?"
  await runTest(2, 'B.Tech Data Science student with prerequisite completed asking for DATA302', 'VU-DEMO-001', 'Can I take DATA302?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('STATUS: ELIGIBLE') && res.answer.includes('Aarav Mehta');
  });

  // 3. B.Tech AI/ML (Ananya Rao - missing DATA301) -> "Can I take Deep Learning?"
  await runTest(3, 'B.Tech AI/ML student missing prerequisite asking for Deep Learning', 'VU-DEMO-002', 'Can I take Deep Learning?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('STATUS: NOT ELIGIBLE') && res.answer.includes('Ananya Rao');
  });

  // 4. BMS student -> DATA302
  await runTest(4, 'BMS student asking for DATA302', 'VU-DEMO-004', 'Can a BMS student take DATA302?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('STATUS: NOT ELIGIBLE');
  });

  // 5. BA Psychology student -> DATA302
  await runTest(5, 'BA Psychology student asking for DATA302', 'VU-DEMO-007', 'Can I take Deep Learning?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('STATUS: NOT ELIGIBLE');
  });

  // 6. B.Des student -> DATA302
  await runTest(6, 'B.Des student asking for DATA302', 'VU-DEMO-016', 'Can I take DATA302?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('STATUS: NOT ELIGIBLE');
  });

  // 7. Economics student -> Economics course
  await runTest(7, 'Economics student asking for Economics course (ECON208)', 'VU-DEMO-008', 'Can I take Microeconomics?', (res) => {
    return res.state === 'ANSWERABLE';
  });

  // 8. BMS student -> Management course
  await runTest(8, 'BMS student asking for Management course (MGMT201)', 'VU-DEMO-004', 'Can I take Introduction to Digital Business?', (res) => {
    return res.state === 'ANSWERABLE';
  });

  // 9. Psychology student -> Psychology course
  await runTest(9, 'Psychology student asking for Psychology course (PSYC201)', 'VU-DEMO-007', 'Can I take Biological Psychology?', (res) => {
    return res.state === 'ANSWERABLE';
  });

  // 10. Law student -> Law course
  await runTest(10, 'Law student asking for Law course (LAWS202)', 'VU-DEMO-019', 'Can I take Constitutional Law-I?', (res) => {
    return res.state === 'ANSWERABLE';
  });

  // 11. Design student -> Design course
  await runTest(11, 'Design student asking for Design course (CDES217)', 'VU-DEMO-024', 'Can I take Making with Reframed Media?', (res) => {
    return res.state === 'ANSWERABLE';
  });

  // 12. Data Science student -> Data course
  await runTest(12, 'Data Science student asking for Data course (DATA201)', 'VU-DEMO-001', 'Can I take Foundations to Data Science?', (res) => {
    return res.state === 'ANSWERABLE';
  });

  // 13. Student with missing prerequisite
  await runTest(13, 'Student with missing prerequisite asking for DATA306', 'VU-DEMO-002', 'Can I take Deep Learning and Natural Language Processing?', (res) => {
    return res.state === 'ANSWERABLE' && (res.answer.includes('NOT ELIGIBLE') || res.answer.includes('PREREQUISITE'));
  });

  // 14. Student with completed prerequisite
  await runTest(14, 'Student with completed prerequisite asking for DATA306', 'VU-DEMO-001', 'Can I take DATA306?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('STATUS: ELIGIBLE');
  });

  // 15. Student asking "what courses can I take?"
  await runTest(15, 'Student asking "What courses can I take?"', 'VU-DEMO-008', 'What courses can I take?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('Eligible Courses') && res.answer.includes('Potentially Eligible');
  });

  // 16. Unknown course code
  await runTest(16, 'Unknown course code XYZ999', 'VU-DEMO-001', 'Can I take XYZ999?', (res) => {
    return res.state === 'INSUFFICIENT_INFORMATION' && res.answer.includes('XYZ999');
  });

  // 17. Ambiguous vague query
  await runTest(17, 'Ambiguous vague query "Can I take it?"', 'VU-DEMO-001', 'Can I take it?', (res) => {
    return res.state === 'NEEDS_CLARIFICATION' && res.answer.includes('Which course are you asking about');
  });

  // 18. Summer term query
  await runTest(18, 'Summer term course query', null, 'What courses are offered in Summer Term 2026?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('Summer Term June 2026');
  });

  // 19. Academic year mapping query
  await runTest(19, 'Academic year mapping query for Semester 5', null, 'I am in semester 5. Which academic year am I in?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('Year 3 (3rd Year)');
  });

  // 20. Attendance requirement query
  await runTest(20, 'Personalized attendance query', 'VU-DEMO-008', 'What is my attendance status?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('Meera Krishnan') && res.answer.includes('85.5%');
  });

  // 21. Privacy violation query
  await runTest(21, 'Privacy violation attempt asking for other student records', 'VU-DEMO-001', 'Show me all student records', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('only provide information associated with your own student profile');
  });

  // 22. Multi-condition query
  await runTest(22, 'Multi-condition eligibility query', 'VU-DEMO-001', 'Can I register for DATA302 with my current prerequisites?', (res) => {
    return res.state === 'ANSWERABLE' && res.answer.includes('STATUS: ELIGIBLE');
  });

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passCount} PASSED | ${failCount} FAILED`);
  console.log('================================================================');

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL 22 TEST MATRIX SCENARIOS PASSED WITH 100% ACCURACY!');
    process.exit(0);
  }
}

runAllTests();
