const { processAdvisorQuery } = require('../src/lib/advisory-engine');

async function testFollowUp() {
  console.log('=== TEST FOLLOW-UP (Meera Krishnan - BA Economics) ===');
  const res1 = await processAdvisorQuery('Can I take DATA302?', 'VU-DEMO-008');
  console.log('Turn 1 Answer:\n', res1.answer);

  const history = [
    { sender: 'user', text: 'Can I take DATA302?' },
    { sender: 'advisor', text: res1.answer }
  ];

  const res2 = await processAdvisorQuery('I completed DATA301 last semester.', 'VU-DEMO-008', history);
  console.log('\nTurn 2 Answer (Follow-up):\n', res2.answer);

  console.log('\n=== TEST FOLLOW-UP (Aarav Mehta - B.Tech Data Science) ===');
  const res3 = await processAdvisorQuery('I completed DATA301 last semester.', 'VU-DEMO-001', history);
  console.log('B.Tech DS Follow-up Answer:\n', res3.answer);
}

testFollowUp();
