const { processAdvisorQuery } = require('../src/lib/advisory-engine');

async function testComplexQuery() {
  const q = "I am a 3rd-year B.Tech Data Science student in semester 5. I completed DATA201 and DATA202 but not DATA301. Which AI/ML courses can I take?";
  console.log(`QUERY: "${q}"`);
  const res = await processAdvisorQuery(q, 'VU-DEMO-015'); // Neil Thomas (B.Tech DS, missing DATA301)
  console.log('ANSWER:\n', res.answer);
  console.log('\nSOURCES:\n', res.sources.map(s => s.documentTitle).join(', '));
}

testComplexQuery();
