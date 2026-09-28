/**
 * Strict End-to-End Validation of the 10 User-Specified Test Cases
 */

const { processAdvisorQuery, SYNTHETIC_PROFILES } = require('../src/lib/advisory-engine');

async function runTests() {
  console.log('======================================================');
  console.log('RUNNING FINAL 10 BEHAVIOR AND RELIABILITY AUDIT TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details) {
    if (condition) {
      console.log(`✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      if (details) console.error('  Details:', details);
      failed++;
    }
  }

  // Find profiles
  const compatibleProfile = SYNTHETIC_PROFILES.find(p => p.id === 'VU-DEMO-001'); // Aarav Mehta (B.Tech DS, completed DATA301)
  const missingPrereqProfile = SYNTHETIC_PROFILES.find(p => p.id === 'VU-DEMO-002'); // Ananya Rao (B.Tech AIML, missing DATA301)
  const econProfile = SYNTHETIC_PROFILES.find(p => p.id === 'VU-DEMO-008'); // Meera Krishnan (BA Economics)
  const lawProfile = SYNTHETIC_PROFILES.find(p => p.program.includes('LLB')); // Karan Shah (Law)

  // ──────────────────────────────────────────────────────
  // TEST A: Valid compatible course
  // ──────────────────────────────────────────────────────
  console.log('\n--- TEST A: Valid compatible course ---');
  const resA = await processAdvisorQuery('Can I take DATA302?', compatibleProfile.id);
  console.log('Answer snippet:', resA.answer.slice(0, 150) + '...');
  assert(
    resA.answer.includes('STATUS: ELIGIBLE') && resA.answer.includes('DATA302') && resA.answer.includes('4'),
    'Test A: B.Tech student who completed DATA301 is ELIGIBLE for DATA302 (4 cr)'
  );

  // ──────────────────────────────────────────────────────
  // TEST B: Valid course but missing prerequisite
  // ──────────────────────────────────────────────────────
  console.log('\n--- TEST B: Valid course but missing prerequisite ---');
  const resB = await processAdvisorQuery('Can I take DATA302?', missingPrereqProfile.id);
  console.log('Answer snippet:', resB.answer.slice(0, 150) + '...');
  assert(
    resB.answer.includes('STATUS: NOT ELIGIBLE') &&
    (resB.answer.includes('Missing prerequisite') || resB.answer.includes('prerequisite')) &&
    resB.answer.includes('DATA301'),
    'Test B: Student without DATA301 is NOT ELIGIBLE for DATA302 due to missing prerequisite'
  );

  // ──────────────────────────────────────────────────────
  // TEST C: Valid course but incompatible domain
  // ──────────────────────────────────────────────────────
  console.log('\n--- TEST C: Valid course but incompatible domain ---');
  const resC = await processAdvisorQuery('Can an Economics student take Deep Learning?');
  console.log('Answer snippet:', resC.answer.slice(0, 150) + '...');
  assert(
    resC.answer.includes('STATUS: NOT ELIGIBLE') &&
    (resC.answer.includes('School of Computer Science') || resC.answer.includes('domain')) &&
    resC.answer.includes('DATA302'),
    'Test C: Economics student is NOT ELIGIBLE for DATA302 due to School domain incompatibility'
  );

  // ──────────────────────────────────────────────────────
  // TEST D: Valid Law course for Law student
  // ──────────────────────────────────────────────────────
  console.log('\n--- TEST D: Valid Law course for Law student ---');
  const resD = await processAdvisorQuery('I am a Law student. Which Law courses can I take?', lawProfile.id);
  console.log('Answer snippet:', resD.answer.slice(0, 150) + '...');
  assert(
    resD.answer.includes('ELIGIBLE COURSES FOR LAW STUDENTS') &&
    resD.answer.includes('LAWS') &&
    resD.answer.includes('BLOCKED BY PREREQUISITE') &&
    resD.sources.some(s => s.documentTitle.includes('118225_Semester_Spread_Structures_Sept_2026.xlsx')),
    'Test D: Law student receives approved Law courses from School of Law curriculum with Section 6 format'
  );

  // ──────────────────────────────────────────────────────
  // TEST E: Unknown course code
  // ──────────────────────────────────────────────────────
  console.log('\n--- TEST E: Unknown course code ---');
  const resE = await processAdvisorQuery('Is COMP999 a 4-credit course?');
  console.log('Answer snippet:', resE.answer.slice(0, 150) + '...');
  assert(
    resE.answer.includes("couldn't verify course code **COMP999**") &&
    resE.answer.includes('Did you mean one of these courses?') &&
    !resE.answer.includes('trouble accessing') &&
    resE.state === 'INSUFFICIENT_INFORMATION',
    'Test E: COMP999 is reported as unverified course code with suggestions and NO technical error'
  );

  // ──────────────────────────────────────────────────────
  // TEST F: Unknown course name (with and without "called")
  // ──────────────────────────────────────────────────────
  console.log('\n--- TEST F1: Unknown course name with "course called" ---');
  const resF1 = await processAdvisorQuery('Can I take a course called Advanced Quantum Computing?');
  console.log('Answer snippet:\n', resF1.answer);
  assert(
    resF1.answer.includes('COURSE NOT FOUND / UNVERIFIED') &&
    resF1.answer.includes("I couldn't find a course named ‘Advanced Quantum Computing’") &&
    resF1.answer.includes("I won't assume that this course is offered by the university") &&
    !resF1.answer.includes('trouble accessing') &&
    resF1.state === 'INSUFFICIENT_INFORMATION',
    'Test F1: "Can I take a course called Advanced Quantum Computing?" returns exact COURSE NOT FOUND / UNVERIFIED'
  );

  console.log('\n--- TEST F2: Unknown course name direct ---');
  const resF2 = await processAdvisorQuery('Can I take Advanced Quantum Computing?');
  assert(
    resF2.answer.includes('COURSE NOT FOUND / UNVERIFIED') &&
    resF2.answer.includes("I couldn't find a course named ‘Advanced Quantum Computing’") &&
    !resF2.answer.includes('trouble accessing') &&
    resF2.state === 'INSUFFICIENT_INFORMATION',
    'Test F2: "Can I take Advanced Quantum Computing?" returns exact COURSE NOT FOUND / UNVERIFIED'
  );

  console.log('\n--- TEST F3: Unknown course credit query ---');
  const resF3 = await processAdvisorQuery('Is Advanced Quantum Computing a 4-credit course?');
  assert(
    resF3.answer.includes('COURSE NOT FOUND / UNVERIFIED') &&
    resF3.answer.includes("I couldn't find a course named ‘Advanced Quantum Computing’"),
    'Test F3: "Is Advanced Quantum Computing a 4-credit course?" returns COURSE NOT FOUND / UNVERIFIED'
  );

  // ──────────────────────────────────────────────────────
  // TEST G: Course discovery
  // ──────────────────────────────────────────────────────
  console.log('\n--- TEST G: Course discovery ---');
  const resG = await processAdvisorQuery('What courses can I take?', econProfile.id);
  console.log('Answer snippet:', resG.answer.slice(0, 150) + '...');
  assert(
    resG.answer.includes('ELIGIBLE COURSES') &&
    resG.answer.includes('BLOCKED BY PREREQUISITE') &&
    resG.answer.includes('ELIGIBILITY NOT VERIFIED'),
    'Test G: Course discovery returns Section 6 uppercase blocks for active student profile'
  );

  // ──────────────────────────────────────────────────────
  // TEST H: Credits
  // ──────────────────────────────────────────────────────
  console.log('\n--- TEST H: Credits for DATA302 ---');
  const resH = await processAdvisorQuery('How many credits is DATA302?');
  console.log('Answer snippet:', resH.answer.slice(0, 150) + '...');
  assert(
    resH.answer.includes('DATA302') &&
    resH.answer.includes('4 credits') &&
    resH.answer.includes('Deep Learning'),
    'Test H: "How many credits is DATA302?" accurately returns 4 credits from official catalog'
  );

  // ──────────────────────────────────────────────────────
  // TEST I: Academic year
  // ──────────────────────────────────────────────────────
  console.log('\n--- TEST I: Academic year mapping ---');
  const resI = await processAdvisorQuery('I am in Semester 5. Which year am I in?');
  console.log('Answer snippet:', resI.answer.slice(0, 150) + '...');
  assert(
    resI.answer.includes('Year 3 (3rd Year)') &&
    resI.answer.includes('Semester 5') &&
    resI.sources.some(s => s.documentTitle.includes('Student Handbook')),
    'Test I: Semester 5 accurately maps to Year 3 (3rd Year) with official Student Handbook citation'
  );

  // ──────────────────────────────────────────────────────
  // TEST J: Summer course
  // ──────────────────────────────────────────────────────
  console.log('\n--- TEST J: Summer courses June 2026 ---');
  const resJ = await processAdvisorQuery('Which courses are available in Summer Term June 2026?');
  console.log('Answer snippet:', resJ.answer.slice(0, 150) + '...');
  assert(
    resJ.answer.includes('42 approved courses') &&
    resJ.answer.includes('Summer Term June 2026') &&
    resJ.sources.some(s => s.documentTitle.includes('Courses Offered.pdf')),
    'Test J: Returns 42 approved Summer Term June 2026 courses with official PDF citation'
  );

  console.log('\n======================================================');
  console.log(`AUDIT RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
