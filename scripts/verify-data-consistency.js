/**
 * Automated Data Consistency Check Script
 * Verifies course catalog, prerequisites, taxonomy, synthetic profiles, and academic rules.
 */

'use strict';

const {
  OFFICIAL_COURSE_CATALOG,
  COURSE_PREREQUISITES,
  SCHOOL_TAXONOMY,
  findCourseByCode
} = require('../src/lib/courses');

const {
  SYNTHETIC_PROFILES,
  getAcademicYear,
  evaluateEligibility
} = require('../src/lib/advisory-engine');

console.log('================================================================');
console.log('RUNNING AUTOMATED DATA CONSISTENCY CHECKS FOR VU ACADEMIC ADVISOR');
console.log('================================================================\n');

let errorCount = 0;
let warningCount = 0;

function reportError(msg) {
  console.error(`❌ [ERROR] ${msg}`);
  errorCount++;
}

function reportWarning(msg) {
  console.warn(`⚠️ [WARNING] ${msg}`);
  warningCount++;
}

function reportPass(msg) {
  console.log(`✓ [PASS] ${msg}`);
}

// 1. Duplicate Course Codes
const seenCodes = new Set();
OFFICIAL_COURSE_CATALOG.forEach(c => {
  if (!c.code) {
    reportError(`Course missing code: ${JSON.stringify(c)}`);
    return;
  }
  const clean = c.code.replace(/\s+/, '').toUpperCase();
  if (seenCodes.has(clean)) {
    reportError(`Duplicate course code found: ${c.code}`);
  } else {
    seenCodes.add(clean);
  }
});

// 2. Duplicate Course Names
const seenNames = new Set();
OFFICIAL_COURSE_CATALOG.forEach(c => {
  if (!c.name) {
    reportError(`Course code ${c.code} missing name.`);
    return;
  }
  const cleanName = c.name.toLowerCase().trim();
  if (seenNames.has(cleanName)) {
    reportWarning(`Duplicate course name: "${c.name}" (Code: ${c.code})`);
  } else {
    seenNames.add(cleanName);
  }
});

// 3. Invalid Credits
OFFICIAL_COURSE_CATALOG.forEach(c => {
  if (typeof c.credits !== 'number' || c.credits <= 0 || c.credits > 12) {
    reportError(`Invalid credit value for ${c.code}: ${c.credits}`);
  }
});

// 4. Missing School & Taxonomy Check
const validSchools = new Set(Object.values(SCHOOL_TAXONOMY));
OFFICIAL_COURSE_CATALOG.forEach(c => {
  if (!c.school) {
    reportError(`Course ${c.code} missing school property.`);
  } else if (!validSchools.has(c.school)) {
    reportError(`Course ${c.code} has invalid school taxonomy: "${c.school}"`);
  }
});

// 5. Invalid Prerequisites & Non-existent Target Check
for (const [code, prereqs] of Object.entries(COURSE_PREREQUISITES)) {
  const target = findCourseByCode(code);
  if (!target) {
    reportError(`Prerequisite table maps non-existent target course code: ${code}`);
  }
  if (!Array.isArray(prereqs)) {
    reportError(`Prerequisite entry for ${code} is not an array.`);
  } else {
    prereqs.forEach(pCode => {
      const prereqCourse = findCourseByCode(pCode);
      if (!prereqCourse) {
        reportError(`Course ${code} lists non-existent prerequisite: ${pCode}`);
      }
    });
  }
}

// 6. Student Enrollment & Completed Course Dependencies
SYNTHETIC_PROFILES.forEach(st => {
  if (!st.id || !st.display_name || !st.program) {
    reportError(`Invalid student profile schema: ${JSON.stringify(st)}`);
  }

  // Check semester year mapping
  const yearStr = getAcademicYear(st.semester);
  if (!yearStr) {
    reportError(`Failed to calculate academic year for semester ${st.semester}`);
  }

  // Check completed courses
  if (Array.isArray(st.completedCourses)) {
    const completedSet = new Set(st.completedCourses.map(c => c.courseCode.toUpperCase()));
    st.completedCourses.forEach(c => {
      const courseObj = findCourseByCode(c.courseCode);
      if (!courseObj) {
        reportError(`Student ${st.display_name} (${st.id}) lists non-existent completed course: ${c.courseCode}`);
      } else {
        // Check if student completed course without its required prerequisite
        const prereqs = COURSE_PREREQUISITES[c.courseCode.toUpperCase()] || [];
        prereqs.forEach(pCode => {
          if (!completedSet.has(pCode.toUpperCase())) {
            reportWarning(`Student ${st.display_name} completed ${c.courseCode} without recorded prerequisite ${pCode} in transcript.`);
          }
        });
      }
    });
  }
});

// 7. Test Primary Demo Scenario: Meera Krishnan asking about Deep Learning (DATA302)
const meera = SYNTHETIC_PROFILES.find(p => p.display_name === 'Meera Krishnan');
if (!meera) {
  reportError('Primary demo student profile "Meera Krishnan" not found in synthetic profiles!');
} else {
  const dlCourse = findCourseByCode('DATA302');
  const decision = evaluateEligibility(meera, dlCourse);

  if (decision.status !== 'NOT_ELIGIBLE' && decision.status !== 'PREREQUISITE_NOT_MET') {
    reportError(`Meera Krishnan eligibility test failed! Expected NOT_ELIGIBLE, got: ${decision.status}`);
  } else {
    reportPass('Primary Demo Scenario Passed: Meera Krishnan is correctly evaluated as NOT_ELIGIBLE for Deep Learning (DATA302).');
  }
}

console.log('\n================================================================');
console.log(`SUMMARY: ${errorCount} Errors | ${warningCount} Warnings`);
console.log('================================================================');

if (errorCount > 0) {
  process.exit(1);
} else {
  console.log('✅ ALL CONSISTENCY CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
}
