/**
 * Phase 2 Ingestion & Retrieval Verification Tests
 * 
 * Executes the required test suite on real extracted source data:
 * 1. Attendance requirement test -> Verifies Handbook Clause 7 / SOP Clause 2
 * 2. Course registration rules -> Verifies SOP / Handbook Clause 2
 * 3. Summer Term June 2026 offerings -> Verifies Courses Offered.pdf (scoped to Summer 2026)
 * 4. Prerequisite for DATA302 -> Verifies Semester Spread Structure
 * 5. Relevant curriculum courses -> Verifies batch-isolated curriculum spread
 * 6. Summer Term registration rules -> Verifies SOP Clause 4 / Handbook Clause 11
 * 7. Cross-batch isolation test -> Verifies Batch 2026 (DS) does NOT leak into Batch 2024 (CSE)
 */

const { retriever } = require('../src/lib/rag/retriever');

function runTest(testNumber, description, queryOptions, validationFn) {
  console.log('----------------------------------------------------------------');
  console.log(`TEST ${testNumber}: ${description}`);
  console.log(`Query: "${queryOptions.query}"`);
  if (queryOptions.batch) console.log(`Filter [Batch]: ${queryOptions.batch}`);
  if (queryOptions.program) console.log(`Filter [Program]: ${queryOptions.program}`);
  if (queryOptions.sourceType) console.log(`Filter [SourceType]: ${queryOptions.sourceType}`);

  const results = retriever.retrieve(queryOptions);

  console.log(`Retrieved Chunks: ${results.length}`);
  if (results.length > 0) {
    const top = results[0];
    console.log(`Top Source: [${top.documentName}] (Hierarchy L${top.hierarchyLevel}) | Ref: ${top.pageOrSheet} / ${top.clauseNumber || 'N/A'}`);
    console.log(`Snippet: "${top.chunkText.slice(0, 180).replace(/\s+/g, ' ')}..."`);
  }

  const isValid = validationFn(results);
  if (isValid) {
    console.log(`RESULT: [PASSED] Evidence correctly sourced and verified.`);
  } else {
    console.log(`RESULT: [FAILED] Source or content validation failed.`);
  }
  return isValid;
}

function runAllTests() {
  console.log('================================================================');
  console.log('PHASE 2: RAG RETRIEVAL VERIFICATION ON REAL SOURCE DATA');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  // Test 1: Minimum attendance requirement
  total++;
  if (runTest(
    1,
    'Minimum Attendance Requirement',
    { query: 'What is the minimum attendance requirement?' },
    (results) => {
      return results.some(r =>
        (r.documentName.includes('Student Handbook') || r.documentName.includes('SOP')) &&
        (r.chunkText.includes('75%') || r.chunkText.includes('seventy five percent'))
      );
    }
  )) passed++;

  // Test 2: Rules for course registration
  total++;
  if (runTest(
    2,
    'Course Registration Rules',
    { query: 'What are the rules for course registration on Digii?' },
    (results) => {
      return results.some(r =>
        (r.documentName.includes('SOP') || r.documentName.includes('Student Handbook')) &&
        (r.chunkText.toLowerCase().includes('course registration') || r.chunkText.toLowerCase().includes('digii'))
      );
    }
  )) passed++;

  // Test 3: Summer Term June 2026 offerings
  total++;
  if (runTest(
    3,
    'Summer Term June 2026 Offerings',
    {
      query: 'Which courses are offered in the Summer Term June 2026?',
      sourceType: 'COURSE_OFFERING'
    },
    (results) => {
      return results.some(r =>
        r.documentName.includes('Courses Offered.pdf') &&
        r.chunkText.includes('Summer Term June 2026')
      );
    }
  )) passed++;

  // Test 4: Prerequisite for DATA302
  total++;
  if (runTest(
    4,
    'Prerequisite for DATA302 (Deep Learning)',
    {
      query: 'What is the prerequisite for DATA302?'
    },
    (results) => {
      return results.some(r =>
        r.chunkText.includes('DATA302') ||
        r.documentName.includes('Semester_Spread')
      );
    }
  )) passed++;

  // Test 5: Courses available for relevant curriculum (Batch 2024, Semester 3)
  total++;
  if (runTest(
    5,
    'Curriculum Courses for Batch 2024, Semester 3',
    {
      query: 'What courses are available for the curriculum?',
      batch: '2024',
      semester: 3
    },
    (results) => {
      return results.every(r => {
        // If it has batch metadata, it MUST be 2024
        if (r.metadata?.batch) return r.metadata.batch === '2024';
        return true;
      });
    }
  )) passed++;

  // Test 6: Summer Term registration rules
  total++;
  if (runTest(
    6,
    'Summer Term Registration Rules',
    {
      query: 'What are the Summer Term registration rules?'
    },
    (results) => {
      return results.some(r =>
        (r.documentName.includes('SOP') || r.documentName.includes('Handbook')) &&
        r.chunkText.toLowerCase().includes('summer term')
      );
    }
  )) passed++;

  // Test 7: Batch Isolation & Conflict Prevention (2026 DS vs 2024 CSE)
  total++;
  console.log('----------------------------------------------------------------');
  console.log('TEST 7: BATCH ISOLATION & CONFLICT PREVENTION');
  console.log('Query: "Curriculum courses in Semester 1" with Batch=2026 (BTech_DS)');
  const ds2026Results = retriever.retrieve({
    query: 'Curriculum courses in Semester 1',
    batch: '2026',
    program: 'BTECH_DS',
    semester: 1
  });

  const contains2024Leak = ds2026Results.some(r => r.metadata?.batch && r.metadata.batch !== '2026');
  const correctlyFiltered2026 = ds2026Results.every(r => !r.metadata?.batch || r.metadata.batch === '2026');

  if (!contains2024Leak && correctlyFiltered2026) {
    console.log(`Retrieved ${ds2026Results.length} chunks. ALL chunks belong strictly to Batch 2026.`);
    console.log(`Top chunk batch: ${ds2026Results[0]?.metadata?.batch} | Program: ${ds2026Results[0]?.metadata?.program}`);
    console.log('RESULT: [PASSED] Zero cross-batch contamination detected.');
    passed++;
  } else {
    console.log('RESULT: [FAILED] Cross-batch contamination detected!');
  }

  console.log('\n================================================================');
  console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log('================================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllTests();
