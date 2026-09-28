const { processAdvisorQuery } = require('../src/lib/advisory-engine');

async function testQuery(query, profileId = 'VU-DEMO-008') {
  console.log(`\n======================================================`);
  console.log(`QUERY: "${query}" (Profile: ${profileId})`);
  const res = await processAdvisorQuery(query, profileId);
  console.log(`STATE: ${res.state}`);
  console.log(`ANSWER:\n${res.answer.substring(0, 300)}...`);
  if (res.sources && res.sources.length) {
    console.log(`SOURCES: ${res.sources.map(s => s.documentTitle).join(', ')}`);
  }
}

async function run() {
  const queries = [
    "Can I take DATA302 Deep Learning?",
    "Can I take COMP301 Artificial Intelligence?",
    "What courses can I take next semester?",
    "What courses can I take from the summer term?",
    "Can an Economics student take Deep Learning?",
    "What are the prerequisites for DATA302?",
    "What happens if I have not completed the prerequisite?",
    "How many credits is DATA302?",
    "What courses are available for a BMS student?",
    "What Computer Science courses can I take?",
    "What courses can a 3rd-year student register for?",
    "Can I take a course from another school?",
    "Which courses are related to Data Science?",
    "Can I take a course without its prerequisite?",
    "What courses can I take based on my current semester, year, program and completed courses?"
  ];

  for (const q of queries) {
    await testQuery(q);
  }
}

run();
