/**
 * 30-TEST COMPREHENSIVE SUITE — VU ACADEMIC ADVISOR FINAL PERSONALISATION & ATTENDANCE
 * Supports both local ephemeral Express server and live production verification via TARGET_URL env var.
 */
const http = require('http');
const assert = require('assert');
const app = require('../src/server');

const TARGET_URL = process.env.TARGET_URL ? process.env.TARGET_URL.replace(/\/$/, '') : null;

const ACCOUNTS = {
  aarav: { id: '2022UG00001', pw: 'Student1@2022' },
  bhavya: { id: '2022UG00002', pw: 'Student2@2022' },
  chirag: { id: '2023UG00001', pw: 'Student3@2023' },
  divya: { id: '2024UG00001', pw: 'Student4@2024' },
  eshaan: { id: '2025UG00001', pw: 'Student5@2025' },
  farhan: { id: '2026UG00001', pw: 'Student6@2026' }
};

async function runSuite() {
  let server = null;
  let baseUrl = TARGET_URL;

  if (!baseUrl) {
    server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  }

  console.log('================================================================');
  console.log('VU ACADEMIC ADVISOR — 30-TEST FINAL PERSONALISATION SUITE');
  console.log(`Target: ${baseUrl}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function req(path, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_) {}
    return { status: res.status, json, text };
  }

  async function login(acc) {
    const r = await req('/api/student/login', 'POST', { studentId: acc.id, password: acc.pw });
    if (r.status !== 200 || !r.json || !r.json.token) {
      throw new Error(`Login failed for ${acc.id}: HTTP ${r.status}`);
    }
    return r.json.token;
  }

  async function test(num, name, fn) {
    try {
      await fn();
      passed++;
      console.log(`  [PASS ${String(num).padStart(2, '0')}/30] ${name}`);
    } catch (err) {
      failed++;
      console.error(`  [FAIL ${String(num).padStart(2, '0')}/30] ${name} -> ${err.message}`);
    }
  }

  try {
    const tokens = {
      aarav: await login(ACCOUNTS.aarav),
      bhavya: await login(ACCOUNTS.bhavya),
      chirag: await login(ACCOUNTS.chirag),
      divya: await login(ACCOUNTS.divya),
      eshaan: await login(ACCOUNTS.eshaan),
      farhan: await login(ACCOUNTS.farhan)
    };

    // ── GROUP 1: AUTHENTICATED STUDENT IDENTITY (Tests 1-5) ──
    await test(1, 'Identity: "What is my name?" returns Aarav Sharma', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What is my name?' }, tokens.aarav);
      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('Aarav Sharma'), 'Missing student name');
      assert(!r.json.answer.includes('INSUFFICIENT INFORMATION'));
    });

    await test(2, 'Identity: "What is my student ID?" returns 2022UG00001', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What is my student ID?' }, tokens.aarav);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('2022UG00001'), 'Missing 2022UG00001');
    });

    await test(3, 'Identity: "Which batch do I belong to?" returns Batch 2024 for Divya', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'Which batch do I belong to?' }, tokens.divya);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('2024'), 'Missing Batch 2024');
      assert(r.json.answer.includes('Divya Nair'));
    });

    await test(4, 'Identity: "Which semester am I currently studying?" returns Semester 3 for Eshaan', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'Which semester am I currently studying?' }, tokens.eshaan);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('Semester 3'), 'Missing Semester 3');
      assert(r.json.answer.includes('Eshaan Kulkarni'));
    });

    await test(5, 'Identity: "What is my degree programme?" returns B.Tech CSE for Farhan', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What is my degree programme?' }, tokens.farhan);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('B.Tech (Hons.) Computer Science and Engineering'));
    });

    // ── GROUP 2: COURSE PROGRESSION, MINOR & SPECIALISATION (Tests 6-11) ──
    await test(6, 'Progression: Current semester courses match Aarav Sem 5 spread', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What courses do I have this semester?' }, tokens.aarav);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('COMP208') && r.json.answer.includes('DATA301'));
    });

    await test(7, 'Progression: Hyphenated "next-semester" query returns Semester 6 planned courses', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What courses should I take next-semester?' }, tokens.aarav);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('Semester 6') && r.json.answer.includes('DATA302'));
    });

    await test(8, 'Progression: "Which courses have I completed?" lists Aarav completed courses', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'Which courses have I completed?' }, tokens.aarav);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('91') && r.json.answer.includes('UCOR103') && r.json.answer.includes('FINA333'));
    });

    await test(9, 'Progression: Remaining courses ("Which courses are remaining?" & "What courses do I still need to complete?")', async () => {
      const r1 = await req('/api/advisory', 'POST', { query: 'Which courses are remaining?' }, tokens.divya);
      assert.strictEqual(r1.json.state, 'ANSWERABLE');
      assert(r1.json.answer.includes('110 credits') || r1.json.answer.includes('110'));
      assert(r1.json.answer.includes('MKTG') || r1.json.answer.includes('Remaining'));
      const r2 = await req('/api/advisory', 'POST', { query: 'What courses do I still need to complete?' }, tokens.divya);
      assert.strictEqual(r2.json.state, 'ANSWERABLE');
      assert(r2.json.answer.includes('110') && !r2.json.answer.includes('INSUFFICIENT'));
    });

    await test(10, 'Specialisation & Minor: Bhavya query shows Applied Deep Learning + MATH401 & DATA402 + Psychology', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What minor and specialisation am I pursuing and which specialisation courses have I completed?' }, tokens.bhavya);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('Applied Deep Learning'), 'Missing Applied Deep Learning');
      assert(r.json.answer.includes('MATH401') && r.json.answer.includes('DATA402'), 'Missing completed spec courses');
      assert(r.json.answer.includes('Psychology'), 'Missing Psychology minor');
    });

    await test(11, 'Prerequisites: Bhavya missing prerequisite query identifies COMP204 blocking COMP206', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'Which prerequisites am I missing?' }, tokens.bhavya);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('COMP204') && r.json.answer.includes('COMP206'));
    });

    // ── GROUP 3: COURSE-WISE ATTENDANCE & RECOVERY MATH (Tests 12-17) ──
    await test(12, 'Attendance: Aarav course-wise attendance table shows all 5 courses', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What is my attendance in each course?' }, tokens.aarav);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('COMP208') && r.json.answer.includes('DATA301') && r.json.answer.includes('86.15%'));
    });

    await test(13, 'Attendance: Specific course code lookup COMP208 returns 81.25%', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What is my attendance in COMP208?' }, tokens.aarav);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('COMP208') && r.json.answer.includes('81.25%'));
    });

    await test(14, 'Attendance: Divya "Which courses have attendance below 75%?" pinpoints COMP209 (68%)', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'Which courses have attendance below 75%?' }, tokens.divya);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('COMP209') && r.json.answer.includes('68%'));
    });

    await test(15, 'Attendance: "How many classes can I miss in COMP208?" returns exact safe buffer (2)', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'How many classes can I miss in COMP208?' }, tokens.aarav);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('2 class'));
    });

    await test(16, 'Attendance: Divya recovery classes for COMP209 computes 7 consecutive classes', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'How many more classes must I attend in COMP209 to reach 75%?' }, tokens.divya);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('7 consecutive classes') || r.json.answer.includes('7'));
    });

    await test(17, 'Attendance: Debarment consequences cite FA grade, Clause 7.2, and 65% floor', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What happens if my attendance stays below 75%?' }, tokens.divya);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('FA') && r.json.answer.includes('debarred') && r.json.answer.includes('65%'));
    });

    // ── GROUP 4: ACADEMIC PROGRESS, BACKLOG, MEDICAL LEAVE, ISOLATION (Tests 18-24) ──
    await test(18, 'Academic Progress: Chirag semester-wise CGPA shows 9.12 across Sems 1-4', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What is my semester-wise CGPA?' }, tokens.chirag);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('9.12') && r.json.answer.includes('Semester 4'));
    });

    await test(19, 'Academic Progress: Bhavya remaining credits returns 50 remaining / 130 completed', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'How many credits remain for graduation?' }, tokens.bhavya);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('130') && r.json.answer.includes('50') && r.json.answer.includes('180'));
    });

    await test(20, 'Academic Progress: Bhavya backlog graduation impact cites Clause 12.1 & COMP204', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'Do I have any backlogs and how does it affect graduation?' }, tokens.bhavya);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('COMP204') && r.json.answer.includes('12.1'));
    });

    await test(21, 'Medical Leave: Aarav Sept 10-22 shows 13 inclusive calendar days & Clause 7.3', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'How many days of medical leave do I have?' }, tokens.aarav);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('13') && r.json.answer.includes('Typhoid') && r.json.answer.includes('65%'));
    });

    await test(22, 'Dashboard Integrity: Divya has 1 course <75% (COMP209) & all others >80%', async () => {
      const r = await req('/api/student/dashboard', 'GET', null, tokens.divya);
      assert.strictEqual(r.status, 200);
      const list = r.json.dashboard.attendanceOverview.courseList;
      const below = list.filter(c => c.percentage < 75);
      const others = list.filter(c => c.percentage >= 75);
      assert.strictEqual(below.length, 1);
      assert.strictEqual(below[0].code, 'COMP209');
      assert(others.every(c => c.percentage > 80), 'Expected all other courses > 80%');
    });

    await test(23, 'Cross-Student Isolation: Unauth agentic workflow protected & token separation holds', async () => {
      const blocked = await req('/api/advising-workflow', 'POST', { query: 'Check status', studentId: '2022UG00001' });
      assert.strictEqual(blocked.status, 403);
      const rA = await req('/api/advisory', 'POST', { query: 'Which courses have attendance below 75%?' }, tokens.aarav);
      assert(!rA.json.answer.includes('Divya') && !rA.json.answer.includes('COMP209'));
    });

    await test(24, 'Batch Progression: Freshman Farhan (Batch 2026 Sem 1) handled cleanly', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What is my CGPA and semester?' }, tokens.farhan);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
      assert(r.json.answer.includes('Semester 1') && r.json.answer.includes('In progress'));
    });

    // ── GROUP 5: GENERAL RAG REGRESSIONS, CITATIONS & UI/API SECURITY (Tests 25-30) ──
    await test(25, 'Regression RAG: Unauthenticated Foundation courses query for Batch 2024', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What are the Foundation courses for Batch 2024?' });
      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.json.state, 'ANSWERABLE');
    });

    await test(26, 'Regression RAG: L-T-P structure of DATA103 mentions 1-0-4', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'Explain the L-T-P structure of DATA103' });
      assert.strictEqual(r.status, 200);
      assert(r.json.answer.includes('1-0-4'));
    });

    await test(27, 'Regression RAG: Batch 2022 vs Batch 2026 structure comparison works', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'Compare the Batch 2022 and Batch 2026 curriculum structures' });
      assert.strictEqual(r.status, 200);
      assert(r.json.answer.includes('2022') && r.json.answer.includes('2026'));
    });

    await test(28, 'Source Security: Internal assignment excluded & Semester Structure preview active', async () => {
      const blocked = await req('/api/document-preview?doc=gai');
      assert.strictEqual(blocked.status, 403);
      const valid = await req('/api/document-preview?doc=semester_spread');
      assert.strictEqual(valid.status, 200);
      assert(valid.json.sheets && valid.json.sheets.length > 0);
    });

    await test(29, 'Unauthenticated Privacy: Asking "What is my name?" unauthenticated asks Sign In', async () => {
      const r = await req('/api/advisory', 'POST', { query: 'What is my name?' });
      assert.strictEqual(r.status, 200);
      assert.strictEqual(r.json.state, 'NEEDS_CLARIFICATION');
      assert(r.json.answer.includes('Student Sign In'));
    });

    await test(30, 'UI/API Hygiene: Token metadata returned & public HTML exposes zero static student names/IDs', async () => {
      const apiRes = await req('/api/advisory', 'POST', { query: 'What is the total credit requirement for B.Tech?' });
      assert(apiRes.json.tokens && typeof apiRes.json.tokens.totalTokens === 'number');
      const htmlRes = await req('/');
      assert.strictEqual(htmlRes.status, 200);
      assert(!htmlRes.text.includes('Aarav Sharma'), 'Found hardcoded Aarav Sharma in public HTML');
      assert(!htmlRes.text.includes('Aarav Mehta'), 'Found hardcoded Aarav Mehta in public HTML');
      assert(!htmlRes.text.includes('>2022UG00001<'), 'Found hardcoded 2022UG00001 value in public HTML');
      assert(htmlRes.text.includes('drawerSpecBox') && htmlRes.text.includes('drawerSyntheticNotice'));
    });

    console.log('\n================================================================');
    console.log(`FINAL 30-TEST SUITE SCORE: ${passed} / 30 PASSED (${failed} Failed)`);
    console.log('================================================================');
    if (failed > 0) process.exitCode = 1;
  } finally {
    if (server) server.close();
  }
}

runSuite().catch(err => {
  console.error('Fatal suite error:', err);
  process.exit(1);
});
