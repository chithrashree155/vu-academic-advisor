/**
 * Advisory API Endpoint Contract
 * Implements the system architecture data flow without committing to a full chat implementation.
 */

import { AdvisorResponse, SystemState } from '../../../lib/types/system';
import { classifyIntentDeterministically } from '../../../lib/llm/classifier';
import { OUT_OF_SCOPE_FALLBACK } from '../../../lib/llm/prompts';
import { evaluateProgression, evaluateAttendance } from '../../../lib/rules';

export interface AdvisoryRequestBody {
  query: string;
  studentContext?: {
    rollNumber?: string;
    batch?: string;
    program?: string;
    currentSemester?: number;
    cumulativeGpa?: number;
    overallAttendancePct?: number;
    hasMedicalExigency?: boolean;
    medicalProofSubmittedWithinDays?: number;
    isApprovedSportsOrNationalEvent?: boolean;
    completedCourses?: Array<{
      courseCode: string;
      isPassed: boolean;
    }>;
  };
}

export async function processAdvisoryRequest(body: AdvisoryRequestBody): Promise<AdvisorResponse> {
  const startTime = Date.now();
  const { query, studentContext } = body;

  // Step 1: Query / Intent Classification
  const classification = classifyIntentDeterministically(query);

  // Guardrail 1: Out of scope inquiry
  if (classification.intent === 'OUT_OF_SCOPE') {
    return {
      state: 'OUT_OF_SCOPE',
      answer: OUT_OF_SCOPE_FALLBACK,
      sources: [],
      debugTrace: {
        intent: classification.intent,
        latencyMs: Date.now() - startTime,
        retrievalCount: 0,
      },
    };
  }

  // Guardrail 2: Requires student profile context
  if (classification.requiresStudentProfile && !studentContext?.batch) {
    return {
      state: 'NEEDS_STUDENT_INFORMATION',
      answer:
        'To answer your question accurately, I require your academic batch year (e.g. 2023, 2024, 2025) and relevant academic history.',
      sources: [],
      missingInformationRequired: ['batch', 'academic_history'],
      suggestedFollowUps: ['I belong to B.Tech CSE Batch 2024', 'I belong to B.Tech CSE Batch 2023'],
      debugTrace: {
        intent: classification.intent,
        latencyMs: Date.now() - startTime,
        retrievalCount: 0,
      },
    };
  }

  // Step 2: Deterministic Rule Engines Execution (if applicable)
  if (classification.intent === 'ATTENDANCE_POLICY' && typeof studentContext?.overallAttendancePct === 'number') {
    const audit = evaluateAttendance({
      courseCode: classification.extractedParameters.courseCode ?? 'REGISTERED_COURSES',
      currentAttendancePct: studentContext.overallAttendancePct,
      hasMedicalExigency: studentContext.hasMedicalExigency ?? false,
      medicalProofSubmittedWithinDays: studentContext.medicalProofSubmittedWithinDays,
      isApprovedSportsOrNationalEvent: studentContext.isApprovedSportsOrNationalEvent ?? false,
    });

    return {
      state: 'ANSWERABLE',
      answer: audit.ruleExplanation,
      sources: [
        {
          documentTitle: '4. Student Handbook Aug 2026.pdf',
          sourceType: 'STUDENT_HANDBOOK',
          hierarchyLevel: 1,
          sectionOrSheet: 'Section III',
          clauseNumber: 'Clause 7',
          pageNumber: 21,
          excerpt:
            'The attendance requirement shall be a minimum of seventy five percent (75%) of the classes actually conducted in every Course... relaxation down to sixty five percent (65%) for serious medical exigencies or official event representation.',
          confidence: 1.0,
        },
        {
          documentTitle: 'SOP STUDENT 19082025 - Final.pdf',
          sourceType: 'STUDENT_SOP',
          hierarchyLevel: 5,
          sectionOrSheet: 'Clause 2',
          pageNumber: 2,
          excerpt:
            'Signed medical applications along with specified documents to be submitted to the office of Registrar within three working days after rejoining.',
          confidence: 1.0,
        },
      ],
      ruleEvaluationResults: { attendanceAudit: audit },
      debugTrace: {
        intent: classification.intent,
        latencyMs: Date.now() - startTime,
        retrievalCount: 2,
      },
    };
  }

  if (classification.intent === 'PROGRESSION_CHECK' && typeof studentContext?.cumulativeGpa === 'number') {
    const progression = evaluateProgression({
      currentYear: 2,
      targetYear: 3,
      cumulativeGpa: studentContext.cumulativeGpa,
      totalEarnedCredits: 0,
    });

    const isEligible = progression.isEligibleForPromotion;
    return {
      state: 'ANSWERABLE',
      answer: isEligible
        ? `With a CGPA of ${studentContext.cumulativeGpa.toFixed(2)}, you meet the minimum CGPA requirement of 5.00 for progression to Year 3.`
        : `With a CGPA of ${studentContext.cumulativeGpa.toFixed(2)}, you do not satisfy the minimum CGPA threshold of 5.00 required for progression to Year 3 per Table 3. Options available under Clause 12 include repeating the academic year or re-registering for specific courses.`,
      sources: [
        {
          documentTitle: '4. Student Handbook Aug 2026.pdf',
          sourceType: 'STUDENT_HANDBOOK',
          hierarchyLevel: 1,
          sectionOrSheet: 'Section III',
          clauseNumber: 'Clause 12.1 (Table 3)',
          pageNumber: 34,
          excerpt: 'Progression to Year 3 and higher years of the Program: Minimum CGPA of 5.00.',
          confidence: 1.0,
        },
      ],
      ruleEvaluationResults: { progressionAudit: progression },
      debugTrace: {
        intent: classification.intent,
        latencyMs: Date.now() - startTime,
        retrievalCount: 1,
      },
    };
  }

  // Fallback for general ungrounded or incomplete information in current phase
  return {
    state: 'INSUFFICIENT_INFORMATION',
    answer:
      'This query requires RAG retrieval and verified vector indices from official university documentation, which will be enabled in Phase 2.',
    sources: [],
    debugTrace: {
      intent: classification.intent,
      latencyMs: Date.now() - startTime,
      retrievalCount: 0,
    },
  };
}
