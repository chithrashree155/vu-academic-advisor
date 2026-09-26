/**
 * Deterministic Attendance Evaluation Engine
 * Implements VU Student Handbook Clause 7 and Student SOP Clause 2:
 * - 75% standard attendance requirement to appear for End-Term Examination
 * - Relaxation down to 65% for serious medical exigencies or approved state/national/international events
 * - Medical applications must be submitted within 3 working days after rejoining
 * - Below 65% is an absolute bar (FA grade)
 */

import { AttendanceAuditRequest, AttendanceAuditResult } from '../types/rules';

export function evaluateAttendance(request: AttendanceAuditRequest): AttendanceAuditResult {
  const { currentAttendancePct, hasMedicalExigency, medicalProofSubmittedWithinDays, isApprovedSportsOrNationalEvent } =
    request;

  if (currentAttendancePct >= 75.0) {
    return {
      courseCode: request.courseCode,
      attendancePct: currentAttendancePct,
      status: 'ELIGIBLE',
      minimumRequiredPct: 75.0,
      ruleExplanation: 'Student satisfies the standard 75% attendance requirement for End-Term Examination.',
      ruleCitation: 'VU Student Handbook Section III Clause 7 & Student SOP Clause 2',
    };
  }

  // Check relaxation eligibility (65% to 74.99%)
  if (currentAttendancePct >= 65.0) {
    const isMedicalValid =
      hasMedicalExigency &&
      typeof medicalProofSubmittedWithinDays === 'number' &&
      medicalProofSubmittedWithinDays <= 3;

    if (isMedicalValid || isApprovedSportsOrNationalEvent) {
      return {
        courseCode: request.courseCode,
        attendancePct: currentAttendancePct,
        status: 'RELAXATION_PERMITTED',
        minimumRequiredPct: 65.0,
        ruleExplanation:
          'Attendance is between 65% and 75%, and student has valid certified medical grounds submitted within 3 working days or approved official event representation.',
        ruleCitation: 'VU Student Handbook Section III Clause 7.2 & Student SOP Clause 2',
      };
    }

    return {
      courseCode: request.courseCode,
      attendancePct: currentAttendancePct,
      status: 'DEBARRED_FA',
      minimumRequiredPct: 75.0,
      ruleExplanation:
        'Attendance is below 75% without valid medical proof submitted within the mandatory 3 working days window or approved event representation.',
      ruleCitation: 'VU Student Handbook Section III Clause 7.1 & Student SOP Clause 2',
    };
  }

  // Below 65% is strict debarment
  return {
    courseCode: request.courseCode,
    attendancePct: currentAttendancePct,
    status: 'DEBARRED_FA',
    minimumRequiredPct: 65.0,
    ruleExplanation:
      'Attendance is below 65%. Even with medical certificates or event representation, attendance below 65% results in debarment and an FA grade.',
    ruleCitation: 'VU Student Handbook Section III Clause 7.3 & Student SOP Clause 2',
  };
}
