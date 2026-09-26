/**
 * Deterministic Rules Engine Interfaces and Result Types
 */

import { CourseGrade } from './database';

export interface PrerequisiteCheckRequest {
  studentId?: string;
  courseCode: string;
  batch: string;
  programCode: string;
  completedCourses: Array<{
    courseCode: string;
    grade?: CourseGrade | null;
    isPassed: boolean;
  }>;
}

export interface PrerequisiteCheckResult {
  courseCode: string;
  isEligible: boolean;
  unmetPrerequisites: Array<{
    prerequisiteCourseCode: string;
    rawText: string;
    reason: 'NOT_TAKEN' | 'FAILED' | 'UNCERTAIN_SOURCE' | 'MINIMUM_GRADE_NOT_MET';
  }>;
  metPrerequisites: string[];
  uncertaintyWarning?: string;
  ruleCitation: string;
}

export interface ProgressionCheckRequest {
  currentYear: 1 | 2 | 3 | 4;
  targetYear: 2 | 3 | 4;
  cumulativeGpa: number;
  totalEarnedCredits: number;
}

export interface ProgressionCheckResult {
  targetYear: number;
  isEligibleForPromotion: boolean;
  requiredMinCgpa: number;
  actualCgpa: number;
  optionsIfIneligible?: Array<
    | 'REPEAT_ACADEMIC_YEAR_FULL'
    | 'RE_REGISTER_SPECIFIC_COURSES'
  >;
  ruleCitation: string; // e.g. 'VU Student Handbook Section III, Clause 12.1, Table 3'
}

export interface AttendanceAuditRequest {
  courseCode: string;
  currentAttendancePct: number;
  hasMedicalExigency: boolean;
  medicalProofSubmittedWithinDays?: number; // Must be <= 3 working days per SOP Clause 2
  isApprovedSportsOrNationalEvent: boolean;
}

export interface AttendanceAuditResult {
  courseCode: string;
  attendancePct: number;
  status: 'ELIGIBLE' | 'RELAXATION_PERMITTED' | 'DEBARRED_FA';
  minimumRequiredPct: number;
  ruleExplanation: string;
  ruleCitation: string; // 'VU Student Handbook Section III Clause 7 & Student SOP Clause 2'
}

export interface DegreeAuditRequest {
  batch: string;
  programCode: string;
  completedCourses: Array<{
    courseCode: string;
    basketName: string;
    credits: number;
    grade?: CourseGrade | null;
    isPassed: boolean;
  }>;
  cumulativeGpa: number;
  feeDuesCleared: boolean;
  disciplinaryPending: boolean;
}

export interface DegreeAuditResult {
  isDegreeEligible: boolean;
  isDistinctionEligible: boolean; // CGPA >= 8.50 (Handbook Clause 15.3)
  minimumCgpaRequired: number;    // 5.00 (Handbook Clause 15.2.2)
  actualCgpa: number;
  totalRequiredCredits: number;   // 180 across all B.Tech batches
  totalEarnedCredits: number;
  basketBreakdown: Record<string, {
    requiredCredits: number;
    earnedCredits: number;
    isSatisfied: boolean;
    missingCredits: number;
  }>;
  unmetConditions: string[];
  ruleCitation: string;
}
