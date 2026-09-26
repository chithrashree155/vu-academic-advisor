/**
 * CommonJS Deterministic Rules Engine for VU AI Academic Advisor
 */

function evaluateAttendance(request) {
  const { currentAttendancePct, hasMedicalExigency, medicalProofSubmittedWithinDays, isApprovedSportsOrNationalEvent } = request;

  if (currentAttendancePct >= 75.0) {
    return {
      courseCode: request.courseCode,
      attendancePct: currentAttendancePct,
      status: 'ELIGIBLE',
      minimumRequiredPct: 75.0,
      ruleExplanation: 'Student satisfies the standard 75% attendance requirement for End-Term Examination.',
      ruleCitation: 'VU Student Handbook Section III Clause 7 & Student SOP Clause 2'
    };
  }

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
        ruleExplanation: 'Attendance is between 65% and 75%, and student has valid certified medical grounds submitted within 3 working days or approved official event representation.',
        ruleCitation: 'VU Student Handbook Section III Clause 7.2 & Student SOP Clause 2'
      };
    }

    return {
      courseCode: request.courseCode,
      attendancePct: currentAttendancePct,
      status: 'DEBARRED_FA',
      minimumRequiredPct: 75.0,
      ruleExplanation: 'Attendance is below 75% without valid medical proof submitted within the mandatory 3 working days window or approved event representation.',
      ruleCitation: 'VU Student Handbook Section III Clause 7.1 & Student SOP Clause 2'
    };
  }

  return {
    courseCode: request.courseCode,
    attendancePct: currentAttendancePct,
    status: 'DEBARRED_FA',
    minimumRequiredPct: 65.0,
    ruleExplanation: 'Attendance is below 65%. Even with medical certificates or event representation, attendance below 65% results in debarment and an FA grade.',
    ruleCitation: 'VU Student Handbook Section III Clause 7.3 & Student SOP Clause 2'
  };
}

function evaluateProgression(request) {
  const minCgpaRequired = request.targetYear === 2 ? 4.0 : 5.0;
  const isEligible = request.cumulativeGpa >= minCgpaRequired;

  return {
    targetYear: request.targetYear,
    isEligibleForPromotion: isEligible,
    requiredMinCgpa: minCgpaRequired,
    actualCgpa: request.cumulativeGpa,
    optionsIfIneligible: isEligible ? undefined : ['REPEAT_ACADEMIC_YEAR_FULL', 'RE_REGISTER_SPECIFIC_COURSES'],
    ruleCitation: 'VU Student Handbook August 2026, Section III, Clause 12.1, Table 3 (Progression Criteria)'
  };
}

function evaluatePrerequisites(request, prerequisiteRules = []) {
  const applicableRules = prerequisiteRules.filter(
    (rule) =>
      rule.course_code.toUpperCase() === request.courseCode.toUpperCase() &&
      rule.batch === request.batch &&
      rule.program_code.toUpperCase() === request.programCode.toUpperCase()
  );

  if (applicableRules.length === 0) {
    return {
      courseCode: request.courseCode,
      isEligible: true,
      unmetPrerequisites: [],
      metPrerequisites: [],
      ruleCitation: `Curriculum Spread Structure (Batch ${request.batch})`
    };
  }

  const unmet = [];
  const met = [];

  for (const rule of applicableRules) {
    if (rule.is_uncertain || !rule.prerequisite_course_code) {
      unmet.push({
        prerequisiteCourseCode: rule.prerequisite_course_code || 'UNCERTAIN',
        rawText: rule.raw_prerequisite_text,
        reason: 'UNCERTAIN_SOURCE'
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
        reason: 'NOT_TAKEN'
      });
    } else if (!completedRecord.isPassed) {
      unmet.push({
        prerequisiteCourseCode: prereqCode,
        rawText: rule.raw_prerequisite_text,
        reason: 'FAILED'
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
    ruleCitation: `Curriculum Spread Structure (Batch ${request.batch}, Program ${request.programCode})`
  };
}

module.exports = {
  evaluateAttendance,
  evaluateProgression,
  evaluatePrerequisites
};
