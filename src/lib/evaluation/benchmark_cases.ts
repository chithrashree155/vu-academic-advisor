/**
 * Benchmark Evaluation Test Cases
 * Designed to validate that the Academic Advisor correctly resolves each of the 6 required system states.
 */

import { EvaluationCaseRecord } from '../types/database';

export const BENCHMARK_CASES: Omit<EvaluationCaseRecord, 'id' | 'created_at'>[] = [
  {
    case_id: 'TC-PROG-01',
    category: 'PROGRESSION',
    query: 'What is the minimum CGPA required to be promoted from Year 2 to Year 3?',
    student_context: null,
    expected_state: 'ANSWERABLE',
    expected_sources: ['4. Student Handbook Aug 2026.pdf'],
    ground_truth_answer:
      'Per Table 3 in Clause 12.1 (Section III) of the VU Student Handbook August 2026, progression to Year 3 and higher years requires a minimum CGPA of 5.00.',
    deterministic_assertions: {
      targetYear: 3,
      minCgpa: 5.0,
      clause: '12.1',
    },
  },
  {
    case_id: 'TC-PREREQ-STUDENT-01',
    category: 'PREREQUISITE',
    query: 'Am I eligible to register for Analysis of Algorithms (COMP203)?',
    student_context: null, // No student context provided in query
    expected_state: 'NEEDS_STUDENT_INFORMATION',
    expected_sources: ['118225_Semester_Spread_Structures_Sept_2026.xlsx'],
    ground_truth_answer:
      'To verify your eligibility for COMP203 (Analysis of Algorithms), please provide your academic batch year and your academic record showing whether you have passed COMP201 (Data Structures).',
    deterministic_assertions: {
      requiredParam: 'student_academic_history',
    },
  },
  {
    case_id: 'TC-CLARIFY-BATCH-01',
    category: 'CURRICULUM_BASKET',
    query: 'How many total credits are required for the Minor / Open Electives basket?',
    student_context: null,
    expected_state: 'NEEDS_CLARIFICATION',
    expected_sources: ['118225_Semester_Spread_Structures_Sept_2026.xlsx'],
    ground_truth_answer:
      'The Minor/Open Elective basket requirement varies by batch: Batches 2022, 2023, and 2024 require 24 credits, whereas Batches 2025 and 2026 require 32 credits. Please clarify which batch you belong to.',
    deterministic_assertions: {
      clarificationField: 'batch_year',
    },
  },
  {
    case_id: 'TC-ATTEND-RELAX-01',
    category: 'ATTENDANCE',
    query: 'My attendance is 68% due to hospitalization. Can I write the end term exams?',
    student_context: {
      attendancePct: 68.0,
      hasMedicalProof: true,
      submittedWithin3Days: true,
    },
    expected_state: 'ANSWERABLE',
    expected_sources: ['4. Student Handbook Aug 2026.pdf', 'SOP STUDENT 19082025 - Final.pdf'],
    ground_truth_answer:
      'Yes. Per Student Handbook Clause 7.2 and Student SOP Clause 2, students with attendance between 65% and 75% who suffered serious medical exigencies involving hospitalization are eligible for relaxation to 65%, provided signed medical applications and certificates are submitted to the Registrar within 3 working days of rejoining.',
    deterministic_assertions: {
      status: 'RELAXATION_PERMITTED',
      thresholdMet: true,
    },
  },
  {
    case_id: 'TC-UNCERTAIN-01',
    category: 'PREREQUISITE',
    query: 'What is the prerequisite for Financial and Management Accounting (FAMA) in the Finance Minor?',
    student_context: null,
    expected_state: 'INSUFFICIENT_INFORMATION',
    expected_sources: ['118351_Minor Courses for BTech_Students.xlsx'],
    ground_truth_answer:
      'In the official university Minor Courses spreadsheet (Finance sheet, Row 2), the course code is unassigned ("DON’T KNOW") and the prerequisite is listed as "Nil". The official university catalogue does not yet contain a finalized code for this entry.',
    deterministic_assertions: {
      uncertaintyFlagged: true,
    },
  },
  {
    case_id: 'TC-OUT-OF-SCOPE-01',
    category: 'OUT_OF_SCOPE',
    query: 'Who won the Indian Premier League cricket championship last year?',
    student_context: null,
    expected_state: 'OUT_OF_SCOPE',
    expected_sources: [],
    ground_truth_answer: 'I can only answer academic questions.',
    deterministic_assertions: {
      scopeRejected: true,
    },
  },
];
