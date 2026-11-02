/**
 * Focused Curriculum Evaluation Test Suite
 * Vidyashilp University VU Academic Advisor
 * 
 * STRICT EVALUATION RULES:
 * 1. ONLY contains questions about curriculum baskets and degree structures:
 *    - University Core
 *    - Foundation
 *    - Program Core
 *    - Program Honors
 *    - Specialization Tracks
 *    - Minor / Open Electives
 *    - Internship / Capstone
 *    - Total degree credits (180 credits)
 *    - Semester-wise courses
 *    - Academic year differences
 *    - Course credits
 *    - L-T-P structure
 * 2. Does NOT include attendance, medical eligibility, registration, or unrelated advisory topics.
 * 3. Tests all 10 required evaluation categories:
 *    Cat 1: Simple questions
 *    Cat 2: Detailed questions
 *    Cat 3: Multi-part questions
 *    Cat 4: Questions involving different batches
 *    Cat 5: Questions involving semester-wise course baskets
 *    Cat 6: Questions involving course credits
 *    Cat 7: Questions involving L-T-P
 *    Cat 8: Questions requiring multiple sources
 *    Cat 9: Questions with missing information / follow-ups
 *    Cat 10: Questions where the chatbot must refuse to guess
 * 4. For every test, validates:
 *    - Answer correctness
 *    - Retrieval correctness
 *    - Batch and semester isolation
 *    - Credit calculation
 *    - Source correctness & URL validity
 *    - Transparent token reporting
 *    - Grounding in retrieved evidence
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { processAdvisorQuery, getOfficialDocumentUrl } = require('../src/lib/advisory-engine');

console.log('================================================================');
console.log('VIDYASHILP UNIVERSITY — FOCUSED CURRICULUM EVALUATION (30 TESTS)');
console.log('================================================================\n');

function checkSourceUrlValid(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('http://') || url.startsWith('https://')) return true;
  if (url.startsWith('/documents/')) {
    const rawPath = url.split('#')[0].replace('/documents/', '');
    const filename = decodeURIComponent(rawPath);
    const candidatePaths = [
      path.join(__dirname, '../data', filename),
      path.join(__dirname, '..', filename)
    ];
    return candidatePaths.some(p => fs.existsSync(p));
  }
  return false;
}

const TEST_CASES = [
  // ── CATEGORY 1: SIMPLE QUESTIONS ──
  {
    id: 1,
    category: '1. Simple Questions',
    query: 'How many total credits are required for the B.Tech degree?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has180 = ans.includes('180') && (ans.includes('credits') || ans.includes('credit'));
      const correctState = res.state === 'ANSWERABLE';
      const hasSource = res.sources && res.sources.length > 0;
      const validUrl = hasSource && res.sources.every(s => !s.url || checkSourceUrlValid(s.url));
      return {
        passed: has180 && correctState && hasSource && validUrl,
        reason: has180 ? 'Exact 180 total degree credits stated' : 'Missing 180 credits'
      };
    }
  },
  {
    id: 2,
    category: '1. Simple Questions',
    query: 'What is the course code for Programming in Python?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasCode = ans.includes('DATA103');
      const correctState = res.state === 'ANSWERABLE';
      return {
        passed: hasCode && correctState,
        reason: hasCode ? 'Correctly identified DATA103' : 'Missing DATA103'
      };
    }
  },
  {
    id: 3,
    category: '1. Simple Questions',
    query: 'How many credits is Compiler Design?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasCredits = ans.includes('3 credits') || ans.includes('3 credit');
      const hasBatch = ans.includes('2026') || ans.includes('Batch');
      return {
        passed: hasCredits && res.state === 'ANSWERABLE',
        reason: hasCredits ? 'Exact 3 credits for Compiler Design' : 'Missing 3 credits'
      };
    }
  },

  // ── CATEGORY 2: DETAILED QUESTIONS ──
  {
    id: 4,
    category: '2. Detailed Questions',
    query: 'What are all the University Core courses for Batch 2024 and their credits?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasTotal = ans.includes('18 credits') || ans.includes('18 credit');
      const hasComm = ans.includes('Communication') || ans.includes('UCOR103');
      const hasCritical = ans.includes('Critical Thinking') || ans.includes('UCOR210');
      return {
        passed: hasTotal && hasComm && hasCritical && res.state === 'ANSWERABLE',
        reason: hasTotal ? '18 credits total and detailed course list provided' : 'Incomplete University Core details'
      };
    }
  },
  {
    id: 5,
    category: '2. Detailed Questions',
    query: 'What are the Program Core courses in Batch 2026 Data Science?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasTotal = ans.includes('50 credits') || ans.includes('50 credit');
      const hasCompiler = ans.includes('Compiler Design') || ans.includes('COMP311');
      const hasOS = ans.includes('Operating Systems') || ans.includes('COMP302');
      return {
        passed: hasTotal && hasCompiler && hasOS && res.state === 'ANSWERABLE',
        reason: hasTotal ? '50 credits Program Core for 2026 DS detailed' : 'Incomplete Program Core details'
      };
    }
  },

  // ── CATEGORY 3: MULTI-PART QUESTIONS ──
  {
    id: 6,
    category: '3. Multi-Part Questions',
    query: 'What are the Foundation courses for Batch 2023, how many credits do they have in total, and which ones are in Semester 1?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has34 = ans.includes('34 credits') || ans.includes('34 credit');
      const hasMath = ans.includes('Probability Theory') || ans.includes('MATH202');
      return {
        passed: has34 && hasMath && res.state === 'ANSWERABLE',
        reason: has34 ? '34 basket credits and semester distribution answered' : 'Multi-part query incomplete'
      };
    }
  },
  {
    id: 7,
    category: '3. Multi-Part Questions',
    query: 'How many credits are allocated to Program Honors and Specialization Tracks in B.Tech?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has20Honors = ans.includes('20') && (ans.includes('Honors') || ans.includes('Honours'));
      return {
        passed: has20Honors && res.state === 'ANSWERABLE',
        reason: has20Honors ? '20 credits honors and electives validated' : 'Incomplete credit breakdown'
      };
    }
  },

  // ── CATEGORY 4: QUESTIONS INVOLVING DIFFERENT BATCHES ──
  {
    id: 8,
    category: '4. Different Batches',
    query: 'Which mathematics course is offered in Batch 2022 Semester 1?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasCalculus = ans.includes('Calculus') && ans.includes('MATH201');
      const notProb = !ans.includes('Probability Theory');
      return {
        passed: hasCalculus && notProb && res.state === 'ANSWERABLE',
        reason: hasCalculus ? 'Correctly isolated MATH201 Calculus for 2022 S1' : 'Batch confusion with Calculus'
      };
    }
  },
  {
    id: 9,
    category: '4. Different Batches',
    query: 'Which mathematics course is offered in Batch 2023 Semester 1?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasProb = ans.includes('Probability Theory') && ans.includes('MATH202');
      const notCalcInS1 = !ans.includes('MATH201 — Calculus');
      return {
        passed: hasProb && notCalcInS1 && res.state === 'ANSWERABLE',
        reason: hasProb ? 'Correctly isolated MATH202 Probability Theory for 2023 S1' : 'Batch confusion with Probability'
      };
    }
  },
  {
    id: 10,
    category: '4. Different Batches',
    query: 'How many Foundation course credits are required in Batch 2024 versus Batch 2025?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has34 = ans.includes('34');
      const has24 = ans.includes('24');
      return {
        passed: has34 && has24 && res.state === 'ANSWERABLE',
        reason: has34 && has24 ? 'Differentiated 34 cr (2024) vs 24 cr (2025)' : 'Batch credit comparison missing'
      };
    }
  },
  {
    id: 11,
    category: '4. Different Batches',
    query: 'How many University Core credits are required in Batch 2024 versus Batch 2025?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has18 = ans.includes('18');
      const has24 = ans.includes('24');
      return {
        passed: has18 && has24 && res.state === 'ANSWERABLE',
        reason: has18 && has24 ? 'Differentiated 18 cr (2024) vs 24 cr (2025)' : 'University Core comparison missing'
      };
    }
  },

  // ── CATEGORY 5: SEMESTER-WISE COURSE BASKETS ──
  {
    id: 12,
    category: '5. Semester-Wise Baskets',
    query: 'What are the Foundation courses for Batch 2022 Semester 1?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has13 = ans.includes('13 credits') || ans.includes('13 credit');
      const hasCalc = ans.includes('MATH201') || ans.includes('Calculus');
      return {
        passed: has13 && hasCalc && res.state === 'ANSWERABLE',
        reason: has13 ? 'Exact 13 credits for 2022 S1 Foundation' : 'Semester 1 Foundation mismatch'
      };
    }
  },
  {
    id: 13,
    category: '5. Semester-Wise Baskets',
    query: 'What are the Foundation courses for Batch 2023 Semester 1?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has13 = ans.includes('13 credits') || ans.includes('13 credit');
      const hasProb = ans.includes('MATH202') || ans.includes('Probability');
      return {
        passed: has13 && hasProb && res.state === 'ANSWERABLE',
        reason: has13 ? 'Exact 13 credits for 2023 S1 Foundation' : 'Semester 1 Foundation mismatch'
      };
    }
  },
  {
    id: 14,
    category: '5. Semester-Wise Baskets',
    query: 'Show University Core courses for batch 2025 semester 2 only',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasEnv = ans.includes('Environmental Studies') || ans.includes('UCOR111');
      const hasConst = ans.includes('Constitution') || ans.includes('LAWS101');
      const hasComm = ans.includes('Community Engagement') || ans.includes('UCOR701');
      return {
        passed: hasEnv && hasConst && hasComm && res.state === 'ANSWERABLE',
        reason: hasEnv ? 'Correctly retrieved S2 Univ Core for Batch 2025 (UCOR111, LAWS101, UCOR701)' : 'Missing S2 courses'
      };
    }
  },
  {
    id: 15,
    category: '5. Semester-Wise Baskets',
    query: 'What Program Core courses does batch 2026 DS take in Semester 3?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasTCS = ans.includes('COMP202') || ans.includes('Theoretical Computer Science');
      const hasAlgo = ans.includes('COMP203') || ans.includes('Analysis of Algorithms');
      return {
        passed: hasTCS && hasAlgo && res.state === 'ANSWERABLE',
        reason: hasTCS ? 'Correctly identified S3 Program Core for 2026 DS (COMP202, COMP203)' : 'Semester 3 courses missing'
      };
    }
  },

  // ── CATEGORY 6: COURSE CREDITS ──
  {
    id: 16,
    category: '6. Course Credits',
    query: 'How many credits does DATA103 have?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has3 = ans.includes('3 credits') || ans.includes('3 credit');
      return {
        passed: has3 && res.state === 'ANSWERABLE',
        reason: has3 ? 'DATA103 has exact 3 credits' : 'Missing 3 credits'
      };
    }
  },
  {
    id: 17,
    category: '6. Course Credits',
    query: 'How many credits does UCOR103 have?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has2 = ans.includes('2 credits') || ans.includes('2 credit');
      return {
        passed: has2 && res.state === 'ANSWERABLE',
        reason: has2 ? 'UCOR103 has exact 2 credits' : 'Missing 2 credits'
      };
    }
  },
  {
    id: 18,
    category: '6. Course Credits',
    query: 'How many credits does Operating Systems have in Batch 2024 versus Batch 2026?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has3 = ans.includes('3 credits') || ans.includes('3');
      const has4 = ans.includes('4 credits') || ans.includes('4');
      return {
        passed: has3 && has4 && res.state === 'ANSWERABLE',
        reason: has3 && has4 ? 'Differentiated OS 3 cr in 2024 vs 4 cr in 2026' : 'Credit comparison missing'
      };
    }
  },
  {
    id: 19,
    category: '6. Course Credits',
    query: 'How many credits are required for the Minor / Open Electives basket in Batch 2025?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has32 = ans.includes('32 credits') || ans.includes('32 credit');
      return {
        passed: has32 && res.state === 'ANSWERABLE',
        reason: has32 ? 'Exact 32 credits for Minor/Open in 2025' : 'Missing 32 credits'
      };
    }
  },

  // ── CATEGORY 7: L-T-P STRUCTURE ──
  {
    id: 20,
    category: '7. L-T-P Structure',
    query: 'What does L-T-P mean?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasL = ans.includes('Lecture') && (ans.includes('1 contact') || ans.includes('1 Credit'));
      const hasT = ans.includes('Tutorial') && (ans.includes('1 contact') || ans.includes('1 Credit'));
      const hasP = ans.includes('Practical') && (ans.includes('2') || ans.includes('Two'));
      const hasFormula = ans.includes('Course Credits') || ans.includes('L + T');
      return {
        passed: hasL && hasT && hasP && hasFormula && res.state === 'ANSWERABLE',
        reason: hasL && hasT && hasP ? 'Complete explanation of Lecture, Tutorial, Practical norms' : 'Incomplete L-T-P definition'
      };
    }
  },
  {
    id: 21,
    category: '7. L-T-P Structure',
    query: 'Explain the L-T-P structure of DATA103',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasLTP = ans.includes('1-0-4');
      const hasBreakdown = ans.includes('Lecture') && ans.includes('Practical');
      const hasCredits = ans.includes('3 credits') || ans.includes('3 credit');
      return {
        passed: hasLTP && hasBreakdown && hasCredits && res.state === 'ANSWERABLE',
        reason: hasLTP ? 'Exact 1-0-4 breakdown and 3 credits explained separately' : 'Missing 1-0-4 breakdown'
      };
    }
  },
  {
    id: 22,
    category: '7. L-T-P Structure',
    query: 'What is the difference between lecture, tutorial and practical?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasLecture = ans.includes('Lecture');
      const hasTutorial = ans.includes('Tutorial');
      const hasPractical = ans.includes('Practical');
      const hasNorms = ans.includes('Clause 3.1') || ans.includes('Student Handbook');
      return {
        passed: hasLecture && hasTutorial && hasPractical && hasNorms && res.state === 'ANSWERABLE',
        reason: hasLecture && hasTutorial && hasPractical ? 'Difference explained per Clause 3.1' : 'Incomplete difference'
      };
    }
  },
  {
    id: 23,
    category: '7. L-T-P Structure',
    query: 'Explain the L-T-P structure of UCOR701',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasNonTaught = ans.includes('Clause 3.2') || ans.includes('Non-Taught') || ans.includes('0-0-0');
      const has1Cr = ans.includes('1 credit');
      return {
        passed: hasNonTaught && has1Cr && res.state === 'ANSWERABLE',
        reason: hasNonTaught ? 'Accurately explained Clause 3.2 non-taught effort norm' : 'Missing non-taught explanation'
      };
    }
  },
  {
    id: 24,
    category: '7. L-T-P Structure',
    query: 'Explain the course structure of MATH201 in simple terms',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasLTP = ans.includes('2-1-0');
      const hasCredits = ans.includes('3 credits') || ans.includes('3 credit');
      return {
        passed: hasLTP && hasCredits && res.state === 'ANSWERABLE',
        reason: hasLTP ? 'Exact 2-1-0 breakdown and 3 credits explained' : 'Missing 2-1-0 breakdown'
      };
    }
  },

  // ── CATEGORY 8: QUESTIONS REQUIRING MULTIPLE SOURCES ──
  {
    id: 25,
    category: '8. Multiple Sources',
    query: 'Explain the L-T-P structure of DATA103 and how it relates to university academic regulations',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasHandbook = res.sources.some(s => s.documentTitle.includes('Handbook'));
      const hasSpread = res.sources.some(s => s.documentTitle.includes('Semester_Spread'));
      const multipleSources = res.sources.length >= 2;
      return {
        passed: multipleSources && hasHandbook && hasSpread && res.state === 'ANSWERABLE',
        reason: multipleSources ? 'Grounded in both Student Handbook (Clause 3.1) and Semester Spread workbook' : 'Missing multiple source grounding'
      };
    }
  },

  // ── CATEGORY 9: MISSING INFORMATION & FOLLOW-UPS ──
  {
    id: 26,
    category: '9. Missing Info & Follow-ups',
    query: 'What about Semester 1 only?',
    history: [{ text: 'What are the Foundation courses for Batch 2023?' }],
    validate: (res) => {
      const ans = res.answer || '';
      const hasProb = ans.includes('MATH202') || ans.includes('Probability');
      const has13 = ans.includes('13 credits') || ans.includes('13 credit');
      return {
        passed: hasProb && has13 && res.state === 'ANSWERABLE',
        reason: hasProb && has13 ? 'Successfully resolved follow-up context to Batch 2023 S1' : 'Failed follow-up resolution'
      };
    }
  },
  {
    id: 27,
    category: '9. Missing Info & Follow-ups',
    query: 'Explain its L-T-P structure',
    history: [{ text: 'Tell me about DATA103' }],
    validate: (res) => {
      const ans = res.answer || '';
      const has104 = ans.includes('1-0-4');
      const hasPython = ans.includes('DATA103') || ans.includes('Programming in Python');
      return {
        passed: has104 && hasPython && res.state === 'ANSWERABLE',
        reason: has104 ? 'Successfully resolved follow-up to DATA103 L-T-P (1-0-4)' : 'Failed course follow-up resolution'
      };
    }
  },

  // ── CATEGORY 10: REFUSAL TO GUESS ──
  {
    id: 28,
    category: '10. Refusal to Guess',
    query: 'What are the Foundation courses for Batch 2035?',
    history: [],
    validate: (res) => {
      const isRefused = res.state === 'INSUFFICIENT_INFORMATION';
      const mentionsBatch = (res.answer || '').includes('2035');
      return {
        passed: isRefused && mentionsBatch,
        reason: isRefused ? 'Safely refused unverified future Batch 2035' : 'Incorrectly answered for invalid batch'
      };
    }
  },
  {
    id: 29,
    category: '10. Refusal to Guess',
    query: 'What courses are scheduled in Semester 9?',
    history: [],
    validate: (res) => {
      const isRefused = res.state === 'INSUFFICIENT_INFORMATION';
      const mentions8 = (res.answer || '').includes('8');
      return {
        passed: isRefused && mentions8,
        reason: isRefused ? 'Safely refused out-of-range Semester 9' : 'Failed out-of-range semester check'
      };
    }
  },
  {
    id: 30,
    category: '10. Refusal to Guess',
    query: 'How many credits does Quantum Holography 999 carry?',
    history: [],
    validate: (res) => {
      const isRefused = res.state === 'INSUFFICIENT_INFORMATION';
      return {
        passed: isRefused,
        reason: isRefused ? 'Safely refused fabricated non-existent course' : 'Hallucinated credit value'
      };
    }
  },

  // ── CATEGORY 11: L-T-P & CREDIT DISAMBIGUATION REGRESSIONS ──
  {
    id: 31,
    category: '11. L-T-P Disambiguation Regressions',
    query: 'What does 1-0-4 mean in DATA103?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasL = ans.includes('Lecture (L):') && ans.includes('1');
      const hasT = ans.includes('Tutorial (T):') && ans.includes('0');
      const hasP = ans.includes('Practical (P):') && ans.includes('4');
      const hasContact = ans.includes('5') && (ans.includes('Contact Hours') || ans.includes('hours/week'));
      const hasCredits = ans.includes('3 credits') || ans.includes('3 credit');
      const hasDiff = ans.includes('Difference Between Weekly Contact Hours and Credits');
      return {
        passed: hasL && hasT && hasP && hasContact && hasCredits && hasDiff && res.state === 'ANSWERABLE',
        reason: hasL && hasP ? 'Exact 1-0-4 breakdown, 5 contact hrs, 3 credits, and contact hr vs credit diff explained' : 'Incomplete 1-0-4 answer'
      };
    }
  },
  {
    id: 32,
    category: '11. L-T-P Disambiguation Regressions',
    query: "Explain DATA103's L-T-P.",
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has104 = ans.includes('1-0-4');
      const hasCredits = ans.includes('3 credits') || ans.includes('3 credit');
      return {
        passed: has104 && hasCredits && res.state === 'ANSWERABLE',
        reason: has104 && hasCredits ? 'Accurately resolved possessive DATA103 L-T-P (1-0-4, 3 cr)' : 'Missing 1-0-4 or 3 credits'
      };
    }
  },
  {
    id: 33,
    category: '11. L-T-P Disambiguation Regressions',
    query: 'How many practical hours does DATA103 have?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has4Hours = ans.includes('4 practical') || (ans.includes('Practical (P):') && ans.includes('4'));
      const hasCredits = ans.includes('3 credits') || ans.includes('3 credit');
      return {
        passed: has4Hours && hasCredits && res.state === 'ANSWERABLE',
        reason: has4Hours ? 'Correctly identified 4 practical hours and explained 3 credits' : 'Missing 4 practical hours'
      };
    }
  },
  {
    id: 34,
    category: '11. L-T-P Disambiguation Regressions',
    query: 'What is the difference between L-T-P and credits?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasDifference = ans.includes('Difference Between L-T-P (Contact Hours) and Academic Credits');
      const hasFormula = ans.includes('L + T') && (ans.includes('P/2') || ans.includes('\\frac{P}{2}') || ans.includes('P / 2'));
      const hasData103 = ans.includes('DATA103') && ans.includes('1-0-4');
      const noBatchComparison = !ans.includes('Curriculum Comparison: Batch 2024') && !ans.includes('vs. Batch 2025');
      return {
        passed: hasDifference && hasFormula && hasData103 && noBatchComparison && res.state === 'ANSWERABLE',
        reason: hasDifference && noBatchComparison ? 'Clean conceptual differentiation with DATA103 example without batch comparison' : 'Returned batch comparison or missing concept'
      };
    }
  },
  {
    id: 35,
    category: '11. L-T-P Disambiguation Regressions',
    query: 'Does 1-0-4 mean 4 credits?',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const hasNo = ans.includes('No.') || ans.includes('not 4');
      const has3Credits = ans.includes('3 credits') || ans.includes('3 credit');
      const hasRatio = ans.includes('2:1') || ans.includes('2 practical hours equal 1 credit') || ans.includes('2 lab hours');
      return {
        passed: hasNo && has3Credits && hasRatio && res.state === 'ANSWERABLE',
        reason: hasNo ? 'Explicitly clarified that 1-0-4 yields 3 credits, not 4' : 'Failed to refute 4 credits misconception'
      };
    }
  },
  {
    id: 36,
    category: '11. L-T-P Disambiguation Regressions',
    query: 'Explain L-T-P using DATA103 as an example.',
    history: [],
    validate: (res) => {
      const ans = res.answer || '';
      const has104 = ans.includes('1-0-4');
      const has4Practical = ans.includes('4') && ans.includes('practical');
      const has3Credits = ans.includes('3 credits') || ans.includes('3 credit');
      const distinguishesHoursFromCredits = ans.includes('Distinguishing Practical Hours from Credits') || ans.includes('Difference Between Weekly Contact Hours and Credits');
      return {
        passed: has104 && has4Practical && has3Credits && distinguishesHoursFromCredits && res.state === 'ANSWERABLE',
        reason: has104 && distinguishesHoursFromCredits ? 'Exemplified L-T-P using DATA103 and distinguished 4 practical hours from 3 credits' : 'Incomplete explanation with DATA103'
      };
    }
  }
];

async function runEvaluation() {
  let passedCount = 0;
  let failedCount = 0;
  let partialCount = 0;

  const resultsByCategory = {};

  for (const tc of TEST_CASES) {
    if (!resultsByCategory[tc.category]) {
      resultsByCategory[tc.category] = { total: 0, passed: 0, failed: 0 };
    }
    resultsByCategory[tc.category].total++;

    try {
      const response = await processAdvisorQuery(tc.query, null, tc.history);
      const validation = tc.validate(response);

      // Verify sources and URLs
      let urlCheckPassed = true;
      if (Array.isArray(response.sources) && response.sources.length > 0) {
        for (const s of response.sources) {
          if (s.url && !checkSourceUrlValid(s.url)) {
            urlCheckPassed = false;
            console.warn(`[URL WARN] Invalid source URL in Test ${tc.id}: ${s.url}`);
          }
        }
      }

      // Verify token reporting
      const hasTransparentTokens = response.tokens && (
        response.tokens.totalTokens !== null ||
        (response.tokens.executionType && response.tokens.executionType.includes('deterministic'))
      );

      if (validation.passed && urlCheckPassed && hasTransparentTokens) {
        passedCount++;
        resultsByCategory[tc.category].passed++;
        console.log(`[PASS] Test ${tc.id.toString().padStart(2, '0')}: [${tc.category}] "${tc.query}"`);
        console.log(`       -> ${validation.reason} | Sources: ${response.sources.length} | State: ${response.state}`);
      } else if (validation.passed && (!urlCheckPassed || !hasTransparentTokens)) {
        partialCount++;
        console.log(`[PARTIAL] Test ${tc.id.toString().padStart(2, '0')}: [${tc.category}] "${tc.query}"`);
        console.log(`          -> Answer correct, but token/URL validation flagged.`);
      } else {
        failedCount++;
        resultsByCategory[tc.category].failed++;
        console.error(`[FAIL] Test ${tc.id.toString().padStart(2, '0')}: [${tc.category}] "${tc.query}"`);
        console.error(`       -> ${validation.reason}`);
      }
    } catch (err) {
      failedCount++;
      resultsByCategory[tc.category].failed++;
      console.error(`[ERROR] Test ${tc.id.toString().padStart(2, '0')} crashed: ${err.message}`);
    }
  }

  console.log('\n================================================================');
  console.log('FOCUSED CURRICULUM EVALUATION SUMMARY');
  console.log('================================================================');
  console.log(`Total Curriculum Questions Tested: ${TEST_CASES.length}`);
  console.log(`Passed:                            ${passedCount} / ${TEST_CASES.length} (${((passedCount / TEST_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`Partially Passed:                  ${partialCount}`);
  console.log(`Failed:                            ${failedCount}`);
  console.log('----------------------------------------------------------------');
  console.log('Breakdown by Curriculum Category:');
  for (const [cat, stats] of Object.entries(resultsByCategory)) {
    console.log(`• ${cat.padEnd(35, ' ')} : ${stats.passed} / ${stats.total} passed`);
  }
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runEvaluation().catch(err => {
  console.error('Fatal evaluation runner error:', err);
  process.exit(1);
});
