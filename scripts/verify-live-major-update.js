/**
 * Live Production Verification Suite for Major Update:
 * 6 Secure Student Profiles, University Synthetic IDs (2022UG00001), Scrypt Auth,
 * Personalised RAG, Dashboard, Special Scenarios (Medical, Low Attendance, Backlog)
 * Target: https://vu-academic-advisor-ecru.vercel.app
 */

'use strict';

const LIVE_URL = 'https://vu-academic-advisor-ecru.vercel.app';

const PRIMARY_ACCOUNTS = [
  { id: '2022UG00001', name: 'Aarav Sharma', batch: '2022', sem: 5, minor: 'Finance', pass: 'Student1@2022', legacyId: 'VU-BTECH-2201', aliasPass: 'Aarav@VU2022' },
  { id: '2022UG00002', name: 'Bhavya Patel', batch: '2022', sem: 7, minor: 'Psychology', pass: 'Student2@2022', legacyId: 'VU-BTECH-2202', aliasPass: 'Bhavya@VU2022' },
  { id: '2023UG00001', name: 'Chirag Verma', batch: '2023', sem: 5, minor: 'Design', pass: 'Student3@2023', legacyId: 'VU-BTECH-2303', aliasPass: 'Chirag@VU2023' },
  { id: '2024UG00001', name: 'Divya Nair', batch: '2024', sem: 4, minor: 'Marketing', pass: 'Student4@2024', legacyId: 'VU-BTECH-2404', aliasPass: 'Divya@VU2024' },
  { id: '2025UG00001', name: 'Eshaan Kulkarni', batch: '2025', sem: 3, minor: 'Economics', pass: 'Student5@2025', legacyId: 'VU-BTECH-2505', aliasPass: 'Eshaan@VU2025' },
  { id: '2026UG00001', name: 'Farhan Ahmed', batch: '2026', sem: 1, minor: 'Psychology', pass: 'Student6@2026', legacyId: 'VU-BTECH-2606', aliasPass: 'Farhan@VU2026' }
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
    body: JSON.stringify({ studentId: '2022UG00001', password: 'WrongPassword@123' })
  });
  verify(badLogin.status === 401, 'Invalid credentials rejected (HTTP 401)');

  // 3. Live Login for All 6 Students with University Synthetic IDs
  console.log('\n--- 3. LIVE LOGIN FOR ALL 6 STUDENTS (SYNTHETIC IDs) ---');
  const liveTokens = {};
  for (const acc of PRIMARY_ACCOUNTS) {
    const res = await fetchLive('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: acc.id, password: acc.pass })
    });
    verify(res.status === 200 && res.json?.status === 'success' && res.json?.token,
      `Live Login (Synthetic ID): ${acc.id} (${acc.name})`,
      `Got ${res.status}: ${JSON.stringify(res.json)}`
    );
    if (res.json?.token) {
      liveTokens[acc.id] = res.json.token;
    }
  }

  // 3.1 Legacy alias login verification (using official password)
  for (const acc of PRIMARY_ACCOUNTS) {
    const res = await fetchLive('/api/student/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: acc.legacyId, password: acc.pass })
    });
    verify(res.status === 200 && res.json?.status === 'success',
      `Live Legacy Alias Login: ${acc.legacyId}`
    );
  }

  // 3.2 Verify retired legacy alternative passwords are rejected
  const retiredRes = await fetchLive('/api/student/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: '2022UG00001', password: 'Aarav@VU2022' })
  });
  verify(retiredRes.status === 401, 'Live Retired legacy alternative passwords rejected (HTTP 401)');

  // 4. Live Dashboard Verification
  console.log('\n--- 4. LIVE DASHBOARD FOR ALL 6 STUDENTS ---');
  for (const acc of PRIMARY_ACCOUNTS) {
    const token = liveTokens[acc.id];
    if (!token) continue;

    const dash = await fetchLive('/api/student/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const sInfo = dash.json?.dashboard?.studentOverview || dash.json?.dashboard?.studentInfo;
    verify(dash.status === 200 && sInfo?.name === acc.name && sInfo?.minor === acc.minor,
      `Live Dashboard: ${acc.name} (${acc.id}) — Minor: ${acc.minor}`
    );
  }

  // 5. Special Academic Scenarios on Production
  console.log('\n--- 5. LIVE SPECIAL ACADEMIC SCENARIOS ---');

  // Scenario A: Medical Leave (Aarav, 2022UG00001)
  const tokenA = liveTokens['2022UG00001'];
  if (tokenA) {
    const qMed = await fetchLive('/api/advisory', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'How many medical leave days do I have?' })
    });
    const ansMed = qMed.json?.answer || '';
    verify(ansMed.includes('13') && ansMed.includes('Approved'),
      'Live Scenario A: Aarav Sharma has approved 13 calendar days medical leave'
    );
  }

  // Scenario B: Low Attendance in COMP209 (Divya, 2024UG00001)
  const tokenD = liveTokens['2024UG00001'];
  if (tokenD) {
    const qAtt = await fetchLive('/api/advisory', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenD}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Which course has my lowest attendance?' })
    });
    const ansAtt = qAtt.json?.answer || '';
    verify(ansAtt.includes('COMP209') && ansAtt.includes('68') && ansAtt.includes('7'),
      'Live Scenario B: Divya COMP209 identified at 68% needing 7 consecutive classes'
    );
  }

  // Scenario C: Backlog in COMP204 (Bhavya, 2022UG00002)
  const tokenB = liveTokens['2022UG00002'];
  if (tokenB) {
    const qBack = await fetchLive('/api/advisory', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Which subjects do I have a backlog in?' })
    });
    const ansBack = qBack.json?.answer || '';
    verify(ansBack.includes('COMP204') && ansBack.includes('12.1'),
      'Live Scenario C: Bhavya COMP204 backlog identified with Clause 12.1 graduation rule'
    );
  }

  // 6. General Curriculum & Security Previews
  console.log('\n--- 6. GENERAL CURRICULUM & SECURITY PREVIEWS ---');
  const prevSpread = await fetchLive('/api/document-preview?doc=Semester_Spread_Structures_Sept_2026.xlsx');
  verify(prevSpread.status === 200 && prevSpread.json?.type === 'workbook', 'Live Semester Spread preview works');

  const prevMinor = await fetchLive('/api/document-preview?doc=118351_Minor%20Courses%20for%20BTech_Students.xlsx');
  verify(prevMinor.status === 200 && prevMinor.json?.type === 'workbook', 'Live Minor Courses preview works');

  const prevInternal = await fetchLive('/api/document-preview?doc=all%20the%20info%20for%20gai%20assignment.pdf');
  verify(prevInternal.status === 403, 'Live Internal Assignment PDF is strictly blocked (HTTP 403)');

  console.log('\n================================================================');
  console.log(`LIVE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal live runner error:', err);
  process.exit(1);
});
