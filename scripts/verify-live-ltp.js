/**
 * Live Verification Script for L-T-P & Credit Disambiguation
 * Testing against https://vu-academic-advisor-ecru.vercel.app
 */

async function testLive() {
  const baseUrl = 'https://vu-academic-advisor-ecru.vercel.app';
  const testCases = [
    {
      id: 1,
      query: 'What does 1-0-4 mean in DATA103?',
      validate: (data) => {
        const a = data.answer || '';
        const stateOk = data.state === 'ANSWERABLE';
        const hasLTP = a.includes('Lecture (L):') && a.includes('1') &&
                       a.includes('Tutorial (T):') && a.includes('0') &&
                       a.includes('Practical (P):') && a.includes('4');
        const hasContact = (a.includes('5 hours/week') || a.includes('5 contact hours') || a.includes('5') && a.includes('Contact Hours'));
        const hasCredits = a.includes('3 credit') || a.includes('3 credits');
        const hasDiff = a.includes('Difference Between Weekly Contact Hours and Credits');
        const notBatchComp = !a.includes('Curriculum Comparison: Batch 2024');
        return {
          pass: stateOk && hasLTP && hasContact && hasCredits && hasDiff && notBatchComp,
          checks: { stateOk, hasLTP, hasContact, hasCredits, hasDiff, notBatchComp }
        };
      }
    },
    {
      id: 2,
      query: 'What is the difference between L-T-P and credits?',
      validate: (data) => {
        const a = data.answer || '';
        const stateOk = data.state === 'ANSWERABLE';
        const hasDiff = a.includes('Difference Between L-T-P (Contact Hours) and Academic Credits');
        const hasFormula = a.includes('L + T') && (a.includes('P/2') || a.includes('\\frac{P}{2}'));
        const hasData103 = a.includes('DATA103') && a.includes('1-0-4');
        const notBatchComp = !a.includes('Curriculum Comparison: Batch 2024') && !a.includes('vs. Batch 2025');
        return {
          pass: stateOk && hasDiff && hasFormula && hasData103 && notBatchComp,
          checks: { stateOk, hasDiff, hasFormula, hasData103, notBatchComp }
        };
      }
    },
    {
      id: 3,
      query: "Explain DATA103's L-T-P.",
      validate: (data) => {
        const a = data.answer || '';
        const stateOk = data.state === 'ANSWERABLE';
        const has104 = a.includes('1-0-4');
        const hasCredits = a.includes('3 credit') || a.includes('3 credits');
        const notBatchComp = !a.includes('Curriculum Comparison');
        return {
          pass: stateOk && has104 && hasCredits && notBatchComp,
          checks: { stateOk, has104, hasCredits, notBatchComp }
        };
      }
    },
    {
      id: 4,
      query: 'How many practical hours does DATA103 have?',
      validate: (data) => {
        const a = data.answer || '';
        const stateOk = data.state === 'ANSWERABLE';
        const has4Practical = a.includes('4 practical') || (a.includes('Practical (P):') && a.includes('4'));
        const hasCredits = a.includes('3 credit') || a.includes('3 credits');
        return {
          pass: stateOk && has4Practical && hasCredits,
          checks: { stateOk, has4Practical, hasCredits }
        };
      }
    },
    {
      id: 5,
      query: 'Does 1-0-4 mean 4 credits?',
      validate: (data) => {
        const a = data.answer || '';
        const stateOk = data.state === 'ANSWERABLE';
        const hasNo = a.includes('No.') || a.includes('not 4');
        const has3Credits = a.includes('3 credit') || a.includes('3 credits');
        const hasRatio = a.includes('2:1') || a.includes('2 practical hours equal 1 credit') || a.includes('2 lab hours');
        return {
          pass: stateOk && hasNo && has3Credits && hasRatio,
          checks: { stateOk, hasNo, has3Credits, hasRatio }
        };
      }
    },
    {
      id: 6,
      query: 'Explain L-T-P using DATA103 as an example.',
      validate: (data) => {
        const a = data.answer || '';
        const stateOk = data.state === 'ANSWERABLE';
        const has104 = a.includes('1-0-4');
        const has4Practical = a.includes('4') && a.includes('practical');
        const has3Credits = a.includes('3 credit') || a.includes('3 credits');
        return {
          pass: stateOk && has104 && has4Practical && has3Credits,
          checks: { stateOk, has104, has4Practical, has3Credits }
        };
      }
    }
  ];

  console.log(`\n======================================================`);
  console.log(`LIVE DISAMBIGUATION & REGRESSION TEST: ${baseUrl}`);
  console.log(`======================================================\n`);

  let passedCount = 0;

  for (const tc of testCases) {
    console.log(`------------------------------------------------------`);
    console.log(`Test ${tc.id}: "${tc.query}"`);
    try {
      const res = await fetch(`${baseUrl}/api/advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: tc.query })
      });
      const data = await res.json();
      const val = tc.validate(data);

      console.log(`Status: ${data.state} | Result: ${val.pass ? 'PASSED [✓]' : 'FAILED [✗]'}`);
      console.log(`Token Usage:`, data.tokenUsage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
      console.log(`Sources (${(data.sources || []).length}):`, (data.sources || []).map(s => s.documentTitle).join(', '));
      console.log(`Checks:`, JSON.stringify(val.checks));
      console.log(`Answer excerpt:\n${data.answer.substring(0, 320)}...\n`);

      if (val.pass) passedCount++;
    } catch (err) {
      console.log(`Error calling API: ${err.message}`);
    }
  }

  console.log(`======================================================`);
  console.log(`FINAL LIVE RESULT: ${passedCount} / ${testCases.length} PASSED`);
  console.log(`======================================================\n`);
}

testLive();
