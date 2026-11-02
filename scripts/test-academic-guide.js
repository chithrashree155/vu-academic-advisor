/**
 * Comprehensive Academic Explanation & Reading Guide Test Suite
 * Tests interpretation and explanation of "all the info for gai assignment.pdf"
 */

const { processAdvisorQuery } = require('../src/lib/advisory-engine');

const TEST_CASES = [
  // ── 1. L-T-P & L-T-P-C Explanations ──
  {
    id: 1,
    query: 'What does L-T-P mean?',
    category: '1. L-T-P & L-T-P-C Definitions',
    validate: (res) => {
      const a = res.answer || '';
      const hasL = a.includes('Lecture (Classroom Instruction)') || a.includes('Lecture');
      const hasT = a.includes('Tutorial');
      const hasP = a.includes('Practical');
      const hasSource = res.sources.some(s => s.documentTitle.includes('Handbook') || s.documentTitle.includes('all the info'));
      return {
        pass: res.state === 'ANSWERABLE' && hasL && hasT && hasP && hasSource,
        reason: 'Explains Lecture, Tutorial, Practical in order with verified sources'
      };
    }
  },
  {
    id: 2,
    query: 'Explain L-T-P 3-0-2.',
    category: '1. L-T-P & L-T-P-C Definitions',
    validate: (res) => {
      const a = res.answer || '';
      const hasL = a.includes('3') && a.includes('lecture');
      const hasT = a.includes('0') && a.includes('tutorial');
      const hasP = a.includes('2') && a.includes('practical');
      const hasContact = a.includes('5 hours per week') || a.includes('5');
      const hasCredits = a.includes('4 credit') || a.includes('4 credits');
      return {
        pass: res.state === 'ANSWERABLE' && hasL && hasT && hasP && hasContact && hasCredits,
        reason: 'Exact 3-0-2 breakdown: 3 lecture, 0 tutorial, 2 practical = 5 contact hrs, 4 credits'
      };
    }
  },
  {
    id: 3,
    query: 'What is the difference between lecture and practical hours?',
    category: '1. L-T-P & L-T-P-C Definitions',
    validate: (res) => {
      const a = res.answer || '';
      const hasLecture = a.includes('1:1') || a.includes('1 contact hour per week = 1 academic credit');
      const hasPractical = a.includes('2:1') || a.includes('2 practical contact hours per week = 1 academic credit');
      const hasExample = a.includes('DATA103');
      return {
        pass: res.state === 'ANSWERABLE' && hasLecture && hasPractical && hasExample,
        reason: 'Distinguishes 1:1 lecture ratio from 2:1 practical ratio using DATA103 example'
      };
    }
  },

  // ── 2. Credits & Calculation Rules ──
  {
    id: 4,
    query: 'What are credits?',
    category: '2. Credits & Calculation Rules',
    validate: (res) => {
      const a = res.answer || '';
      const hasDegree = a.includes('180 credits');
      const hasFormula = a.includes('L + T') && (a.includes('P/2') || a.includes('\\frac{P}{2}'));
      return {
        pass: res.state === 'ANSWERABLE' && hasDegree && hasFormula,
        reason: 'Explains credits toward 180-credit degree and official formula'
      };
    }
  },
  {
    id: 5,
    query: 'How are credits calculated?',
    category: '2. Credits & Calculation Rules',
    validate: (res) => {
      const a = res.answer || '';
      const hasFormula = a.includes('L + T') && (a.includes('P/2') || a.includes('\\frac{P}{2}'));
      const hasRatios = (a.includes('1:1') || a.includes('1 contact hour')) && (a.includes('2:1') || a.includes('2 contact hours'));
      const hasVerificationNote = a.includes('Confirmation Flag') || a.includes('confirm') || a.includes('Non-Taught');
      return {
        pass: res.state === 'ANSWERABLE' && hasFormula && hasRatios && hasVerificationNote,
        reason: 'Provides formula, explains 1:1 vs 2:1 ratios, and highlights non-taught courses note'
      };
    }
  },
  {
    id: 6,
    query: 'Why does a course have credits but no weekly contact hours?',
    category: '2. Credits & Calculation Rules',
    validate: (res) => {
      const a = res.answer || '';
      const has000 = a.includes('0-0-0');
      const hasQuantum = a.includes('quantum of') || a.includes('Non-Taught') || a.includes('Experiential');
      const hasExamples = a.includes('UCOR701') || a.includes('DATA801') || a.includes('DATA803') || a.includes('MTSC781');
      return {
        pass: res.state === 'ANSWERABLE' && has000 && hasQuantum && hasExamples,
        reason: 'Explains non-taught/experiential pedagogy with official examples like UCOR701, DATA801, DATA803'
      };
    }
  },

  // ── 3. Semester Spread vs Credit Structure ──
  {
    id: 7,
    query: 'What is the difference between semester spread and credit structure?',
    category: '3. Semester Spread vs Credit Structure',
    validate: (res) => {
      const a = res.answer || '';
      const hasSpread = a.includes('Semester Spread') && (a.includes('chronological') || a.includes('S1') || a.includes('schedule'));
      const hasStruct = a.includes('Credit Structure') && (a.includes('baskets') || a.includes('graduation'));
      const hasSpanning = a.includes('multiple semesters') || a.includes('distributed across');
      const notBatchComparison = !a.includes('Curriculum Comparison: Batch 2024');
      return {
        pass: res.state === 'ANSWERABLE' && hasSpread && hasStruct && hasSpanning && notBatchComparison,
        reason: 'Accurately distinguishes chronological spread from graduation basket structure without batch comparison'
      };
    }
  },

  // ── 4. Basket Categories ──
  {
    id: 8,
    query: 'What is a basket?',
    category: '4. Basket Categories',
    validate: (res) => {
      const a = res.answer || '';
      const hasDef = a.includes('category of courses') || a.includes('designated academic category');
      const has7Baskets = a.includes('7') || a.includes('B1') || a.includes('University Core');
      const has180 = a.includes('180');
      return {
        pass: res.state === 'ANSWERABLE' && hasDef && has7Baskets && has180,
        reason: 'Explains basket concept, 7 categories (B1-B7), and 180 total credit requirement'
      };
    }
  },
  {
    id: 9,
    query: 'What does Foundation mean?',
    category: '4. Basket Categories',
    validate: (res) => {
      const a = res.answer || '';
      const hasMathScience = a.includes('mathematical') || a.includes('Calculus') || a.includes('science');
      const hasCredits = a.includes('26') || a.includes('34');
      const hasMultiSem = a.includes('multiple semesters') || a.includes('distributed across');
      return {
        pass: res.state === 'ANSWERABLE' && hasMathScience && hasCredits && hasMultiSem,
        reason: 'Defines Foundation basket, credit range, and semester distribution'
      };
    }
  },
  {
    id: 10,
    query: 'What is Program Core?',
    category: '4. Basket Categories',
    validate: (res) => {
      const a = res.answer || '';
      const hasCore = a.includes('compulsory') || a.includes('engineering');
      const hasCourses = a.includes('Data Structures') || a.includes('Operating Systems') || a.includes('Algorithms');
      const hasCredits = a.includes('46') || a.includes('50');
      return {
        pass: res.state === 'ANSWERABLE' && hasCore && hasCourses && hasCredits,
        reason: 'Defines Program Core compulsory engineering foundations'
      };
    }
  },
  {
    id: 11,
    query: 'What is Program Honors?',
    category: '4. Basket Categories',
    validate: (res) => {
      const a = res.answer || '';
      const has20Credits = a.includes('20 credits') || a.includes('20 credit');
      const hasCompulsory = a.includes('compulsory') || a.includes('count toward') || a.includes('integral');
      const hasCourses = a.includes('Machine Learning') || a.includes('Deep Learning') || a.includes('Data Science');
      return {
        pass: res.state === 'ANSWERABLE' && has20Credits && hasCompulsory && hasCourses,
        reason: 'Explains 20-credit Program Honors requirement and clarifies its compulsory nature'
      };
    }
  },
  {
    id: 12,
    query: 'What is a specialization track?',
    category: '4. Basket Categories',
    validate: (res) => {
      const a = res.answer || '';
      const hasTrack1 = a.includes('Applied Deep Learning');
      const hasTrack2 = a.includes('Full Stack Development');
      const has5Courses = a.includes('5') && (a.includes('courses') || a.includes('20 credits'));
      return {
        pass: res.state === 'ANSWERABLE' && hasTrack1 && hasTrack2 && has5Courses,
        reason: 'Details Track 1 (Applied Deep Learning) and Track 2 (Full Stack Development) 5 courses / 20 credits'
      };
    }
  },
  {
    id: 13,
    query: 'What is the difference between an elective and an open/minor course?',
    category: '4. Basket Categories',
    validate: (res) => {
      const a = res.answer || '';
      const hasMinor = a.includes('Minor') && (a.includes('School') || a.includes('Law') || a.includes('Business'));
      const hasOpen = a.includes('Open Electives') || a.includes('outside');
      const hasProgramElectives = a.includes('Program Electives') || a.includes('engineering discipline');
      return {
        pass: res.state === 'ANSWERABLE' && hasMinor && hasOpen && hasProgramElectives,
        reason: 'Distinguishes program electives from multidisciplinary minor and open electives'
      };
    }
  },

  // ── 5. Prerequisites & Notations ──
  {
    id: 14,
    query: 'What does NIL mean?',
    category: '5. Prerequisites & Notations',
    validate: (res) => {
      const a = res.answer || '';
      const hasNoPrereq = a.includes('no prerequisite') || a.includes('no prior course');
      const hasExample = a.includes('DATA103') || a.includes('MATH201') || a.includes('COMP201');
      return {
        pass: res.state === 'ANSWERABLE' && hasNoPrereq && hasExample,
        reason: 'Defines NIL as no prerequisite with concrete curriculum examples'
      };
    }
  },
  {
    id: 15,
    query: 'What does a prerequisite mean?',
    category: '5. Prerequisites & Notations',
    validate: (res) => {
      const a = res.answer || '';
      const hasDef = a.includes('must successfully complete') || a.includes('before being permitted');
      const hasAndOr = a.includes('AND') && a.includes('OR');
      return {
        pass: res.state === 'ANSWERABLE' && hasDef && hasAndOr,
        reason: 'Defines prerequisite and multiple prerequisite rules (AND vs OR)'
      };
    }
  },
  {
    id: 16,
    query: 'What does TBA mean?',
    category: '5. Prerequisites & Notations',
    validate: (res) => {
      const a = res.answer || '';
      const hasToBeat = a.includes('To Be Announced');
      const hasExample = a.includes('Language') || a.includes('Compiler Design') || a.includes('Image Processing');
      return {
        pass: res.state === 'ANSWERABLE' && hasToBeat && hasExample,
        reason: 'Defines TBA as To Be Announced with official curriculum placeholders'
      };
    }
  },

  // ── 6. Batches & Evolution ──
  {
    id: 17,
    query: 'How many semesters are in the curriculum?',
    category: '6. Batches & Evolution',
    validate: (res) => {
      const a = res.answer || '';
      const has8 = a.includes('8') && a.includes('semester');
      const has4Years = a.includes('4') && a.includes('year');
      const hasSummer = a.includes('Summer');
      return {
        pass: res.state === 'ANSWERABLE' && has8 && has4Years && hasSummer,
        reason: 'Explains 8 regular semesters across 4 years with summer terms'
      };
    }
  },
  {
    id: 18,
    query: 'What is the total degree credit requirement?',
    category: '6. Batches & Evolution',
    validate: (res) => {
      const a = res.answer || '';
      const has180 = a.includes('180') && a.includes('credit');
      return {
        pass: res.state === 'ANSWERABLE' && has180,
        reason: 'Confirms exact 180 total degree credits'
      };
    }
  },
  {
    id: 19,
    query: 'Why does a course appear in one semester for one batch and another semester for a different batch?',
    category: '6. Batches & Evolution',
    validate: (res) => {
      const a = res.answer || '';
      const hasVersioning = a.includes('versioned') || a.includes('admission batch');
      const hasExamples = a.includes('MATH201') || a.includes('COMP207') || a.includes('DATA103');
      return {
        pass: res.state === 'ANSWERABLE' && hasVersioning && hasExamples,
        reason: 'Explains batch curriculum versioning with concrete shift examples'
      };
    }
  },

  // ── 7. Safe Refusal Guardrails ──
  {
    id: 20,
    query: 'How many credits does Quantum Holography 999 carry?',
    category: '7. Safe Refusal Guardrails',
    validate: (res) => {
      return {
        pass: res.state === 'INSUFFICIENT_INFORMATION',
        reason: 'Safely refused non-existent course without fabricating credits'
      };
    }
  },
  {
    id: 21,
    query: 'What are the Foundation courses for Batch 2035?',
    category: '7. Safe Refusal Guardrails',
    validate: (res) => {
      return {
        pass: res.state === 'INSUFFICIENT_INFORMATION',
        reason: 'Safely refused unsupported future batch 2035'
      };
    }
  }
];

async function runAcademicGuideTests() {
  console.log('\n================================================================');
  console.log('VIDYASHILP UNIVERSITY — ACADEMIC EXPLANATION GUIDE VERIFICATION');
  console.log('================================================================\n');

  let passedCount = 0;
  const categories = {};

  for (const tc of TEST_CASES) {
    if (!categories[tc.category]) {
      categories[tc.category] = { total: 0, passed: 0 };
    }
    categories[tc.category].total++;

    const res = await processAdvisorQuery(tc.query);
    const val = tc.validate(res);

    if (val.pass) {
      passedCount++;
      categories[tc.category].passed++;
      console.log(`[PASS] Test ${String(tc.id).padStart(2, '0')}: [${tc.category}] "${tc.query}"`);
      console.log(`       -> ${val.reason} | Sources: ${(res.sources || []).length} | State: ${res.state}`);
    } else {
      console.log(`[FAIL] Test ${String(tc.id).padStart(2, '0')}: [${tc.category}] "${tc.query}"`);
      console.log(`       -> ${val.reason} | State: ${res.state}`);
      console.log(`       -> Excerpt: ${(res.answer || '').slice(0, 160)}...`);
    }
  }

  console.log('\n================================================================');
  console.log('ACADEMIC GUIDE EVALUATION SUMMARY');
  console.log('================================================================');
  console.log(`Total Tested: ${TEST_CASES.length}`);
  console.log(`Passed:       ${passedCount} / ${TEST_CASES.length} (${((passedCount / TEST_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`Failed:       ${TEST_CASES.length - passedCount}`);
  console.log('----------------------------------------------------------------');
  console.log('Breakdown by Category:');
  for (const [cat, data] of Object.entries(categories)) {
    console.log(`• ${cat.padEnd(38)}: ${data.passed} / ${data.total} passed`);
  }
  console.log('================================================================\n');

  if (passedCount < TEST_CASES.length) {
    process.exit(1);
  }
}

runAcademicGuideTests();

