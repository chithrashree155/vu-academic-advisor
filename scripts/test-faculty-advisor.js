/**
 * End-to-End Verification Test Suite
 * Tests all 10 core tests, RAG grounding, privacy, UI terminology, dynamic year calculation, and synthetic data rules.
 */

'use strict';

const { processAdvisorQuery, getStudentProfileById, getAcademicYear } = require('../src/lib/advisory-engine');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('STARTING E2E VERIFICATION SUITE FOR VU ACADEMIC ADVISOR');
console.log('================================================================\n');

const testResults = [];

async function recordTest(id, title, fn) {
  try {
    const { pass, actual, expected, bug, file, reason } = await fn();
    testResults.push({
      id,
      title,
      actual,
      expected,
      pass: pass ? 'PASS' : 'FAIL',
      bug: bug || 'None',
      file: file || 'None',
      reason: reason || 'None'
    });
    if (pass) {
      console.log(`✓ [PASS] ${id}: ${title}`);
    } else {
      console.error(`❌ [FAIL] ${id}: ${title}`);
      console.error(`   Actual:\n${actual}\n`);
    }
  } catch (err) {
    console.error(`❌ [ERROR] ${id}: ${title}`, err);
    testResults.push({
      id,
      title,
      actual: err.message,
      expected: 'Successful execution',
      pass: 'FAIL',
      bug: 'Runtime error',
      file: 'advisory-engine.js',
      reason: err.stack || err.message
    });
  }
}

async function runE2eTests() {
  // TEST 1 — Economics -> Deep Learning (Meera Krishnan)
  await recordTest('TEST 1', 'Economics -> Deep Learning (Meera Krishnan)', async () => {
    const res = await processAdvisorQuery('Can I take deep learning?', 'VU-DEMO-008');
    const pass = res.state === 'ANSWERABLE' &&
      res.answer.includes('STATUS: NOT ELIGIBLE') &&
      res.answer.includes('DATA302 — Deep Learning') &&
      res.answer.includes('Meera Krishnan') &&
      res.answer.includes('BA (Hons.) – Economics') &&
      res.answer.includes('Semester 5') &&
      res.answer.includes('Year 3 (3rd Year)') &&
      res.answer.includes('DATA301 — Machine Learning');

    return {
      pass,
      actual: res.answer,
      expected: 'STATUS: NOT ELIGIBLE with DATA302, Meera Krishnan, BA Economics, Sem 5, Year 3, missing DATA301 prerequisite and reason.'
    };
  });

  // TEST 2 — Data Science -> Deep Learning (Aarav Mehta - prerequisite completed)
  await recordTest('TEST 2', 'Data Science -> Deep Learning (Aarav Mehta, DATA301 completed)', async () => {
    const res = await processAdvisorQuery('Can I take DATA302?', 'VU-DEMO-001');
    const pass = res.state === 'ANSWERABLE' && res.answer.includes('STATUS: ELIGIBLE') && res.answer.includes('Aarav Mehta');
    return {
      pass,
      actual: res.answer,
      expected: 'STATUS: ELIGIBLE for Aarav Mehta since DATA301 is completed.'
    };
  });

  // TEST 3 — Missing prerequisite (Neil Thomas - DATA301 missing)
  await recordTest('TEST 3', 'Missing prerequisite (Neil Thomas, missing DATA301)', async () => {
    const res = await processAdvisorQuery('Can I take DATA302?', 'VU-DEMO-015');
    const pass = res.state === 'ANSWERABLE' && (res.answer.includes('STATUS: NOT ELIGIBLE') || res.answer.includes('PREREQUISITE NOT MET')) && res.answer.includes('DATA301');
    return {
      pass,
      actual: res.answer,
      expected: 'STATUS: NOT ELIGIBLE (PREREQUISITE NOT MET) identifying DATA301 — Machine Learning.'
    };
  });

  // TEST 4 — What courses can I take? (BA Economics student)
  await recordTest('TEST 4', 'What courses can I take? (Meera Krishnan, BA Economics)', async () => {
    const res = await processAdvisorQuery('What courses can I take?', 'VU-DEMO-008');
    const pass = res.state === 'ANSWERABLE' &&
      res.answer.includes('1. Eligible Courses') &&
      res.answer.includes('2. Eligible with Conditions') &&
      res.answer.includes('3. Prerequisites Missing') &&
      res.answer.includes('4. Not Eligible') &&
      res.answer.includes('5. Cannot Verify');
    return {
      pass,
      actual: res.answer,
      expected: 'Filtered categories: 1. Eligible, 2. Eligible with conditions, 3. Prerequisites missing, 4. Not eligible, 5. Cannot verify.'
    };
  });

  // TEST 5 — BMS Student ("What courses can a BMS student take?")
  await recordTest('TEST 5', 'BMS Student Course Evaluation', async () => {
    const res = await processAdvisorQuery('What courses can a BMS student take?', null);
    const pass = res.state === 'ANSWERABLE' && res.answer.includes('BMS') && !res.answer.includes('Recommended DATA302');
    return {
      pass,
      actual: res.answer,
      expected: 'Evaluates Management/Economics/Core courses. Does NOT recommend advanced CS courses indiscriminately.'
    };
  });

  // TEST 6 — Course Existence vs Eligibility
  await recordTest('TEST 6', 'Course existence ("Does DATA302 exist?") vs Eligibility ("Can I take DATA302?")', async () => {
    const resExistence = await processAdvisorQuery('Does DATA302 exist?', 'VU-DEMO-008');
    const resEligibility = await processAdvisorQuery('Can I take DATA302?', 'VU-DEMO-008');

    const pass = resExistence.answer.includes('official course') &&
      resExistence.answer.includes('4 credits') &&
      resEligibility.answer.includes('STATUS: NOT ELIGIBLE') &&
      resExistence.answer !== resEligibility.answer;

    return {
      pass,
      actual: `Existence: ${resExistence.answer.substring(0, 100)}...\nEligibility: ${resEligibility.answer.substring(0, 100)}...`,
      expected: 'Two distinct response paths. Existence confirms catalog status; eligibility runs deterministic rule check.'
    };
  });

  // TEST 7 — Unknown Course
  await recordTest('TEST 7', 'Unknown Course (XYZ999)', async () => {
    const res = await processAdvisorQuery('Can I take XYZ999?', 'VU-DEMO-001');
    const pass = res.state === 'INSUFFICIENT_INFORMATION' && res.answer.includes('XYZ999');
    return {
      pass,
      actual: res.answer,
      expected: 'INSUFFICIENT_INFORMATION stating XYZ999 cannot be verified and suggesting candidate real courses.'
    };
  });

  // TEST 8 — Ambiguous Course ("Can I take AI?")
  await recordTest('TEST 8', 'Ambiguous Course ("Can I take AI?")', async () => {
    const res = await processAdvisorQuery('Can I take AI?', 'VU-DEMO-001');
    const pass = res.state === 'NEEDS_CLARIFICATION' && res.answer.includes('COMP301') && res.answer.includes('DATA206');
    return {
      pass,
      actual: res.answer,
      expected: 'NEEDS_CLARIFICATION listing COMP301, DATA206, and COMP210 for user disambiguation.'
    };
  });

  // TEST 9 — Complex Question
  await recordTest('TEST 9', 'Multi-factor complex query', async () => {
    const res = await processAdvisorQuery('Which courses can I take next semester considering my completed courses, prerequisites and my BA Economics program?', 'VU-DEMO-008');
    const pass = res.state === 'ANSWERABLE' && res.answer.includes('Eligible Courses');
    return {
      pass,
      actual: res.answer,
      expected: 'Multi-factor evaluation categorizing eligible courses for BA Economics.'
    };
  });

  // TEST 10 — Follow-up Question Sequence
  await recordTest('TEST 10', 'Follow-up Question Session Memory', async () => {
    const q1 = await processAdvisorQuery("Why can't I take DATA302?", 'VU-DEMO-008');
    const history1 = [{ sender: 'user', text: "Why can't I take DATA302?" }, { sender: 'advisor', text: q1.answer }];

    const q2 = await processAdvisorQuery("What prerequisite do I need?", 'VU-DEMO-008', history1);
    const history2 = [...history1, { sender: 'user', text: "What prerequisite do I need?" }, { sender: 'advisor', text: q2.answer }];

    const q3 = await processAdvisorQuery("Can I take that prerequisite this summer?", 'VU-DEMO-008', history2);

    const pass = q1.answer.includes('NOT ELIGIBLE') &&
      q2.answer.includes('DATA301 — Machine Learning') &&
      q3.answer.includes('Summer Term June 2026');

    return {
      pass,
      actual: `Q1: ${q1.answer.substring(0, 60)}...\nQ2: ${q2.answer.substring(0, 60)}...\nQ3: ${q3.answer.substring(0, 60)}...`,
      expected: 'Preserves context across 3 turns: DATA302 -> DATA301 prerequisite -> Summer Term offering status.'
    };
  });

  // PRIVACY CHECK
  await recordTest('PRIVACY CHECK', 'Frontend privacy & student data isolation', async () => {
    const htmlPath = path.join(__dirname, '../public/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    const noStudentProfilesSection = !htmlContent.includes('Student Profiles') && !htmlContent.includes('Synthetic Testing Data');
    const noBrowsableList = !htmlContent.includes('Student Profile 01') && !htmlContent.includes('18 synthetic student cards');

    return {
      pass: noStudentProfilesSection && noBrowsableList,
      actual: `Index HTML check: Student Profiles Section Removed=${noStudentProfilesSection}, Browsable List Removed=${noBrowsableList}`,
      expected: 'No student profiles directory, grid, cards, or test data section on public index.html.'
    };
  });

  // UI TERMINOLOGY CHECK
  await recordTest('UI CHECK', 'UI Terminology & Header Branding', async () => {
    const htmlPath = path.join(__dirname, '../public/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    const noFacultyAdvisor = !htmlContent.includes('VU Faculty Advisor');
    const noHowItWorks = !htmlContent.includes('HOW VU ADVISOR WORKS') && !htmlContent.includes('01 ASK');
    const usesVUAdvisor = htmlContent.includes('VU Advisor') || htmlContent.includes('VU AI Assistant');

    return {
      pass: noFacultyAdvisor && noHowItWorks && usesVUAdvisor,
      actual: `Faculty Advisor Removed=${noFacultyAdvisor}, How VU Advisor Works Removed=${noHowItWorks}, VU Advisor branding=${usesVUAdvisor}`,
      expected: 'Uses VU Advisor / VU AI Assistant. No Faculty Advisor terminology or How VU Advisor Works section.'
    };
  });

  // DYNAMIC YEAR CALCULATION CHECK
  await recordTest('YEAR CALCULATION CHECK', 'Dynamic Academic Year Calculation', async () => {
    const y1 = getAcademicYear(1);
    const y2 = getAcademicYear(3);
    const y3 = getAcademicYear(5);
    const y4 = getAcademicYear(7);

    const pass = y1.includes('Year 1') && y2.includes('Year 2') && y3.includes('Year 3') && y4.includes('Year 4');

    return {
      pass,
      actual: `Sem 1=${y1}, Sem 3=${y2}, Sem 5=${y3}, Sem 7=${y4}`,
      expected: 'Sem 1/2 -> Year 1, Sem 3/4 -> Year 2, Sem 5/6 -> Year 3, Sem 7/8 -> Year 4.'
    };
  });

  // SYNTHETIC DATA RULE CHECK
  await recordTest('SYNTHETIC DATA RULE CHECK', 'Synthetic Rule Distinction Disclaimer', async () => {
    const res = await processAdvisorQuery('Can I take DATA302?', 'VU-DEMO-008');
    const pass = res.answer.includes('synthetic demo') || (res.sources && res.sources.some(s => s.documentTitle.includes('Synthetic')));
    return {
      pass,
      actual: res.answer,
      expected: 'Contains explicit disclaimer noting synthetic demo curriculum mapping rules.'
    };
  });

  // Summary Report Output
  console.log('\n================================================================');
  console.log('VERIFICATION RESULTS SUMMARY TABLE');
  console.log('================================================================\n');

  console.table(testResults.map(t => ({
    ID: t.id,
    Title: t.title,
    Result: t.pass,
    Bug: t.bug
  })));

  const totalFailed = testResults.filter(t => t.pass === 'FAIL').length;
  if (totalFailed > 0) {
    console.error(`\n❌ ${totalFailed} TESTS FAILED. PLEASE FIX THE BUGS LISTED ABOVE.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL ${testResults.length} VERIFICATION TESTS PASSED WITH 100% ACCURACY!`);
    process.exit(0);
  }
}

runE2eTests();
