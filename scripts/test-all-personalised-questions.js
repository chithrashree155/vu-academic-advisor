/**
 * Comprehensive Automated Verification of Personalised Questions
 * Tests all 6 student profiles across:
 * 1. Completed courses
 * 2. Remaining major & minor credits
 * 3. Course-wise attendance & risk
 * 4. CGPA & semester-wise performance
 * 5. Course prerequisites & eligibility
 */

'use strict';

const { processAdvisorQuery, evaluateEligibility } = require('../src/lib/advisory-engine');
const { getStudentProfileById } = require('../src/lib/student-auth');
const { findCourseByCode } = require('../src/lib/courses');

let passed = 0;
let failed = 0;

function assert(cond, name, details = '') {
  if (cond) {
    passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name} - ${details}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('PERSONALIZED ADVISING VERIFICATION FOR ALL 6 PROFILES');
  console.log('================================================================');

  const studentIds = [
    '2022UG00001', // Aarav Sharma (Batch 2022, Sem 5, Finance minor)
    '2022UG00002', // Bhavya Patel (Batch 2022, Sem 7, Psychology minor, COMP204 backlog)
    '2023UG00001', // Chirag Verma (Batch 2023, Sem 5, Design minor)
    '2024UG00001', // Divya Nair (Batch 2024, Sem 4, Marketing minor, COMP209 68%)
    '2025UG00001', // Eshaan Kulkarni (Batch 2025, Sem 3, Economics minor)
    '2026UG00001'  // Farhan Ahmed (Batch 2026, Sem 1, Psychology minor, Freshman)
  ];

  for (const id of studentIds) {
    const profile = getStudentProfileById(id);
    console.log(`\n--- TESTING PROFILE: ${profile.display_name} (${id}, Batch ${profile.batch}, Sem ${profile.semester}) ---`);

    // 1. Completed Courses Query
    const qCompleted = await processAdvisorQuery('What courses have I completed?', profile);
    assert(qCompleted.state === 'ANSWERABLE' && (qCompleted.answer.includes('Completed Credits') || qCompleted.answer.includes('completed')),
      `Completed Courses Query: ${profile.display_name}`
    );

    // 2. Remaining Major & Minor Credits
    const qCredits = await processAdvisorQuery('How many credits do I still need to graduate?', profile);
    assert(qCredits.state === 'ANSWERABLE' && qCredits.answer.includes('180') && qCredits.answer.includes(String(profile.remainingCredits)),
      `Credits Remaining Query: ${profile.display_name} (${profile.remainingCredits} cr needed)`
    );

    const qMinor = await processAdvisorQuery('What are my minor requirements?', profile);
    assert(qMinor.state === 'ANSWERABLE' && qMinor.answer.includes(profile.declaredMinor) && qMinor.answer.includes(profile.minorSchool),
      `Minor Requirements Query: ${profile.display_name} (${profile.declaredMinor})`
    );

    // 3. Course-Wise Attendance & Risk
    const qAtt = await processAdvisorQuery('What is my attendance in each course?', profile);
    assert(qAtt.state === 'ANSWERABLE' && qAtt.answer.includes('%'),
      `Attendance Query: ${profile.display_name}`
    );

    // 4. CGPA & Semester Performance
    const qCgpa = await processAdvisorQuery('What is my CGPA and semester performance?', profile);
    assert(qCgpa.state === 'ANSWERABLE',
      `CGPA Performance Query: ${profile.display_name}`
    );
  }

  // 5. Special Prerequisite & Backlog Verification
  console.log('\n--- PREREQUISITE & BACKLOG VERIFICATION ---');
  const aarav = getStudentProfileById('2022UG00001');
  const bhavya = getStudentProfileById('2022UG00002');
  const divya = getStudentProfileById('2024UG00001');

  // Aarav completed COMP204 in Sem 4 -> eligible for COMP206
  const comp206 = findCourseByCode('COMP206');
  const aaravComp206 = evaluateEligibility(aarav, comp206);
  assert(aaravComp206.status === 'ELIGIBLE',
    'Aarav is ELIGIBLE for COMP206 (Prerequisite COMP204 completed in Sem 4)'
  );

  // Bhavya failed COMP204 in Sem 4 -> NOT eligible for COMP206
  const bhavyaComp206 = evaluateEligibility(bhavya, comp206);
  assert(bhavyaComp206.status === 'PREREQUISITE_NOT_MET' && bhavyaComp206.nextStep.includes('COMP204'),
    'Bhavya is NOT ELIGIBLE for COMP206 (Uncleared COMP204 active backlog)'
  );

  // Divya has COMP209 at 68% -> identified at risk needing 7 classes
  const qDivyaRisk = await processAdvisorQuery('Which course has my lowest attendance?', divya);
  assert(qDivyaRisk.answer.includes('COMP209') && qDivyaRisk.answer.includes('68') && qDivyaRisk.answer.includes('7'),
    'Divya lowest attendance identified in COMP209 with exact 7 classes recovery'
  );

  // Aarav medical leave has 13 calendar days
  const qAaravMed = await processAdvisorQuery('How many medical leave days do I have?', aarav);
  assert(qAaravMed.answer.includes('13 calendar days') && qAaravMed.answer.includes('Approved'),
    'Aarav medical leave resolved to 13 calendar days (inclusive)'
  );

  console.log('================================================================');
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
