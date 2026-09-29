/**
 * Standalone 200 Test Case Runner for VU Academic Advisor
 * 
 * Tests the existing live production endpoint:
 * https://vu-academic-advisor.vercel.app/api/advisory
 * 
 * - Reads test cases from data/VU_Academic_Advisor_200_Test_Cases.xlsx
 * - Executes queries sequentially against the production endpoint
 * - Records full responses, states, latencies, and classifications
 * - Writes data/test_results_200.csv and data/test_summary_200.txt
 * 
 * TESTING ONLY — Zero application / production modifications.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const XLSX = require('xlsx');

const ENDPOINT_HOSTNAME = 'vu-academic-advisor.vercel.app';
const ENDPOINT_PATH = '/api/advisory';
const PRODUCTION_URL = `https://${ENDPOINT_HOSTNAME}${ENDPOINT_PATH}`;

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXCEL_PATH = path.join(PROJECT_ROOT, 'data', 'VU_Academic_Advisor_200_Test_Cases.xlsx');
const RESULTS_CSV_PATH = path.join(PROJECT_ROOT, 'data', 'test_results_200.csv');
const SUMMARY_TXT_PATH = path.join(PROJECT_ROOT, 'data', 'test_summary_200.txt');

// Delay between sequential queries in milliseconds to prevent rate limiting / overloading
const REQUEST_SPACING_MS = 200;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sendQuery(queryText) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      query: queryText,
      profileId: null
    });

    const options = {
      hostname: ENDPOINT_HOSTNAME,
      port: 443,
      path: ENDPOINT_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 30000
    };

    const startTime = Date.now();

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        const responseTimeMs = Date.now() - startTime;
        let parsed = null;
        let parseError = null;

        try {
          parsed = JSON.parse(rawData);
        } catch (err) {
          parseError = err.message;
        }

        resolve({
          httpStatus: res.statusCode,
          responseTimeMs,
          rawBody: rawData,
          parsedBody: parsed,
          parseError,
          networkError: null
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTimeMs = Date.now() - startTime;
      resolve({
        httpStatus: 0,
        responseTimeMs,
        rawBody: '',
        parsedBody: null,
        parseError: null,
        networkError: 'Request timed out after 30 seconds'
      });
    });

    req.on('error', (err) => {
      const responseTimeMs = Date.now() - startTime;
      resolve({
        httpStatus: 0,
        responseTimeMs,
        rawBody: '',
        parsedBody: null,
        parseError: null,
        networkError: err.message
      });
    });

    req.write(payload);
    req.end();
  });
}

function escapeCsvField(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log('VU ACADEMIC ADVISOR — 200 TEST RUNNER');
  console.log(`Target Production Endpoint: ${PRODUCTION_URL}`);
  console.log(`Input File: ${EXCEL_PATH}`);
  console.log('========================================================================\n');

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`ERROR: Test cases file not found at: ${EXCEL_PATH}`);
    process.exit(1);
  }

  // 1. Read Test Cases from Excel
  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  if (!rows || rows.length === 0) {
    console.error('ERROR: No test cases found in worksheet.');
    process.exit(1);
  }

  console.log(`Loaded ${rows.length} test cases from "${sheetName}".`);
  console.log(`Starting sequential test execution...\n`);

  // Initialize CSV results file with headers
  const csvHeaders = [
    'Test ID',
    'Category',
    'Question',
    'Expected State',
    'HTTP Status',
    'Response State',
    'Is Answerable',
    'Is Insufficient Information',
    'Response Time (ms)',
    'Answer Excerpt',
    'Citations',
    'Error Message',
    'Complete API Response'
  ];

  const csvRows = [csvHeaders.map(escapeCsvField).join(',')];

  let passCount = 0;
  let insufficientCount = 0;
  let errorCount = 0;
  let otherCount = 0;
  let totalResponseTimeMs = 0;
  let fastestResponse = { id: null, ms: Infinity };
  let slowestResponse = { id: null, ms: -1 };

  const failedTestIds = [];
  const insufficientTestIds = [];
  const answerableTestIds = [];
  const otherTestIds = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const testId = row['Test ID'] || `T${String(i + 1).padStart(3, '0')}`;
    const category = row['Category'] || 'Uncategorized';
    const question = row['Question'] || '';
    const expectedState = row['Expected State'] || '';

    if (!question || question.trim() === '') {
      console.warn(`[${i + 1}/${rows.length}] ${testId} — SKIPPED (empty question)`);
      continue;
    }

    const res = await sendQuery(question.trim());
    totalResponseTimeMs += res.responseTimeMs;

    if (res.responseTimeMs < fastestResponse.ms && res.httpStatus === 200) {
      fastestResponse = { id: testId, ms: res.responseTimeMs };
    }
    if (res.responseTimeMs > slowestResponse.ms && res.httpStatus === 200) {
      slowestResponse = { id: testId, ms: res.responseTimeMs };
    }

    let statusLabel = 'UNKNOWN';
    let isAnswerable = false;
    let isInsufficient = false;
    let responseState = 'NONE';
    let answerText = '';
    let citationsText = '';
    let errorMessage = res.networkError || res.parseError || '';

    if (res.httpStatus === 200 && res.parsedBody) {
      const data = res.parsedBody;
      responseState = data.state || 'NO_STATE';
      answerText = data.answer || '';
      const citations = Array.isArray(data.citations)
        ? data.citations
        : (data.citation ? [data.citation] : []);
      citationsText = citations.join(' | ');

      const isDefaultFallback = answerText.includes("I couldn't verify that requirement from the available Vidyashilp University");

      if (responseState === 'ANSWERABLE' && !isDefaultFallback) {
        statusLabel = 'PASS';
        isAnswerable = true;
        passCount++;
        answerableTestIds.push(testId);
      } else if (responseState === 'INSUFFICIENT_INFORMATION' || isDefaultFallback) {
        statusLabel = 'INSUFFICIENT_INFORMATION';
        isInsufficient = true;
        insufficientCount++;
        insufficientTestIds.push(testId);
      } else {
        statusLabel = responseState;
        otherCount++;
        otherTestIds.push(testId);
      }
    } else {
      statusLabel = 'ERROR';
      errorCount++;
      failedTestIds.push(testId);
      if (!errorMessage) {
        errorMessage = `HTTP ${res.httpStatus}`;
      }
    }

    // Console output for this test case
    console.log(`[${i + 1}/${rows.length}] ${testId} — ${statusLabel} — ${res.responseTimeMs} ms`);

    // Prepare CSV Row
    const answerSnippet = answerText.length > 200 ? answerText.substring(0, 197) + '...' : answerText;
    const fullResponseString = res.rawBody || (res.parsedBody ? JSON.stringify(res.parsedBody) : '');

    const csvRow = [
      testId,
      category,
      question,
      expectedState,
      res.httpStatus,
      responseState,
      isAnswerable ? 'YES' : 'NO',
      isInsufficient ? 'YES' : 'NO',
      res.responseTimeMs,
      answerSnippet,
      citationsText,
      errorMessage,
      fullResponseString
    ];

    csvRows.push(csvRow.map(escapeCsvField).join(','));

    // Rate-limiting spacer between requests
    if (i < rows.length - 1 && REQUEST_SPACING_MS > 0) {
      await sleep(REQUEST_SPACING_MS);
    }
  }

  // 2. Write CSV Results
  fs.writeFileSync(RESULTS_CSV_PATH, csvRows.join('\n'), 'utf8');
  console.log(`\nDetailed CSV results written to: ${RESULTS_CSV_PATH}`);

  // 3. Compile Summary Statistics
  const totalCompleted = rows.length;
  const successfulHttp = totalCompleted - errorCount;
  const failedHttp = errorCount;
  const avgResponseTimeMs = totalCompleted > 0 ? Math.round(totalResponseTimeMs / totalCompleted) : 0;
  const passPercentage = totalCompleted > 0 ? ((passCount / totalCompleted) * 100).toFixed(1) : '0.0';

  const summaryContent = [
    '========================================================================',
    'VU ACADEMIC ADVISOR — 200 PRODUCTION TEST CASE SUMMARY',
    `Timestamp: ${new Date().toISOString()}`,
    `Endpoint: ${PRODUCTION_URL}`,
    `Input File: ${path.basename(EXCEL_PATH)}`,
    '========================================================================',
    '',
    `Total tests: ${totalCompleted}`,
    `Successful HTTP requests: ${successfulHttp}`,
    `Failed HTTP requests: ${failedHttp}`,
    `Answerable responses (PASS): ${passCount}`,
    `INSUFFICIENT_INFORMATION responses: ${insufficientCount}`,
    `Other unexpected responses: ${otherCount}`,
    `Average response time: ${avgResponseTimeMs} ms`,
    `Fastest response: ${fastestResponse.id ? `${fastestResponse.id} (${fastestResponse.ms} ms)` : 'N/A'}`,
    `Slowest response: ${slowestResponse.id ? `${slowestResponse.id} (${slowestResponse.ms} ms)` : 'N/A'}`,
    `Percentage of answerable tests: ${passPercentage}%`,
    '',
    '------------------------------------------------------------------------',
    `List of failed Test IDs (HTTP/Network errors, count: ${failedTestIds.length}):`,
    failedTestIds.length > 0 ? failedTestIds.join(', ') : 'None',
    '',
    '------------------------------------------------------------------------',
    `List of Test IDs returning INSUFFICIENT_INFORMATION (count: ${insufficientTestIds.length}):`,
    insufficientTestIds.length > 0 ? insufficientTestIds.join(', ') : 'None',
    '',
    '------------------------------------------------------------------------',
    `List of Test IDs returning OTHER states (count: ${otherTestIds.length}):`,
    otherTestIds.length > 0 ? otherTestIds.join(', ') : 'None',
    '',
    '========================================================================'
  ].join('\n');

  fs.writeFileSync(SUMMARY_TXT_PATH, summaryContent, 'utf8');
  console.log(`Summary report written to: ${SUMMARY_TXT_PATH}\n`);

  // 4. Print Final Console Summary
  console.log('========================================');
  console.log('VU ACADEMIC ADVISOR — 200 TEST REPORT');
  console.log(`Total:                    ${totalCompleted}`);
  console.log(`PASS:                     ${passCount}`);
  console.log(`INSUFFICIENT_INFORMATION: ${insufficientCount}`);
  console.log(`ERROR:                    ${errorCount}`);
  if (otherCount > 0) {
    console.log(`OTHER:                    ${otherCount}`);
  }
  console.log(`Average response time:    ${avgResponseTimeMs} ms`);
  console.log('========================================\n');
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
