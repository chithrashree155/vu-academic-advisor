/**
 * Live Deployment Verification Script for https://vu-academic-advisor-ecru.vercel.app
 */

async function main() {
  const baseUrl = 'https://vu-academic-advisor-ecru.vercel.app';
  console.log(`Verifying live deployment at: ${baseUrl}\n`);

  // 1. Health check
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log('Health check response:', JSON.stringify(healthData, null, 2));
  } catch (err) {
    console.log('Health check endpoint err:', err.message);
  }

  // 2. 8 Target Queries
  const queries = [
    {
      id: 1,
      q: 'Which mathematics course is offered in Batch 2023 Semester 1?',
      validate: (data) => {
        const text = data.answer || '';
        const passed = text.includes('Probability Theory') &&
                       text.includes('MATH202') &&
                       text.includes('3 credits') &&
                       !text.includes('###') &&
                       !text.includes('*Official Knowledge Source:') &&
                       text.includes('Official Knowledge Source:');
        return { passed, note: passed ? 'MATH202 - Probability Theory, 3 credits, clean heading and source' : text.slice(0, 150) };
      }
    },
    {
      id: 2,
      q: 'Which mathematics course is offered in Batch 2022 Semester 1?',
      validate: (data) => {
        const text = data.answer || '';
        const passed = text.includes('Calculus') &&
                       text.includes('MATH201') &&
                       text.includes('3 credits') &&
                       !text.includes('###') &&
                       !text.includes('*Official Knowledge Source:') &&
                       text.includes('Official Knowledge Source:');
        return { passed, note: passed ? 'MATH201 - Calculus, 3 credits, clean heading and source' : text.slice(0, 150) };
      }
    },
    {
      id: 3,
      q: 'What are the Foundation courses for Batch 2023 Semester 1?',
      validate: (data) => {
        const text = data.answer || '';
        const passed = text.includes('13 credits') &&
                       text.includes('MATH202') &&
                       !text.includes('###') &&
                       text.includes('Official Knowledge Source:');
        return { passed, note: passed ? '5 Foundation courses, 13 credits' : text.slice(0, 150) };
      }
    },
    {
      id: 4,
      q: 'What are the Foundation courses for Batch 2022 Semester 1?',
      validate: (data) => {
        const text = data.answer || '';
        const passed = text.includes('13 credits') &&
                       text.includes('MATH201') &&
                       !text.includes('###') &&
                       text.includes('Official Knowledge Source:');
        return { passed, note: passed ? '5 Foundation courses, 13 credits' : text.slice(0, 150) };
      }
    },
    {
      id: 5,
      q: 'What are the Foundation courses for Batch 2023?',
      validate: (data) => {
        const text = data.answer || '';
        const passed = text.includes('34 credits') &&
                       !text.includes('###') &&
                       text.includes('Official Knowledge Source:');
        return { passed, note: passed ? 'Full basket 34 credits' : text.slice(0, 150) };
      }
    },
    {
      id: 6,
      q: 'What is the minimum attendance requirement for end-semester examinations?',
      validate: (data) => {
        const text = data.answer || '';
        const passed = text.includes('75%') &&
                       text.includes('65%') &&
                       !text.includes('###') &&
                       text.includes('Official Knowledge Source:');
        return { passed, note: passed ? '75% mandatory, 65% condoned' : text.slice(0, 150) };
      }
    },
    {
      id: 7,
      q: 'What should I do if my student profile does not contain the required information?',
      validate: (data) => {
        const text = data.answer || '';
        const passed = (text.includes('Clause 2.4') || text.includes('Faculty Advisor')) &&
                       !text.includes('###') &&
                       text.includes('Official Knowledge Source:');
        return { passed, note: passed ? 'Student Handbook Clause 2.4 guidance' : text.slice(0, 150) };
      }
    },
    {
      id: 8,
      q: 'What are the Foundation courses for Batch 2035 Semester 1?',
      validate: (data) => {
        const passed = data.state === 'INSUFFICIENT_INFORMATION';
        return { passed, note: passed ? 'Safely returned INSUFFICIENT_INFORMATION' : data.state };
      }
    }
  ];

  console.log('Testing all 8 target questions against live endpoint...\n');
  let passCount = 0;

  for (const item of queries) {
    try {
      const res = await fetch(`${baseUrl}/api/advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: item.q })
      });
      const data = await res.json();
      const check = item.validate(data);
      if (check.passed) {
        passCount++;
        console.log(`[PASS] Q${item.id}: "${item.q}" -> ${check.note}`);
      } else {
        console.log(`[FAIL] Q${item.id}: "${item.q}" -> Note: ${check.note}`);
      }
    } catch (e) {
      console.log(`[ERROR] Q${item.id}: ${e.message}`);
    }
  }

  console.log(`\nLive Verification Summary: ${passCount} / ${queries.length} passed.`);
}

main().catch(console.error);
