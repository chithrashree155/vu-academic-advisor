/**
 * Deterministic Academic Progression Engine
 * Implements Table 3 from Student Handbook Clause 12.1
 * - Progression to Year 2 (Sem 3 entry): Minimum CGPA of 4.00
 * - Progression to Year 3 and higher: Minimum CGPA of 5.00
 */

import { ProgressionCheckRequest, ProgressionCheckResult } from '../types/rules';

export function evaluateProgression(request: ProgressionCheckRequest): ProgressionCheckResult {
  const minCgpaRequired = request.targetYear === 2 ? 4.0 : 5.0;
  const isEligible = request.cumulativeGpa >= minCgpaRequired;

  return {
    targetYear: request.targetYear,
    isEligibleForPromotion: isEligible,
    requiredMinCgpa: minCgpaRequired,
    actualCgpa: request.cumulativeGpa,
    optionsIfIneligible: isEligible
      ? undefined
      : ['REPEAT_ACADEMIC_YEAR_FULL', 'RE_REGISTER_SPECIFIC_COURSES'],
    ruleCitation: 'VU Student Handbook August 2026, Section III, Clause 12.1, Table 3 (Progression Criteria)',
  };
}
