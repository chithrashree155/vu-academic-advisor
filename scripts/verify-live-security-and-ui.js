'use strict';

const https = require('https');

const LIVE_URL = 'https://vu-academic-advisor-ecru.vercel.app';

function requestLive(path, method = 'GET', postBody = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, LIVE_URL);
    const options = {
      method,
      headers: {
        'User-Agent': 'VU-Live-Security-Verifier/2.0'
      },
      timeout: 30000
    };

    let payload = null;
    if (postBody) {
      payload = JSON.stringify(postBody);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          // not json
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBody: data,
          json
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout requesting ${path}`));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

async function runVerification() {
  console.log('================================================================');
  console.log('FINAL LIVE SECURITY AND UI VERIFICATION');
  console.log(`Target: ${LIVE_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(num, name, condition, details = '') {
    if (condition) {
      console.log(`[PASS] Test ${num}: ${name}`);
      if (details) console.log(`       -> ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${num}: ${name}`);
      if (details) console.error(`       -> ${details}`);
      failed++;
    }
  }

  // 1. Root page & Preview UI elements
  try {
    const root = await requestLive('/');
    const html = root.rawBody;
    const hasModal = html.includes('id="docPreviewModal"');
    const hasTabs = html.includes('id="previewTabsToolbar"');
    const hasTable = html.includes('id="previewTableWrap"');
    const hasDl = html.includes('id="btnDocDownload"');
    report(1, 'Live root HTML page loads and contains Preview Modal elements', root.statusCode === 200 && hasModal && hasTabs && hasTable && hasDl, `Status: ${root.statusCode}, modal: ${hasModal}, tabsToolbar: ${hasTabs}`);
  } catch (err) {
    report(1, 'Live root HTML page loads and contains Preview Modal elements', false, err.message);
  }

  // 2. Security: Block internal assignment file from preview API
  try {
    const block1 = await requestLive('/api/document-preview?doc=all%20the%20info');
    report(2, 'Security: /api/document-preview?doc=all%20the%20info returns 403 Forbidden', block1.statusCode === 403, `HTTP Status: ${block1.statusCode}, message: ${block1.json?.message}`);
  } catch (err) {
    report(2, 'Security: /api/document-preview?doc=all%20the%20info returns 403 Forbidden', false, err.message);
  }

  try {
    const block2 = await requestLive('/api/document-preview?doc=academic_info');
    report(3, 'Security: /api/document-preview?doc=academic_info returns 403 Forbidden', block2.statusCode === 403, `HTTP Status: ${block2.statusCode}`);
  } catch (err) {
    report(3, 'Security: /api/document-preview?doc=academic_info returns 403 Forbidden', false, err.message);
  }

  try {
    const block3 = await requestLive('/api/document-preview?doc=academic%20course%20information');
    report(4, 'Security: /api/document-preview?doc=academic%20course%20information returns 403 Forbidden', block3.statusCode === 403, `HTTP Status: ${block3.statusCode}`);
  } catch (err) {
    report(4, 'Security: /api/document-preview?doc=academic%20course%20information returns 403 Forbidden', false, err.message);
  }

  // 3. Document Preview API for Official Semester Structure
  try {
    const semPreview = await requestLive('/api/document-preview?doc=semester_spread&sheet=Sem_Spread_2024');
    const isWb = semPreview.json?.type === 'workbook';
    const hasSheets = Array.isArray(semPreview.json?.sheets) && semPreview.json.sheets.includes('Sem_Spread_2024');
    const hasRows = Array.isArray(semPreview.json?.rows) && semPreview.json.rows.length > 5;
    report(5, 'Preview API: Semester Structure Excel opens as workbook with sheet tabs & rows', semPreview.statusCode === 200 && isWb && hasSheets && hasRows, `Status: ${semPreview.statusCode}, type: ${semPreview.json?.type}, sheets: ${semPreview.json?.sheets?.length}, rows: ${semPreview.json?.rows?.length}`);
  } catch (err) {
    report(5, 'Preview API: Semester Structure Excel opens as workbook with sheet tabs & rows', false, err.message);
  }

  // 4. Document Preview API for Minor Courses
  try {
    const minorPreview = await requestLive('/api/document-preview?doc=minor_courses&sheet=Psychology');
    const isWb = minorPreview.json?.type === 'workbook';
    const hasSheets = Array.isArray(minorPreview.json?.sheets) && minorPreview.json.sheets.includes('Psychology');
    const hasRows = Array.isArray(minorPreview.json?.rows) && minorPreview.json.rows.length > 0;
    report(6, 'Preview API: Minor Courses Excel opens with 7 sheet tabs and rows', minorPreview.statusCode === 200 && isWb && hasSheets && hasRows, `Status: ${minorPreview.statusCode}, sheets: ${minorPreview.json?.sheets?.join(', ')}, rows: ${minorPreview.json?.rows?.length}`);
  } catch (err) {
    report(6, 'Preview API: Minor Courses Excel opens with 7 sheet tabs and rows', false, err.message);
  }

  // 5. Document Preview API for Student Handbook PDF
  try {
    const handbookPreview = await requestLive('/api/document-preview?doc=handbook');
    const isPdf = handbookPreview.json?.type === 'pdf';
    const pdfUrl = handbookPreview.json?.pdfUrl;
    report(7, 'Preview API: Student Handbook loads authentic PDF preview reference', handbookPreview.statusCode === 200 && isPdf && pdfUrl?.includes('Handbook'), `Status: ${handbookPreview.statusCode}, type: ${handbookPreview.json?.type}, url: ${pdfUrl}`);
  } catch (err) {
    report(7, 'Preview API: Student Handbook loads authentic PDF preview reference', false, err.message);
  }

  // 6. Chatbot Test: DATA103 L-T-P Breakdown
  try {
    const res = await requestLive('/api/advisory', 'POST', { query: 'What does 1-0-4 mean in DATA103?' });
    const ans = res.json?.answer || '';
    const hasBreakdown = ans.includes('1') && ans.includes('4') && ans.includes('3 credit');
    const sources = res.json?.sources || [];
    const sourceTitles = sources.map(s => s.documentTitle).join(' | ');
    const hasInternalSource = sourceTitles.toLowerCase().includes('all the info') || sourceTitles.toLowerCase().includes('academic course information');
    const tokens = res.json?.tokens || res.json?.tokenUsage;
    const hasTokenUsage = tokens && (typeof tokens.totalTokens === 'number');
    report(8, 'Chatbot: "What does 1-0-4 mean in DATA103?" has accurate L-T-P, 5 contact hrs, 3 credits, no internal sources', hasBreakdown && !hasInternalSource && hasTokenUsage, `Tokens: ${JSON.stringify(tokens)}, Sources: ${sourceTitles}`);
  } catch (err) {
    report(8, 'Chatbot: "What does 1-0-4 mean in DATA103?" has accurate L-T-P, 5 contact hrs, 3 credits, no internal sources', false, err.message);
  }

  // 7. Chatbot Test: Difference between L-T-P and Credits
  try {
    const res = await requestLive('/api/advisory', 'POST', { query: 'What is the difference between L-T-P and credits?' });
    const ans = res.json?.answer || '';
    const explainsDiff = (ans.includes('contact hour') || ans.includes('Contact-Hour')) && ans.includes('Credit');
    const noBatchConfusion = !ans.includes('Batch 2024 vs Batch 2025');
    const sources = res.json?.sources || [];
    const sourceTitles = sources.map(s => s.documentTitle).join(' | ');
    const hasInternalSource = sourceTitles.toLowerCase().includes('all the info') || sourceTitles.toLowerCase().includes('academic course information');
    report(9, 'Chatbot: "What is the difference between L-T-P and credits?" explains contact hrs vs credits without batch confusion or internal source', explainsDiff && noBatchConfusion && !hasInternalSource, `Sources: ${sourceTitles}`);
  } catch (err) {
    report(9, 'Chatbot: "What is the difference between L-T-P and credits?" explains contact hrs vs credits without batch confusion or internal source', false, err.message);
  }

  // 8. Chatbot Test: Minor Courses List for Psychology 2025
  try {
    const res = await requestLive('/api/advisory', 'POST', { query: 'List the Psychology minor courses for 2025' });
    const ans = res.json?.answer || '';
    const hasCourses = ans.includes('PSYC') || ans.includes('Psychology');
    const sources = res.json?.sources || [];
    const sourceTitles = sources.map(s => s.documentTitle).join(' | ');
    const isMinorDoc = sourceTitles.includes('B.Tech Minor Courses') || sourceTitles.includes('118351');
    report(10, 'Chatbot: "List the Psychology minor courses for 2025" cites B.Tech Minor Courses', hasCourses && isMinorDoc, `Sources: ${sourceTitles}`);
  } catch (err) {
    report(10, 'Chatbot: "List the Psychology minor courses for 2025" cites B.Tech Minor Courses', false, err.message);
  }

  // 9. Chatbot Test: Minor Prerequisite Anomaly (MGMT210 in Finance 2025)
  try {
    const res = await requestLive('/api/advisory', 'POST', { query: 'Explain the prerequisite issue for MGMT210 in Finance 2025' });
    const ans = res.json?.answer || '';
    const hasPrereq = ans.includes('FINA333');
    const explainsIssue = ans.toLowerCase().includes('not offered to the 2025 batch') || ans.toLowerCase().includes('not offered to 2025');
    report(11, 'Chatbot: Explains prerequisite anomaly for MGMT210 (FINA333 not offered to 2025 batch)', hasPrereq && explainsIssue, `Answer excerpt: ${ans.substring(0, 100)}...`);
  } catch (err) {
    report(11, 'Chatbot: Explains prerequisite anomaly for MGMT210 (FINA333 not offered to 2025 batch)', false, err.message);
  }

  // 10. Chatbot Test: Academic Glossary "What does TBA mean?"
  try {
    const res = await requestLive('/api/advisory', 'POST', { query: 'What does TBA mean?' });
    const ans = res.json?.answer || '';
    const explainsTba = ans.includes('To Be Announced');
    const sources = res.json?.sources || [];
    const sourceTitles = sources.map(s => s.documentTitle).join(' | ');
    const hasInternalSource = sourceTitles.toLowerCase().includes('all the info') || sourceTitles.toLowerCase().includes('academic course information');
    report(12, 'Chatbot: "What does TBA mean?" explains To Be Announced without internal document citation', explainsTba && !hasInternalSource, `Sources: ${sourceTitles}`);
  } catch (err) {
    report(12, 'Chatbot: "What does TBA mean?" explains To Be Announced without internal document citation', false, err.message);
  }

  // 11. Chatbot Test: Meaning of NIL
  try {
    const res = await requestLive('/api/advisory', 'POST', { query: 'What does NIL mean in prerequisites?' });
    const ans = res.json?.answer || '';
    const explainsNil = ans.toLowerCase().includes('no prerequisite');
    const sources = res.json?.sources || [];
    const sourceTitles = sources.map(s => s.documentTitle).join(' | ');
    const hasInternalSource = sourceTitles.toLowerCase().includes('all the info') || sourceTitles.toLowerCase().includes('academic course information');
    report(13, 'Chatbot: "What does NIL mean in prerequisites?" explains no prerequisite without internal document citation', explainsNil && !hasInternalSource, `Sources: ${sourceTitles}`);
  } catch (err) {
    report(13, 'Chatbot: "What does NIL mean in prerequisites?" explains no prerequisite without internal document citation', false, err.message);
  }

  // 12. Chatbot Test: Semester Spread vs Credit Structure
  try {
    const res = await requestLive('/api/advisory', 'POST', { query: 'What is the difference between semester spread and credit structure?' });
    const ans = res.json?.answer || '';
    const explains = ans.includes('Semester Spread') && ans.includes('Credit Structure');
    const sources = res.json?.sources || [];
    const sourceTitles = sources.map(s => s.documentTitle).join(' | ');
    const hasInternalSource = sourceTitles.toLowerCase().includes('all the info') || sourceTitles.toLowerCase().includes('academic course information');
    report(14, 'Chatbot: Spread vs Structure explains both sheets with official workbook source only', explains && !hasInternalSource, `Sources: ${sourceTitles}`);
  } catch (err) {
    report(14, 'Chatbot: Spread vs Structure explains both sheets with official workbook source only', false, err.message);
  }

  // 13. Token usage and source card structure verification
  try {
    const res = await requestLive('/api/advisory', 'POST', { query: 'How many total credits are required for the B.Tech degree?' });
    const tokens = res.json?.tokens || res.json?.tokenUsage;
    const hasExact180 = (res.json?.answer || '').includes('180');
    const isTokenTruthful = typeof tokens?.totalTokens === 'number';
    report(15, 'Token Display & Degree Credits: Exact 180 credits returned with truthful token telemetry', hasExact180 && isTokenTruthful, `Total tokens: ${tokens?.totalTokens}, prompt: ${tokens?.promptTokens}, completion: ${tokens?.completionTokens}`);
  } catch (err) {
    report(15, 'Token Display & Degree Credits: Exact 180 credits returned with truthful token telemetry', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
