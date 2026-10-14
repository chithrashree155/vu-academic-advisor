/**
 * Phase 4 & 5 Consolidated Evaluation Runner
 * 
 * Executes the 30 representative benchmark test cases across all four variants:
 * - V1: Basic LLM Baseline
 * - V2: Structured Prompting
 * - V3: RAG Knowledge Retrieval
 * - V4: RAG + Deterministic Student Data
 * 
 * Computes exact Phase 4 metrics:
 * 1. Accuracy
 * 2. Hallucination Rate
 * 3. Eligibility Accuracy
 * 4. Source Correctness
 * 5. Missing-Information Success
 * 6. Conflict-Handling Success
 * 7. Incorrect Recommendation Count
 * 8. Average Response Time (ms)
 * 
 * Outputs:
 * - data/evaluation_set_30.csv
 * - data/evaluation_results_per_case.json
 * - data/evaluation_results_per_case.csv
 * - data/variants_comparison_summary.csv
 * - data/variants_comparison_summary.json
 */

'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { SYSTEM_VARIANTS } = require('../src/lib/evaluation/variants');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EVAL_SET_PATH = path.join(PROJECT_ROOT, 'data', 'evaluation_set_30.json');
const EVAL_CSV_PATH = path.join(PROJECT_ROOT, 'data', 'evaluation_set_30.csv');
const PER_CASE_JSON_PATH = path.join(PROJECT_ROOT, 'data', 'evaluation_results_per_case.json');
const PER_CASE_CSV_PATH = path.join(PROJECT_ROOT, 'data', 'evaluation_results_per_case.csv');
const SUMMARY_CSV_PATH = path.join(PROJECT_ROOT, 'data', 'variants_comparison_summary.csv');
const SUMMARY_JSON_PATH = path.join(PROJECT_ROOT, 'data', 'variants_comparison_summary.json');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeCsvField(val) {
  if (val === null || val === undefined) return '""';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

// ── EVALUATION CLASSIFIER ───────────────────────────────────────────────────

function classifyResponse(testCase, variantResult) {
  if (variantResult.isBlocked) {
    return {
      classification: 'BLOCKED',
      explanation: variantResult.blockReason || 'Variant execution blocked due to external API unavailability.',
      isCorrectState: false,
      hasValidSources: false,
      isCorrectEligibility: null,
      isMissingInfoHandled: null,
      isConflictHandled: null,
      isIncorrectRecommendation: false,
      isHallucinated: false
    };
  }

  const { expectedState, expectedKeywords, requiresSources, requiresEligibilityDecision, isMissingInfoCase, isConflictCase } = testCase;
  const answer = (variantResult.answer || '').trim();
  const lowerAnswer = answer.toLowerCase();
  const lowerQuery = testCase.query.toLowerCase();
  const resultState = variantResult.state;

  // 1. Check Hallucination / Unsupported claims
  let isHallucinated = false;
  let isIncorrectRecommendation = false;
  let explanation = '';

  // Unsupported course code test (e.g. COMP999)
  if (testCase.category === 'Unsupported Questions' && /COMP999/i.test(testCase.query)) {
    if (resultState === 'ANSWERABLE' && (lowerAnswer.includes('comp999 is') || lowerAnswer.includes('4 credits') || lowerAnswer.includes('course is'))) {
      isHallucinated = true;
      explanation = 'Hallucinated non-existent course code COMP999 as a valid course.';
    }
  }

  // Quantum computing unknown course
  if (testCase.category === 'Unsupported Questions' && /quantum computing/i.test(testCase.query)) {
    if (resultState === 'ANSWERABLE' && !lowerAnswer.includes('not found') && !lowerAnswer.includes('unverified')) {
      isHallucinated = true;
      explanation = 'Hallucinated non-existent course Advanced Quantum Computing in curriculum.';
    }
  }

  // 2. State & Keyword verification
  const isCorrectState = resultState === expectedState ||
    (isMissingInfoCase && (resultState === 'NEEDS_STUDENT_INFORMATION' || resultState === 'NEEDS_CLARIFICATION' || (resultState === 'ANSWERABLE' && (lowerAnswer.includes('program') || lowerAnswer.includes('profile'))))) ||
    (testCase.category === 'Privacy & Security Guardrails' && (resultState === 'OUT_OF_SCOPE' || lowerAnswer.includes('private') || lowerAnswer.includes('restricted') || lowerAnswer.includes('cannot')));

  const missingKeywords = (expectedKeywords || []).filter(kw => !lowerAnswer.includes(kw.toLowerCase()));
  const allKeywordsPresent = missingKeywords.length === 0;

  // 3. Source correctness
  const hasValidSources = !requiresSources || (Array.isArray(variantResult.sources) && variantResult.sources.length > 0) || (Array.isArray(variantResult.citations) && variantResult.citations.length > 0);

  // 4. Eligibility correctness
  let isCorrectEligibility = null;
  if (requiresEligibilityDecision) {
    if (expectedKeywords.includes('NOT ELIGIBLE')) {
      isCorrectEligibility = lowerAnswer.includes('not eligible') || lowerAnswer.includes('status: not eligible');
      if (lowerAnswer.includes('status: eligible') && !lowerAnswer.includes('not eligible')) {
        isIncorrectRecommendation = true;
        explanation = 'Critically incorrect: approved an ineligible student without required prerequisites.';
      }
    } else if (expectedKeywords.includes('ELIGIBLE')) {
      isCorrectEligibility = lowerAnswer.includes('eligible') && !lowerAnswer.includes('not eligible');
    } else {
      // General prerequisite question
      isCorrectEligibility = allKeywordsPresent;
    }
  }

  // 5. Missing Info Handled
  let isMissingInfoHandled = null;
  if (isMissingInfoCase) {
    isMissingInfoHandled = isCorrectState && (lowerAnswer.includes('profile') || lowerAnswer.includes('program') || lowerAnswer.includes('batch') || lowerAnswer.includes('student'));
  }

  // 6. Conflict Handled
  let isConflictHandled = null;
  if (isConflictCase) {
    if (/75%/i.test(testCase.query) || /attendance/i.test(testCase.query)) {
      isConflictHandled = lowerAnswer.includes('75%') && (lowerAnswer.includes('65%') || lowerAnswer.includes('medical') || lowerAnswer.includes('condonation'));
    } else if (/2024.*2026|minor/i.test(testCase.query)) {
      isConflictHandled = (lowerAnswer.includes('24') && lowerAnswer.includes('32')) || lowerAnswer.includes('batch');
    } else {
      isConflictHandled = isCorrectState && allKeywordsPresent;
    }
  }

  // Final classification determination
  let classification = 'INCORRECT';

  if (isHallucinated) {
    classification = 'UNSUPPORTED/HALLUCINATED';
  } else if (isIncorrectRecommendation) {
    classification = 'INCORRECT';
  } else if (isCorrectState && allKeywordsPresent && hasValidSources) {
    classification = 'CORRECT';
    explanation = 'Response matches expected system state, verified academic documents, and citations.';
  } else if (isCorrectState && (allKeywordsPresent || hasValidSources)) {
    classification = 'PARTIALLY_CORRECT';
    explanation = `Partially matches: ${!allKeywordsPresent ? `missing keyword(s) [${missingKeywords.join(', ')}]` : ''} ${!hasValidSources ? 'missing required source citations' : ''}`.trim();
  } else {
    classification = 'INCORRECT';
    if (!explanation) {
      explanation = `State mismatch (got ${resultState}, expected ${expectedState}) or failed factual assertions.`;
    }
  }

  return {
    classification,
    explanation,
    isCorrectState,
    hasValidSources,
    isCorrectEligibility,
    isMissingInfoHandled,
    isConflictHandled,
    isIncorrectRecommendation,
    isHallucinated
  };
}

// ── MAIN RUNNER ─────────────────────────────────────────────────────────────

async function runEvaluation() {
  console.log('========================================================================');
  console.log('PHASES 3, 4 & 5 — SYSTEM VARIANTS BENCHMARK & EVALUATION RUNNER');
  console.log('========================================================================\n');

  if (!fs.existsSync(EVAL_SET_PATH)) {
    console.error(`ERROR: Benchmark dataset not found at: ${EVAL_SET_PATH}`);
    process.exit(1);
  }

  const testCases = JSON.parse(fs.readFileSync(EVAL_SET_PATH, 'utf8'));
  console.log(`Loaded ${testCases.length} representative test cases from ${EVAL_SET_PATH}.`);

  // Ensure CSV export of evaluation set
  const evalCsvHeaders = [
    'id', 'sourceId', 'category', 'query', 'studentProfileId',
    'expectedState', 'expectedAnswer', 'authoritativeSource',
    'requiresEligibilityDecision', 'requiresSources', 'isMissingInfoCase', 'isConflictCase'
  ];
  const csvLines = [evalCsvHeaders.join(',')];
  for (const c of testCases) {
    csvLines.push([
      c.id, c.sourceId, c.category, c.query, c.studentProfileId,
      c.expectedState, c.expectedAnswer, c.authoritativeSource,
      c.requiresEligibilityDecision, c.requiresSources, c.isMissingInfoCase, c.isConflictCase
    ].map(escapeCsvField).join(','));
  }
  fs.writeFileSync(EVAL_CSV_PATH, csvLines.join('\n'));
  console.log(`Verified evaluation dataset CSV written to: ${EVAL_CSV_PATH}\n`);

  const variantKeys = ['V1', 'V2', 'V3', 'V4'];
  const perCaseResults = [];
  const metricsByVariant = {};

  for (const vKey of variantKeys) {
    metricsByVariant[vKey] = {
      variant: vKey,
      name: SYSTEM_VARIANTS[vKey].name,
      totalCases: testCases.length,
      evaluatedCount: 0,
      blockedCount: 0,
      correctCount: 0,
      partiallyCorrectCount: 0,
      hallucinatedCount: 0,
      incorrectCount: 0,
      totalResponseTimeMs: 0,
      applicableEligibilityCount: 0,
      correctEligibilityCount: 0,
      applicableSourcesCount: 0,
      correctSourcesCount: 0,
      applicableMissingInfoCount: 0,
      correctMissingInfoCount: 0,
      applicableConflictCount: 0,
      correctConflictCount: 0,
      incorrectRecommendationCount: 0,
      blockReason: null
    };
  }

  console.log('------------------------------------------------------------------------');
  console.log('EXECUTING 30 BENCHMARK CASES ACROSS 4 VARIANTS SEQUENTIALLY...');
  console.log('------------------------------------------------------------------------\n');

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`[${i + 1}/30] Evaluating Case: ${tc.id} (${tc.sourceId}) [${tc.category}]`);
    console.log(`       Query: "${tc.query}"`);
    if (tc.studentProfileId) console.log(`       Profile: ${tc.studentProfileId}`);

    const caseResult = {
      id: tc.id,
      sourceId: tc.sourceId,
      category: tc.category,
      query: tc.query,
      studentProfileId: tc.studentProfileId,
      expectedState: tc.expectedState,
      authoritativeSource: tc.authoritativeSource,
      expectedAnswer: tc.expectedAnswer,
      variants: {}
    };

    for (const vKey of variantKeys) {
      const vConfig = SYSTEM_VARIANTS[vKey];
      let vResult;

      try {
        vResult = await vConfig.execute(tc.query, tc.studentProfileId);
      } catch (err) {
        vResult = {
          variant: vKey,
          variantName: vConfig.name,
          state: 'ERROR',
          answer: `[RUNTIME ERROR] ${err.message}`,
          sources: [],
          citations: [],
          latencyMs: 0,
          isBlocked: false,
          error: err.message
        };
      }

      const evalScore = classifyResponse(tc, vResult);
      const metrics = metricsByVariant[vKey];

      if (vResult.isBlocked) {
        metrics.blockedCount++;
        metrics.blockReason = vResult.blockReason;
      } else {
        metrics.evaluatedCount++;
        metrics.totalResponseTimeMs += vResult.latencyMs || 0;

        if (evalScore.classification === 'CORRECT') metrics.correctCount++;
        else if (evalScore.classification === 'PARTIALLY_CORRECT') metrics.partiallyCorrectCount++;
        else if (evalScore.classification === 'UNSUPPORTED/HALLUCINATED') metrics.hallucinatedCount++;
        else metrics.incorrectCount++;

        // Sub-metric trackers
        if (tc.requiresEligibilityDecision) {
          metrics.applicableEligibilityCount++;
          if (evalScore.isCorrectEligibility) metrics.correctEligibilityCount++;
        }

        if (tc.requiresSources) {
          metrics.applicableSourcesCount++;
          if (evalScore.hasValidSources) metrics.correctSourcesCount++;
        }

        if (tc.isMissingInfoCase) {
          metrics.applicableMissingInfoCount++;
          if (evalScore.isMissingInfoHandled) metrics.correctMissingInfoCount++;
        }

        if (tc.isConflictCase) {
          metrics.applicableConflictCount++;
          if (evalScore.isConflictHandled) metrics.correctConflictCount++;
        }

        if (evalScore.isIncorrectRecommendation) {
          metrics.incorrectRecommendationCount++;
        }
      }

      caseResult.variants[vKey] = {
        state: vResult.state,
        latencyMs: vResult.latencyMs || 0,
        classification: evalScore.classification,
        explanation: evalScore.explanation,
        answerExcerpt: (vResult.answer || '').substring(0, 160).replace(/\s+/g, ' '),
        citations: vResult.citations || [],
        isBlocked: vResult.isBlocked || false,
        blockReason: vResult.blockReason || null
      };

      await sleep(50); // Sensible spacing
    }

    perCaseResults.push(caseResult);
    console.log(`       V1: ${caseResult.variants.V1.classification} | V2: ${caseResult.variants.V2.classification} | V3: ${caseResult.variants.V3.classification} | V4: ${caseResult.variants.V4.classification}`);
  }

  // ── SAVE PER-CASE RESULTS ─────────────────────────────────────────────────

  fs.writeFileSync(PER_CASE_JSON_PATH, JSON.stringify(perCaseResults, null, 2));
  console.log(`\n✓ Saved full per-case JSON results to: ${PER_CASE_JSON_PATH}`);

  const perCaseCsvHeaders = [
    'Test ID', 'Source Ref', 'Category', 'Query', 'Student Context', 'Expected State', 'Expected Source',
    'V1 Classification', 'V1 State', 'V1 Latency (ms)', 'V1 Answer Excerpt',
    'V2 Classification', 'V2 State', 'V2 Latency (ms)', 'V2 Answer Excerpt',
    'V3 Classification', 'V3 State', 'V3 Latency (ms)', 'V3 Answer Excerpt',
    'V4 Classification', 'V4 State', 'V4 Latency (ms)', 'V4 Answer Excerpt'
  ];

  const perCaseCsvRows = [perCaseCsvHeaders.join(',')];
  for (const r of perCaseResults) {
    perCaseCsvRows.push([
      r.id, r.sourceId, r.category, r.query, r.studentProfileId || 'None', r.expectedState, r.authoritativeSource,
      r.variants.V1.classification, r.variants.V1.state, r.variants.V1.latencyMs, r.variants.V1.answerExcerpt,
      r.variants.V2.classification, r.variants.V2.state, r.variants.V2.latencyMs, r.variants.V2.answerExcerpt,
      r.variants.V3.classification, r.variants.V3.state, r.variants.V3.latencyMs, r.variants.V3.answerExcerpt,
      r.variants.V4.classification, r.variants.V4.state, r.variants.V4.latencyMs, r.variants.V4.answerExcerpt
    ].map(escapeCsvField).join(','));
  }
  fs.writeFileSync(PER_CASE_CSV_PATH, perCaseCsvRows.join('\n'));
  console.log(`✓ Saved per-case CSV results to: ${PER_CASE_CSV_PATH}`);

  // ── CALCULATE AGGREGATED METRICS ──────────────────────────────────────────

  const summaryRows = [];

  for (const vKey of variantKeys) {
    const m = metricsByVariant[vKey];
    const n = m.evaluatedCount;

    const accuracy = n > 0 ? ((m.correctCount / n) * 100).toFixed(1) + '%' : 'N/A (BLOCKED)';
    const acceptableAdvisoryRate = n > 0 ? (((m.correctCount + m.partiallyCorrectCount) / n) * 100).toFixed(1) + '%' : 'N/A (BLOCKED)';
    const hallucinationRate = n > 0 ? ((m.hallucinatedCount / n) * 100).toFixed(1) + '%' : 'N/A (BLOCKED)';
    const eligibilityAccuracy = m.applicableEligibilityCount > 0 ? ((m.correctEligibilityCount / m.applicableEligibilityCount) * 100).toFixed(1) + '%' : 'N/A';
    const sourceCorrectness = m.applicableSourcesCount > 0 ? ((m.correctSourcesCount / m.applicableSourcesCount) * 100).toFixed(1) + '%' : 'N/A';
    const missingInfoSuccess = m.applicableMissingInfoCount > 0 ? ((m.correctMissingInfoCount / m.applicableMissingInfoCount) * 100).toFixed(1) + '%' : 'N/A';
    const conflictSuccess = m.applicableConflictCount > 0 ? ((m.correctConflictCount / m.applicableConflictCount) * 100).toFixed(1) + '%' : 'N/A';
    const avgResponseTimeMs = n > 0 ? Math.round(m.totalResponseTimeMs / n) : 'N/A';

    summaryRows.push({
      variant: vKey,
      variantName: m.name,
      status: m.blockedCount === m.totalCases ? 'BLOCKED' : (m.blockedCount > 0 ? 'PARTIALLY_BLOCKED' : 'RUNNABLE'),
      totalCases: m.totalCases,
      evaluatedResponses: m.evaluatedCount,
      blockedResponses: m.blockedCount,
      accuracy,
      acceptableAdvisoryRate,
      hallucinationRate,
      eligibilityAccuracy,
      sourceCorrectness,
      missingInfoSuccess,
      conflictSuccess,
      incorrectRecommendationCount: m.incorrectRecommendationCount,
      avgResponseTimeMs,
      blockReason: m.blockReason || 'None (Completed successfully)'
    });
  }

  fs.writeFileSync(SUMMARY_JSON_PATH, JSON.stringify(summaryRows, null, 2));
  console.log(`✓ Saved summary JSON to: ${SUMMARY_JSON_PATH}`);

  const summaryCsvHeaders = [
    'Variant', 'Variant Name', 'Execution Status', 'Total Cases', 'Evaluated Responses', 'Blocked Responses',
    'Accuracy', 'Acceptable Advisory Rate', 'Hallucination Rate', 'Eligibility Accuracy', 'Source Correctness',
    'Missing Info Success', 'Conflict Handling Success', 'Incorrect Recommendations',
    'Avg Response Time (ms)', 'Notes / Block Reason'
  ];

  const summaryCsvLines = [summaryCsvHeaders.join(',')];
  for (const s of summaryRows) {
    summaryCsvLines.push([
      s.variant, s.variantName, s.status, s.totalCases, s.evaluatedResponses, s.blockedResponses,
      s.accuracy, s.acceptableAdvisoryRate, s.hallucinationRate, s.eligibilityAccuracy, s.sourceCorrectness,
      s.missingInfoSuccess, s.conflictSuccess, s.incorrectRecommendationCount,
      s.avgResponseTimeMs, s.blockReason
    ].map(escapeCsvField).join(','));
  }
  fs.writeFileSync(SUMMARY_CSV_PATH, summaryCsvLines.join('\n'));
  console.log(`✓ Saved comparison summary CSV to: ${SUMMARY_CSV_PATH}\n`);

  // ── DISPLAY CONSOLE COMPARISON TABLE ──────────────────────────────────────

  console.log('========================================================================');
  console.log('PHASE 5: AGGREGATED SYSTEM VARIANTS COMPARISON TABLE');
  console.log('========================================================================');
  console.table(summaryRows.map(r => ({
    'Variant': `${r.variant}: ${r.variantName}`,
    'Status': r.status,
    'Eval/Total': `${r.evaluatedResponses}/${r.totalCases}`,
    'Accuracy': r.accuracy,
    'Hallucination': r.hallucinationRate,
    'Eligibility': r.eligibilityAccuracy,
    'Sources': r.sourceCorrectness,
    'Missing Info': r.missingInfoSuccess,
    'Conflict': r.conflictSuccess,
    'Latency': `${r.avgResponseTimeMs} ms`
  })));
  console.log('========================================================================\n');

  return { summaryRows, perCaseResults };
}

if (require.main === module) {
  runEvaluation()
    .then(() => {
      console.log('Evaluation successfully completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal Evaluation Runner Error:', err);
      process.exit(1);
    });
}

module.exports = { runEvaluation };
