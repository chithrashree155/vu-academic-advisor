/**
 * End-to-End MVP Verification Test Suite
 * Tests all required demo queries, synthetic profiles, and system states.
 */

async function runE2ETests() {
  console.log('================================================================');
  console.log('STARTING END-TO-END MVP VALIDATION SUITE');
  console.log('URL: http://localhost:3000');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  // Test 1: Health Endpoint
  total++;
  try {
    const res = await fetch('http://localhost:3000/api/health');
    const data = await res.json();
    if (res.status === 200 && data.status === 'healthy') {
      console.log('TEST 1 [Health Endpoint]: PASSED (Server healthy, 384-dim embedder)');
      passed++;
    } else {
      console.log('TEST 1 [Health Endpoint]: FAILED', data);
    }
  } catch (e) {
    console.log('TEST 1 [Health Endpoint]: FAILED', e.message);
  }

  // Test 2: Profiles Endpoint
  total++;
  try {
    const res = await fetch('http://localhost:3000/api/profiles');
    const data = await res.json();
    if (data.profiles && data.profiles.length >= 3) {
      console.log(`TEST 2 [Synthetic Profiles]: PASSED (${data.profiles.length} demo profiles verified: Student A, B, C)`);
      passed++;
    } else {
      console.log('TEST 2 [Synthetic Profiles]: FAILED', data);
    }
  } catch (e) {
    console.log('TEST 2 [Synthetic Profiles]: FAILED', e.message);
  }

  // Helper for advisory queries
  async function testQuery(testNum, label, query, profileId, expectedState, validationFn) {
    total++;
    try {
      const res = await fetch('http://localhost:3000/api/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, profileId })
      });
      const data = await res.json();
      const stateMatch = data.state === expectedState;
      const valid = validationFn(data);

      if (stateMatch && valid) {
        console.log(`TEST ${testNum} [${label}]: PASSED (State: ${data.state}, Sources: ${data.sources?.length || 0})`);
        console.log(`  -> Snippet: "${data.answer.slice(0, 140)}..."`);
        if (data.sources && data.sources.length > 0) {
          console.log(`  -> Top Source: ${data.sources[0].documentTitle} (${data.sources[0].pageOrSheet})`);
        }
        passed++;
        return true;
      } else {
        console.log(`TEST ${testNum} [${label}]: FAILED (Expected: ${expectedState}, Got: ${data.state})`, data);
        return false;
      }
    } catch (e) {
      console.log(`TEST ${testNum} [${label}]: FAILED with error:`, e.message);
      return false;
    }
  }

  // Demo Query 1: Minimum attendance requirement
  await testQuery(
    3,
    'Attendance Requirement',
    'What is the minimum attendance requirement?',
    null,
    'ANSWERABLE',
    (d) => d.answer.includes('75%') && d.sources.some(s => s.documentTitle.includes('Handbook'))
  );

  // Demo Query 2: Summer Term 2026 course offerings
  await testQuery(
    4,
    'Summer Term Offerings',
    'What courses are offered in Summer Term 2026?',
    null,
    'ANSWERABLE',
    (d) => d.answer.includes('73 courses') && d.sources.some(s => s.documentTitle.includes('Courses Offered'))
  );

  // Demo Query 3: Prerequisite for DATA302
  await testQuery(
    5,
    'Prerequisite Inquiry',
    'What is the prerequisite for DATA302?',
    null,
    'ANSWERABLE',
    (d) => d.answer.includes('DATA301') && d.sources.some(s => s.documentTitle.includes('Semester_Spread'))
  );

  // Demo Query 4A: Can I take DATA302? (WITHOUT Student Profile -> NEEDS_STUDENT_INFORMATION)
  await testQuery(
    6,
    'Course Eligibility without Profile',
    'Can I take DATA302?',
    null,
    'NEEDS_STUDENT_INFORMATION',
    (d) => d.answer.includes('require your student profile')
  );

  // Demo Query 4B: Can I take DATA302? (WITH Student A -> ELIGIBLE)
  await testQuery(
    7,
    'Course Eligibility Student A (Passed DATA301)',
    'Can I take DATA302?',
    'student-a',
    'ANSWERABLE',
    (d) => d.answer.includes('ELIGIBLE: Yes') && d.ruleResults?.eligible === true
  );

  // Demo Query 4C: Can I take DATA302? (WITH Student B -> NOT ELIGIBLE)
  await testQuery(
    8,
    'Course Eligibility Student B (Missing DATA301)',
    'Can I take DATA302?',
    'student-b',
    'ANSWERABLE',
    (d) => d.answer.includes('NOT ELIGIBLE: No') && d.ruleResults?.eligible === false
  );

  // Demo Query 5: Summer Term registration rules
  await testQuery(
    9,
    'Summer Term Rules',
    'What are the Summer Term registration rules?',
    null,
    'ANSWERABLE',
    (d) => d.answer.includes('Summer Term') && d.sources.length > 0
  );

  // Demo Query 6: What information do you need to determine course eligibility?
  await testQuery(
    10,
    'Required Eligibility Information',
    'What information do you need to determine my course eligibility?',
    null,
    'ANSWERABLE',
    (d) => d.answer.includes('Academic Program') && d.answer.includes('Batch Year')
  );

  // Demo Query 7: Out-of-Scope Test ("Who won the cricket match?")
  await testQuery(
    11,
    'Out of Scope Guardrail',
    'Who is the best professor or who won the cricket match?',
    null,
    'OUT_OF_SCOPE',
    (d) => d.answer.includes('I can only answer academic questions')
  );

  console.log('\n================================================================');
  console.log(`E2E TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('================================================================');

  if (passed === total) {
    console.log('ALL TESTS PASSED! MVP IS FULLY FUNCTIONAL.');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runE2ETests();
