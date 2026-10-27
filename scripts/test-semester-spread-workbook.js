/**
 * Comprehensive Automated Tests for Semester_Spread_Structures_Sept_2026.xlsx
 * Grounded in Vidyashilp University Academic Advisor
 */

const { processAdvisorQuery } = require('../src/lib/advisory-engine');
const {
  loadCurriculumData,
  compareCurriculumVersions,
  getBasketCourses,
  findCourseDetails,
  validateBasketRecords,
  validateSemesterRecords,
  detectCurriculumConflicts
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

  await testCase(24, 'Semester Filter: Batch 2023 Foundation courses, Semester 1 only', async () => {
    const structRes = getBasketCourses('Tell me foundation courses for batch 2023 first semester only');
    assert(structRes && structRes.hasSemesterFilter === true, 'Must activate semester filter');
    assert(structRes.semesterNum === 1, 'Must extract semester 1');
    assert(structRes.version === '2023', 'Must extract batch 2023');
    assert(structRes.courses.length === 5, `Expected 5 courses, got ${structRes.courses.length}`);
    assert(structRes.totalCredits === 13, `Expected 13 credits, got ${structRes.totalCredits}`);

    const expectedCodes = ['MATH202', 'COMP132', 'MTSC111', 'PSYC101/ECON101', 'DATA131'];
    const actualCodes = structRes.courses.map(c => c.courseCode);
    assert(expectedCodes.every(code => actualCodes.includes(code)), `Missing codes: expected ${expectedCodes}, got ${actualCodes}`);

    const res = await processAdvisorQuery('Tell me foundation courses for batch 2023 first semester only');
    assert(res.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(res.ruleResults.semester === 1, 'RuleResults must report semester 1');
    assert(res.ruleResults.count === 5, 'RuleResults must report 5 courses');
    assert(res.ruleResults.credits === 13, 'RuleResults must report 13 credits');
    assert(res.answer.includes('MATH202') && res.answer.includes('Probability Theory'), 'Must include MATH202');
    assert(res.answer.includes('COMP132') && res.answer.includes('Design Workshop'), 'Must include COMP132');
    assert(res.answer.includes('MTSC111') && res.answer.includes('Materials for Smart Devices'), 'Must include MTSC111');
    assert(res.answer.includes('DATA131') && res.answer.includes('Visualizing Data for Story Telling'), 'Must include DATA131');
    assert(!res.answer.includes('Calculus') && !res.answer.includes('Sustainable Cities and Communities'), 'Must NOT include courses from other semesters');
  });

  await testCase(25, 'Semester Filter: Batch 2023 Foundation courses, Whole Basket (No Semester Constraint)', async () => {
    const structRes = getBasketCourses('foundation', '2023');
    assert(structRes && structRes.hasSemesterFilter === false, 'Must not activate semester filter');
    assert(structRes.allocatedCredits === 34, 'Expected 34 allocated credits');
    assert(structRes.courses.length === 13, `Expected 13 courses, got ${structRes.courses.length}`);

    const res = await processAdvisorQuery('What are the Foundation courses for 2023 batch?');
    assert(res.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(res.ruleResults.count === 13, 'RuleResults must report 13 courses');
    assert(res.ruleResults.credits === 34, 'RuleResults must report 34 credits');
    assert(res.answer.includes('Probability Theory') && res.answer.includes('Calculus'), 'Must include all approved Foundation courses');
    assert(res.answer.includes('34 credits'), 'Must state 34-credit basket allocation');
  });

  await testCase(26, 'Semester Filter: Batch 2022 Foundation courses, Semester 1 only', async () => {
    const structRes = getBasketCourses('foundation', '2022', 1);
    assert(structRes && structRes.hasSemesterFilter === true, 'Must activate semester filter');
    assert(structRes.semesterNum === 1, 'Must extract semester 1');
    assert(structRes.courses.length === 5, `Expected 5 courses, got ${structRes.courses.length}`);
    assert(structRes.totalCredits === 13, `Expected 13 credits, got ${structRes.totalCredits}`);

    const actualCodes = structRes.courses.map(c => c.courseCode);
    assert(actualCodes.includes('MATH201'), 'Batch 2022 S1 must include MATH201 (Calculus)');
    assert(!actualCodes.includes('MATH202'), 'Batch 2022 S1 must NOT include MATH202 (Probability Theory is S2 for 2022)');

    const res = await processAdvisorQuery('Tell me foundation courses for batch 2022 semester 1 only');
    assert(res.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(res.ruleResults.semester === 1, 'RuleResults must report semester 1');
    assert(res.ruleResults.count === 5, 'RuleResults must report 5 courses');
    assert(res.answer.includes('MATH201') && res.answer.includes('Calculus'), 'Must include MATH201 Calculus');
    assert(!res.answer.includes('Probability Theory'), 'Must NOT include Probability Theory (S2 in 2022)');
  });

  await testCase(27, 'Semester Filter: Batch 2025 University Core courses, Semester 2 only', async () => {
    const structRes = getBasketCourses('University Core', '2025', 2);
    assert(structRes && structRes.hasSemesterFilter === true, 'Must activate semester filter');
    assert(structRes.semesterNum === 2, 'Must extract semester 2');
    assert(structRes.courses.length === 3, `Expected 3 courses, got ${structRes.courses.length}`);
    assert(structRes.totalCredits === 5, `Expected 5 credits, got ${structRes.totalCredits}`);

    const res = await processAdvisorQuery('Show University Core courses for batch 2025 semester 2 only');
    assert(res.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(res.ruleResults.semester === 2, 'RuleResults must report semester 2');
    assert(res.ruleResults.count === 3, 'RuleResults must report 3 courses');
    assert(res.ruleResults.credits === 5, 'RuleResults must report 5 credits');
    assert(res.answer.includes('UCOR111') && res.answer.includes('Environmental Studies and Sustainability'), 'Must include UCOR111');
    assert(res.answer.includes('LAWS101') && res.answer.includes('Fundamentals of Indian Constitution'), 'Must include LAWS101');
    assert(res.answer.includes('UCOR701') && res.answer.includes('Community Engagement'), 'Must include UCOR701');
  });

  await testCase(28, 'Semester Filter: Batch 2026 DS Program Core courses, Semester 3 only', async () => {
    const structRes = getBasketCourses('Program Core', '2026', 3);
    assert(structRes && structRes.hasSemesterFilter === true, 'Must activate semester filter');
    assert(structRes.semesterNum === 3, 'Must extract semester 3');
    assert(structRes.courses.length === 2, `Expected 2 courses, got ${structRes.courses.length}`);
    assert(structRes.totalCredits === 8, `Expected 8 credits, got ${structRes.totalCredits}`);

    const res = await processAdvisorQuery('What Program Core courses does batch 2026 DS take in Semester 3?');
    assert(res.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(res.ruleResults.semester === 3, 'RuleResults must report semester 3');
    assert(res.ruleResults.count === 2, 'RuleResults must report 2 courses');
    assert(res.ruleResults.credits === 8, 'RuleResults must report 8 credits');
    assert(res.answer.includes('COMP202') && res.answer.includes('Theoretical Computer Science'), 'Must include COMP202');
    assert(res.answer.includes('COMP203') && res.answer.includes('Analysis of Algorithms'), 'Must include COMP203');
  });

  await testCase(29, 'Semester Filter: Unavailable Semester Handling (No Courses & Out of Range)', async () => {
    // 1. Semester with no placement data (Semester 8 has no Foundation courses in 2023)
    const emptyRes = getBasketCourses('foundation', '2023', 8);
    assert(emptyRes && emptyRes.noCoursesInSemester === true, 'Must mark noCoursesInSemester');
    assert(emptyRes.courses.length === 0, 'Courses must be empty array');

    const resEmpty = await processAdvisorQuery('Foundation courses for batch 2023 semester 8 only');
    assert(resEmpty.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(resEmpty.ruleResults.count === 0, 'Count must be 0');
    assert(resEmpty.answer.includes('no **Foundation Courses** scheduled in **Semester 8**'), 'Must explain no courses scheduled');
    assert(!resEmpty.answer.includes('34 credits'), 'Must NOT return full basket credits');

    // 2. Out-of-range semester (Semester 9 does not exist in 8-semester B.Tech)
    const outRangeRes = getBasketCourses('foundation', '2023', 9);
    assert(outRangeRes && outRangeRes.semesterValid === false, 'Must flag invalid semester');

    const resOutRange = await processAdvisorQuery('Foundation courses for batch 2023 semester 9 only');
    assert(resOutRange.state === 'INSUFFICIENT_INFORMATION', 'State must be INSUFFICIENT_INFORMATION');
    assert(resOutRange.ruleResults.invalidSemester === 9, 'Must report invalid semester 9');
    assert(resOutRange.answer.includes('8 semesters'), 'Must explain B.Tech consists of 8 semesters');
  });

  await testCase(30, 'Unknown Batch Fallback: Batch 2035 Fails Safely with Insufficient Information', async () => {
    const res = await processAdvisorQuery('What are the Foundation courses for Batch 2035?');
    assert(res.state === 'INSUFFICIENT_INFORMATION', `State must be INSUFFICIENT_INFORMATION (got ${res.state})`);
    assert(res.answer.includes('Batch 2035') || res.answer.includes('2035'), 'Answer must reference requested batch 2035');
    assert(res.answer.includes('2022') && res.answer.includes('2026'), 'Answer must list supported batches 2022-2026');
    assert(res.ruleResults && res.ruleResults.unsupportedBatch === '2035', 'ruleResults must record unsupportedBatch');
  });

  await testCase(31, 'Out-of-Scope Guardrail: Non-Academic Programming Request Blocked', async () => {
    const res = await processAdvisorQuery('Write a python script to sort a list using quicksort');
    assert(res.state === 'OUT_OF_SCOPE' || res.state === 'INSUFFICIENT_INFORMATION' || res.answer.toLowerCase().includes('academic advisor') || res.answer.toLowerCase().includes('university'), 'Must block out of scope request');
  });

  await testCase(32, 'Ambiguous Course Disambiguation: Underspecified "AI" Query Prompts for Clarification', async () => {
    const res = await processAdvisorQuery('Can I take AI?');
    assert(res.state === 'NEEDS_CLARIFICATION', `State must be NEEDS_CLARIFICATION (got ${res.state})`);
    assert(res.answer.includes('COMP301') && res.answer.includes('DATA206'), 'Must list ambiguous course options for disambiguation');
  });

  await testCase(33, 'Mutation Test 1: Corrupted Course Credit Value Caught by Validation', () => {
    const validCourses = [
      { name: 'Multivariate Calculus', credits: 4 },
      { name: 'Linear Algebra', credits: 4 },
      { name: 'Probability and Statistics', credits: 4 }
    ];
    // Baseline valid check
    const baseAudit = validateBasketRecords('Math Basket', '2025', validCourses, 12);
    assert(baseAudit.isValid === true, 'Baseline audit must be valid');

    // Mutate credit: 4 -> 99
    const corruptedCourses = [
      { name: 'Multivariate Calculus', credits: 4 },
      { name: 'Linear Algebra', credits: 99 },
      { name: 'Probability and Statistics', credits: 4 }
    ];
    const corruptedAudit = validateBasketRecords('Math Basket', '2025', corruptedCourses, 12);
    assert(corruptedAudit.isValid === false, 'Corrupted audit must NOT be valid');
    assert(corruptedAudit.hasDiscrepancy === true, 'Must flag discrepancy');
    assert(corruptedAudit.calculatedSum === 107, 'Must report exact corrupted sum (107)');
    assert(corruptedAudit.difference === 95, 'Must report exact discrepancy delta (+95)');
  });

  await testCase(34, 'Mutation Test 2: Mismatched / Corrupted Semester Record Caught by Validation', () => {
    const corruptedSemesterCourses = [
      { courseCode: 'MATH201', courseName: 'Calculus', semesterNum: 1, credits: 3 },
      { courseCode: 'COMP201', courseName: 'Data Structures', semesterNum: 2, credits: 4 } // Corrupted semester placement!
    ];
    const semAudit = validateSemesterRecords('2022', 1, corruptedSemesterCourses);
    assert(semAudit.isValid === false, 'Mismatched semester must fail validation');
    assert(semAudit.errors.some(e => e.includes('mismatched semester')), 'Must explicitly flag mismatched semester error');
  });

  await testCase(35, 'Mutation Test 3: Conflicting Course Definitions Across Records Caught by Conflict Detector', () => {
    const recordsWithConflict = [
      { batch: '2024', program: 'BTECH_CSE', courseCode: 'COMP202', name: 'Theoretical Computer Science', credits: 4 },
      { batch: '2024', program: 'BTECH_CSE', courseCode: 'COMP202', name: 'Theoretical Computer Science', credits: 2 } // Conflicting 2 cr!
    ];
    const conflictResult = detectCurriculumConflicts(recordsWithConflict);
    assert(conflictResult.hasConflict === true, 'Must detect conflict');
    assert(conflictResult.conflicts.length === 1, 'Must detect exactly 1 conflict');
    assert(conflictResult.conflicts[0].reason.includes('4 cr vs 2 cr'), 'Must report conflicting credit values');
  });

  await testCase(36, 'API Handler End-to-End Execution & Output Verification', async () => {
    const query = 'What are the Foundation courses for 2024 batch?';
    const startTime = Date.now();
    const res = await processAdvisorQuery(query);
    const latencyMs = Date.now() - startTime;

    assert(res.state === 'ANSWERABLE', 'State must be ANSWERABLE');
    assert(Array.isArray(res.sources) && res.sources.length > 0, 'Must attach source documents');
    assert(res.sources[0].documentTitle === 'Semester_Spread_Structures_Sept_2026.xlsx', 'Must cite workbook');
    assert(res.sources[0].pageOrSheet.includes('Struct_2024'), 'Must cite Struct_2024 worksheet');
    assert(res.ruleResults && res.ruleResults.credits === 34, 'Must return ruleResults with 34 credits');
    assert(latencyMs < 500, `E2E Latency must be fast (got ${latencyMs}ms)`);
  });

  await testCase(37, 'Regression: Exact Batch Isolation for MATH201 (Calculus) vs MATH202 (Probability Theory)', () => {
    // 2022 S1 vs S2 Foundation
    const s1_2022 = getBasketCourses('foundation', '2022', 1);
    const s2_2022 = getBasketCourses('foundation', '2022', 2);
    const s1_2022_codes = s1_2022.courses.map(c => c.courseCode);
    const s2_2022_codes = s2_2022.courses.map(c => c.courseCode);

    assert(s1_2022_codes.includes('MATH201'), '2022 S1 must contain MATH201 (Calculus)');
    assert(!s1_2022_codes.includes('MATH202'), '2022 S1 must NOT contain MATH202');
    assert(s2_2022_codes.includes('MATH202'), '2022 S2 must contain MATH202 (Probability Theory)');
    assert(!s2_2022_codes.includes('MATH201'), '2022 S2 must NOT contain MATH201');

    // 2023 S1 vs S2 Foundation
    const s1_2023 = getBasketCourses('foundation', '2023', 1);
    const s2_2023 = getBasketCourses('foundation', '2023', 2);
    const s1_2023_codes = s1_2023.courses.map(c => c.courseCode);
    const s2_2023_codes = s2_2023.courses.map(c => c.courseCode);

    assert(s1_2023_codes.includes('MATH202'), '2023 S1 must contain MATH202 (Probability Theory)');
    assert(!s1_2023_codes.includes('MATH201'), '2023 S1 must NOT contain MATH201');
    assert(s2_2023_codes.includes('MATH201'), '2023 S2 must contain MATH201 (Calculus)');
    assert(!s2_2023_codes.includes('MATH202'), '2023 S2 must NOT contain MATH202');

    // Verify exact credits (3 cr each)
    const math201_2022 = s1_2022.courses.find(c => c.courseCode === 'MATH201');
    const math202_2023 = s1_2023.courses.find(c => c.courseCode === 'MATH202');
    assert(math201_2022.credits === 3, 'MATH201 in 2022 S1 must be 3 credits');
    assert(math202_2023.credits === 3, 'MATH202 in 2023 S1 must be 3 credits');
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
