/**
 * Comprehensive Automated Tests for Semester_Spread_Structures_Sept_2026.xlsx
 * Grounded in Vidyashilp University Academic Advisor
 */

const { processAdvisorQuery } = require('../src/lib/advisory-engine');
const {
  loadCurriculumData,
  compareCurriculumVersions,
  getBasketCourses,
  findCourseDetails
} = require('../src/lib/curriculum-data');

async function runTestSuite() {
  console.log('================================================================');
  console.log('SEMESTER SPREAD STRUCTURES (SEPT 2026) - AUTOMATED VERIFICATION');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const failures = [];

  function assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  async function testCase(number, title, runFn) {
    process.stdout.write(`TEST ${number}: ${title} ... `);
    try {
      await runFn();
      console.log('PASSED [✓]');
      passed++;
    } catch (err) {
      console.log('FAILED [✗]');
      console.error(`   Error: ${err.message}`);
      failed++;
      failures.push({ number, title, error: err.message });
    }
  }

  // Load ground truth workbook data
  const { curriculumStructures, curriculumCourses, prerequisites } = loadCurriculumData();

  // -------------------------------------------------------------
  // PART A: Direct Workbook Structure & Data Integrity Unit Tests
  // -------------------------------------------------------------
  await testCase(1, 'All 5 Curriculum Structures Loaded with Exact 180 Credits', () => {
    const batches = ['2022', '2023', '2024', '2025', '2026'];
    for (const b of batches) {
      assert(curriculumStructures[b], `Missing structure for batch ${b}`);
      assert(curriculumStructures[b].totalCredits === 180, `Batch ${b} total credits != 180 (got ${curriculumStructures[b].totalCredits})`);
    }
  });

  await testCase(2, 'Foundation & University Core Credits Exact Counts Across Batches', () => {
    // 2022-2024: Foundation 34, Uni Core 18
    assert(curriculumStructures['2024'].basketCredits['Foundation'] === 34, '2024 Foundation must be 34 credits');
    assert(curriculumStructures['2024'].basketCredits['University Core'] === 18, '2024 Uni Core must be 18 credits');

    // 2025: Foundation 24, Uni Core 24
    assert(curriculumStructures['2025'].basketCredits['Foundation'] === 24, '2025 Foundation must be 24 credits');
    assert(curriculumStructures['2025'].basketCredits['University Core'] === 24, '2025 Uni Core must be 24 credits');

    // 2026 DS: Foundation 26, Uni Core 18, Program Core 50
    assert(curriculumStructures['2026'].basketCredits['Foundation'] === 26, '2026 DS Foundation must be 26 credits');
    assert(curriculumStructures['2026'].basketCredits['University Core'] === 18, '2026 DS Uni Core must be 18 credits');
    assert(curriculumStructures['2026'].basketCredits['Program Core'] === 50, '2026 DS Program Core must be 50 credits');
  });

  await testCase(3, 'Direct Prerequisite Map Verification from Workbook', () => {
    // MTSC211 Sustainable Smart Materials requires MTSC111
    const mtsc211 = prerequisites.find(p => p.courseCode === 'MTSC211');
    assert(mtsc211, 'MTSC211 missing from prerequisites');
    assert(mtsc211.rawPrerequisiteText === 'MTSC111', 'MTSC211 prerequisite must be MTSC111');

    // COMP132 / COMP133 Design Workshop has NIL / None in workbook
    const dw = curriculumCourses.find(c => c.courseCode === 'COMP132' || c.courseCode === 'COMP133');
    assert(dw, 'Design Workshop missing from curriculumCourses');
    assert(dw.prerequisite === 'NIL' || dw.prerequisite === 'Nil' || dw.prerequisite === 'None', 'Design workshop prerequisite should be NIL');
  });

  await testCase(4, 'Program Honors 20 Credits Consistent Across All Versions', () => {
    for (const b of ['2022', '2023', '2024', '2025', '2026']) {
      assert(curriculumStructures[b].basketCredits['Program Honors'] === 20, `Batch ${b} Program Honors must be 20 credits`);
    }
  });

  // -------------------------------------------------------------
  // PART B: Chatbot Query Engine Integration & End-to-End Tests
  // -------------------------------------------------------------

  await testCase(5, 'Chatbot: Foundation Courses for Batch 2025', async () => {
    const res = await processAdvisorQuery('What are the Foundation courses for 2025 batch?');
    assert(res.answer.includes('24 credits') || res.answer.includes('24 credit'), 'Must mention 24 credits');
    assert(res.answer.includes('Semester_Spread_Structures_Sept_2026.xlsx'), 'Must cite official workbook');
    assert(res.state === 'ANSWERABLE', 'State should be ANSWERABLE');
  });

  await testCase(6, 'Chatbot: Foundation Courses for Batch 2024', async () => {
    const res = await processAdvisorQuery('What are the Foundation courses for 2024 batch?');
    assert(res.answer.includes('34 credits') || res.answer.includes('34 credit'), 'Must mention 34 credits');
    assert(res.answer.includes('Semester_Spread_Structures_Sept_2026.xlsx'), 'Must cite official workbook');
  });

  await testCase(7, 'Chatbot: University Core for Batch 2024', async () => {
    const res = await processAdvisorQuery('What are the University Core courses for 2024?');
    assert(res.answer.includes('18 credits') || res.answer.includes('18 credit'), 'Must mention 18 credits');
    assert(res.answer.includes('Effective Communication') || res.answer.includes('COMM101') || res.answer.includes('Design Thinking'), 'Must list core courses');
  });

  await testCase(8, 'Chatbot: Program Core in 2026 DS (Including Compiler Design)', async () => {
    const res = await processAdvisorQuery('What are the Program Core courses in 2026 DS?');
    assert(res.answer.includes('50 credits') || res.answer.includes('50 credit'), 'Must mention 50 credits');
    assert(res.answer.includes('Compiler Design'), 'Must include Compiler Design');
    assert(res.answer.includes('Operating Systems'), 'Must include Operating Systems');
  });

  await testCase(9, 'Chatbot: Course Credits - Compiler Design (Exact & Batch Scoped)', async () => {
    const res = await processAdvisorQuery('How many credits is Compiler Design?');
    assert(res.answer.includes('3-credit') || res.answer.includes('3 credits') || res.answer.includes('3 Credits'), 'Compiler Design must be 3 credits');
    assert(res.answer.includes('2026') || res.answer.includes('Data Science') || res.answer.includes('Semester_Spread_Structures_Sept_2026.xlsx'), 'Must cite workbook');
  });

  await testCase(10, 'Chatbot: Course Credits - Operating Systems (Version Differences)', async () => {
    const res = await processAdvisorQuery('How many credits is Operating Systems?');
    assert(res.answer.includes('3 credits') || res.answer.includes('3 Credits'), 'Must mention 3 credits for earlier batches');
    assert(res.answer.includes('4 credits') || res.answer.includes('4 Credits'), 'Must mention 4 credits for 2026 DS');
  });

  await testCase(11, 'Chatbot: Semester Placement - Operating Systems Across Versions', async () => {
    const res = await processAdvisorQuery('Which semester is Operating Systems taught in?');
    assert(res.answer.includes('Semester 5') && res.answer.includes('Semester 4'), 'Must explain Semester 5 in 2022-2024 and Semester 4 in 2025/2026');
  });

  await testCase(12, 'Chatbot: Semester Placement - Semester 3 Courses for 2025 Batch', async () => {
    const res = await processAdvisorQuery('What courses are in semester 3 for 2025 batch?');
    assert(res.answer.includes('Semester 3') || res.answer.includes('Sem 3'), 'Must identify Semester 3');
    assert(res.answer.includes('Data Structures') || res.answer.includes('COMP202'), 'Must list DSA');
  });

  await testCase(13, 'Chatbot: Prerequisite - Sustainable Smart Materials (Grounded in Workbook)', async () => {
    const res = await processAdvisorQuery('What are the prerequisites for Sustainable Smart Materials?');
    assert(res.answer.includes('MTSC111'), 'Must state MTSC111');
    assert(res.answer.includes('Materials for Smart Devices'), 'Must state Materials for Smart Devices');
    assert(res.answer.includes('Semester_Spread_Structures_Sept_2026.xlsx'), 'Must cite workbook');
  });

  await testCase(14, 'Chatbot: Prerequisite - Design Workshop (NIL / None Handling)', async () => {
    const res = await processAdvisorQuery('What are the prerequisites for Design Workshop?');
    assert(res.answer.includes('No prerequisites') || res.answer.includes('None') || res.answer.includes('NIL'), 'Must state None or No prerequisites');
  });

  await testCase(15, 'Chatbot: Prerequisite - Unknown Course Fallback (No Hallucination)', async () => {
    const res = await processAdvisorQuery('What are the prerequisites for Quantum Computing 999?');
    assert(
      res.state === 'INSUFFICIENT_INFORMATION' ||
      res.answer.includes('not listed') ||
      res.answer.includes('cannot be confirmed') ||
      res.answer.includes('INSUFFICIENT INFORMATION') ||
      res.answer.includes("couldn't verify"),
      'Must not invent prerequisites for unknown courses'
    );
  });

  await testCase(16, 'Chatbot: Curriculum Version Comparison - Foundation 2024 vs 2025', async () => {
    const res = await processAdvisorQuery('Compare the Foundation courses between 2024 and 2025 batches');
    assert(res.answer.includes('34 credits') && res.answer.includes('24 credits'), 'Must compare 34 credits vs 24 credits');
    assert(res.answer.includes('-10 credits') || res.answer.includes('Change: -10'), 'Must mention -10 credit difference');
  });

  await testCase(17, 'Chatbot: Curriculum Version Comparison - University Core Expansion in 2025', async () => {
    const res = await processAdvisorQuery('How did University Core change in 2025?');
    assert(res.answer.includes('18') && res.answer.includes('24'), 'Must mention increase from 18 to 24 credits');
    assert(res.answer.includes('Environmental Studies') || res.answer.includes('Humanistic Leadership') || res.answer.includes('Analytical Academic Writing'), 'Must mention new courses');
  });

  await testCase(18, 'Chatbot: Version Ambiguity Prompting - Foundation Courses Without Version', async () => {
    const res = await processAdvisorQuery('What are the Foundation courses?');
    assert(res.answer.includes('Batches 2022, 2023 & 2024') || res.answer.includes('2024'), 'Must label 2022-2024 version');
    assert(res.answer.includes('Batch 2025') || res.answer.includes('2025'), 'Must label 2025 version');
    assert(res.answer.includes('2026') || res.answer.includes('Data Science'), 'Must label 2026 DS version');
    assert(res.answer.toLowerCase().includes('specify') && res.answer.toLowerCase().includes('batch'), 'Must prompt user for their batch');
  });

  await testCase(19, 'Chatbot: Degree Total Credit Requirement Across Curriculum', async () => {
    const res = await processAdvisorQuery('What is the total credit requirement for B.Tech?');
    assert(res.answer.includes('180 credits') || res.answer.includes('180 Credits'), 'Must state 180 credits');
    assert(res.answer.includes('Semester_Spread_Structures_Sept_2026.xlsx'), 'Must cite workbook');
  });

  await testCase(20, 'Chatbot: Curriculum Comparison Phrasing - Foundation basket differ between 2024 and 2025', async () => {
    const res = await processAdvisorQuery('How does the Foundation basket differ between the 2024 and 2025 structures?');
    assert(res.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(res.answer.includes('34 credits') && res.answer.includes('24 credits'), 'Must compare 34 and 24 credits');
    assert(res.answer.includes('Reallocated'), 'Must detail reallocated courses');
    assert(res.answer.includes('Semester_Spread_Structures_Sept_2026.xlsx'), 'Must cite workbook');
  });

  await testCase(21, 'Chatbot: Course Transition - Sustainable Cities and Communities in updated curriculum', async () => {
    const res = await processAdvisorQuery('Where does Sustainable Cities and Communities appear in the updated curriculum?');
    assert(res.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(res.answer.includes('Foundation Courses') && res.answer.includes('2022–2024'), 'Must mention original Foundation basket');
    assert(res.answer.includes('Environmental Studies and Sustainability'), 'Must identify successor course');
    assert(res.answer.includes('University Core') && res.answer.includes('2025'), 'Must identify updated University Core basket');
    assert(res.answer.includes('Semester_Spread_Structures_Sept_2026.xlsx'), 'Must cite workbook');
  });

  await testCase(22, 'Chatbot: Direct Transition Relevance - Academic Writing in updated curriculum', async () => {
    const res = await processAdvisorQuery('Where does Academic Writing appear in the updated curriculum?');
    assert(res.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(res.answer.includes('Foundation Courses') && res.answer.includes('2022–2024'), 'Must mention original 2022-2024 Foundation basket');
    assert(res.answer.includes('Analytical Academic Writing'), 'Must identify Analytical Academic Writing');
    assert(res.answer.includes('University Core') && res.answer.includes('2025'), 'Must identify 2025 University Core basket');
    assert(res.answer.includes('3 credits') || res.answer.includes('3 cr'), 'Must state 3 credits for Analytical Academic Writing');
    assert(res.answer.includes('Semester_Spread_Structures_Sept_2026.xlsx'), 'Must cite workbook');
  });

  await testCase(23, 'Chatbot: Cloud Computing 2024 Foundation Basket & Semester Placement', async () => {
    const res = await processAdvisorQuery('Is Cloud Computing included in the 2024 Foundation basket? Which semester is it in?');
    assert(res.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(res.answer.includes('Semester 4'), 'Must identify Semester 4');
    assert(res.answer.includes('Foundation') && res.answer.includes('2024'), 'Must confirm Foundation basket inclusion for Batch 2024');
    assert(res.answer.includes('COMP403'), 'Must mention course code COMP403');
  });

  // Summary
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
  console.log('================================================================');

  if (failed > 0) {
    console.error('\nFailures summary:');
    failures.forEach(f => console.error(` - Test ${f.number} (${f.title}): ${f.error}`));
    process.exit(1);
  } else {
    console.log(`\nAll ${passed} automated tests passed successfully against Semester_Spread_Structures_Sept_2026.xlsx!`);
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
