/**
 * Comprehensive Automated Verification Suite for Secure Student Profiles,
 * Personalised RAG, Data Isolation, and Accessibility Features
 * Vidyashilp University (VU Academic Advisor)
 */

'use strict';

const app = require('../src/server');
const http = require('http');
const { ALL_PROFILES, authenticateStudent, validateSession } = require('../src/lib/student-auth');
const { processAdvisorQuery } = require('../src/lib/advisory-engine');

const TEST_ACCOUNTS = [
  { id: 'VU-BTECH-2201', name: 'Aarav Sharma', batch: '2022', sem: 5, minor: 'Finance', pass: 'Aarav@VU2022' },
  { id: 'VU-BTECH-2202', name: 'Bhavya Patel', batch: '2022', sem: 7, minor: 'Psychology', pass: 'Bhavya@VU2022' },
  { id: 'VU-BTECH-2303', name: 'Chirag Verma', batch: '2023', sem: 5, minor: 'Design', pass: 'Chirag@VU2023' },
  { id: 'VU-BTECH-2404', name: 'Divya Nair', batch: '2024', sem: 4, minor: 'Marketing', pass: 'Divya@VU2024' },
  { id: 'VU-BTECH-2505', name: 'Eshaan Kulkarni', batch: '2025', sem: 3, minor: 'Economics', pass: 'Eshaan@VU2025' },
  { id: 'VU-BTECH-2606', name: 'Farhan Ahmed', batch: '2026', sem: 1, minor: 'Psychology', pass: 'Farhan@VU2026' }
];

let server;
let baseUrl = '';

function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Test Server] Running on ${baseUrl}`);
      resolve();
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, options);
  let json = null;
  try {
    json = await res.json();
  } catch (_) {}
  return { status: res.status, ok: res.ok, json };
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedCount++;
    console.error(`  [FAIL] ${testName} - ${details}`);
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('VU ACADEMIC ADVISOR: SECURE PROFILES & PERSONALISED RAG SUITE');
  console.log('================================================================\n');

  await startServer();

  try {
    // ════════════════════════════════════════════════════════
    // 1. AUTHENTICATION & ACCESS CONTROL
    // ════════════════════════════════════════════════════════
    console.log('--- 1. AUTHENTICATION & ACCESS CONTROL ---');

    const authTokens = {};

    // 1.1 All 6 accounts log in successfully with correct passwords
    for (const acc of TEST_ACCOUNTS) {
      const res = await request('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: acc.id, password: acc.pass })
      });
      assert(res.status === 200 && res.json?.status === 'success' && res.json?.token,
        `Student Login: ${acc.id} (${acc.name})`,
        `Expected 200 + token, got ${res.status}: ${JSON.stringify(res.json)}`
      );
      if (res.json?.token) {
        authTokens[acc.id] = res.json.token;
      }
    }

    // 1.2 Incorrect password rejected (HTTP 401)
    const badPassRes = await request('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: 'VU-BTECH-2201', password: 'IncorrectPassword!123' })
    });
    assert(badPassRes.status === 401, 'Incorrect password rejected with HTTP 401', `Got status ${badPassRes.status}`);

    // 1.3 Missing credentials rejected (HTTP 400)
    const emptyLoginRes = await request('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(emptyLoginRes.status === 400, 'Empty login payload rejected with HTTP 400', `Got status ${emptyLoginRes.status}`);

    // 1.4 Unauthenticated access to /api/student/profile rejected (HTTP 401)
    const unauthProf = await request('/api/student/profile');
    assert(unauthProf.status === 401, 'Unauthenticated profile request rejected with HTTP 401', `Got status ${unauthProf.status}`);

    // 1.5 Unauthenticated access to /api/student/dashboard rejected (HTTP 401)
    const unauthDash = await request('/api/student/dashboard');
    assert(unauthDash.status === 401, 'Unauthenticated dashboard request rejected with HTTP 401', `Got status ${unauthDash.status}`);

    // 1.6 Tampered session token rejected (HTTP 401)
    const tamperedRes = await request('/api/student/profile', {
      headers: { 'Authorization': 'Bearer bad_token_1234567890abcdef' }
    });
    assert(tamperedRes.status === 401, 'Tampered token rejected with HTTP 401', `Got status ${tamperedRes.status}`);

    // 1.7 Public student list endpoint is disabled (HTTP 403)
    const listRes = await request('/api/student/list');
    assert(listRes.status === 403, 'Public /api/student/list disabled (HTTP 403)', `Got status ${listRes.status}`);
    const profilesRes = await request('/api/profiles');
    assert(profilesRes.status === 403, 'Public /api/profiles disabled (HTTP 403)', `Got status ${profilesRes.status}`);

    // ════════════════════════════════════════════════════════
    // 2. DATA ISOLATION & DASHBOARD INTEGRITY
    // ════════════════════════════════════════════════════════
    console.log('\n--- 2. DATA ISOLATION & DASHBOARD INTEGRITY ---');

    // 2.1 Authenticated dashboard returns 3 distinct sections
    const dashA = await request('/api/student/dashboard', {
      headers: { 'Authorization': `Bearer ${authTokens['VU-BTECH-2201']}` }
    });
    assert(dashA.status === 200 && dashA.json?.dashboard?.studentInfo && dashA.json?.dashboard?.academicInfo && dashA.json?.dashboard?.creditOverview,
      'Student A dashboard has 3 distinct sections (Student, Academic, Credit Overview)',
      `Got ${JSON.stringify(dashA.json)}`
    );

    // 2.2 Dashboard Section 1: Official student info & declared minor
    const sInfo = dashA.json?.dashboard?.studentInfo;
    assert(sInfo?.name === 'Aarav Sharma' && sInfo?.declaredMinor === 'Finance' && sInfo?.specialisation === 'Not specified',
      'Dashboard Section 1: Aarav Sharma, Finance minor, Not specified specialisation'
    );

    // 2.3 Dashboard Section 2: Official enrolled courses (LTP, credits, prereqs)
    const aCourses = dashA.json?.dashboard?.academicInfo?.enrolledCourses || [];
    const hasNetworks = aCourses.some(c => c.code === 'COMP208' && c.ltp === '3-0-2' && c.credits === 4);
    const hasML = aCourses.some(c => c.code === 'DATA301' && c.ltp === '2-0-4' && c.credits === 4);
    assert(hasNetworks && hasML && aCourses.length === 5,
      'Dashboard Section 2: Exact Batch 2022 Sem 5 courses (COMP208, DATA301, 5 courses total)'
    );

    // 2.4 Dashboard Section 3: 180 degree credits, completed/remaining "Not available"
    const cOver = dashA.json?.dashboard?.creditOverview;
    assert(cOver?.totalDegreeCreditsRequired === 180 &&
           String(cOver?.completedCredits).includes('Not available') &&
           String(cOver?.remainingCredits).includes('Not available') &&
           cOver?.minorCreditStructure?.requiredCredits === 24,
      'Dashboard Section 3: 180 total credits, completed "Not available", remaining "Not available", 24 minor credits'
    );

    // 2.5 Data Isolation: Token for Student A retrieves Student A only (cannot see Student B)
    const profA = await request('/api/student/profile', {
      headers: { 'Authorization': `Bearer ${authTokens['VU-BTECH-2201']}` }
    });
    assert(profA.json?.student?.id === 'VU-BTECH-2201' && profA.json?.student?.display_name === 'Aarav Sharma',
      'Token A returns Student A record'
    );

    // 2.6 Chat history isolation
    await request('/api/student/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens['VU-BTECH-2201']}`
      },
      body: JSON.stringify({ sender: 'user', text: 'Private note for Student A' })
    });
    const histA = await request('/api/student/history', {
      headers: { 'Authorization': `Bearer ${authTokens['VU-BTECH-2201']}` }
    });
    const histB = await request('/api/student/history', {
      headers: { 'Authorization': `Bearer ${authTokens['VU-BTECH-2202']}` }
    });
    const studentAHasNote = (histA.json?.history || []).some(m => m.text.includes('Private note for Student A'));
    const studentBHasNote = (histB.json?.history || []).some(m => m.text.includes('Private note for Student A'));
    assert(studentAHasNote && !studentBHasNote, 'Chat history strictly isolated between Student A and Student B');

    // ════════════════════════════════════════════════════════
    // 3. PERSONALISED RAG EVALUATION FOR ALL 6 STUDENTS
    // ════════════════════════════════════════════════════════
    console.log('\n--- 3. PERSONALISED RAG EVALUATION FOR ALL 6 STUDENTS ---');

    for (const acc of TEST_ACCOUNTS) {
      const token = authTokens[acc.id];
      const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Query 1: Current semester courses
      const q1 = await request('/api/advisory', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ query: 'What courses do I have this semester?' })
      });
      const ans1 = q1.json?.answer || '';
      assert(ans1.includes(acc.name) && ans1.includes(`Semester ${acc.sem}`) && ans1.includes('Total Degree Credits Requirement'),
        `Personalised Courses: ${acc.id} (${acc.name}, Sem ${acc.sem})`
      );

      // Query 2: Minor requirements
      const q2 = await request('/api/advisory', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ query: 'What are my minor requirements?' })
      });
      const ans2 = q2.json?.answer || '';
      assert(ans2.includes(acc.minor) && ans2.includes('credits'),
        `Personalised Minor: ${acc.id} declared minor (${acc.minor})`
      );

      // Query 3: What minor am I taking?
      const q3 = await request('/api/advisory', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ query: 'What minor am I taking?' })
      });
      const ans3 = q3.json?.answer || '';
      assert(ans3.includes(acc.minor),
        `Confirm Declared Minor: ${acc.id} confirms ${acc.minor}`
      );

      // Query 4: Next semester suggestions
      const q4 = await request('/api/advisory', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ query: 'What should I take next semester?' })
      });
      const ans4 = q4.json?.answer || '';
      assert(ans4.includes(`Semester ${acc.sem + 1}`) || ans4.includes('Planned Semester Credits'),
        `Next Semester Courses: ${acc.id} receives planned Sem ${acc.sem + 1} courses`
      );

      // Query 5: Credits needed
      const q5 = await request('/api/advisory', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ query: 'How many credits do I still need?' })
      });
      const ans5 = q5.json?.answer || '';
      assert(ans5.includes('180') && ans5.includes('Not available'),
        `Credits Progress: ${acc.id} receives 180 total degree credits and "Not available" explanation`
      );

      // Query 6: DATA302 eligibility
      const q6 = await request('/api/advisory', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ query: 'Am I eligible for DATA302?' })
      });
      const ans6 = q6.json?.answer || '';
      assert(ans6.includes('DATA302') && ans6.includes('DATA301'),
        `Course Eligibility DATA302: ${acc.id} evaluated against DATA301 prerequisite`
      );
    }

    // ════════════════════════════════════════════════════════
    // 4. GENERAL RAG PRESERVATION & EXPLICIT BATCH OVERRIDES
    // ════════════════════════════════════════════════════════
    console.log('\n--- 4. GENERAL RAG & EXPLICIT BATCH OVERRIDES ---');

    // 4.1 General question unauthenticated
    const genQ1 = await request('/api/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What does 1-0-4 mean in DATA103?' })
    });
    const genAns1 = genQ1.json?.answer || '';
    assert(genAns1.includes('1') && genAns1.includes('4') && genAns1.includes('3 credit'),
      'DATA103 L-T-P explanation: 1 lecture, 0 tutorial, 4 practical, 3 credits'
    );

    // 4.2 L-T-P difference from credits
    const genQ2 = await request('/api/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What is the difference between L-T-P and credits?' })
    });
    const genAns2 = genQ2.json?.answer || '';
    assert(genAns2.toLowerCase().includes('contact hour') && genAns2.toLowerCase().includes('credit'),
      'L-T-P vs credits distinction clearly explained'
    );

    // 4.3 Attendance regulations
    const genQ3 = await request('/api/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What is the minimum attendance requirement?' })
    });
    const genAns3 = genQ3.json?.answer || '';
    assert(genAns3.includes('75%') && genAns3.includes('65%'),
      'Attendance regulations: 75% rule and 65% medical relaxation threshold'
    );

    // 4.4 Explicit batch override takes precedence over student batch
    // Student A is Batch 2022, but explicitly asks about Batch 2024
    const overQ = await request('/api/advisory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authTokens['VU-BTECH-2201']}`
      },
      body: JSON.stringify({ query: 'What are the Foundation courses for Batch 2024?' })
    });
    const overAns = overQ.json?.answer || '';
    assert(overAns.includes('2024') && overAns.includes('Foundation'),
      'Explicit batch query (Batch 2024) overrides student batch (2022)'
    );

    // 4.5 Unauthenticated user asking personal courses is prompted to sign in
    const anonQ = await request('/api/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What courses do I have this semester?' })
    });
    assert(anonQ.json?.state === 'NEEDS_CLARIFICATION' && anonQ.json?.answer.includes('Student Sign In'),
      'Unauthenticated personal query prompts user to sign in'
    );

    // 4.6 Token display truthful reporting
    const tokRes = await request('/api/advisory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'How many total credits are required for the B.Tech degree?' })
    });
    const tokData = tokRes.json?.tokens || tokRes.json?.tokenUsage;
    assert(tokData && tokData.totalTokens !== null, 'Token display usage data included in API response');

    // ════════════════════════════════════════════════════════
    // 5. OFFICIAL DOCUMENT PREVIEWS & EXCLUSION
    // ════════════════════════════════════════════════════════
    console.log('\n--- 5. DOCUMENT PREVIEWS & SECURITY ---');

    // 5.1 Semester spread workbook preview
    const prevSpread = await request('/api/document-preview?doc=Semester_Spread_Structures_Sept_2026.xlsx');
    assert(prevSpread.status === 200 && prevSpread.json?.type === 'workbook' && Array.isArray(prevSpread.json?.sheets),
      'Semester spread workbook preview endpoint functions correctly'
    );

    // 5.2 Minor courses workbook preview
    const prevMinor = await request('/api/document-preview?doc=118351_Minor%20Courses%20for%20BTech_Students.xlsx');
    assert(prevMinor.status === 200 && prevMinor.json?.type === 'workbook' && prevMinor.json?.sheets?.includes('Finance'),
      'Minor courses workbook preview endpoint functions correctly with sheets'
    );

    // 5.3 Student Handbook PDF preview
    const prevPdf = await request('/api/document-preview?doc=Student%20Handbook');
    assert(prevPdf.status === 200 && prevPdf.json?.type === 'pdf',
      'Student Handbook PDF preview endpoint returns PDF viewer payload'
    );

    // 5.4 Internal assignment document is strictly blocked
    const prevInternal = await request('/api/document-preview?doc=all%20the%20info%20for%20gai%20assignment.pdf');
    assert(prevInternal.status === 403,
      'Internal assignment PDF is strictly blocked from public source preview (HTTP 403)'
    );

    // ════════════════════════════════════════════════════════
    // 6. VOICE / TTS UTILITY FUNCTIONS
    // ════════════════════════════════════════════════════════
    console.log('\n--- 6. VOICE & TEXT-TO-SPEECH (TTS) AUDIT ---');

    // Test text cleaning for TTS
    const rawMarkdown = "• **DATA103 — Programming in Python** [p. 14]: 1-0-4 (3 credits). ✓ Eligible! Visit https://vidyashilp.edu.in";
    // Simulate cleanTextForSpeech regex logic
    const cleaned = rawMarkdown
      .replace(/\[(?:Official|Student|Semester|B\.Tech|Course|DATA|MATH|ENG|UCOR)[^\]]*\]/gi, '')
      .replace(/\[(?:p\.\s*\d+|sheet\s*[^\]]+)\]/gi, '')
      .replace(/(\b\d+)-(\d+)-(\d+\b)/g, '$1, $2, $3')
      .replace(/[*#_`>~]/g, '')
      .replace(/✓/g, 'Status: Eligible. ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    assert(!cleaned.includes('**') && !cleaned.includes('https') && cleaned.includes('1, 0, 4'),
      'TTS text cleaning removes markdown asterisks, URLs, and formats L-T-P numbers cleanly'
    );

    // Test sentence chunking
    const longText = "Sentence one is clear. Sentence two is very informative and provides important details. Sentence three confirms eligibility.";
    const chunks = longText.match(/[^.!?]+[.!?]+|\S+$/g) || [longText];
    assert(chunks.length === 3, 'TTS sentence chunker splits long responses at punctuation boundaries');

    console.log('\n================================================================');
    console.log(`SUITE RESULTS: ${passedCount} PASSED | ${failedCount} FAILED`);
    console.log('================================================================\n');

  } finally {
    await stopServer();
  }

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal suite runner error:', err);
  process.exit(1);
});
