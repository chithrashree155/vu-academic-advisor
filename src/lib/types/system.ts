/**
 * System States and Core Architecture Types for VU Academic Advisor
 */

export type SystemState =
  | 'ANSWERABLE'
  | 'NEEDS_STUDENT_INFORMATION'
  | 'NEEDS_CLARIFICATION'
  | 'INSUFFICIENT_INFORMATION'
  | 'CONFLICTING_SOURCES'
  | 'OUT_OF_SCOPE';

export type SourceHierarchyType =
  | 'STUDENT_HANDBOOK'       // Level 1: Official handbook & academic regulations
  | 'CURRICULUM_STRUCTURE'   // Level 2: Program semester spreads & credit baskets
  | 'COURSE_CATALOGUE'       // Level 3: Master course definitions
  | 'COURSE_OFFERING'        // Level 4: Term-specific course lists
  | 'STUDENT_SOP'            // Level 5: Standard Operating Procedures
  | 'ACADEMIC_CALENDAR'      // Level 6: Dates & milestones
  | 'SUPPORTING_INFO';        // Level 7: Portal notifications / web support

export interface EvidenceCitation {
  documentTitle: string;
  sourceType: SourceHierarchyType;
  hierarchyLevel: number;
  sectionOrSheet?: string;
  clauseNumber?: string;
  pageNumber?: number;
  batchScope?: string[];
  excerpt: string;
  confidence: number;
}

export type QueryIntent =
  | 'COURSE_ELIGIBILITY'         // Can I take course X?
  | 'PREREQUISITE_INQUIRY'       // What are the prerequisites for X?
  | 'PROGRESSION_CHECK'          // Will I be promoted to year 3?
  | 'ATTENDANCE_POLICY'          // What happens if attendance drops below 75%?
  | 'ADD_DROP_POLICY'            // What is the deadline to drop a course?
  | 'DEGREE_AUDIT'               // How many credits do I need to graduate?
  | 'MINOR_ENROLLMENT'           // Can I take a minor in Finance?
  | 'SUMMER_TERM_OFFERING'       // Is Data Structures offered in Summer 2026?
  | 'GENERAL_POLICY'             // General handbook / SOP rule
  | 'OUT_OF_SCOPE';              // Non-academic / generic conversational

export interface IntentClassificationResult {
  intent: QueryIntent;
  requiresStudentProfile: boolean;
  extractedParameters: {
    courseCode?: string;
    courseName?: string;
    program?: string;
    batch?: string;
    semester?: number;
    minorCode?: string;
    term?: string;
  };
  confidence: number;
}

export interface AdvisorResponse {
  state: SystemState;
  answer: string;
  sources: EvidenceCitation[];
  ruleEvaluationResults?: Record<string, unknown>;
  missingInformationRequired?: string[];
  suggestedFollowUps?: string[];
  debugTrace?: {
    intent: QueryIntent;
    latencyMs: number;
    retrievalCount: number;
  };
}
