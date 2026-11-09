/**
 * Live Production Verification Suite for Major Update:
 * 6 Secure Student Profiles, Scrypt Auth, Personalised RAG, Dashboard, Document Previews & TTS
 * Target: https://vu-academic-advisor-ecru.vercel.app
 */

'use strict';

const LIVE_URL = 'https://vu-academic-advisor-ecru.vercel.app';

const TEST_ACCOUNTS = [
  { id: 'VU-BTECH-2201', name: 'Aarav Sharma', batch: '2022', sem: 5, minor: 'Finance', pass: 'Aarav@VU2022' },
  { id: 'VU-BTECH-2202', name: 'Bhavya Patel', batch: '2022', sem: 7, minor: 'Psychology', pass: 'Bhavya@VU2022' },
  { id: 'VU-BTECH-2303', name: 'Chirag Verma', batch: '2023', sem: 5, minor: 'Design', pass: 'Chirag@VU2023' },
  { id: 'VU-BTECH-2404', name: 'Divya Nair', batch: '2024', sem: 4, minor: 'Marketing', pass: 'Divya@VU2024' },
  { id: 'VU-BTECH-2505', name: 'Eshaan Kulkarni', batch: '2025', sem: 3, minor: 'Economics', pass: 'Eshaan@VU2025' },
  { id: 'VU-BTECH-2606', name: 'Farhan Ahmed', batch: '2026', sem: 1, minor: 'Psychology', pass: 'Farhan@VU2026' }
];

async function fetchLive(endpoint, options = {}) {
  const url = `${LIVE_URL}${endpoint}`;
  const res = await fetch(url, options);
  let json = null;
  try {
    json = await res.json();
  } catch (_) {}
  return { status: res.status, ok: res.ok, json };
}

let passed = 0;
let failed = 0;

function verify(condition, name, info = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name} - ${info}`);
  }
}

async function run() {
  console.log('================================================================');
  console.log('LIVE PRODUCTION VERIFICATION: VU ACADEMIC ADVISOR');
  console.log(`URL: ${LIVE_URL}`);
  console.log('================================================================\n');

  // 1. Health & Build Verification
  console.log('--- 1. HEALTH & DEPLOYMENT INTEGRITY ---');
  const health = await fetchLive('/api/health');
  verify(health.status === 200 && health.json?.status === 'healthy', 'Live /api/health is healthy');

  // 2. Public Privacy Protection
  console.log('\n--- 2. PRIVACY & SECURITY DEFENSE ---');
  const listRes = await fetchLive('/api/student/list');
  verify(listRes.status === 403, 'Public /api/student/list is disabled (HTTP 403)');
  const profsRes = await fetchLive('/api/profiles');
  verify(profsRes.status === 403, 'Public /api/profiles is disabled (HTTP 403)');

  const unauthProf = await fetchLive('/api/student/profile');
  verify(unauthProf.status === 401, 'Unauthenticated /api/student/profile rejected (HTTP 401)');
  const unauthDash = await fetchLive('/api/student/dashboard');
  verify(unauthDash.status === 401, 'Unauthenticated /api/student/dashboard rejected (HTTP 401)');

  const badLogin = await fetchLive('/api/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: 'VU-BTECH-2201', password: 'WrongPassword@123' })
  });
  verify(badLogin.status === 401, 'Invalid password rejected with HTTP 401');

  // 3. Authenticate All 6 Accounts on Live Site
  console.log('\n--- 3. LIVE AUTHENTICATION FOR ALL 6 ACCOUNTS ---');
  const tokens = {};
  for (const acc of TEST_ACCOUNTS) {
    const res = await fetchLive('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: acc.id, password: acc.pass })
    });
    verify(res.status === 200 && res.json?.token && res.json?.student?.display_name === acc.name,
      `Live Login: ${acc.id} (${acc.name})`
    );
    if (res.json?.token) {
      tokens[acc.id] = res.json.token;
    }
  }

  // 4. Live Dashboard Verification
  console.log('\n--- 4. LIVE 3-SECTION STUDENT DASHBOARD ---');
  const dashA = await fetchLive('/api/student/dashboard', {
    headers: { 'Authorization': `Bearer ${tokens['VU-BTECH-2201']}` }
  });
  const d = dashA.json?.dashboard;
  verify(d?.studentInfo?.name === 'Aarav Sharma' && d?.studentInfo?.declaredMinor === 'Finance' && d?.studentInfo?.specialisation === 'Not specified',
    'Dashboard Section 1: Student info correct and specialisation "Not specified"'
  );
  verify(d?.academicInfo?.enrolledCourses?.length === 5 && d?.academicInfo?.enrolledCourses?.some(c => c.code === 'DATA301'),
    'Dashboard Section 2: 5 enrolled courses with DATA301 (Machine Learning)'
  );
  verify(d?.creditOverview?.totalDegreeCreditsRequired === 180 &&
         String(d?.creditOverview?.completedCredits).includes('Not available') &&
         String(d?.creditOverview?.remainingCredits).includes('Not available'),
    'Dashboard Section 3: 180 total degree credits, completed/remaining "Not available"'
  );

  // 5. Personalised RAG on Live Site
  console.log('\n--- 5. LIVE PERSONALISED RAG EVALUATION ---');
  for (const acc of TEST_ACCOUNTS) {
    const token = tokens[acc.id];
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // My courses
    const q1 = await fetchLive('/api/advisory', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query: 'What courses do I have this semester?' })
    });
    const ans1 = q1.json?.answer || '';
    verify(ans1.includes(acc.name) && ans1.includes(`Semester ${acc.sem}`),
      `Live Personalised Courses: ${acc.id} (${acc.name})`
    );

    // My minor
    const q2 = await fetchLive('/api/advisory', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query: 'What are my minor requirements?' })
    });
    const ans2 = q2.json?.answer || '';
    verify(ans2.includes(acc.minor),
      `Live Personalised Minor: ${acc.id} receives ${acc.minor} minor details`
    );

    // Next semester
    const q3 = await fetchLive('/api/advisory', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query: 'What should I take next semester?' })
    });
    const ans3 = q3.json?.answer || '';
    verify(ans3.includes(`Semester ${acc.sem + 1}`) || ans3.includes('Planned Semester Credits'),
      `Live Next Semester: ${acc.id} receives upcoming Semester ${acc.sem + 1} courses`
    );

    // Remaining credits
    const q4 = await fetchLive('/api/advisory', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query: 'How many credits do I still need?' })
    });
    const ans4 = q4.json?.answer || '';
    verify(ans4.includes('180') && ans4.includes('Not available'),
      `Live Credits Progress: ${acc.id} references 180 credits & "Not available"`
    );

    // Eligibility DATA302
    const q5 = await fetchLive('/api/advisory', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ query: 'Am I eligible for DATA302?' })
    });
    const ans5 = q5.json?.answer || '';
    verify(ans5.includes('DATA302') && ans5.includes('DATA301'),
      `Live DATA302 Eligibility: ${acc.id} evaluated against DATA301 prerequisite`
    );
  }

  // 6. Live General RAG & Previews
  console.log('\n--- 6. LIVE GENERAL RAG, DOCUMENT PREVIEWS & ACCESS CONTROL ---');
  const ltpRes = await fetchLive('/api/advisory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'What does 1-0-4 mean in DATA103?' })
  });
  verify((ltpRes.json?.answer || '').includes('1') && (ltpRes.json?.answer || '').includes('4') && (ltpRes.json?.answer || '').includes('3 credit'),
    'Live DATA103 L-T-P breakdown verified'
  );

  const prevSpread = await fetchLive('/api/document-preview?doc=Semester_Spread_Structures_Sept_2026.xlsx');
  verify(prevSpread.status === 200 && prevSpread.json?.type === 'workbook', 'Live Semester spread preview verified');

  const prevMinor = await fetchLive('/api/document-preview?doc=118351_Minor%20Courses%20for%20BTech_Students.xlsx');
  verify(prevMinor.status === 200 && prevMinor.json?.type === 'workbook', 'Live Minor courses preview verified');

  const prevBlocked = await fetchLive('/api/document-preview?doc=all%20the%20info%20for%20gai%20assignment.pdf');
  verify(prevBlocked.status === 403, 'Internal assignment PDF strictly blocked on live production (HTTP 403)');

  console.log('\n================================================================');
  console.log(`LIVE VERIFICATION RESULT: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal live runner error:', err);
  process.exit(1);
});
