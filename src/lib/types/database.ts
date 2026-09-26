/**
 * Database Entity Types matching Supabase / PostgreSQL Schema
 */

import { SourceHierarchyType, SystemState } from './system';

export type CourseGrade =
  | 'O'
  | 'A+'
  | 'A'
  | 'B+'
  | 'B'
  | 'C'
  | 'D'
  | 'F'
  | 'FA'
  | 'S'
  | 'U'
  | 'I'
  | 'W';

export type RegistrationStatus =
  | 'REGISTERED'
  | 'COMPLETED'
  | 'DROPPED'
  | 'AUDIT'
  | 'WITHDRAWN';

export type PrerequisiteType =
  | 'STRICT_PASS'
  | 'MINIMUM_GRADE'
  | 'EXPOSURE'
  | 'COREQUISITE'
  | 'UNCERTAIN_PENDING';

export interface DocumentRecord {
  id: string;
  filename: string;
  file_type: string;
  title: string;
  source_type: SourceHierarchyType;
  hierarchy_level: number;
  academic_year?: string | null;
  batch_scope?: string[] | null;
  version?: string | null;
  is_verified: boolean;
  is_raster_scan: boolean;
  sha256_hash?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunkRecord {
  id: string;
  document_id: string;
  content: string;
  embedding?: number[] | null;
  chunk_index: number;
  page_number?: number | null;
  section_number?: string | null;
  clause_number?: string | null;
  academic_year?: string | null;
  batch?: string | null;
  program?: string | null;
  token_count?: number | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ProgramRecord {
  id: string;
  program_code: string;
  program_name: string;
  school_name: string;
  degree_level: 'UG' | 'PG' | 'PHD';
  standard_duration_years: number;
  max_duration_years: number;
  created_at: string;
}

export interface CourseRecord {
  id: string;
  course_code: string;
  course_name: string;
  credits: number;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  school_or_dept?: string | null;
  has_uncertain_code: boolean;
  uncertainty_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoursePrerequisiteRecord {
  id: string;
  course_code: string;
  prerequisite_course_code?: string | null;
  batch: string;
  program_code: string;
  prerequisite_type: PrerequisiteType;
  raw_prerequisite_text: string;
  is_uncertain: boolean;
  source_document_id?: string | null;
  created_at: string;
}

export interface CurriculumCourseRecord {
  id: string;
  program_code: string;
  batch: string;
  semester_num: number;
  basket_name: string;
  course_code: string;
  credits: number;
  is_mandatory: boolean;
  source_sheet_name?: string | null;
  source_document_id?: string | null;
  created_at: string;
}

export interface CourseOfferingRecord {
  id: string;
  course_code: string;
  academic_year: string;
  term_name: string;
  term_type: 'SUMMER' | 'ODD' | 'EVEN';
  credits: number;
  max_capacity?: number | null;
  is_offered: boolean;
  source_document_id?: string | null;
  created_at: string;
}

export interface MinorProgramRecord {
  id: string;
  minor_code: string;
  minor_name: string;
  offering_school: string;
  total_required_credits: number;
  minimum_enrolled_threshold: number;
  created_at: string;
}

export interface MinorCourseRecord {
  id: string;
  minor_code: string;
  batch: string;
  semester_num: number;
  course_code: string;
  course_name: string;
  credits: number;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  raw_prerequisite_text?: string | null;
  is_uncertain: boolean;
  source_sheet_name?: string | null;
  source_document_id?: string | null;
  created_at: string;
}

export interface AcademicCalendarRecord {
  id: string;
  academic_year: string;
  semester_type: 'ODD' | 'EVEN' | 'SUMMER';
  event_category: 'REGISTRATION' | 'ADD_DROP' | 'EXAMINATION' | 'HOLIDAY';
  event_name: string;
  start_date?: string | null;
  end_date?: string | null;
  is_tentative: boolean;
  is_ocr_verified: boolean;
  source_document_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface StudentRecord {
  id: string;
  roll_number: string;
  student_name: string;
  program_code: string;
  batch: string;
  current_semester: number;
  cumulative_gpa: number;
  total_earned_credits: number;
  enrolled_minor_code?: string | null;
  fee_dues_cleared: boolean;
  overall_attendance_pct: number;
  has_pending_disciplinary: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentCourseRecord {
  id: string;
  student_id: string;
  course_code: string;
  academic_year: string;
  term_name: string;
  semester_num: number;
  grade?: CourseGrade | null;
  grade_points?: number | null;
  credits_earned: number;
  attendance_pct: number;
  status: RegistrationStatus;
  is_passed: boolean;
  created_at: string;
}

export interface EvaluationCaseRecord {
  id: string;
  case_id: string;
  category: string;
  query: string;
  student_context?: Record<string, unknown> | null;
  expected_state: SystemState;
  expected_sources: string[];
  ground_truth_answer: string;
  deterministic_assertions?: Record<string, unknown> | null;
  created_at: string;
}

export interface EvaluationResultRecord {
  id: string;
  evaluation_case_id: string;
  run_timestamp: string;
  model_name: string;
  actual_state: SystemState;
  state_matches: boolean;
  grounded_score?: number | null;
  hallucination_detected: boolean;
  rule_engine_output?: Record<string, unknown> | null;
  retrieved_sources?: Record<string, unknown> | null;
  generated_answer: string;
  latency_ms: number;
  created_at: string;
}
