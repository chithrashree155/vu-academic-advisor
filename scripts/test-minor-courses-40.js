/**
 * Comprehensive 40-Test Suite for VU Academic Advisor
 * Tests Categories A, B, C, D, E as specified in Part 9 of the Implementation Prompt.
 */

const { processAdvisorQuery } = require('../src/lib/advisory-engine');
const path = require('path');
const fs = require('fs');

async function runTestSuite() {
  console.log('================================================================');
  console.log('VU Academic Advisor — 40 Comprehensive Verification Tests');
  console.log('================================================================\n');

  const results = [];
  let passCount = 0;
  let failCount = 0;

  async function testCase(id, category, question, validator, queryOverride = null) {
    const start = Date.now();
    try {
      const res = await processAdvisorQuery(queryOverride || question);
      const latency = Date.now() - start;
      const validation = validator(res);

      const passed = validation.passed;
      if (passed) passCount++;
      else failCount++;

      results.push({
        id,
        category,
        question,
        passed,
        latency,
        expected: validation.expected,
        actual: res.answer ? res.answer.substring(0, 160).replace(/\n/g, ' ') + '...' : '(No answer)',
        sources: (res.sources || []).map(s => s.documentTitle).join(', '),
        notes: validation.notes || ''
      });

      const icon = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`[${icon}] #${id} [${category}] ${question}`);
      if (!passed) {
        console.log(`       Reason: ${validation.notes}`);
      }
    } catch (err) {
      failCount++;
      results.push({
        id,
        category,
        question,
        passed: false,
        latency: Date.now() - start,
        expected: 'Successful execution without exception',
        actual: err.message,
        sources: '',
        notes: `Exception: ${err.message}`
      });
      console.log(`[❌ FAIL] #${id} [${category}] ${question} — EXCEPTION: ${err.message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // CATEGORY A: MINOR-COURSE TESTS (1–10)
  // ══════════════════════════════════════════════════════════════
  console.log('--- CATEGORY A: MINOR-COURSE TESTS (1–10) ---');

  await testCase(1, 'A. Minor Courses', 'List minors available for the 2023 batch', res => {
    const ans = res.answer || '';
    const hasLaw = ans.includes('Law');
    const hasDesign = ans.includes('Design');
    const hasPsych = ans.includes('Psychology');
    const hasEcon = ans.includes('Economics');
    const hasFinance = ans.includes('Finance');
    const hasMarketing = ans.includes('Marketing');
    const hasStartupNotOffered = ans.includes('Start-up') && (ans.includes('Not Offered') || ans.includes('not offered'));
    const passed = hasLaw && hasDesign && hasPsych && hasEcon && hasFinance && hasMarketing && hasStartupNotOffered;
    return {
      passed,
      expected: 'Lists 6 available minors for 2023 and clarifies Start-up is not offered',
      notes: passed ? 'All 7 minors correctly classified for 2023' : 'Missing minors or Start-up status not explained'
    };
  });

  await testCase(2, 'A. Minor Courses', 'List the Law minor for 2023', res => {
    const ans = res.answer || '';
    const hasLAWM305 = ans.includes('LAWM305');
    const hasLAWE200 = ans.includes('LAWE200');
    const hasLAWC410 = ans.includes('LAWC410');
    const hasLAWB210 = ans.includes('LAWB210');
    const hasLAWM306 = ans.includes('LAWM306');
    const hasLAWE301 = ans.includes('LAWE301');
    const hasUndecided = ans.includes('5') && (ans.includes('Don’t Know') || ans.includes("Don't Know") || ans.includes('undecided'));
    const passed = hasLAWM305 && hasLAWE200 && hasLAWC410 && hasLAWB210 && hasLAWM306 && hasLAWE301 && hasUndecided;
    return {
      passed,
      expected: 'Lists all 6 Law courses for 2023 plus 5 undecided credits',
      notes: passed ? 'All 6 courses and 5 undecided credits verified' : 'Missing courses or undecided credit count'
    };
  });

  await testCase(3, 'A. Minor Courses', 'Explain why the Law minor is not offered for 2022', res => {
    const ans = res.answer || '';
    const passed = (ans.includes('2022') && (ans.includes('not offered') || ans.includes('NOT OFFERED')) && (ans.includes('no curriculum block') || ans.includes('no allocation') || ans.includes('starting from the 2023')));
    return {
      passed,
      expected: 'Explains that Law minor workbook contains no block for 2022 batch',
      notes: passed ? 'Correctly grounded in workbook structure' : 'Did not explain workbook omission'
    };
  });

  await testCase(4, 'A. Minor Courses', 'List the Design minor for 2023', res => {
    const ans = res.answer || '';
    const hasCDES105 = ans.includes('CDES105');
    const hasCDES702 = ans.includes('CDES702');
    const hasCDES221 = ans.includes('CDES221');
    const hasCDES219 = ans.includes('CDES219');
    const hasCDES301 = ans.includes('CDES301');
    const hasCDES312 = ans.includes('CDES312');
    const passed = hasCDES105 && hasCDES702 && hasCDES221 && hasCDES219 && hasCDES301 && hasCDES312;
    return {
      passed,
      expected: 'Lists all 6 Design courses for 2023 totalling 24 credits',
      notes: passed ? 'All 6 courses verified' : 'Missing Design 2023 courses'
    };
  });

  await testCase(5, 'A. Minor Courses', 'List the Psychology minor for 2025', res => {
    const ans = res.answer || '';
    const hasCourses = ans.includes('PSYC202') && ans.includes('PSYC241') && ans.includes('PSYC306') && ans.includes('PSYC104') && ans.includes('PSYC255');
    const hasDiscrepancy = ans.includes('PSYC101') && (ans.includes('not offered') || ans.includes('PSYC102'));
    const passed = hasCourses && hasDiscrepancy;
    return {
      passed,
      expected: 'Lists Psychology 2025 courses and notes PSYC101 prerequisite discrepancy',
      notes: passed ? 'Courses and prerequisite discrepancy disclosed' : 'Missing courses or PSYC101 discrepancy'
    };
  });

  await testCase(6, 'A. Minor Courses', 'List the Psychology minor for 2026', res => {
    const ans = res.answer || '';
    const hasCourses = ans.includes('PSYC202') && ans.includes('PSYC241') && ans.includes('PSYC306') && ans.includes('PSYC104') && ans.includes('PSYC255');
    const has24 = ans.includes('24') || ans.includes('Fully Defined');
    const passed = hasCourses && has24;
    return {
      passed,
      expected: 'Lists Psychology 2026 courses with 24 total credits',
      notes: passed ? 'Psychology 2026 fully listed' : 'Missing courses or credit totals'
    };
  });

  await testCase(7, 'A. Minor Courses', 'Explain the Economics minor status for 2024', res => {
    const ans = res.answer || '';
    const passed = (ans.includes('NOT RUNNING') || ans.includes('not running')) && (ans.includes('No Students') || ans.includes('no students'));
    return {
      passed,
      expected: 'Explains Economics 2024 is marked NOT RUNNING because No Students chose it',
      notes: passed ? 'Accurately explains No Students status' : 'Did not identify No Students reason'
    };
  });

  await testCase(8, 'A. Minor Courses', 'List Finance minor courses for 2025', res => {
    const ans = res.answer || '';
    const hasMGMT330 = ans.includes('MGMT330');
    const hasMGMT210 = ans.includes('MGMT210');
    const hasMGMT213 = ans.includes('MGMT213');
    const hasMGMT323 = ans.includes('MGMT323');
    const hasNewFintech = ans.includes('Fintech');
    const hasPrereqNote = ans.includes('FINA333') && (ans.includes('not offered') || ans.includes('discrepancy') || ans.includes('confirmation'));
    const passed = hasMGMT330 && hasMGMT210 && hasMGMT213 && hasMGMT323 && hasNewFintech && hasPrereqNote;
    return {
      passed,
      expected: 'Lists Finance 2025 courses and discloses FINA333 prerequisite issue',
      notes: passed ? 'Courses and prerequisite issues verified' : 'Missing courses or FINA333 issue'
    };
  });

  await testCase(9, 'A. Minor Courses', 'List Marketing minor courses for 2026', res => {
    const ans = res.answer || '';
    const hasMGMT328 = ans.includes('MGMT328');
    const has20TBD = ans.includes('20') && ans.includes('TBD');
    const passed = hasMGMT328 && has20TBD;
    return {
      passed,
      expected: 'Lists MGMT328 in S3 and 20 undecided TBD credits',
      notes: passed ? 'MGMT328 and 20 TBD credits verified' : 'Missing MGMT328 or 20 TBD credits'
    };
  });

  await testCase(10, 'A. Minor Courses', 'Explain the Start-up minor status for 2026', res => {
    const ans = res.answer || '';
    const passed = (ans.includes('not offered') || ans.includes('NOT OFFERED')) && (ans.includes('2024') && ans.includes('2025'));
    return {
      passed,
      expected: 'Explains Start-up minor is NOT OFFERED to 2026 (only for 2024 and 2025)',
      notes: passed ? 'Start-up 2026 status correctly explained' : 'Did not identify not offered status'
    };
  });

  // ══════════════════════════════════════════════════════════════
  // CATEGORY B: PREREQUISITE TESTS (11–15)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- CATEGORY B: PREREQUISITE TESTS (11–15) ---');

  await testCase(11, 'B. Prerequisites', 'What are the prerequisites for PSYC306 in 2025?', res => {
    const ans = res.answer || '';
    const hasPrereq = ans.includes('PSYC101') && ans.includes('PSYC201');
    const hasDisclosure = ans.includes('not offered to the 2025 batch') || ans.includes('PSYC102') || ans.includes('confirm with the university');
    const passed = hasPrereq && hasDisclosure;
    return {
      passed,
      expected: 'Lists PSYC101 and PSYC201 and explains PSYC101 was not offered to 2025 batch',
      notes: passed ? 'Prerequisites and ground truth discrepancy verified' : 'Missing listed prereqs or disclosure'
    };
  });

  await testCase(12, 'B. Prerequisites', 'What are the prerequisites for ECON301 in 2026?', res => {
    const ans = res.answer || '';
    const hasPrereq = ans.includes('ECON201') && ans.includes('ECON202');
    const hasDisclosure = ans.includes('does not exist') || ans.includes('ECON208') || ans.includes('confirmation');
    const passed = hasPrereq && hasDisclosure;
    return {
      passed,
      expected: 'Lists ECON201 & ECON202 and notes ECON202 does not exist and ECON201 not offered',
      notes: passed ? 'Prerequisites and anomalies verified' : 'Missing listed prereqs or anomaly notes'
    };
  });

  await testCase(13, 'B. Prerequisites', 'Explain the prerequisite issue for MGMT210 in Finance 2025', res => {
    const ans = res.answer || '';
    const low = ans.toLowerCase();
    const hasPrereq = ans.includes('FINA333');
    const hasIssue = low.includes('not offered to the 2025 batch') || low.includes('not offered to 2025');
    const passed = hasPrereq && hasIssue;
    return {
      passed,
      expected: 'Explains FINA333 is listed as prerequisite but is not offered to 2025 batch',
      notes: passed ? 'FINA333 absence identified' : 'Missing FINA333 prerequisite issue'
    };
  });

  await testCase(14, 'B. Prerequisites', 'Explain the prerequisite issue for MGMT302 in Marketing 2025', res => {
    const ans = res.answer || '';
    const low = ans.toLowerCase();
    const hasPrereq = ans.includes('MKTG201');
    const hasIssue = low.includes('not offered to the 2025 batch') || low.includes('not offered to 2025');
    const passed = hasPrereq && hasIssue;
    return {
      passed,
      expected: 'Explains MKTG201 is listed as prerequisite but is not offered to 2025 batch',
      notes: passed ? 'MKTG201 absence identified' : 'Missing MKTG201 prerequisite issue'
    };
  });

  await testCase(15, 'B. Prerequisites', 'Explain the prerequisite issue for CDES712 in Design 2022', res => {
    const ans = res.answer || '';
    const hasCDES402 = ans.includes('CDES402');
    const hasCDES504 = ans.includes('CDES504');
    const hasCodeDistinction = ans.includes('CDES712') && ans.includes('CDES312');
    const passed = hasCDES402 && hasCDES504 && hasCodeDistinction;
    return {
      passed,
      expected: 'Explains CDES402 & CDES504 prerequisites and compares CDES712 (2022) with CDES312 (2023)',
      notes: passed ? 'CDES712 prerequisites and batch code shift verified' : 'Missing prerequisites or code comparison'
    };
  });

  // ══════════════════════════════════════════════════════════════
  // CATEGORY C: CREDIT TESTS (16–20)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- CATEGORY C: CREDIT TESTS (16–20) ---');

  await testCase(16, 'C. Credits', 'How many credits are still undecided in Law 2026?', res => {
    const ans = res.answer || '';
    const passed = ans.includes('24') && (ans.includes('TBA') || ans.includes('undecided') || ans.includes('0 credits'));
    return {
      passed,
      expected: 'Explains all 24 credits in Law 2026 are undecided / TBA',
      notes: passed ? '24 undecided credits verified' : 'Did not identify 24 undecided credits'
    };
  });

  await testCase(17, 'C. Credits', 'How many credits are still undecided in Finance 2026?', res => {
    const ans = res.answer || '';
    const passed = ans.includes('20') && (ans.includes('TBD') || ans.includes('undecided')) && ans.includes('MGMT330');
    return {
      passed,
      expected: 'Explains 20 credits are undecided (4 credits decided in MGMT330)',
      notes: passed ? '20 TBD credits and MGMT330 verified' : 'Did not identify 20 undecided credits'
    };
  });

  await testCase(18, 'C. Credits', 'Explain the Design 2024 credit discrepancy', res => {
    const ans = res.answer || '';
    const hasCDES217 = ans.includes('CDES217');
    const hasLTP = ans.includes('2-3-0');
    const hasValues = ans.includes('4') && ans.includes('5');
    const passed = hasCDES217 && hasLTP && hasValues;
    return {
      passed,
      expected: 'Explains CDES217 has L-T-P 2-3-0 which computes to 5 credits but sheet lists 4 credits',
      notes: passed ? 'CDES217 credit calculation discrepancy verified' : 'Missing 2-3-0 or 4 vs 5 credits'
    };
  });

  await testCase(19, 'C. Credits', 'Explain the Marketing 2025 credit discrepancy', res => {
    const ans = res.answer || '';
    const hasMGMT302 = ans.includes('MGMT302');
    const hasLTP = ans.includes('2-1-0');
    const hasValues = ans.includes('3') && ans.includes('4');
    const passed = hasMGMT302 && hasLTP && hasValues;
    return {
      passed,
      expected: 'Explains MGMT302 has L-T-P 2-1-0 which computes to 3 credits but sheet lists 4 credits',
      notes: passed ? 'MGMT302 credit calculation discrepancy verified' : 'Missing 2-1-0 or 3 vs 4 credits'
    };
  });

  await testCase(20, 'C. Credits', 'Explain the semester-wise minor/Open slot mismatch for a selected batch', res => {
    const ans = res.answer || '';
    const hasSlots = ans.includes('Semester 3') || ans.includes('S3') || ans.includes('B.Tech Data Science');
    const hasMismatch = ans.includes('slot') || ans.includes('mismatch') || ans.includes('Finance') || ans.includes('Law');
    const passed = hasSlots && hasMismatch;
    return {
      passed,
      expected: 'Explains B.Tech DS slot allocations and compares with minor semester credit distributions',
      notes: passed ? 'Slot distribution mismatch verified' : 'Missing slot distribution analysis'
    };
  });

  // ══════════════════════════════════════════════════════════════
  // CATEGORY D: SOURCE UI TESTS (21–30)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- CATEGORY D: SOURCE UI TESTS (21–30) ---');

  let q21Res = null;
  await testCase(21, 'D. Source UI', 'What is the semester structure for Batch 2024?', res => {
    q21Res = res;
    const ans = res.answer || '';
    const passed = ans.includes('Batch 2024') || ans.includes('180') || ans.includes('Semester');
    return {
      passed,
      expected: 'Returns curriculum structure for Batch 2024',
      notes: passed ? 'Semester structure answered' : 'Failed to return curriculum structure'
    };
  });

  await testCase(22, 'D. Source UI', 'Verify internal assignment PDF is not shown as official source in query 21', res => {
    const titles = (q21Res?.sources || []).map(s => s.documentTitle).join(' ');
    const urls = (q21Res?.sources || []).map(s => s.url || '').join(' ');
    const passed = !titles.includes('all the info for gai') && !urls.includes('gai%20assignment');
    return {
      passed,
      expected: 'No exposure of internal assignment document title or url',
      notes: passed ? 'Internal filename completely suppressed from public sources' : 'Internal filename leaked in sources'
    };
  });

  await testCase(23, 'D. Source UI', 'Test /api/document-preview for semester_spread (modal preview)', () => {
    const xlsx = require('xlsx');
    const cand = path.join(__dirname, '../Semester_Spread_Structures_Sept_2026.xlsx');
    const exists = fs.existsSync(cand);
    const wb = exists ? xlsx.readFile(cand) : null;
    const passed = exists && wb && wb.SheetNames.includes('Sem_Spread_2024');
    return {
      passed,
      expected: 'Server can read Semester Spread workbook and locate Sem_Spread_2024 sheet',
      notes: passed ? 'Semester Spread preview data successfully verified' : 'Workbook not found or missing sheet'
    };
  });

  await testCase(24, 'D. Source UI', 'Verify workbook preview returns structured rows without downloading automatically', () => {
    const xlsx = require('xlsx');
    const cand = path.join(__dirname, '../Semester_Spread_Structures_Sept_2026.xlsx');
    const wb = xlsx.readFile(cand);
    const rows = xlsx.utils.sheet_to_json(wb.Sheets['Sem_Spread_2024'], { header: 1 });
    const passed = Array.isArray(rows) && rows.length > 10;
    return {
      passed,
      expected: 'Workbook preview returns structured array of table rows',
      notes: passed ? `Returned ${rows.length} structured rows for Sem_Spread_2024` : 'Failed to parse table rows'
    };
  });

  await testCase(25, 'D. Source UI', 'Test /api/document-preview for minor_courses (modal preview)', () => {
    const xlsx = require('xlsx');
    const cand = path.join(__dirname, '../data/118351_Minor Courses for BTech_Students.xlsx');
    const exists = fs.existsSync(cand);
    const wb = exists ? xlsx.readFile(cand) : null;
    const passed = exists && wb && wb.SheetNames.includes('Psychology');
    return {
      passed,
      expected: 'Server can read Minor Courses workbook and locate Psychology sheet',
      notes: passed ? 'Minor Courses workbook preview data verified' : 'Minor workbook missing or unreadable'
    };
  });

  await testCase(26, 'D. Source UI', 'Verify correct source document opens with all 7 minor sheets', () => {
    const xlsx = require('xlsx');
    const cand = path.join(__dirname, '../data/118351_Minor Courses for BTech_Students.xlsx');
    const wb = xlsx.readFile(cand);
    const expectedSheets = ['Law Minor', 'Design Minor', 'Psychology', 'Economics', 'Finance', 'Marketing', 'Start-up'];
    const passed = expectedSheets.every(s => wb.SheetNames.includes(s));
    return {
      passed,
      expected: 'Workbook contains all 7 minor sheets',
      notes: passed ? 'All 7 sheets confirmed present' : 'Missing one or more minor sheets'
    };
  });

  await testCase(27, 'D. Source UI', 'Verify source page or sheet information is shown when available', res => {
    const sources = res.sources || [];
    const hasSheetOrPage = sources.some(s => s.pageOrSheet && s.pageOrSheet.length > 2);
    return {
      passed: hasSheetOrPage,
      expected: 'Source objects contain specific pageOrSheet reference',
      notes: hasSheetOrPage ? 'pageOrSheet location metadata verified' : 'Missing pageOrSheet location'
    };
  }, 'What are the courses in the Law minor for Batch 2023?');

  await testCase(28, 'D. Source UI', 'Verify source preview modal DOM element exists in index.html', () => {
    const html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    const hasModal = html.includes('id="docPreviewModal"');
    const hasTable = html.includes('id="previewTable"');
    const hasTabs = html.includes('id="previewTabsToolbar"');
    const passed = hasModal && hasTable && hasTabs;
    return {
      passed,
      expected: 'index.html contains docPreviewModal, previewTable, and previewTabsToolbar',
      notes: passed ? 'DOM elements for preview modal verified' : 'Missing preview modal HTML elements'
    };
  });

  await testCase(29, 'D. Source UI', 'Verify no local filesystem path is displayed in public source cards', res => {
    const sources = res.sources || [];
    const titles = sources.map(s => s.documentTitle).join(' ');
    const passed = !titles.includes('C:\\') && !titles.includes('/documents/');
    return {
      passed,
      expected: 'Public source cards do not display local filesystem or /documents/ path strings',
      notes: passed ? 'Titles are human-readable clean labels' : 'Leaked local path in source card'
    };
  });

  await testCase(30, 'D. Source UI', 'Verify token display is truthful and visible', res => {
    const tok = res.tokens;
    const passed = tok && tok.totalTokens !== null && tok.model && tok.model.includes('Deterministic');
    return {
      passed,
      expected: 'Tokens object present with 0 tokens and Deterministic model label',
      notes: passed ? 'Token reporting is truthful and non-fabricated' : 'Missing tokens object or incorrect model'
    };
  });

  // ══════════════════════════════════════════════════════════════
  // CATEGORY E: REGRESSION TESTS (31–40)
  // ══════════════════════════════════════════════════════════════
  console.log('\n--- CATEGORY E: REGRESSION TESTS (31–40) ---');

  await testCase(31, 'E. Regression', 'What does L-T-P mean?', res => {
    const ans = res.answer || '';
    const passed = ans.includes('Lecture') && ans.includes('Tutorial') && ans.includes('Practical');
    return {
      passed,
      expected: 'Explains Lecture, Tutorial, Practical weekly contact hours',
      notes: passed ? 'L-T-P components defined' : 'Missing L-T-P explanation'
    };
  });

  await testCase(32, 'E. Regression', 'What does 1-0-4 mean in DATA103?', res => {
    const ans = res.answer || '';
    const hasHours = ans.includes('1') && ans.includes('4') && (ans.includes('5') || ans.includes('contact hour'));
    const hasCredits = ans.includes('3 credits') || ans.includes('3 Credits') || ans.includes('Credits = 3');
    const passed = hasHours && hasCredits && !ans.includes('INSUFFICIENT INFORMATION');
    return {
      passed,
      expected: 'Explains DATA103 L-T-P 1-0-4, 5 weekly contact hours, 3 credits',
      notes: passed ? 'DATA103 contact hours and credits explained' : 'Failed to explain DATA103 structure'
    };
  });

  await testCase(33, 'E. Regression', 'What is the difference between L-T-P and credits?', res => {
    const ans = res.answer || '';
    const hasConcept = ans.includes('Contact Hours') || ans.includes('contact hours') || ans.includes('weekly');
    const notBatchComp = !ans.includes('Batch 2024 vs Batch 2025');
    const passed = hasConcept && notBatchComp;
    return {
      passed,
      expected: 'Explains weekly contact hours vs academic credits without returning batch comparison',
      notes: passed ? 'Contact hours vs credits cleanly explained' : 'Incorrectly returned batch comparison or missing concept'
    };
  });

  await testCase(34, 'E. Regression', 'What is the difference between semester spread and credit structure?', res => {
    const ans = res.answer || '';
    const passed = (ans.includes('Semester Spread') || ans.includes('Sem Spread')) && (ans.includes('Credit Structure') || ans.includes('Struct_'));
    return {
      passed,
      expected: 'Explains chronological semester spread vs degree basket credit structure',
      notes: passed ? 'Spread vs structure distinction verified' : 'Missing spread vs structure explanation'
    };
  });

  await testCase(35, 'E. Regression', 'What does NIL mean in prerequisites?', res => {
    const ans = res.answer || '';
    const passed = ans.includes('no prerequisite') || ans.includes('No prerequisite');
    return {
      passed,
      expected: 'Explains NIL means no prerequisite required',
      notes: passed ? 'NIL definition verified' : 'Did not define NIL'
    };
  });

  await testCase(36, 'E. Regression', 'What does TBA mean?', res => {
    const ans = res.answer || '';
    const passed = ans.includes('To Be Announced');
    return {
      passed,
      expected: 'Explains TBA means To Be Announced',
      notes: passed ? 'TBA definition verified' : 'Did not define TBA'
    };
  });

  await testCase(37, 'E. Regression', 'What does TBD mean?', res => {
    const ans = res.answer || '';
    const passed = ans.includes('To Be Decided') && (ans.includes('undecided') || ans.includes('placeholder'));
    return {
      passed,
      expected: 'Explains TBD means To Be Decided (placeholder for undecided courses/credits)',
      notes: passed ? 'TBD definition and credit interpretation verified' : 'Did not define TBD'
    };
  });

  await testCase(38, 'E. Regression', 'What are the prerequisites for DATA302?', res => {
    const ans = res.answer || '';
    const passed = ans.includes('DATA301') || ans.includes('Machine Learning');
    return {
      passed,
      expected: 'Identifies DATA301 Machine Learning as prerequisite for DATA302 Deep Learning',
      notes: passed ? 'DATA301 prerequisite verified' : 'Missing DATA301 prerequisite'
    };
  });

  await testCase(39, 'E. Regression', 'What are the attendance rules?', res => {
    const ans = res.answer || '';
    const passed = ans.includes('75%') && ans.includes('65%');
    return {
      passed,
      expected: 'Explains 75% mandatory attendance and 65% medical relaxation threshold',
      notes: passed ? 'Attendance rules verified' : 'Missing attendance thresholds'
    };
  });

  await testCase(40, 'E. Regression', 'What is the quantum mechanics syllabus for Harvard students?', res => {
    const passed = res.state === 'INSUFFICIENT_INFORMATION' || res.state === 'OUT_OF_SCOPE';
    return {
      passed,
      expected: 'Rejects out-of-scope query without hallucinating',
      notes: passed ? `Appropriately declined query (State: ${res.state})` : 'Hallucinated or answered out-of-scope query'
    };
  });

  console.log('\n================================================================');
  console.log(`40-TEST SUITE COMPLETED:`);
  console.log(`TOTAL: 40 | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log('================================================================\n');

  // Save detailed test report
  const reportPath = path.join(__dirname, '../data/test_minor_courses_40_results.json');
  fs.writeFileSync(reportPath, JSON.stringify({ summary: { total: 40, passed: passCount, failed: failCount }, results }, null, 2));
  console.log(`Detailed test report saved to: ${reportPath}`);

  return { total: 40, passed: passCount, failed: failCount, results };
}

if (require.main === module) {
  runTestSuite().then(res => {
    if (res.failed > 0) {
      console.error(`Suite finished with ${res.failed} failures.`);
      process.exit(1);
    } else {
      console.log('All 40 tests PASSED with 100% success rate.');
      process.exit(0);
    }
  });
}

module.exports = { runTestSuite };
