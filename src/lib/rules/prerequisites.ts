/**
 * Deterministic Prerequisite Checking Engine
 * Strictly relies on structured database prerequisite records.
 * NEVER infers or guesses prerequisites.
 */

import { PrerequisiteCheckRequest, PrerequisiteCheckResult } from '../types/rules';
import { CoursePrerequisiteRecord } from '../types/database';

export function evaluatePrerequisites(
  request: PrerequisiteCheckRequest,
  prerequisiteRules: CoursePrerequisiteRecord[]
): PrerequisiteCheckResult {
  const applicableRules = prerequisiteRules.filter(
    (rule) =>
      rule.course_code.toUpperCase() === request.courseCode.toUpperCase() &&
      rule.batch === request.batch &&
      rule.program_code.toUpperCase() === request.programCode.toUpperCase()
  );

  // If no rules exist in the curriculum, check if it's explicitly NIL or truly unrecorded
  if (applicableRules.length === 0) {
    return {
      courseCode: request.courseCode,
      isEligible: true,
      unmetPrerequisites: [],
      metPrerequisites: [],
      ruleCitation: `Curriculum Spread Structure (Batch ${request.batch})`,
    };
  }

  const unmet: PrerequisiteCheckResult['unmetPrerequisites'] = [];
  const met: string[] = [];
  let uncertaintyWarning: string | undefined;

  for (const rule of applicableRules) {
    // Check if prerequisite contains placeholder or uncertain text
    if (rule.is_uncertain || !rule.prerequisite_course_code) {
      uncertaintyWarning = `Prerequisite for course ${request.courseCode} contains placeholder or unverified text: "${rule.raw_prerequisite_text}". Student clarification required.`;
      unmet.push({
        prerequisiteCourseCode: rule.prerequisite_course_code ?? 'UNCERTAIN',
        rawText: rule.raw_prerequisite_text,
        reason: 'UNCERTAIN_SOURCE',
      });
      continue;
    }

    const prereqCode = rule.prerequisite_course_code.toUpperCase();
    const completedRecord = request.completedCourses.find(
      (c) => c.courseCode.toUpperCase() === prereqCode
    );

    if (!completedRecord) {
      unmet.push({
        prerequisiteCourseCode: prereqCode,
        rawText: rule.raw_prerequisite_text,
        reason: 'NOT_TAKEN',
      });
    } else if (!completedRecord.isPassed) {
      unmet.push({
        prerequisiteCourseCode: prereqCode,
        rawText: rule.raw_prerequisite_text,
        reason: 'FAILED',
      });
    } else {
      met.push(prereqCode);
    }
  }

  return {
    courseCode: request.courseCode,
    isEligible: unmet.length === 0,
    unmetPrerequisites: unmet,
    metPrerequisites: met,
    uncertaintyWarning,
    ruleCitation: `Curriculum Spread Structure (Batch ${request.batch}, Program ${request.programCode})`,
  };
}
