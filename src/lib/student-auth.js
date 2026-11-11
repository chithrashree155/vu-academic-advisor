/**
 * Secure Student Authentication & Profile Management Engine
 * Vidyashilp University (VU Academic Advisor)
 *
 * Implements salted password hashing (crypto.scryptSync), stateless HMAC-SHA256 session management,
 * and 6 secure synthetic B.Tech student profiles grounded strictly in official university datasets:
 * - Semester_Spread_Structures_Sept_2026.xlsx
 * - Minor_Courses_for_BTech_Students.xlsx
 * - Student Handbook Aug 2026.pdf
 * - SOP STUDENT 19082025 - Final.pdf
 *
 * University Synthetic Student ID Format: 2022UG00001 to 2026UG00001
 * Backward-compatible aliases: VU-BTECH-2201 to VU-BTECH-2606
 */

'use strict';

const crypto = require('crypto');

// Server secret for stateless HMAC session signing (persists across Vercel serverless cold starts)
const SESSION_SECRET = process.env.SESSION_SECRET || 'vu-advisor-auth-stateless-secret-key-2026-btech-cse';
// Session validity: 24 hours
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

// Per-student isolated chat history: Map<studentId, Array<{ sender: string, text: string, timestamp: number }>>
const studentChatHistories = new Map();
// Revoked session blacklist for explicit logouts
const revokedTokens = new Set();

/**
 * Unique random salt generator helper for secure student credentials
 */
function generateSecureSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Hash password with cryptographic salt using Scrypt
 */
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

/**
 * Verify password against stored hash using timing-safe comparison
 */
function verifyPassword(password, hash, salt) {
  try {
    const computed = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch (err) {
    return false;
  }
}

/**
 * Dynamic Course-Wise Attendance Calculator
 * Uses the rigorous dynamic attendance formulas:
 * 1. Current %: (attended / conducted) * 100
 * 2. Classes needed for 75%: (attended + x)/(conducted + x) >= 0.75  =>  x >= ceil((0.75 * conducted - attended) / 0.25)
 * 3. Classes can miss: attended / (conducted + y) >= 0.75  =>  y <= floor((attended - 0.75 * conducted) / 0.75)
 */
function calculateAttendanceStatus(conducted, attended) {
  const percentage = conducted > 0 ? (attended / conducted) * 100 : 100;
  const roundedPct = Math.round(percentage * 100) / 100;
  const isEligible = roundedPct >= 75.0;

  let classesNeededFor75 = 0;
  if (roundedPct < 75.0) {
    classesNeededFor75 = Math.max(0, Math.ceil((0.75 * conducted - attended) / 0.25));
  }

  let classesCanMiss = 0;
  if (roundedPct >= 75.0) {
    classesCanMiss = Math.max(0, Math.floor((attended - 0.75 * conducted) / 0.75));
  }

  return {
    conducted,
    attended,
    percentage: roundedPct,
    isEligible,
    classesNeededFor75,
    classesCanMiss,
    status: isEligible ? 'Eligible' : 'At Risk (Below 75%)'
  };
}

// ── 6 SECURE SYNTHETIC B.TECH STUDENT PROFILES GROUNDED IN OFFICIAL DATA ──
// All students are enrolled in B.Tech (Hons.) Computer Science & Engineering,
// School of Computational and Data Sciences.

const RAW_STUDENT_DATA = [
  // ── STUDENT 1: Batch 2022, Sem 5 (Case 1: Approved Medical Leave, Eligible Not Selected Specialisation, Finance Minor Pursuing) ──
  {
    id: '2022UG00001',
    legacyAliases: ['VU-BTECH-2201'],
    display_name: 'Aarav Sharma',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2022',
    semester: 5,
    specialisation: 'Not specified',
    specialisationTracking: {
      status: 'Eligible but has not selected',
      trackName: 'Not selected',
      availableTracks: ['Applied Deep Learning', 'Full Stack Development'],
      totalCredits: 20,
      completedCredits: 0,
      remainingCredits: 20,
      eligibilitySemester: 5,
      note: 'Specialization Tracks (20 credits across 5 SPT courses) begin in Semester 5 for Batch 2022. You are eligible in Semester 5 to declare Applied Deep Learning or Full Stack Development, but have not yet finalized a selection.',
      courses: [
        { code: 'MATH401 / COMP401', name: 'SPT #1: Probabilistic Graph Models / Web Framework', credits: 4, semester: 5, status: 'Pending' },
        { code: 'DATA402 / DATA406', name: 'SPT #2: Advanced Visualization and Storytelling / Big Data Framework', credits: 4, semester: 6, status: 'Pending' },
        { code: 'DATA403 / COMP402', name: 'SPT #3: Natural Language Processing / Software Architecture and Deployments', credits: 4, semester: 7, status: 'Pending' },
        { code: 'DATA404', name: 'SPT #4: Multi Modal Learning / Cloud Computing', credits: 4, semester: 7, status: 'Pending' },
        { code: 'DATA405', name: 'SPT #5: Reinforcement Learning / Cognitive Computing', credits: 4, semester: 7, status: 'Pending' }
      ]
    },
    degreeTotalCredits: 180,
    declaredMinor: 'Finance',
    minorSchool: 'School of Business Studies',
    minorStatus: 'Selected and currently pursuing (24 defined credits for Batch 2022; 6/24 credits completed)',
    minorTracking: {
      status: 'Selected and currently pursuing',
      eligibilityNote: 'Minor courses span Semesters 3 to 7 in Batch 2022 (24 total minor credits).',
      totalCredits: 24,
      completedCredits: 6,
      remainingCredits: 18
    },
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 6,
      remainingCredits: 18,
      school: 'School of Business Studies',
      batch: '2022',
      coursesOffered: [
        { code: 'FAMA', name: 'Financial and Management Accounting (FAMA)', ltp: '2-1-0', credits: 3, status: 'Completed', semester: 3, grade: 'A', prerequisites: 'Nil' },
        { code: 'FINA333', name: 'Fiancial Institutions Markets and Services', ltp: '2-1-0', credits: 3, status: 'Completed', semester: 4, grade: 'A', prerequisites: 'MGMT208 (refers to S3 FAMA)' },
        { code: 'MGMT207', name: 'Corporate Finance', ltp: '2-1-0', credits: 3, status: 'Pending', semester: 5, prerequisites: 'FAMA' },
        { code: 'MGMT209', name: 'Financial Statement Anaylsis', ltp: '2-1-0', credits: 3, status: 'Pending', semester: 6, prerequisites: 'FINA201 (refers to S3 FAMA)' },
        { code: 'MGMT210', name: 'Basics of Investment Management', ltp: '2-2-0', credits: 4, status: 'Pending', semester: 6, prerequisites: 'FINA333' },
        { code: 'MGMT213', name: 'Introduction To Fintech', ltp: '1-1-0', credits: 2, status: 'Pending', semester: 7, prerequisites: 'FINA333' },
        { code: 'MGMT323', name: 'Basics of Startup Finance', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 7, prerequisites: 'MGMT207' },
        { code: 'MGMT203', name: 'Business Strategy Simulation', ltp: '0-0-0', credits: 2, status: 'Pending', semester: 7, prerequisites: 'MKMT201 / MGMT207 / FINA201' }
      ]
    },
    // Semester-wise CGPA and Credit Records (Sem 1 to Sem 4 completed = 91 credits, weighted CGPA = 8.59)
    semesterHistory: [
      { semester: 1, sgpa: 8.40, credits: 22, status: 'Completed' },
      { semester: 2, sgpa: 8.65, credits: 24, status: 'Completed' },
      { semester: 3, sgpa: 8.50, credits: 22, status: 'Completed' },
      { semester: 4, sgpa: 8.80, credits: 23, status: 'Completed' }
    ],
    completedCredits: 91,
    remainingCredits: 89,
    cgpa: 8.59,
    // Case 1: Approved Medical Leave (13 calendar days inclusive: 10-22 Sept 2024)
    medicalLeave: {
      hasRecord: true,
      status: 'Approved',
      duration: '13 calendar days (10-Sep-2024 to 22-Sep-2024, inclusive)',
      reason: 'Acute Typhoid (Synthetic Evaluation Scenario)',
      affectedCourses: [
        { code: 'COMP208', name: 'Networks', sessionsMissed: 4 },
        { code: 'COMP207', name: 'Operating Systems', sessionsMissed: 3 }
      ],
      approvalAuthority: 'Dean & Academic Committee per SOP Clause 2',
      submissionStatus: 'Submitted verified hospital certificate within 3 working days',
      academicImpact: 'Under Handbook Clause 7.3, medical leave does not automatically waive or grant attendance credits. It qualifies the student for attendance condonation down to 65% if overall attendance drops below 75%. Since Aarav maintains >80% in all courses, eligibility is fully preserved without condonation.'
    },
    // Verified completed courses from Batch 2022 curriculum spread (Semesters 1-4) & official Finance minor S3-S4
    completedCourses: [
      { code: 'UCOR103', courseCode: 'UCOR103', name: 'Communication Skills', courseName: 'Communication Skills', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR104', courseCode: 'UCOR104', name: 'Problem Solving with Design Thinking', courseName: 'Problem Solving with Design Thinking', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR102', courseCode: 'UCOR102', name: 'Introduction to writing', courseName: 'Introduction to writing', credits: 2, semesterTaken: 1, grade: 'B+', isPassed: true, category: 'Univ Core' },
      { code: 'MATH201', courseCode: 'MATH201', name: 'Calculus', courseName: 'Calculus', credits: 3, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'COMP132', courseCode: 'COMP132', name: 'Design Workshop', courseName: 'Design Workshop', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'MTSC111', courseCode: 'MTSC111', name: 'Materials for Smart Devices', courseName: 'Materials for Smart Devices', credits: 3, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'DATA131', courseCode: 'DATA131', name: 'Visualizing Data for Story Telling', courseName: 'Visualizing Data for Story Telling', credits: 2, semesterTaken: 1, grade: 'A+', isPassed: true, category: 'Foundation' },
      { code: 'PSYC101', courseCode: 'PSYC101', name: 'Introduction to Psychology', courseName: 'Introduction to Psychology', credits: 3, semesterTaken: 1, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'DATA130', courseCode: 'DATA130', name: 'Computational Thinking', courseName: 'Computational Thinking', credits: 3, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'UCOR203', courseCode: 'UCOR203', name: 'Leadership and Teamwork Skills', courseName: 'Leadership and Teamwork Skills', credits: 2, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR701', courseCode: 'UCOR701', name: 'Community Engagement & Service Experience', courseName: 'Community Engagement & Service Experience', credits: 1, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR106', courseCode: 'UCOR106', name: 'Learning to Learn', courseName: 'Learning to Learn', credits: 2, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'MATH202', courseCode: 'MATH202', name: 'Probability Theory', courseName: 'Probability Theory', credits: 3, semesterTaken: 2, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'MTSC211', courseCode: 'MTSC211', name: 'Sustainable Smart Materials', courseName: 'Sustainable Smart Materials', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'ENGL201', courseCode: 'ENGL201', name: 'Academic Writing', courseName: 'Academic Writing', credits: 3, semesterTaken: 2, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'COMP201', courseCode: 'COMP201', name: 'Data Structures', courseName: 'Data Structures', credits: 4, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'MATH205', courseCode: 'MATH205', name: 'Statistics with R', courseName: 'Statistics with R', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'DATA201', courseCode: 'DATA201', name: 'Foundations to Data Science', courseName: 'Foundations to Data Science', credits: 3, semesterTaken: 2, grade: 'A+', isPassed: true, category: 'Program HONORS' },
      { code: 'UCOR205', courseCode: 'UCOR205', name: 'Socio Cultural Perspectives on Indian Life-SPIL', courseName: 'Socio Cultural Perspectives on Indian Life-SPIL', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR201', courseCode: 'UCOR201', name: 'Introduction to Epistemology', courseName: 'Introduction to Epistemology', credits: 2, semesterTaken: 3, grade: 'B+', isPassed: true, category: 'Univ Core' },
      { code: 'MATH204', courseCode: 'MATH204', name: 'Linear Algebra', courseName: 'Linear Algebra', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'COMP203', courseCode: 'COMP203', name: 'Analysis of Algorithms', courseName: 'Analysis of Algorithms', credits: 4, semesterTaken: 3, grade: 'B+', isPassed: true, category: 'Program CORE' },
      { code: 'COMP202', courseCode: 'COMP202', name: 'Theoretical Computer Science', courseName: 'Theoretical Computer Science', credits: 4, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'DATA202', courseCode: 'DATA202', name: 'Exploratory Data Analysis', courseName: 'Exploratory Data Analysis', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'FAMA', courseCode: 'FAMA', name: 'Financial and Management Accounting (FAMA) [Minor]', courseName: 'Financial and Management Accounting (FAMA) [Minor]', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Minor (Finance)' },
      { code: 'COMP205', courseCode: 'COMP205', name: 'Object Oriented Programming', courseName: 'Object Oriented Programming', credits: 3, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'COMP204', courseCode: 'COMP204', name: 'Digital Design and Computer Organization', courseName: 'Digital Design and Computer Organization', credits: 4, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'COMP301', courseCode: 'COMP301', name: 'Artificial Intelligence', courseName: 'Artificial Intelligence', credits: 4, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'COMP209', courseCode: 'COMP209', name: 'Databases Management', courseName: 'Databases Management', credits: 4, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'MATH301', courseCode: 'MATH301', name: 'Optimization Techniques for Data Science', courseName: 'Optimization Techniques for Data Science', credits: 4, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'SLAD207', courseCode: 'SLAD207', name: 'Foundation Seminar', courseName: 'Foundation Seminar', credits: 1, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'FINA333', courseCode: 'FINA333', name: 'Fiancial Institutions Markets and Services [Minor]', courseName: 'Fiancial Institutions Markets and Services [Minor]', credits: 3, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Minor (Finance)' }
    ],
    // Enrolled Courses in Batch 2022 Semester 5 (5 courses preserving dashboard & attendance tests)
    enrolledCourses: [
      {
        code: 'COMP208',
        name: 'Networks',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'NIL',
        conducted: 32,
        attended: 26,
        category: 'Program CORE'
      },
      {
        code: 'COMP207',
        name: 'Operating Systems',
        ltp: '2-0-2',
        credits: 3,
        prerequisite: 'NIL',
        conducted: 28,
        attended: 23,
        category: 'Program CORE'
      },
      {
        code: 'DATA301',
        name: 'Machine Learning',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'DATA202, MATH301',
        conducted: 34,
        attended: 30,
        category: 'Program HONORS'
      },
      {
        code: 'DATA207',
        name: 'Human Centric AI',
        ltp: '1-0-2',
        credits: 2,
        prerequisite: 'COMP210/COMP301',
        conducted: 20,
        attended: 18,
        category: 'Program HONORS'
      },
      {
        code: 'DATA801',
        name: 'Summer Training/Internship',
        ltp: '0-0-0',
        credits: 2,
        prerequisite: 'NIL',
        conducted: 16,
        attended: 15,
        category: 'Internship/ Capstone Project'
      }
    ],
    nextSemesterCourses: [
      { code: 'LANG101', name: 'Language', ltp: '0-0-0', credits: 3, prerequisite: 'NIL', basket: 'Foundation' },
      { code: 'COMP206', name: 'Microprocessors and Computer Architecture', ltp: '3-0-2', credits: 4, prerequisite: 'COMP204, COMP207', basket: 'Program CORE' },
      { code: 'DATA302', name: 'Deep Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA301', basket: 'Program HONORS' },
      { code: 'DATA402 / DATA406', name: 'SPT-Course #2 (Advanced Visualization and Storytelling / Big Data Framework)', ltp: '2-0-4', credits: 4, prerequisite: 'DATA301 / NIL', basket: 'Specialization Tracks' },
      { code: 'MGMT209', name: 'Financial Statement Anaylsis [Minor: Finance]', ltp: '2-1-0', credits: 3, prerequisite: 'FINA201 (refers to S3 FAMA)', basket: 'Minor (Finance)' },
      { code: 'MGMT210', name: 'Basics of Investment Management [Minor: Finance]', ltp: '2-2-0', credits: 4, prerequisite: 'FINA333', basket: 'Minor (Finance)' }
    ],
    backlogs: [],
    salt: '9f8b3c1a4e2d7085a6b1c2d3e4f5a6b7',
    password: 'Student1@2022'
  },

  // ── STUDENT 2: Batch 2022, Sem 7 (Case 3: Backlog in COMP204 + Case 5: Selected Specialisation 'Applied Deep Learning' with Completed SPT Courses) ──
  {
    id: '2022UG00002',
    legacyAliases: ['VU-BTECH-2202'],
    display_name: 'Bhavya Patel',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2022',
    semester: 7,
    specialisation: 'Applied Deep Learning',
    specialisationTracking: {
      status: 'Selected and currently pursuing',
      trackName: 'Applied Deep Learning',
      availableTracks: ['Applied Deep Learning', 'Full Stack Development'],
      totalCredits: 20,
      completedCredits: 8,
      remainingCredits: 12,
      eligibilitySemester: 5,
      note: 'Selected Batch 2022 Applied Deep Learning Specialization Track (20 credits total). Completed 2 SPT courses (8 credits) in Semesters 5–6; currently pursuing the remaining 3 SPT courses (12 credits) in Semester 7.',
      courses: [
        { code: 'MATH401', name: 'Probabilistic Graph Models (SPT #1)', ltp: '3-0-2', credits: 4, semester: 5, status: 'Completed', grade: 'A' },
        { code: 'DATA402', name: 'Advanced Visualization and Storytelling (SPT #2)', ltp: '2-0-4', credits: 4, semester: 6, status: 'Completed', grade: 'A' },
        { code: 'DATA403', name: 'Natural Language Processing (SPT #3)', ltp: '2-0-4', credits: 4, semester: 7, status: 'In Progress' },
        { code: 'DATA404', name: 'Multi Modal Learning (SPT #4)', ltp: '2-0-4', credits: 4, semester: 7, status: 'In Progress' },
        { code: 'DATA405', name: 'Reinforcement Learning (SPT #5)', ltp: '2-0-4', credits: 4, semester: 7, status: 'In Progress' }
      ]
    },
    degreeTotalCredits: 180,
    declaredMinor: 'Psychology',
    minorSchool: 'School of Liberal Arts & Sciences',
    minorStatus: 'Selected and currently pursuing (24 defined credits for Batch 2022; 16/24 credits completed)',
    minorTracking: {
      status: 'Selected and currently pursuing',
      eligibilityNote: 'Minor courses span Semesters 3 to 7 in Batch 2022 (24 total minor credits).',
      totalCredits: 24,
      completedCredits: 16,
      remainingCredits: 8
    },
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 16,
      remainingCredits: 8,
      school: 'School of Liberal Arts & Sciences',
      batch: '2022',
      coursesOffered: [
        { code: 'PSYC201', name: 'Biological Psychology', ltp: '3-1-0', credits: 4, status: 'Completed', semester: 3, grade: 'A', prerequisites: 'Nil' },
        { code: 'PSYC202', name: 'Cognitive Psychology', ltp: '2-2-0', credits: 4, status: 'Completed', semester: 4, grade: 'B+', prerequisites: 'PSYC101' },
        { code: 'PSYC255', name: 'Psychopathology', ltp: '3-1-0', credits: 4, status: 'Completed', semester: 5, grade: 'A', prerequisites: 'Nil' },
        { code: 'PSYC241', name: 'Social Psychology', ltp: '2-2-0', credits: 4, status: 'Completed', semester: 6, grade: 'A', prerequisites: 'PSYC101' },
        { code: 'PSYC204', name: 'Developmental Psychology', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 6, prerequisites: 'PSYC101' },
        { code: 'PSYC303', name: 'Psychological Testing and Measurement', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 7, prerequisites: 'PSYC101, PSYC202, MATH131' }
      ]
    },
    // Semester-wise CGPA and Credit Records (Sem 1 to Sem 6 completed = 130 credits, weighted CGPA = 7.87)
    semesterHistory: [
      { semester: 1, sgpa: 8.00, credits: 22, status: 'Completed' },
      { semester: 2, sgpa: 8.15, credits: 24, status: 'Completed' },
      { semester: 3, sgpa: 7.80, credits: 23, status: 'Completed' },
      { semester: 4, sgpa: 6.85, credits: 21, status: 'Completed with Backlog in COMP204' },
      { semester: 5, sgpa: 8.10, credits: 23, status: 'Completed' },
      { semester: 6, sgpa: 8.35, credits: 17, status: 'Completed (COMP206 deferred pending COMP204)' }
    ],
    completedCredits: 130,
    remainingCredits: 50, // 180 - 130 = 50 (4 backlog COMP204 + 4 blocked COMP206 + 4 deferred UCOR/MTSC + 18 Sem 7 + 8 Minor + 12 Sem 8 Capstone)
    cgpa: 7.87,
    medicalLeave: {
      hasRecord: false,
      status: 'No medical leave recorded'
    },
    // Case 3: Backlog in COMP204 (Digital Design and Computer Organization)
    backlogs: [
      {
        code: 'COMP204',
        name: 'Digital Design and Computer Organization',
        semesterTaken: 4,
        credits: 4,
        ltp: '3-1-0',
        grade: 'F',
        status: 'Active Backlog (Pending Re-registration / Supplementary Evaluation)',
        prerequisiteFor: ['COMP206'],
        progressionImpact: 'Under Student Handbook Section III, Clause 12.1 (Degree Award Regulations), all mandatory core courses and 180 degree credits must be cleared with a passing grade (minimum grade point 4.0) to qualify for graduation. Bhavya must re-register and clear COMP204 before taking prerequisite-dependent COMP206.'
      }
    ],
    // Verified completed courses from Batch 2022 spread (Semesters 1-6, excluding failed COMP204 and blocked COMP206)
    completedCourses: [
      { code: 'UCOR103', courseCode: 'UCOR103', name: 'Communication Skills', courseName: 'Communication Skills', credits: 2, semesterTaken: 1, grade: 'B+', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR104', courseCode: 'UCOR104', name: 'Problem Solving with Design Thinking', courseName: 'Problem Solving with Design Thinking', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR102', courseCode: 'UCOR102', name: 'Introduction to writing', courseName: 'Introduction to writing', credits: 2, semesterTaken: 1, grade: 'B', isPassed: true, category: 'Univ Core' },
      { code: 'MATH201', courseCode: 'MATH201', name: 'Calculus', courseName: 'Calculus', credits: 3, semesterTaken: 1, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'COMP132', courseCode: 'COMP132', name: 'Design Workshop', courseName: 'Design Workshop', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'MTSC111', courseCode: 'MTSC111', name: 'Materials for Smart Devices', courseName: 'Materials for Smart Devices', credits: 3, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'DATA131', courseCode: 'DATA131', name: 'Visualizing Data for Story Telling', courseName: 'Visualizing Data for Story Telling', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'PSYC101', courseCode: 'PSYC101', name: 'Introduction to Psychology', courseName: 'Introduction to Psychology', credits: 3, semesterTaken: 1, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'DATA130', courseCode: 'DATA130', name: 'Computational Thinking', courseName: 'Computational Thinking', credits: 3, semesterTaken: 1, grade: 'B+', isPassed: true, category: 'Program CORE' },
      { code: 'UCOR203', courseCode: 'UCOR203', name: 'Leadership and Teamwork Skills', courseName: 'Leadership and Teamwork Skills', credits: 2, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR701', courseCode: 'UCOR701', name: 'Community Engagement & Service Experience', courseName: 'Community Engagement & Service Experience', credits: 1, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR106', courseCode: 'UCOR106', name: 'Learning to Learn', courseName: 'Learning to Learn', credits: 2, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'MATH202', courseCode: 'MATH202', name: 'Probability Theory', courseName: 'Probability Theory', credits: 3, semesterTaken: 2, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'MTSC211', courseCode: 'MTSC211', name: 'Sustainable Smart Materials', courseName: 'Sustainable Smart Materials', credits: 3, semesterTaken: 2, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'ENGL201', courseCode: 'ENGL201', name: 'Academic Writing', courseName: 'Academic Writing', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'COMP201', courseCode: 'COMP201', name: 'Data Structures', courseName: 'Data Structures', credits: 4, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'MATH205', courseCode: 'MATH205', name: 'Statistics with R', courseName: 'Statistics with R', credits: 3, semesterTaken: 2, grade: 'B+', isPassed: true, category: 'Program CORE' },
      { code: 'DATA201', courseCode: 'DATA201', name: 'Foundations to Data Science', courseName: 'Foundations to Data Science', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'UCOR205', courseCode: 'UCOR205', name: 'Socio Cultural Perspectives on Indian Life-SPIL', courseName: 'Socio Cultural Perspectives on Indian Life-SPIL', credits: 3, semesterTaken: 3, grade: 'B+', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR201', courseCode: 'UCOR201', name: 'Introduction to Epistemology', courseName: 'Introduction to Epistemology', credits: 2, semesterTaken: 3, grade: 'B+', isPassed: true, category: 'Univ Core' },
      { code: 'MATH204', courseCode: 'MATH204', name: 'Linear Algebra', courseName: 'Linear Algebra', credits: 3, semesterTaken: 3, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'COMP203', courseCode: 'COMP203', name: 'Analysis of Algorithms', courseName: 'Analysis of Algorithms', credits: 4, semesterTaken: 3, grade: 'B', isPassed: true, category: 'Program CORE' },
      { code: 'COMP202', courseCode: 'COMP202', name: 'Theoretical Computer Science', courseName: 'Theoretical Computer Science', credits: 4, semesterTaken: 3, grade: 'B+', isPassed: true, category: 'Program CORE' },
      { code: 'DATA202', courseCode: 'DATA202', name: 'Exploratory Data Analysis', courseName: 'Exploratory Data Analysis', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'PSYC201', courseCode: 'PSYC201', name: 'Biological Psychology [Minor]', courseName: 'Biological Psychology [Minor]', credits: 4, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Minor (Psychology)' },
      { code: 'UCOR210', courseCode: 'UCOR210', name: 'Critical Thinking', courseName: 'Critical Thinking', credits: 2, semesterTaken: 4, grade: 'B+', isPassed: true, category: 'Univ Core' },
      { code: 'COMP205', courseCode: 'COMP205', name: 'Object Oriented Programming', courseName: 'Object Oriented Programming', credits: 3, semesterTaken: 4, grade: 'B+', isPassed: true, category: 'Program CORE' },
      { code: 'COMP301', courseCode: 'COMP301', name: 'Artificial Intelligence', courseName: 'Artificial Intelligence', credits: 4, semesterTaken: 4, grade: 'B', isPassed: true, category: 'Program CORE' },
      { code: 'COMP209', courseCode: 'COMP209', name: 'Databases Management', courseName: 'Databases Management', credits: 4, semesterTaken: 4, grade: 'B+', isPassed: true, category: 'Program CORE' },
      { code: 'MATH301', courseCode: 'MATH301', name: 'Optimization Techniques for Data Science', courseName: 'Optimization Techniques for Data Science', credits: 4, semesterTaken: 4, grade: 'B+', isPassed: true, category: 'Program HONORS' },
      { code: 'PSYC202', courseCode: 'PSYC202', name: 'Cognitive Psychology [Minor]', courseName: 'Cognitive Psychology [Minor]', credits: 4, semesterTaken: 4, grade: 'B+', isPassed: true, category: 'Minor (Psychology)' },
      { code: 'COMP208', courseCode: 'COMP208', name: 'Networks', courseName: 'Networks', credits: 4, semesterTaken: 5, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'COMP207', courseCode: 'COMP207', name: 'Operating Systems', courseName: 'Operating Systems', credits: 3, semesterTaken: 5, grade: 'B+', isPassed: true, category: 'Program CORE' },
      { code: 'DATA301', courseCode: 'DATA301', name: 'Machine Learning', courseName: 'Machine Learning', credits: 4, semesterTaken: 5, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'DATA207', courseCode: 'DATA207', name: 'Human Centric AI', courseName: 'Human Centric AI', credits: 2, semesterTaken: 5, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'MATH401', courseCode: 'MATH401', name: 'Probabilistic Graph Models [SPT: Applied Deep Learning]', courseName: 'Probabilistic Graph Models [SPT: Applied Deep Learning]', credits: 4, semesterTaken: 5, grade: 'A', isPassed: true, category: 'Specialization Tracks (Applied Deep Learning)' },
      { code: 'DATA801', courseCode: 'DATA801', name: 'Summer Training/Internship', courseName: 'Summer Training/Internship', credits: 2, semesterTaken: 5, grade: 'A+', isPassed: true, category: 'Internship/ Capstone Project' },
      { code: 'PSYC255', courseCode: 'PSYC255', name: 'Psychopathology [Minor]', courseName: 'Psychopathology [Minor]', credits: 4, semesterTaken: 5, grade: 'A', isPassed: true, category: 'Minor (Psychology)' },
      { code: 'LANG101', courseCode: 'LANG101', name: 'Language', courseName: 'Language', credits: 3, semesterTaken: 6, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'DATA302', courseCode: 'DATA302', name: 'Deep Learning', courseName: 'Deep Learning', credits: 4, semesterTaken: 6, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'DATA402', courseCode: 'DATA402', name: 'Advanced Visualization and Storytelling [SPT: Applied Deep Learning]', courseName: 'Advanced Visualization and Storytelling [SPT: Applied Deep Learning]', credits: 4, semesterTaken: 6, grade: 'A', isPassed: true, category: 'Specialization Tracks (Applied Deep Learning)' },
      { code: 'SLAD206', courseCode: 'SLAD206', name: 'Human Values in Work and Life', courseName: 'Human Values in Work and Life', credits: 2, semesterTaken: 6, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'PSYC241', courseCode: 'PSYC241', name: 'Social Psychology [Minor]', courseName: 'Social Psychology [Minor]', credits: 4, semesterTaken: 6, grade: 'A', isPassed: true, category: 'Minor (Psychology)' }
    ],
    // Enrolled Courses in Batch 2022 Semester 7 (Official Sem Spread BTECH-2022)
    enrolledCourses: [
      {
        code: 'COMP302',
        name: 'Internet of Things',
        ltp: '0-0-4',
        credits: 2,
        prerequisite: 'COMP132, COMP201, COMP206, COMP208, COMP301',
        conducted: 24,
        attended: 21,
        category: 'Program CORE'
      },
      {
        code: 'DATA403',
        name: 'Natural Language Processing [SPT: Applied Deep Learning]',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'DATA302',
        conducted: 30,
        attended: 26,
        category: 'Specialization Tracks (Applied Deep Learning)'
      },
      {
        code: 'DATA404',
        name: 'Multi Modal Learning [SPT: Applied Deep Learning]',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'DATA302',
        conducted: 30,
        attended: 27,
        category: 'Specialization Tracks (Applied Deep Learning)'
      },
      {
        code: 'DATA405',
        name: 'Reinforcement Learning [SPT: Applied Deep Learning]',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'MATH202, MATH204',
        conducted: 30,
        attended: 25,
        category: 'Specialization Tracks (Applied Deep Learning)'
      },
      {
        code: 'DATA802',
        name: 'Interdisciplinary Project',
        ltp: '0-0-0',
        credits: 4,
        prerequisite: 'NIL',
        conducted: 18,
        attended: 17,
        category: 'Internship/ Capstone Project'
      }
    ],
    nextSemesterCourses: [
      { code: 'DATA803', name: 'Capstone Project/Industrial Internship', ltp: '0-0-0', credits: 12, prerequisite: 'NIL', basket: 'Internship/ Capstone Project' },
      { code: 'COMP204', name: 'Digital Design and Computer Organization [Mandatory Backlog Clearance]', ltp: '3-1-0', credits: 4, prerequisite: 'NIL', basket: 'Program CORE (Backlog Clearance)' },
      { code: 'COMP206', name: 'Microprocessors and Computer Architecture [Pending Prerequisite: COMP204]', ltp: '3-0-2', credits: 4, prerequisite: 'COMP204, COMP207', basket: 'Program CORE (Blocked until COMP204 cleared)' }
    ],
    salt: 'a1b2c3d4e5f6789012345678abcdef01',
    password: 'Student2@2022'
  },

  // ── STUDENT 3: Batch 2023, Sem 5 (Case 4 & 6: Design Minor with completed minor courses, Eligible Not Selected Specialisation) ──
  {
    id: '2023UG00001',
    legacyAliases: ['VU-BTECH-2303'],
    display_name: 'Chirag Verma',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2023',
    semester: 5,
    specialisation: 'Not specified',
    specialisationTracking: {
      status: 'Eligible but has not selected',
      trackName: 'Not selected',
      availableTracks: ['Applied Deep Learning', 'Full Stack Development'],
      totalCredits: 20,
      completedCredits: 0,
      remainingCredits: 20,
      eligibilitySemester: 5,
      note: 'Specialization Tracks (20 credits across 5 SPT courses) begin in Semester 5 for Batch 2023. You are eligible to select Applied Deep Learning or Full Stack Development.'
    },
    degreeTotalCredits: 180,
    declaredMinor: 'Design',
    minorSchool: 'School of Design',
    minorStatus: 'Selected and currently pursuing (24 defined credits for Batch 2023; 7/24 credits completed)',
    minorTracking: {
      status: 'Selected and currently pursuing',
      eligibilityNote: 'Design Minor courses span Semesters 3 to 7 in Batch 2023 (24 total minor credits).',
      totalCredits: 24,
      completedCredits: 7,
      remainingCredits: 17
    },
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 7,
      remainingCredits: 17,
      school: 'School of Design',
      batch: '2023',
      coursesOffered: [
        { code: 'CDES105', name: 'Appreciating and Deconstructing Art and Media', ltp: '3-0-0', credits: 3, status: 'Completed', semester: 3, grade: 'A+', prerequisites: 'NIL' },
        { code: 'CDES702', name: 'Integrative Studio II- Sensemaking, Visualization', ltp: '2-2-0', credits: 4, status: 'Completed', semester: 4, grade: 'A', prerequisites: 'NIL' },
        { code: 'CDES221', name: 'Information Architecture and Design', ltp: '2-2-0', credits: 4, status: 'Pending', semester: 5, prerequisites: 'NIL' },
        { code: 'CDES219', name: 'Elements of Sound', ltp: '2-2-0', credits: 4, status: 'Pending', semester: 6, prerequisites: 'NIL' },
        { code: 'CDES301', name: 'Sketch to Story', ltp: '2-2-0', credits: 4, status: 'Pending', semester: 6, prerequisites: 'NIL' },
        { code: 'CDES312', name: 'Designing Futures', ltp: '2-2-2', credits: 5, status: 'Pending', semester: 7, prerequisites: 'NIL' }
      ]
    },
    // Semester-wise CGPA and Credit Records (Sem 1 to Sem 4 completed = 99 credits, weighted CGPA = 9.12)
    semesterHistory: [
      { semester: 1, sgpa: 9.10, credits: 19, status: 'Completed' },
      { semester: 2, sgpa: 9.25, credits: 24, status: 'Completed' },
      { semester: 3, sgpa: 9.00, credits: 28, status: 'Completed' },
      { semester: 4, sgpa: 9.15, credits: 28, status: 'Completed' }
    ],
    completedCredits: 99,
    remainingCredits: 81,
    cgpa: 9.12,
    medicalLeave: { hasRecord: false, status: 'No medical leave recorded' },
    backlogs: [],
    // Verified completed courses from Batch 2023 curriculum spread (Semesters 1-4) & official Design minor S3-S4
    completedCourses: [
      { code: 'UCOR103', courseCode: 'UCOR103', name: 'Communication Skills', courseName: 'Communication Skills', credits: 2, semesterTaken: 1, grade: 'A+', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR104', courseCode: 'UCOR104', name: 'Problem Solving with Design Thinking', courseName: 'Problem Solving with Design Thinking', credits: 2, semesterTaken: 1, grade: 'A+', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR102', courseCode: 'UCOR102', name: 'Introduction to writing', courseName: 'Introduction to writing', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'MATH202', courseCode: 'MATH202', name: 'Probability Theory', courseName: 'Probability Theory', credits: 3, semesterTaken: 1, grade: 'A+', isPassed: true, category: 'Foundation' },
      { code: 'COMP132', courseCode: 'COMP132', name: 'Design Workshop', courseName: 'Design Workshop', credits: 2, semesterTaken: 1, grade: 'A+', isPassed: true, category: 'Foundation' },
      { code: 'MTSC111', courseCode: 'MTSC111', name: 'Materials for Smart Devices', courseName: 'Materials for Smart Devices', credits: 3, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'PSYC101', courseCode: 'PSYC101', name: 'Introduction to Psychology', courseName: 'Introduction to Psychology', credits: 3, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'DATA131', courseCode: 'DATA131', name: 'Visualizing Data for Story Telling', courseName: 'Visualizing Data for Story Telling', credits: 2, semesterTaken: 1, grade: 'A+', isPassed: true, category: 'Foundation' },
      { code: 'UCOR203', courseCode: 'UCOR203', name: 'Leadership and Teamwork Skills', courseName: 'Leadership and Teamwork Skills', credits: 2, semesterTaken: 2, grade: 'A+', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR701', courseCode: 'UCOR701', name: 'Community Engagement & Service Experience', courseName: 'Community Engagement & Service Experience', credits: 1, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR106', courseCode: 'UCOR106', name: 'Learning to Learn', courseName: 'Learning to Learn', credits: 2, semesterTaken: 2, grade: 'A+', isPassed: true, category: 'Univ Core' },
      { code: 'MATH201', courseCode: 'MATH201', name: 'Calculus', courseName: 'Calculus', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'MTSC211', courseCode: 'MTSC211', name: 'Sustainable Smart Materials', courseName: 'Sustainable Smart Materials', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'ENGL201', courseCode: 'ENGL201', name: 'Academic Writing', courseName: 'Academic Writing', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'COMP201', courseCode: 'COMP201', name: 'Data Structures', courseName: 'Data Structures', credits: 4, semesterTaken: 2, grade: 'A+', isPassed: true, category: 'Program CORE' },
      { code: 'MATH205', courseCode: 'MATH205', name: 'Statistics with R', courseName: 'Statistics with R', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'DATA201', courseCode: 'DATA201', name: 'Foundations to Data Science', courseName: 'Foundations to Data Science', credits: 3, semesterTaken: 2, grade: 'A+', isPassed: true, category: 'Program HONORS' },
      { code: 'UCOR205', courseCode: 'UCOR205', name: 'Socio Cultural Perspectives on Indian Life-SPIL', courseName: 'Socio Cultural Perspectives on Indian Life-SPIL', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR201', courseCode: 'UCOR201', name: 'Introduction to Epistemology', courseName: 'Introduction to Epistemology', credits: 2, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'MTSC781', courseCode: 'MTSC781', name: 'Sustainable Cities and Communities', courseName: 'Sustainable Cities and Communities', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'MATH204', courseCode: 'MATH204', name: 'Linear Algebra', courseName: 'Linear Algebra', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'COMP203', courseCode: 'COMP203', name: 'Analysis of Algorithms', courseName: 'Analysis of Algorithms', credits: 4, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'COMP202', courseCode: 'COMP202', name: 'Theoretical Computer Science', courseName: 'Theoretical Computer Science', credits: 4, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'MATH207', courseCode: 'MATH207', name: 'Research Methodology', courseName: 'Research Methodology', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'DATA202', courseCode: 'DATA202', name: 'Exploratory Data Analysis', courseName: 'Exploratory Data Analysis', credits: 3, semesterTaken: 3, grade: 'A+', isPassed: true, category: 'Program HONORS' },
      { code: 'CDES105', courseCode: 'CDES105', name: 'Appreciating and Deconstructing Art and Media [Minor]', courseName: 'Appreciating and Deconstructing Art and Media [Minor]', credits: 3, semesterTaken: 3, grade: 'A+', isPassed: true, category: 'Minor (Design)' },
      { code: 'UCOR210', courseCode: 'UCOR210', name: 'Critical Thinking', courseName: 'Critical Thinking', credits: 2, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'SLAD206', courseCode: 'SLAD206', name: 'Human Values in Work and Life', courseName: 'Human Values in Work and Life', credits: 2, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'SLAD207', courseCode: 'SLAD207', name: 'Foundation Seminar', courseName: 'Foundation Seminar', credits: 1, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'COMP209', courseCode: 'COMP209', name: 'Databases Management', courseName: 'Databases Management', credits: 4, semesterTaken: 4, grade: 'A+', isPassed: true, category: 'Program CORE' },
      { code: 'COMP204', courseCode: 'COMP204', name: 'Digital Design and Computer Organization', courseName: 'Digital Design and Computer Organization', credits: 4, semesterTaken: 4, grade: 'A+', isPassed: true, category: 'Program CORE' },
      { code: 'COMP301', courseCode: 'COMP301', name: 'Artificial Intelligence', courseName: 'Artificial Intelligence', credits: 4, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'COMP205', courseCode: 'COMP205', name: 'Object Oriented Programming', courseName: 'Object Oriented Programming', credits: 3, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'MATH301', courseCode: 'MATH301', name: 'Optimization Techniques for Data Science', courseName: 'Optimization Techniques for Data Science', credits: 4, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'CDES702', courseCode: 'CDES702', name: 'Integrative Studio II- Sensemaking, Visualization [Minor]', courseName: 'Integrative Studio II- Sensemaking, Visualization [Minor]', credits: 4, semesterTaken: 4, grade: 'A', isPassed: true, category: 'Minor (Design)' }
    ],
    // Enrolled Courses in Batch 2023 Semester 5
    enrolledCourses: [
      {
        code: 'LANG101',
        name: 'Language',
        ltp: '0-0-0',
        credits: 3,
        prerequisite: 'NIL',
        conducted: 22,
        attended: 20,
        category: 'Foundation'
      },
      {
        code: 'COMP208',
        name: 'Networks',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'NIL',
        conducted: 32,
        attended: 29,
        category: 'Program CORE'
      },
      {
        code: 'COMP207',
        name: 'Operating Systems',
        ltp: '2-0-2',
        credits: 3,
        prerequisite: 'NIL',
        conducted: 28,
        attended: 26,
        category: 'Program CORE'
      },
      {
        code: 'COMP206',
        name: 'Microprocessors and Computer Architecture',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'COMP204, COMP207',
        conducted: 32,
        attended: 30,
        category: 'Program CORE'
      },
      {
        code: 'DATA301',
        name: 'Machine Learning',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'DATA202, MATH301',
        conducted: 34,
        attended: 31,
        category: 'Program HONORS'
      },
      {
        code: 'DATA801',
        name: 'Summer Training/Internship',
        ltp: '0-0-0',
        credits: 2,
        prerequisite: 'NIL',
        conducted: 16,
        attended: 16,
        category: 'Internship/ Capstone Project'
      }
    ],
    nextSemesterCourses: [
      { code: 'COMP302', name: 'Internet of Things', ltp: '0-0-4', credits: 2, prerequisite: 'COMP132, COMP201, COMP206, COMP208, COMP301', basket: 'Program CORE' },
      { code: 'DATA302', name: 'Deep Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA301, MATH201', basket: 'Program HONORS' },
      { code: 'DATA303', name: 'MLOps & Model Deployment', ltp: '1-0-2', credits: 2, prerequisite: 'DATA301, COMP208', basket: 'Program HONORS' },
      { code: 'DATA405 / DATA406', name: 'SPT-Course #2 (Reinforcement Learning / Big Data Framework)', ltp: '2-0-4', credits: 4, prerequisite: 'MATH202, MATH204 / NIL', basket: 'Specialization Tracks' },
      { code: 'CDES219', name: 'Elements of Sound [Minor: Design]', ltp: '2-2-0', credits: 4, prerequisite: 'NIL', basket: 'Minor (Design)' },
      { code: 'CDES301', name: 'Sketch to Story [Minor: Design]', ltp: '2-2-0', credits: 4, prerequisite: 'NIL', basket: 'Minor (Design)' }
    ],
    salt: 'b2c3d4e5f6a1789023456789bcdef012',
    password: 'Student3@2023'
  },

  // ── STUDENT 4: Batch 2024, Sem 4 (Case 2: Low Attendance 68% in COMP209, >80% others; Specialisation Not Yet Eligible) ──
  {
    id: '2024UG00001',
    legacyAliases: ['VU-BTECH-2404'],
    display_name: 'Divya Nair',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2024',
    semester: 4,
    specialisation: 'Not yet eligible to select (Begins Semester 5)',
    specialisationTracking: {
      status: 'Not yet eligible to select',
      trackName: 'Not yet eligible to select',
      availableTracks: ['Applied Deep Learning', 'Full Stack Development'],
      totalCredits: 20,
      completedCredits: 0,
      remainingCredits: 20,
      eligibilitySemester: 5,
      note: 'In Batch 2024, Specialization Tracks (Applied Deep Learning or Full Stack Development, 20 credits total) begin in Semester 5. As a Semester 4 student, you are not yet eligible to select a specialisation track.'
    },
    degreeTotalCredits: 180,
    declaredMinor: 'Marketing',
    minorSchool: 'School of Business Studies',
    minorStatus: 'Selected and currently pursuing (24 defined credits for Batch 2024; 3/24 credits completed; Economics is NOT RUNNING for Batch 2024)',
    minorTracking: {
      status: 'Selected and currently pursuing',
      eligibilityNote: 'Marketing Minor courses span Semesters 3 to 7 in Batch 2024 (24 total minor credits).',
      totalCredits: 24,
      completedCredits: 3,
      remainingCredits: 21
    },
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 3,
      remainingCredits: 21,
      school: 'School of Business Studies',
      batch: '2024',
      coursesOffered: [
        { code: 'MKTG201', name: 'Marketing Management', ltp: '2-1-0', credits: 3, status: 'Completed', semester: 3, grade: 'A', prerequisites: 'Nil' },
        { code: 'MGMT302', name: 'Digital and Ecommerce Marketing', ltp: '2-2-0', credits: 4, status: 'Pending', semester: 4, prerequisites: 'MKTG201' },
        { code: 'MGMT305', name: 'Services Marketing', ltp: '2-1-0', credits: 3, status: 'Pending', semester: 5, prerequisites: 'Nil' },
        { code: 'MGMT304', name: 'Integrated Marketing Communications', ltp: '2-1-0', credits: 3, status: 'Pending', semester: 5, prerequisites: 'Nil' },
        { code: 'MGMT314', name: 'Sales and Distribution Management', ltp: '2-2-0', credits: 4, status: 'Pending', semester: 6, prerequisites: 'MKTG201' },
        { code: 'MGMT211', name: 'Brand Management', ltp: '2-1-0', credits: 3, status: 'Pending', semester: 6, prerequisites: 'MKTG201' },
        { code: 'MGMT320', name: 'Marketing Analytics', ltp: '1-1-0', credits: 2, status: 'Pending', semester: 7, prerequisites: 'Nil' },
        { code: 'MGMT307', name: 'Strategy & Decision Making', ltp: '1-1-0', credits: 2, status: 'Pending', semester: 7, prerequisites: 'Nil' }
      ]
    },
    // Semester-wise CGPA and Credit Records (Sem 1 to Sem 3 completed = 70 credits, weighted CGPA = 8.22)
    semesterHistory: [
      { semester: 1, sgpa: 8.20, credits: 21, status: 'Completed' },
      { semester: 2, sgpa: 8.40, credits: 22, status: 'Completed' },
      { semester: 3, sgpa: 8.10, credits: 27, status: 'Completed' }
    ],
    completedCredits: 70,
    remainingCredits: 110,
    cgpa: 8.22,
    medicalLeave: { hasRecord: false, status: 'No medical leave recorded' },
    backlogs: [],
    // Verified completed courses from Batch 2024 curriculum spread (Semesters 1-3) & official Marketing minor S3
    completedCourses: [
      { code: 'UCOR106', courseCode: 'UCOR106', name: 'Learning to Learn', courseName: 'Learning to Learn', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR104', courseCode: 'UCOR104', name: 'Problem Solving with Design Thinking', courseName: 'Problem Solving with Design Thinking', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR102', courseCode: 'UCOR102', name: 'Introduction to writing', courseName: 'Introduction to writing', credits: 2, semesterTaken: 1, grade: 'B+', isPassed: true, category: 'Univ Core' },
      { code: 'MATH203', courseCode: 'MATH203', name: 'Probability and Statistics', courseName: 'Probability and Statistics', credits: 4, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'COMP132', courseCode: 'COMP132', name: 'Design Workshop', courseName: 'Design Workshop', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'MTSC111', courseCode: 'MTSC111', name: 'Materials for Smart Devices', courseName: 'Materials for Smart Devices', credits: 3, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'PSYC101', courseCode: 'PSYC101', name: 'Introduction to Psychology', courseName: 'Introduction to Psychology', credits: 3, semesterTaken: 1, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'DATA103', courseCode: 'DATA103', name: 'Programming in Python', courseName: 'Programming in Python', credits: 3, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'UCOR105', courseCode: 'UCOR105', name: 'Communication and Leadership Skills', courseName: 'Communication and Leadership Skills', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR701', courseCode: 'UCOR701', name: 'Community Engagement & Service Experience', courseName: 'Community Engagement & Service Experience', credits: 1, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'MATH201', courseCode: 'MATH201', name: 'Calculus', courseName: 'Calculus', credits: 3, semesterTaken: 2, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'MTSC211', courseCode: 'MTSC211', name: 'Sustainable Smart Materials', courseName: 'Sustainable Smart Materials', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'ENGL210', courseCode: 'ENGL210', name: 'Academic Writing', courseName: 'Academic Writing', credits: 2, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'COMP201', courseCode: 'COMP201', name: 'Data Structures', courseName: 'Data Structures', credits: 4, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'DATA132', courseCode: 'DATA132', name: 'Data visualization and Storytelling', courseName: 'Data visualization and Storytelling', credits: 3, semesterTaken: 2, grade: 'A+', isPassed: true, category: 'Program CORE' },
      { code: 'DATA201', courseCode: 'DATA201', name: 'Foundations to Data Science', courseName: 'Foundations to Data Science', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'UCOR205', courseCode: 'UCOR205', name: 'Socio Cultural Perspectives on Indian Life-SPIL', courseName: 'Socio Cultural Perspectives on Indian Life-SPIL', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'LAWS101', courseCode: 'LAWS101', name: 'Fundamentals of Indian Constitution and Human Rights', courseName: 'Fundamentals of Indian Constitution and Human Rights', credits: 2, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'MTSC781', courseCode: 'MTSC781', name: 'Sustainable Cities and Communities', courseName: 'Sustainable Cities and Communities', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'MATH204', courseCode: 'MATH204', name: 'Linear Algebra', courseName: 'Linear Algebra', credits: 3, semesterTaken: 3, grade: 'B+', isPassed: true, category: 'Foundation' },
      { code: 'COMP203', courseCode: 'COMP203', name: 'Analysis of Algorithms', courseName: 'Analysis of Algorithms', credits: 4, semesterTaken: 3, grade: 'B+', isPassed: true, category: 'Program CORE' },
      { code: 'COMP202', courseCode: 'COMP202', name: 'Theoretical Computer Science', courseName: 'Theoretical Computer Science', credits: 4, semesterTaken: 3, grade: 'B+', isPassed: true, category: 'Program CORE' },
      { code: 'DATA202', courseCode: 'DATA202', name: 'Exploratory Data Analysis', courseName: 'Exploratory Data Analysis', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'MATH206', courseCode: 'MATH206', name: 'Advanced Statistical Analysis and Research Methods with R', courseName: 'Advanced Statistical Analysis and Research Methods with R', credits: 2, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Program HONORS' },
      { code: 'MKTG201', courseCode: 'MKTG201', name: 'Marketing Management [Minor]', courseName: 'Marketing Management [Minor]', credits: 3, semesterTaken: 3, grade: 'A', isPassed: true, category: 'Minor (Marketing)' }
    ],
    // Case 2: Low attendance in COMP209 (68%), all other Batch 2024 Sem 4 courses > 80%
    enrolledCourses: [
      {
        code: 'COMP209',
        name: 'Databases Management',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'NIL',
        conducted: 25,
        attended: 17, // (17 / 25) * 100 = 68.0% < 75% AT RISK!
        category: 'Program CORE'
      },
      {
        code: 'UCOR310',
        name: 'Critical Thinking',
        ltp: '2-1-0',
        credits: 3,
        prerequisite: 'NIL',
        conducted: 24,
        attended: 21, // 87.5%
        category: 'Univ Core'
      },
      {
        code: 'SLAD206',
        name: 'Human Values in Work and Life',
        ltp: '0-0-0',
        credits: 2,
        prerequisite: 'NIL',
        conducted: 20,
        attended: 18, // 90.0%
        category: 'Foundation'
      },
      {
        code: 'COMP403',
        name: 'Cloud Computing',
        ltp: '2-0-2',
        credits: 3,
        prerequisite: 'NIL',
        conducted: 26,
        attended: 22, // 84.62%
        category: 'Foundation'
      },
      {
        code: 'COMP204',
        name: 'Digital Design and Computer Organization',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'NIL',
        conducted: 30,
        attended: 26, // 86.67%
        category: 'Program CORE'
      },
      {
        code: 'COMP301',
        name: 'Artificial Intelligence',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'NIL',
        conducted: 28,
        attended: 24, // 85.71%
        category: 'Program CORE'
      },
      {
        code: 'MATH301',
        name: 'Optimization Techniques for Data Science',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'NIL',
        conducted: 30,
        attended: 26, // 86.67%
        category: 'Program HONORS'
      }
    ],
    nextSemesterCourses: [
      { code: 'COMP208', name: 'Networks', ltp: '3-0-2', credits: 4, prerequisite: 'NIL', basket: 'Program CORE' },
      { code: 'COMP207', name: 'Operating Systems', ltp: '2-0-2', credits: 3, prerequisite: 'NIL', basket: 'Program CORE' },
      { code: 'COMP205', name: 'Object Oriented Programming', ltp: '2-0-2', credits: 3, prerequisite: 'NIL', basket: 'Program CORE' },
      { code: 'DATA301', name: 'Machine Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA202, MATH301', basket: 'Program HONORS' },
      { code: 'MATH401 / COMP401', name: 'SPT-Course #1 (Probabilistic Graph Models / Web Framework)', ltp: '2-0-4', credits: 4, prerequisite: 'NIL', basket: 'Specialization Tracks' },
      { code: 'DATA801', name: 'Summer Training/Internship', ltp: '0-0-0', credits: 2, prerequisite: 'NIL', basket: 'Internship/ Capstone Project' }
    ],
    salt: 'c3d4e5f6a1b2890134567890cdef0123',
    password: 'Student4@2024'
  },

  // ── STUDENT 5: Batch 2025, Sem 3 (Case 6: Different Batch/Semester Progression, Economics Minor Pursuing, Specialisation Not Yet Eligible) ──
  {
    id: '2025UG00001',
    legacyAliases: ['VU-BTECH-2505'],
    display_name: 'Eshaan Kulkarni',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2025',
    semester: 3,
    specialisation: 'Not yet eligible to select (Begins Semester 5)',
    specialisationTracking: {
      status: 'Not yet eligible to select',
      trackName: 'Not yet eligible to select',
      availableTracks: ['Applied Deep Learning', 'Full Stack Development'],
      totalCredits: 20,
      completedCredits: 0,
      remainingCredits: 20,
      eligibilitySemester: 5,
      note: 'In Batch 2025, Specialization Tracks (Applied Deep Learning or Full Stack Development, 20 credits total) begin in Semester 5. As a Semester 3 student, you are not yet eligible to select a specialisation.'
    },
    degreeTotalCredits: 180,
    declaredMinor: 'Economics',
    minorSchool: 'School of Liberal Arts & Sciences',
    minorStatus: 'Selected and currently pursuing (24 defined credits for Batch 2025; starting ECON208 in Sem 3)',
    minorTracking: {
      status: 'Selected and currently pursuing',
      eligibilityNote: 'Economics Minor courses span Semesters 3 to 7 in Batch 2025 (24 total minor credits). Currently beginning S3 minor entry course ECON208.',
      totalCredits: 24,
      completedCredits: 0,
      remainingCredits: 24
    },
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 0,
      remainingCredits: 24,
      school: 'School of Liberal Arts & Sciences',
      batch: '2025',
      coursesOffered: [
        { code: 'ECON208', name: 'Microeconomics I', ltp: '3-1-0', credits: 4, status: 'In Progress', semester: 3, prerequisites: 'Nil' },
        { code: 'ECON209', name: 'Macroeconomics I', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 4, prerequisites: 'Nil' },
        { code: 'ECON316', name: 'Digital Economics', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 5, prerequisites: 'ECON201 (Discrepancy: batch offers ECON208 instead)' },
        { code: 'ECON315', name: 'Indian Economy', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 6, prerequisites: 'ECON201, ECON209' },
        { code: 'ECON346', name: 'Financial Economics', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 6, prerequisites: 'ECON208, ECON209' },
        { code: 'ECON301', name: 'International Economics', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 7, prerequisites: 'ECON201, ECON202 (University confirmation required)' }
      ]
    },
    // Semester-wise CGPA and Credit Records (Sem 1 to Sem 2 completed = 47 credits, weighted CGPA = 8.61)
    semesterHistory: [
      { semester: 1, sgpa: 8.50, credits: 22, status: 'Completed' },
      { semester: 2, sgpa: 8.70, credits: 25, status: 'Completed' }
    ],
    completedCredits: 47,
    remainingCredits: 133,
    cgpa: 8.61,
    medicalLeave: { hasRecord: false, status: 'No medical leave recorded' },
    backlogs: [],
    // Verified completed courses from Batch 2025 curriculum spread (Semesters 1-2)
    completedCourses: [
      { code: 'UCOR103', courseCode: 'UCOR103', name: 'Communication Skills', courseName: 'Communication Skills', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR106', courseCode: 'UCOR106', name: 'Learning to Learn', courseName: 'Learning to Learn', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'MATH208', courseCode: 'MATH208', name: 'Multivariate Calculus', courseName: 'Multivariate Calculus', credits: 4, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'MTSC111', courseCode: 'MTSC111', name: 'Materials for Smart Devices', courseName: 'Materials for Smart Devices', credits: 3, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'DATA103', courseCode: 'DATA103', name: 'Programming in Python', courseName: 'Programming in Python', credits: 3, semesterTaken: 1, grade: 'A+', isPassed: true, category: 'Program CORE' },
      { code: 'COMP204', courseCode: 'COMP204', name: 'Digital Design and Computer Organization', courseName: 'Digital Design and Computer Organization', credits: 4, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'MGMT101', courseCode: 'MGMT101', name: 'Essentials of Business Management', courseName: 'Essentials of Business Management', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Open/Minor' },
      { code: 'ECON105', courseCode: 'ECON105', name: 'Principles of Economics', courseName: 'Principles of Economics', credits: 2, semesterTaken: 1, grade: 'A', isPassed: true, category: 'Open/Minor' },
      { code: 'UCOR111', courseCode: 'UCOR111', name: 'Environmental Studies and Sustainability', courseName: 'Environmental Studies and Sustainability', credits: 2, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'LAWS101', courseCode: 'LAWS101', name: 'Fundamentals of Indian Constitution and Human Rights', courseName: 'Fundamentals of Indian Constitution and Human Rights', credits: 2, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'UCOR701', courseCode: 'UCOR701', name: 'Community Engagement & Service Experience', courseName: 'Community Engagement & Service Experience', credits: 1, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Univ Core' },
      { code: 'MATH203', courseCode: 'MATH203', name: 'Probability and Statistics', courseName: 'Probability and Statistics', credits: 4, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'MTSC211', courseCode: 'MTSC211', name: 'Sustainable Smart Materials', courseName: 'Sustainable Smart Materials', credits: 3, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'COMP132', courseCode: 'COMP132', name: 'Design Workshop', courseName: 'Design Workshop', credits: 2, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Foundation' },
      { code: 'COMP201', courseCode: 'COMP201', name: 'Data Structures', courseName: 'Data Structures', credits: 4, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Program CORE' },
      { code: 'DATA132', courseCode: 'DATA132', name: 'Data Visualization and Storytelling', courseName: 'Data Visualization and Storytelling', credits: 3, semesterTaken: 2, grade: 'A+', isPassed: true, category: 'Program CORE' },
      { code: 'COMP209', courseCode: 'COMP209', name: 'Databases Management', courseName: 'Databases Management', credits: 4, semesterTaken: 2, grade: 'A', isPassed: true, category: 'Program CORE' }
    ],
    // Enrolled Courses in Batch 2025 Semester 3
    enrolledCourses: [
      {
        code: 'UCOR207',
        name: 'Analytical Academic Writing',
        ltp: '2-1-0',
        credits: 3,
        prerequisite: 'NIL',
        conducted: 24,
        attended: 21,
        category: 'Univ Core'
      },
      {
        code: 'SLAD206',
        name: 'Human Values in Work and Life',
        ltp: '0-0-0',
        credits: 2,
        prerequisite: 'Nil',
        conducted: 20,
        attended: 17,
        category: 'Univ Core'
      },
      {
        code: 'MATH209',
        name: 'Linear Algebra',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'NIL',
        conducted: 30,
        attended: 27,
        category: 'Foundation'
      },
      {
        code: 'COMP202',
        name: 'Theoretical Computer Science',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'NIL',
        conducted: 30,
        attended: 26,
        category: 'Program CORE'
      },
      {
        code: 'COMP203',
        name: 'Analysis of Algorithms',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'COMP201',
        conducted: 30,
        attended: 27,
        category: 'Program CORE'
      },
      {
        code: 'DATA209',
        name: 'Advanced Exploratory Data Analysis',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'DATA132, MATH203',
        conducted: 32,
        attended: 28,
        category: 'Program HONORS'
      }
    ],
    nextSemesterCourses: [
      { code: 'UCOR205', name: 'Socio-Cultural Perspectives on Indian Life', ltp: '2-1-0', credits: 3, prerequisite: 'Nil', basket: 'Univ Core' },
      { code: 'MATH206', name: 'Advanced Statistical Analysis and Research Methods with R', ltp: '0-0-4', credits: 2, prerequisite: 'MATH203', basket: 'Foundation' },
      { code: 'COMP207', name: 'Operating Systems', ltp: '2-0-2', credits: 3, prerequisite: 'Nil', basket: 'Program CORE' },
      { code: 'COMP301', name: 'Artificial Intelligence', ltp: '3-0-2', credits: 4, prerequisite: 'NIL', basket: 'Program CORE' },
      { code: 'COMP205', name: 'Object Oriented Programming', ltp: '2-0-2', credits: 3, prerequisite: 'NIL', basket: 'Program CORE' },
      { code: 'MATH301', name: 'Optimization Techniques for Data Science', ltp: '3-1-0', credits: 4, prerequisite: 'MATH201', basket: 'Program HONORS' },
      { code: 'ECON209', name: 'Macroeconomics I [Minor: Economics]', ltp: '3-1-0', credits: 4, prerequisite: 'Nil', basket: 'Minor (Economics)' }
    ],
    salt: 'd4e5f6a1b2c3901245678901def01234',
    password: 'Student5@2025'
  },

  // ── STUDENT 6: Batch 2026, Sem 1 (Freshman, Not Yet Eligible for Minor & Specialisation) ──
  {
    id: '2026UG00001',
    legacyAliases: ['VU-BTECH-2606'],
    display_name: 'Farhan Ahmed',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering (Data Science)',
    school: 'School of Computational and Data Sciences',
    batch: '2026',
    semester: 1,
    specialisation: 'Not yet eligible to select (Batch 2026 DS uses Open Electives)',
    specialisationTracking: {
      status: 'Not yet eligible to select',
      trackName: 'Not applicable / Open Electives from Sem 5+',
      availableTracks: ['Open Electives Pool (20 credits in Batch 2026 DS)'],
      totalCredits: 20,
      completedCredits: 0,
      remainingCredits: 20,
      eligibilitySemester: 5,
      note: 'In Batch 2026 Data Science (Struct_2026_DS), named Specialization Tracks are replaced by a 20-credit Open Electives pool in later semesters. As a Semester 1 freshman, you are not yet eligible to register for advanced electives.'
    },
    degreeTotalCredits: 180,
    declaredMinor: 'Psychology',
    minorSchool: 'School of Liberal Arts & Sciences',
    minorStatus: 'Not yet eligible to begin minor coursework (Minor coursework begins Semester 3; intended Minor: Psychology; note Law is NOT DECIDED for 2026)',
    minorTracking: {
      status: 'Not yet eligible to select',
      eligibilityNote: 'As a Semester 1 student in Batch 2026, formal Minor track coursework does not begin until Semester 3 (Psychology is recorded as your intended/preferred minor track).',
      totalCredits: 24,
      completedCredits: 0,
      remainingCredits: 24
    },
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 0,
      remainingCredits: 24,
      school: 'School of Liberal Arts & Sciences',
      batch: '2026',
      coursesOffered: [
        { code: 'PSYC201 / PSYC103', name: 'Biological Psychology OR Foundations of Psychology I', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 3, prerequisites: 'Nil' },
        { code: 'PSYC202', name: 'Cognitive Psychology', ltp: '2-2-0', credits: 4, status: 'Pending', semester: 4, prerequisites: 'PSYC101 (Discrepancy: 2026 batch has PSYC105)' },
        { code: 'PSYC241', name: 'Social Psychology', ltp: '2-2-0', credits: 4, status: 'Pending', semester: 5, prerequisites: 'PSYC101 (Discrepancy: 2026 batch has PSYC105)' },
        { code: 'PSYC306', name: 'Health Psychology', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 6, prerequisites: 'PSYC101, PSYC201' },
        { code: 'PSYC104', name: 'Lifespan Development I', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 6, prerequisites: 'Nil' },
        { code: 'PSYC255', name: 'Psychopathology', ltp: '3-1-0', credits: 4, status: 'Pending', semester: 7, prerequisites: 'Nil' }
      ]
    },
    semesterHistory: [],
    completedCredits: 0,
    remainingCredits: 180,
    cgpa: 'In progress (Semester 1 exams pending)',
    medicalLeave: { hasRecord: false, status: 'No medical leave recorded' },
    backlogs: [],
    completedCourses: [],
    // Enrolled Courses in Batch 2026 Semester 1 (Sem_Spread_DS_2026)
    enrolledCourses: [
      {
        code: 'UCOR107',
        name: 'Communication Skills',
        ltp: '2-0-2',
        credits: 3,
        prerequisite: 'Nil',
        conducted: 22,
        attended: 20,
        category: 'Univ Core'
      },
      {
        code: 'UCOR106',
        name: 'Learning to Learn',
        ltp: '1-0-2',
        credits: 2,
        prerequisite: 'Nil',
        conducted: 18,
        attended: 16,
        category: 'Univ Core'
      },
      {
        code: 'MATH208',
        name: 'Multivariate Calculus',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'Nil',
        conducted: 28,
        attended: 25,
        category: 'Foundation'
      },
      {
        code: 'MTSC111',
        name: 'Materials for Smart Devices',
        ltp: '2-0-2',
        credits: 3,
        prerequisite: 'Nil',
        conducted: 22,
        attended: 19,
        category: 'Foundation'
      },
      {
        code: 'DATA103',
        name: 'Programming in Python',
        ltp: '1-0-4',
        credits: 3,
        prerequisite: 'Nil',
        conducted: 30,
        attended: 28,
        category: 'Program CORE'
      },
      {
        code: 'COMP204',
        name: 'Digital Design and Computer Organization',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'Nil',
        conducted: 28,
        attended: 25,
        category: 'Program CORE'
      },
      {
        code: 'MGMT101',
        name: 'Essentials of Business Management',
        ltp: '1-1-0',
        credits: 2,
        prerequisite: 'Nil',
        conducted: 18,
        attended: 16,
        category: 'Open/Minor'
      },
      {
        code: 'PSYC105 / ECON106',
        name: 'Introduction to Psychology / Principles of Economics',
        ltp: '1-1-0',
        credits: 2,
        prerequisite: 'Nil',
        conducted: 18,
        attended: 17,
        category: 'Open/Minor'
      }
    ],
    nextSemesterCourses: [
      { code: 'UCOR111', name: 'Environmental Studies and Sustainability', ltp: '0-0-0', credits: 2, prerequisite: 'NIL', basket: 'Univ Core' },
      { code: 'LAWS101', name: 'Fundamentals of Indian Constitution and Human Rights', ltp: '1-1-0', credits: 2, prerequisite: 'NIL', basket: 'Univ Core' },
      { code: 'UCOR701', name: 'Community Engagement & Service Experience', ltp: '0-0-0', credits: 1, prerequisite: 'NIL', basket: 'Univ Core' },
      { code: 'MATH203', name: 'Probability and Statistics', ltp: '3-1-0', credits: 4, prerequisite: 'NIL', basket: 'Foundation' },
      { code: 'MTSC211', name: 'Sustainable Smart Materials', ltp: '2-0-2', credits: 3, prerequisite: 'MTSC111', basket: 'Foundation' },
      { code: 'COMP133', name: 'Design Workshop', ltp: '1-0-4', credits: 3, prerequisite: 'Nil', basket: 'Foundation' },
      { code: 'COMP201', name: 'Data Structures', ltp: '3-0-2', credits: 4, prerequisite: 'NIL', basket: 'Program CORE' },
      { code: 'DATA132', name: 'Data Visualization and Storytelling', ltp: '1-0-4', credits: 3, prerequisite: 'DATA103', basket: 'Program CORE' },
      { code: 'COMP209', name: 'Databases Management', ltp: '3-0-2', credits: 4, prerequisite: 'NIL', basket: 'Program CORE' }
    ],
    salt: 'e5f6a1b2c3d4012356789012ef012345',
    password: 'Student6@2026'
  }
];

// Initialize lookup tables and deterministic credential hashes
const STUDENT_STORE = new Map();
const ALIAS_LOOKUP = new Map();

RAW_STUDENT_DATA.forEach(raw => {
  // Passwords use unique random salts stored with their hashes; legacy password alternatives removed
  const salt = raw.salt;
  const passwordHash = hashPassword(raw.password, salt);
  const storedHash = `${salt}:${passwordHash}`;

  // Compute enriched course attendance details
  const enrichedEnrolled = raw.enrolledCourses.map(c => {
    const att = calculateAttendanceStatus(c.conducted, c.attended);
    return {
      ...c,
      attendancePercentage: att.percentage,
      attendanceStatus: att.status,
      isAtRisk: !att.isEligible,
      classesNeededFor75: att.classesNeededFor75,
      classesCanMiss: att.classesCanMiss
    };
  });

  // Calculate overall attendance
  const totalConducted = enrichedEnrolled.reduce((sum, c) => sum + (c.conducted || 0), 0);
  const totalAttended = enrichedEnrolled.reduce((sum, c) => sum + (c.attended || 0), 0);
  const overallAttendance = calculateAttendanceStatus(totalConducted, totalAttended);

  const profile = {
    id: raw.id,
    display_name: raw.display_name,
    program: raw.program,
    programName: raw.programName,
    school: raw.school,
    batch: raw.batch,
    semester: raw.semester,
    specialisation: raw.specialisation,
    specialisationTracking: raw.specialisationTracking || null,
    degreeTotalCredits: raw.degreeTotalCredits,
    completedCredits: raw.completedCredits,
    remainingCredits: raw.remainingCredits,
    cgpa: raw.cgpa,
    semesterHistory: raw.semesterHistory,
    declaredMinor: raw.declaredMinor,
    minorSchool: raw.minorSchool,
    minorStatus: raw.minorStatus,
    minorTracking: raw.minorTracking || null,
    minorCreditStructure: raw.minorCreditStructure,
    enrolledCourses: enrichedEnrolled,
    nextSemesterCourses: raw.nextSemesterCourses,
    backlogs: raw.backlogs || [],
    completedCourses: raw.completedCourses || [],
    medicalLeave: raw.medicalLeave || { hasRecord: false },
    isSyntheticDemoRecord: true,
    recordDataNote: 'Synthetic student profile grounded strictly in Vidyashilp University official curriculum workbooks (Semester_Spread_Structures_Sept_2026.xlsx & Minor_Courses_for_BTech_Students.xlsx). Marks/attendance/leave records are synthetic evaluation data, not live ERP data.',
    overallAttendance: {
      conducted: totalConducted,
      attended: totalAttended,
      percentage: overallAttendance.percentage,
      status: overallAttendance.status,
      isEligible: overallAttendance.isEligible
    },
    // Backward-compatible string representation for legacy views
    attendance: `${overallAttendance.percentage}% (${totalAttended}/${totalConducted} classes attended)`
  };

  const record = {
    profile,
    salt,
    passwordHash,
    storedHash
  };

  STUDENT_STORE.set(raw.id.toUpperCase(), record);
  ALIAS_LOOKUP.set(raw.id.toUpperCase(), raw.id.toUpperCase());

  if (Array.isArray(raw.legacyAliases)) {
    raw.legacyAliases.forEach(alias => {
      ALIAS_LOOKUP.set(alias.toUpperCase(), raw.id.toUpperCase());
    });
  }
});

/**
 * Strips internal security fields from student profile
 */
function sanitizeProfile(profile) {
  if (!profile) return null;
  const clone = JSON.parse(JSON.stringify(profile));
  delete clone.salt;
  delete clone.password;
  delete clone.passwordHash;
  delete clone.passwordHashes;
  delete clone.storedHash;
  delete clone.passwords;
  return clone;
}

/**
 * Creates a cryptographically signed stateless JWT-style session token.
 * This guarantees sessions survive across Vercel serverless cold starts.
 */
function createSessionToken(studentId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Date.now();
  const payload = Buffer.from(JSON.stringify({
    sub: studentId,
    iat: now,
    exp: now + SESSION_TTL_MS
  })).toString('base64url');

  const signature = crypto.createHmac('sha256', SESSION_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

/**
 * Authenticates a student with ID and password.
 * Returns { token, student } on success, or null on failure.
 * Case-insensitive, trims accidental whitespace.
 */
function authenticateStudent(studentId, password) {
  if (!studentId || !password) return null;
  const cleanInput = String(studentId).trim().toUpperCase();
  const canonicalId = ALIAS_LOOKUP.get(cleanInput);
  if (!canonicalId) return null;

  const record = STUDENT_STORE.get(canonicalId);
  if (!record) return null;

  const inputPass = String(password).trim();
  const isMatch = verifyPassword(inputPass, record.passwordHash, record.salt);

  if (!isMatch) return null;

  const token = createSessionToken(canonicalId);
  return {
    token,
    student: sanitizeProfile(record.profile)
  };
}

/**
 * Validates a session token and returns the student profile.
 * Stateless verification via HMAC signature.
 */
function validateSession(token) {
  if (!token || typeof token !== 'string') return null;
  if (revokedTokens.has(token)) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signature] = parts;

  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) {
      return null;
    }

    const canonicalId = ALIAS_LOOKUP.get(String(payload.sub).toUpperCase());
    if (!canonicalId) return null;

    const record = STUDENT_STORE.get(canonicalId);
    return record ? sanitizeProfile(record.profile) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Destroys a session token (logout)
 */
function destroySession(token) {
  if (!token) return false;
  revokedTokens.add(token);
  return true;
}

/**
 * Retrieves a sanitized student profile by ID or alias (internal only)
 */
function getStudentProfileById(studentId) {
  if (!studentId) return null;
  const cleanId = String(studentId).trim().toUpperCase();
  const canonicalId = ALIAS_LOOKUP.get(cleanId);
  if (!canonicalId) return null;
  const record = STUDENT_STORE.get(canonicalId);
  return record ? sanitizeProfile(record.profile) : null;
}

/**
 * Comprehensive Student Dashboard Data (Overview, Academic Summary, Attendance Table,
 * Semester CGPAs, Academic Progress, Medical Leave)
 */
function getStudentDashboardData(studentId) {
  const p = getStudentProfileById(studentId);
  if (!p) return null;

  // Minor & Major course calculations
  const degreeTotalCredits = 180;
  const completedCredits = typeof p.completedCredits === 'number' ? p.completedCredits : 0;
  const remainingCredits = degreeTotalCredits - completedCredits;
  const minorTotalCredits = (p.minorCreditStructure && p.minorCreditStructure.totalCredits) || 24;
  const minorCompletedCredits = (p.minorCreditStructure && p.minorCreditStructure.completedCredits) || 0;
  const minorRemainingCredits = minorTotalCredits - minorCompletedCredits;
  const minorProgressPct = Math.round((minorCompletedCredits / minorTotalCredits) * 100);
  const majorCompletedCredits = Math.max(0, completedCredits - minorCompletedCredits);
  const majorRequiredCredits = degreeTotalCredits - minorTotalCredits;
  const majorProgressPct = Math.min(100, Math.round((majorCompletedCredits / majorRequiredCredits) * 100));

  // Specialisation progress calculation
  const specTrack = p.specialisationTracking || null;
  const specTotalCredits = (specTrack && specTrack.totalCredits) || 20;
  const specCompletedCredits = (specTrack && specTrack.completedCredits) || 0;
  const specProgressPct = Math.round((specCompletedCredits / specTotalCredits) * 100);
  const specialisationProgressText = specTrack
    ? (specTrack.status === 'Selected and currently pursuing' || specTrack.status === 'Completed'
      ? `${specProgressPct}% (${specCompletedCredits}/${specTotalCredits} cr — ${specTrack.trackName})`
      : specTrack.status)
    : 'Not assigned';

  return {
    studentOverview: {
      name: p.display_name,
      studentId: p.id,
      batch: p.batch,
      semester: `Semester ${p.semester}`,
      semesterNumber: p.semester,
      program: p.programName,
      school: p.school,
      major: 'Computer Science & Engineering',
      minor: p.declaredMinor,
      minorSchool: p.minorSchool,
      minorStatus: p.minorTracking ? p.minorTracking.status : p.minorStatus,
      specialisation: p.specialisation || 'Not specified',
      specialisationStatus: specTrack ? specTrack.status : 'Not assigned',
      isSyntheticDemoRecord: !!p.isSyntheticDemoRecord,
      recordDataNote: p.recordDataNote
    },
    academicSummary: {
      overallCgpa: p.cgpa,
      completedCredits,
      remainingCredits,
      degreeTotalCredits,
      majorProgress: `${majorProgressPct}% (${majorCompletedCredits}/${majorRequiredCredits} cr)`,
      minorProgress: `${minorProgressPct}% (${minorCompletedCredits}/${minorTotalCredits} cr)`,
      specialisationProgress: specialisationProgressText,
      minorStatus: p.minorTracking ? p.minorTracking.status : p.minorStatus,
      specialisationStatus: specTrack ? specTrack.status : 'Not assigned'
    },
    specialisationStructure: specTrack,
    attendanceOverview: {
      overallPercentage: p.overallAttendance.percentage,
      overallConducted: p.overallAttendance.conducted,
      overallAttended: p.overallAttendance.attended,
      overallStatus: p.overallAttendance.status,
      isOverallEligible: p.overallAttendance.isEligible,
      courseList: p.enrolledCourses.map(c => ({
        code: c.code,
        name: c.name,
        conducted: c.conducted,
        attended: c.attended,
        percentage: c.attendancePercentage,
        status: c.attendanceStatus,
        isAtRisk: c.isAtRisk,
        classesNeededFor75: c.classesNeededFor75,
        classesCanMiss: c.classesCanMiss
      }))
    },
    semesterPerformance: {
      history: p.semesterHistory,
      overallCgpa: p.cgpa
    },
    academicProgress: {
      currentCourses: p.enrolledCourses.map(c => ({
        code: c.code,
        name: c.name,
        ltp: c.ltp,
        credits: c.credits,
        prerequisite: c.prerequisite,
        category: c.category
      })),
      nextSemesterCourses: p.nextSemesterCourses || [],
      backlogs: p.backlogs || [],
      hasBacklog: (p.backlogs || []).length > 0
    },
    completedCourses: p.completedCourses || [],
    medicalLeave: p.medicalLeave || { hasRecord: false },
    minorCreditStructure: {
      minor: p.declaredMinor,
      offeringSchool: p.minorSchool,
      status: p.minorStatus,
      trackingStatus: p.minorTracking ? p.minorTracking.status : p.minorStatus,
      requiredCredits: minorTotalCredits,
      completedCredits: minorCompletedCredits,
      remainingCredits: minorRemainingCredits,
      curriculumCourses: p.minorCreditStructure.coursesOffered
    },
    // Backward-compatible sections for existing UI callers
    studentInfo: {
      name: p.display_name,
      studentId: p.id,
      program: p.programName,
      school: p.school,
      batch: p.batch,
      semester: `Semester ${p.semester}`,
      declaredMinor: p.declaredMinor,
      minorSchool: p.minorSchool,
      specialisation: p.specialisation
    },
    academicInfo: {
      currentSemester: p.semester,
      enrolledCourses: p.enrolledCourses.map(c => ({
        code: c.code,
        title: c.name,
        ltp: c.ltp,
        credits: c.credits,
        prerequisite: c.prerequisite,
        conducted: c.conducted,
        attended: c.attended,
        attendancePercentage: c.attendancePercentage,
        attendanceStatus: c.attendanceStatus,
        isAtRisk: c.isAtRisk
      })),
      totalSemesterCredits: p.enrolledCourses.reduce((sum, c) => sum + (c.credits || 0), 0)
    },
    creditOverview: {
      totalDegreeCreditsRequired: 180,
      degreeRequirementNote: 'Official Vidyashilp University B.Tech (Hons.) CSE norm across all curriculum batches (2022–2026).',
      completedCredits: p.completedCredits,
      remainingCredits: p.remainingCredits,
      cgpa: p.cgpa,
      attendance: p.attendance,
      feeStatus: 'Fee cleared per official records',
      minorCreditStructure: {
        minor: p.declaredMinor,
        offeringSchool: p.minorSchool,
        status: p.minorStatus,
        requiredCredits: p.minorCreditStructure.totalCredits,
        completedCredits: p.minorCreditStructure.completedCredits,
        curriculumCourses: p.minorCreditStructure.coursesOffered
      }
    }
  };
}

/**
 * Isolated student chat history
 */
function getStudentHistory(studentId) {
  if (!studentId) return [];
  const canonicalId = ALIAS_LOOKUP.get(String(studentId).toUpperCase()) || studentId;
  return studentChatHistories.get(canonicalId) || [];
}

function appendStudentHistory(studentId, entry) {
  if (!studentId || !entry) return;
  const canonicalId = ALIAS_LOOKUP.get(String(studentId).toUpperCase()) || studentId;
  if (!studentChatHistories.has(canonicalId)) {
    studentChatHistories.set(canonicalId, []);
  }
  const hist = studentChatHistories.get(canonicalId);
  hist.push({
    sender: entry.sender,
    text: entry.text,
    timestamp: Date.now()
  });
  if (hist.length > 50) {
    hist.shift();
  }
}

function clearStudentHistory(studentId) {
  if (!studentId) return;
  const canonicalId = ALIAS_LOOKUP.get(String(studentId).toUpperCase()) || studentId;
  studentChatHistories.delete(canonicalId);
}

module.exports = {
  authenticateStudent,
  validateSession,
  destroySession,
  getStudentProfileById,
  getStudentDashboardData,
  getStudentHistory,
  appendStudentHistory,
  clearStudentHistory,
  calculateAttendanceStatus,
  hashPassword,
  verifyPassword,
  createSessionToken,
  ALL_PROFILES: RAW_STUDENT_DATA.map(r => {
    const record = STUDENT_STORE.get(r.id);
    return sanitizeProfile(record ? record.profile : null);
  }).filter(Boolean)
};
