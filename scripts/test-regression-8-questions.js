const { processAdvisorQuery } = require('../src/lib/advisory-engine');

const testCases = [
  {
    id: 1,
    query: "Which mathematics course is offered in Batch 2023 Semester 1?",
    expected: {
      mustInclude: ["MATH202", "Probability Theory", "3 credit", "Semester 1", "2023"],
      mustNotInclude: ["###", "UCOR103", "Communication Skills", "19 credits", "*Official Knowledge Source:"],
      sourceContains: "Sem_Spread_2023",
      state: "ANSWERABLE"
    }
  },
  {
    id: 2,
    query: "Which mathematics course is offered in Batch 2022 Semester 1?",
    expected: {
      mustInclude: ["MATH201", "Calculus", "3 credit", "Semester 1", "2022"],
      mustNotInclude: ["###", "UCOR103", "22 credits", "*Official Knowledge Source:"],
      sourceContains: "BTECH-2022",
      state: "ANSWERABLE"
    }
  },
  {
    id: 3,
    query: "What are the Foundation courses for Batch 2023 Semester 1?",
    expected: {
      mustInclude: ["13 credits", "MATH202", "Probability Theory", "Semester 1", "Batch 2023"],
      mustNotInclude: ["###", "*Official Knowledge Source:"],
      sourceContains: "Sem_Spread_2023",
      state: "ANSWERABLE"
    }
  },
  {
    id: 4,
    query: "What are the Foundation courses for Batch 2022 Semester 1?",
    expected: {
      mustInclude: ["13 credits", "MATH201", "Calculus", "Semester 1", "Batch 2022"],
      mustNotInclude: ["###", "*Official Knowledge Source:"],
      sourceContains: "BTECH-2022",
      state: "ANSWERABLE"
    }
  },
  {
    id: 5,
    query: "What are the Foundation courses for Batch 2023?",
    expected: {
      mustInclude: ["34 credits", "Batch 2023", "Probability Theory", "Calculus", "Semester 1", "Semester 2"],
      mustNotInclude: ["###", "*Official Knowledge Source:"],
      sourceContains: "Struct_2023",
      state: "ANSWERABLE"
    }
  },
  {
    id: 6,
    query: "What is the minimum attendance requirement for end-semester examinations?",
    expected: {
      mustInclude: ["75%", "65%", "Clause 7.1", "debarred"],
      mustNotInclude: ["###", "*Official Knowledge Source:"],
      state: "ANSWERABLE"
    }
  },
  {
    id: 7,
    query: "What should I do if my student profile does not contain the required information?",
    expected: {
      mustInclude: ["Faculty", "Mentor", "Clause 2.4", "Registrar"],
      mustNotInclude: ["###", "*Official Knowledge Source:"],
      state: "ANSWERABLE"
    }
  },
  {
    id: 8,
    query: "What are the Foundation courses for Batch 2035 Semester 1?",
    expected: {
      mustInclude: ["Batch 2035", "not a recognized curriculum version", "2022, 2023, 2024, 2025, and 2026"],
      mustNotInclude: ["###", "*Official Knowledge Source:"],
      state: "INSUFFICIENT_INFORMATION"
    }
  }
];

async function runTests() {
  console.log("================================================================================");
  console.log("            VU ACADEMIC ADVISOR 8-QUESTION REGRESSION AUDIT                    ");
  console.log("================================================================================");
  let passedCount = 0;
  let failedCount = 0;

  for (const tc of testCases) {
    console.log(`\n[TEST ${tc.id}] Query: "${tc.query}"`);
    const res = await processAdvisorQuery(tc.query);
    const answer = res.answer || "";
    let testPassed = true;
    const failures = [];

    // State check
    if (tc.expected.state && res.state !== tc.expected.state) {
      testPassed = false;
      failures.push(`Expected state "${tc.expected.state}", got "${res.state}"`);
    }

    // Must Include
    for (const term of tc.expected.mustInclude) {
      if (!answer.includes(term)) {
        testPassed = false;
        failures.push(`Missing expected term: "${term}"`);
      }
    }

    // Must Not Include
    for (const term of tc.expected.mustNotInclude) {
      if (answer.includes(term)) {
        testPassed = false;
        failures.push(`Found forbidden term: "${term}"`);
      }
    }

    // Source contains
    if (tc.expected.sourceContains) {
      const srcMatch = res.sources && res.sources.some(s =>
        (s.pageOrSheet && s.pageOrSheet.includes(tc.expected.sourceContains)) ||
        (s.documentTitle && s.documentTitle.includes(tc.expected.sourceContains))
      );
      const answerMatch = answer.includes(tc.expected.sourceContains);
      if (!srcMatch && !answerMatch) {
        testPassed = false;
        failures.push(`Expected source to contain "${tc.expected.sourceContains}"`);
      }
    }

    if (testPassed) {
      passedCount++;
      console.log(`✓ PASSED`);
      console.log(`State: ${res.state}`);
      const firstLine = answer.split('\n')[0];
      const secondLine = answer.split('\n')[1] || '';
      console.log(`Heading: ${firstLine}`);
      console.log(`Source line: ${secondLine}`);
    } else {
      failedCount++;
      console.log(`❌ FAILED`);
      failures.forEach(f => console.log(`  - ${f}`));
      console.log(`Actual Answer:\n${answer}\n`);
    }
  }

  console.log("\n================================================================================");
  console.log(`RESULTS: ${passedCount} PASSED, ${failedCount} FAILED out of ${testCases.length} tests.`);
  console.log("================================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
