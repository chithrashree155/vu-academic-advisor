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
 * Deterministic salt per student ID ensuring consistent hashing across serverless restarts
 */
function getDeterministicSalt(studentId) {
  return crypto.createHash('sha256').update(String(studentId).toUpperCase() + '_vu_salt_2026').digest('hex').substring(0, 32);
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
  // ── STUDENT 1: Batch 2022, Sem 5 (Scenario A: Approved Medical Leave) ──
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
    degreeTotalCredits: 180,
    declaredMinor: 'Finance',
    minorSchool: 'School of Business Studies',
    minorStatus: 'Offered (24 defined credits for Batch 2022 in official minor curriculum)',
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 8,
      remainingCredits: 16,
      school: 'School of Business Studies',
      batch: '2022',
      coursesOffered: [
        { code: 'BUSS201', name: 'Financial Accounting & Reporting', credits: 4, status: 'Completed', semester: 3, grade: 'A' },
        { code: 'BUSS202', name: 'Corporate Finance', credits: 4, status: 'Completed', semester: 4, grade: 'A' },
        { code: 'BUSS301', name: 'Security Analysis & Portfolio Management', credits: 4, status: 'Pending', semester: 5 },
        { code: 'BUSS302', name: 'Financial Markets & Institutions', credits: 4, status: 'Pending', semester: 6 },
        { code: 'BUSS401', name: 'Derivatives & Risk Management', credits: 4, status: 'Pending', semester: 7 },
        { code: 'BUSS402', name: 'Fintech & Financial Modeling', credits: 4, status: 'Pending', semester: 8 }
      ]
    },
    // Semester-wise CGPA and Credit Records (Sem 1 to Sem 4 completed)
    semesterHistory: [
      { semester: 1, sgpa: 8.40, credits: 23, status: 'Completed' },
      { semester: 2, sgpa: 8.65, credits: 23, status: 'Completed' },
      { semester: 3, sgpa: 8.50, credits: 22, status: 'Completed' },
      { semester: 4, sgpa: 8.80, credits: 23, status: 'Completed' }
    ],
    completedCredits: 91,
    remainingCredits: 89,
    cgpa: 8.59,
    // Scenario A: Approved Medical Leave
    medicalLeave: {
      hasRecord: true,
      status: 'Approved',
      duration: '12 days (10-Sep-2024 to 22-Sep-2024)',
      reason: 'Acute Typhoid (Synthetic Evaluation Scenario)',
      affectedCourses: [
        { code: 'COMP208', name: 'Computer Networks', sessionsMissed: 4 },
        { code: 'COMP207', name: 'Operating Systems', sessionsMissed: 3 }
      ],
      approvalAuthority: 'Dean & Academic Committee per SOP Clause 2',
      submissionStatus: 'Submitted verified hospital certificate within 3 working days',
      academicImpact: 'Under Handbook Clause 7.3, medical leave does not automatically waive or grant attendance credits. It qualifies the student for attendance condonation down to 65% if overall attendance drops below 75%. Since Aarav maintains >80% in all courses, eligibility is fully preserved without condonation.'
    },
    // Enrolled Courses with Detailed Course-Wise Attendance
    enrolledCourses: [
      {
        code: 'COMP208',
        name: 'Computer Networks',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'None',
        conducted: 32,
        attended: 26,
        category: 'Core Engineering'
      },
      {
        code: 'COMP207',
        name: 'Operating Systems',
        ltp: '2-0-2',
        credits: 3,
        prerequisite: 'None',
        conducted: 28,
        attended: 23,
        category: 'Core Engineering'
      },
      {
        code: 'DATA301',
        name: 'Machine Learning',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'DATA202, MATH301',
        conducted: 34,
        attended: 30,
        category: 'Major Core'
      },
      {
        code: 'DATA207',
        name: 'Big Data / Human Centric AI',
        ltp: '1-0-2',
        credits: 2,
        prerequisite: 'None',
        conducted: 20,
        attended: 18,
        category: 'Major Elective'
      },
      {
        code: 'DATA801',
        name: 'Summer Training / Internship (Project-3)',
        ltp: '0-0-4',
        credits: 2,
        prerequisite: 'None',
        conducted: 16,
        attended: 15,
        category: 'Experiential Project'
      }
    ],
    nextSemesterCourses: [
      { code: 'LANG101', name: 'Language (Kannada Kali / Manasu)', ltp: '0-0-0', credits: 3, prerequisite: 'None' },
      { code: 'COMP206', name: 'Microprocessors and Computer Architecture', ltp: '3-0-2', credits: 4, prerequisite: 'COMP204, COMP207' },
      { code: 'DATA302', name: 'Deep Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA301' },
      { code: 'DATA402', name: 'Advanced Visualization and Big Data Framework', ltp: '2-0-4', credits: 4, prerequisite: 'DATA301' }
    ],
    backlogs: [],
    passwords: ['Student1@2022', 'Aarav@VU2022']
  },

  // ── STUDENT 2: Batch 2022, Sem 7 (Scenario C: Backlog in COMP204) ──
  {
    id: '2022UG00002',
    legacyAliases: ['VU-BTECH-2202'],
    display_name: 'Bhavya Patel',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2022',
    semester: 7,
    specialisation: 'Not specified',
    degreeTotalCredits: 180,
    declaredMinor: 'Psychology',
    minorSchool: 'School of Liberal Arts & Design',
    minorStatus: 'Offered (24 defined credits for Batch 2022 in official minor curriculum)',
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 16,
      remainingCredits: 8,
      school: 'School of Liberal Arts & Design',
      batch: '2022',
      coursesOffered: [
        { code: 'PSYC101', name: 'Introduction to Psychology', credits: 4, status: 'Completed', semester: 3, grade: 'A' },
        { code: 'PSYC201', name: 'Cognitive Psychology', credits: 4, status: 'Completed', semester: 4, grade: 'B+' },
        { code: 'PSYC202', name: 'Social Psychology', credits: 4, status: 'Completed', semester: 5, grade: 'A' },
        { code: 'PSYC301', name: 'Developmental Psychology', credits: 4, status: 'Completed', semester: 6, grade: 'A+' },
        { code: 'PSYC302', name: 'Abnormal Psychology', credits: 4, status: 'Pending', semester: 7 },
        { code: 'PSYC401', name: 'Organizational Psychology', credits: 4, status: 'Pending', semester: 8 }
      ]
    },
    // Semester-wise CGPA and Credit Records (Sem 1 to Sem 6 completed)
    semesterHistory: [
      { semester: 1, sgpa: 7.90, credits: 23, status: 'Completed' },
      { semester: 2, sgpa: 8.10, credits: 23, status: 'Completed' },
      { semester: 3, sgpa: 7.80, credits: 22, status: 'Completed' },
      { semester: 4, sgpa: 6.85, credits: 19, status: 'Completed with Backlog in COMP204' },
      { semester: 5, sgpa: 8.20, credits: 22, status: 'Completed' },
      { semester: 6, sgpa: 8.35, credits: 21, status: 'Completed' }
    ],
    completedCredits: 130,
    remainingCredits: 50, // 180 - 130 = 50 (includes 4 backlog credits for COMP204)
    cgpa: 7.89,
    medicalLeave: {
      hasRecord: false,
      status: 'No medical leave recorded'
    },
    // Scenario C: Backlog in COMP204
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
        progressionImpact: 'Under Student Handbook Section III, Clause 12.1 (Degree Award Regulations), all mandatory core courses and degree credits must be cleared with a passing grade (minimum grade point 4.0) to qualify for graduation. Bhavya must re-register or clear COMP204 in the next offered term to fulfill degree requirements.'
      }
    ],
    enrolledCourses: [
      {
        code: 'COMP302',
        name: 'Internet of Things / Compiler Design',
        ltp: '0-0-4',
        credits: 2,
        prerequisite: 'COMP132, COMP201, COMP206, COMP208, COMP301',
        conducted: 24,
        attended: 21,
        category: 'Core Engineering'
      },
      {
        code: 'DATA403',
        name: 'Natural Language Processing / Software Architecture',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'DATA302',
        conducted: 30,
        attended: 26,
        category: 'Major Elective'
      },
      {
        code: 'DATA404',
        name: 'Multi Modal Learning / Cloud Computing',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'DATA302',
        conducted: 30,
        attended: 27,
        category: 'Major Elective'
      },
      {
        code: 'DATA405',
        name: 'Reinforcement Learning / Cognitive Computing',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'MATH202, MATH204',
        conducted: 30,
        attended: 25,
        category: 'Major Elective'
      },
      {
        code: 'DATA802',
        name: 'Interdisciplinary Project (Capstone Phase-1)',
        ltp: '0-0-0',
        credits: 2,
        prerequisite: 'None',
        conducted: 18,
        attended: 17,
        category: 'Capstone'
      }
    ],
    nextSemesterCourses: [
      { code: 'DATA803', name: 'Capstone Project / Industrial Internship', ltp: '0-0-0', credits: 12, prerequisite: 'DATA802' }
    ],
    passwords: ['Student2@2022', 'Bhavya@VU2022']
  },

  // ── STUDENT 3: Batch 2023, Sem 5 (Design Minor, High Performer) ──
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
    degreeTotalCredits: 180,
    declaredMinor: 'Design',
    minorSchool: 'School of Design',
    minorStatus: 'Offered (24 defined credits for Batch 2023 in official minor curriculum)',
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 8,
      remainingCredits: 16,
      school: 'School of Design',
      batch: '2023',
      coursesOffered: [
        { code: 'DESN101', name: 'Design Fundamentals & Visual Language', credits: 4, status: 'Completed', semester: 3, grade: 'A+' },
        { code: 'DESN201', name: 'User Experience (UX) Design', credits: 4, status: 'Completed', semester: 4, grade: 'A' },
        { code: 'DESN202', name: 'Interaction Design & Prototyping', credits: 4, status: 'Pending', semester: 5 },
        { code: 'DESN301', name: 'Design Research & Human Centered Methods', credits: 4, status: 'Pending', semester: 6 },
        { code: 'DESN302', name: 'Information Design & Visual Systems', credits: 4, status: 'Pending', semester: 7 },
        { code: 'DESN401', name: 'Design Project & Portfolio', credits: 4, status: 'Pending', semester: 8 }
      ]
    },
    semesterHistory: [
      { semester: 1, sgpa: 9.10, credits: 23, status: 'Completed' },
      { semester: 2, sgpa: 9.25, credits: 23, status: 'Completed' },
      { semester: 3, sgpa: 9.00, credits: 22, status: 'Completed' },
      { semester: 4, sgpa: 9.15, credits: 23, status: 'Completed' }
    ],
    completedCredits: 91,
    remainingCredits: 89,
    cgpa: 9.13,
    medicalLeave: { hasRecord: false, status: 'No medical leave recorded' },
    backlogs: [],
    enrolledCourses: [
      {
        code: 'LANG101',
        name: 'Language (Kannada Kali / Manasu)',
        ltp: '2-1-0',
        credits: 3,
        prerequisite: 'None',
        conducted: 22,
        attended: 20,
        category: 'University Core'
      },
      {
        code: 'COMP208',
        name: 'Computer Networks',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'None',
        conducted: 32,
        attended: 29,
        category: 'Core Engineering'
      },
      {
        code: 'COMP207',
        name: 'Operating Systems',
        ltp: '2-0-2',
        credits: 3,
        prerequisite: 'None',
        conducted: 28,
        attended: 26,
        category: 'Core Engineering'
      },
      {
        code: 'COMP206',
        name: 'Computer Organisation and Architecture',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'None',
        conducted: 32,
        attended: 30,
        category: 'Core Engineering'
      },
      {
        code: 'DATA301',
        name: 'Machine Learning',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'DATA202, MATH301',
        conducted: 34,
        attended: 31,
        category: 'Major Core'
      },
      {
        code: 'DATA801',
        name: 'Summer Training / Internship (Project-3)',
        ltp: '0-0-4',
        credits: 2,
        prerequisite: 'None',
        conducted: 16,
        attended: 16,
        category: 'Experiential Project'
      }
    ],
    nextSemesterCourses: [
      { code: 'COMP302', name: 'Internet of Things', ltp: '0-0-4', credits: 2, prerequisite: 'COMP132, COMP201, COMP206, COMP208, COMP301' },
      { code: 'DATA302', name: 'Deep Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA301' },
      { code: 'COMP401', name: 'Web Framework & Scalable Systems', ltp: '2-0-4', credits: 4, prerequisite: 'None' },
      { code: 'UCOR215', name: 'Humanistic Leadership Development', ltp: '1-1-0', credits: 2, prerequisite: 'None' }
    ],
    passwords: ['Student3@2023', 'Chirag@VU2023']
  },

  // ── STUDENT 4: Batch 2024, Sem 4 (Scenario B: Low Attendance in Exactly One Course: COMP209) ──
  {
    id: '2024UG00001',
    legacyAliases: ['VU-BTECH-2404'],
    display_name: 'Divya Nair',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2024',
    semester: 4,
    specialisation: 'Not specified',
    degreeTotalCredits: 180,
    declaredMinor: 'Marketing',
    minorSchool: 'School of Business Studies',
    minorStatus: 'Offered (24 defined credits for Batch 2024; note: Economics is NOT RUNNING for 2024)',
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 4,
      remainingCredits: 20,
      school: 'School of Business Studies',
      batch: '2024',
      coursesOffered: [
        { code: 'MKTG101', name: 'Principles of Marketing', credits: 4, status: 'Completed', semester: 3, grade: 'A' },
        { code: 'MKTG201', name: 'Consumer Behavior & Insights', credits: 4, status: 'Pending', semester: 4 },
        { code: 'MKTG202', name: 'Digital & Social Media Marketing', credits: 4, status: 'Pending', semester: 5 },
        { code: 'MKTG301', name: 'Brand Strategy & Management', credits: 4, status: 'Pending', semester: 6 },
        { code: 'MKTG302', name: 'Marketing Analytics & Metrics', credits: 4, status: 'Pending', semester: 7 },
        { code: 'MKTG401', name: 'Integrated Marketing Communications', credits: 4, status: 'Pending', semester: 8 }
      ]
    },
    semesterHistory: [
      { semester: 1, sgpa: 8.20, credits: 23, status: 'Completed' },
      { semester: 2, sgpa: 8.40, credits: 23, status: 'Completed' },
      { semester: 3, sgpa: 8.10, credits: 22, status: 'Completed' }
    ],
    completedCredits: 68,
    remainingCredits: 112,
    cgpa: 8.24,
    medicalLeave: { hasRecord: false, status: 'No medical leave recorded' },
    backlogs: [],
    // Scenario B: Low attendance in COMP209 (68%), all other courses > 80%
    enrolledCourses: [
      {
        code: 'COMP209',
        name: 'Databases Management',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'None',
        conducted: 25,
        attended: 17, // (17 / 25) * 100 = 68.0% < 75% AT RISK!
        category: 'Core Engineering'
      },
      {
        code: 'UCOR310',
        name: 'The Startup Game',
        ltp: '2-1-0',
        credits: 3,
        prerequisite: 'None',
        conducted: 24,
        attended: 21, // 87.5%
        category: 'University Core'
      },
      {
        code: 'SLAD206',
        name: 'India and the World',
        ltp: '2-0-0',
        credits: 2,
        prerequisite: 'None',
        conducted: 20,
        attended: 18, // 90.0%
        category: 'Liberal Arts'
      },
      {
        code: 'COMP403',
        name: 'Artificial Intelligence',
        ltp: '2-0-2',
        credits: 3,
        prerequisite: 'None',
        conducted: 26,
        attended: 22, // 84.62%
        category: 'Core Engineering'
      },
      {
        code: 'COMP204',
        name: 'Digital Design and Computer Organization',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'None',
        conducted: 30,
        attended: 26, // 86.67%
        category: 'Core Engineering'
      },
      {
        code: 'COMP301',
        name: 'Software Engineering',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'None',
        conducted: 28,
        attended: 24, // 85.71%
        category: 'Core Engineering'
      },
      {
        code: 'MATH301',
        name: 'Linear Algebra / Optimization',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'None',
        conducted: 30,
        attended: 26, // 86.67%
        category: 'Mathematics Core'
      }
    ],
    nextSemesterCourses: [
      { code: 'COMP206', name: 'Microprocessors and Computer Architecture', ltp: '3-0-2', credits: 4, prerequisite: 'COMP204, COMP207' },
      { code: 'DATA301', name: 'Machine Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA206, MATH301' },
      { code: 'COMP401', name: 'Probabilistic Graph Models / Web Framework', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'DATA801', name: 'Summer Training / Internship', ltp: '0-0-0', credits: 2, prerequisite: 'None' }
    ],
    passwords: ['Student4@2024', 'Divya@VU2024']
  },

  // ── STUDENT 5: Batch 2025, Sem 3 (Economics Minor) ──
  {
    id: '2025UG00001',
    legacyAliases: ['VU-BTECH-2505'],
    display_name: 'Eshaan Kulkarni',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2025',
    semester: 3,
    specialisation: 'Not specified',
    degreeTotalCredits: 180,
    declaredMinor: 'Economics',
    minorSchool: 'School of Liberal Arts & Design',
    minorStatus: 'Offered (24 defined credits for Batch 2025 in official minor curriculum)',
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 0,
      remainingCredits: 24,
      school: 'School of Liberal Arts & Design',
      batch: '2025',
      coursesOffered: [
        { code: 'ECON101', name: 'Microeconomics Principles', credits: 4, status: 'Pending', semester: 3 },
        { code: 'ECON102', name: 'Macroeconomics Principles', credits: 4, status: 'Pending', semester: 4 },
        { code: 'ECON201', name: 'Intermediate Microeconomics', credits: 4, status: 'Pending', semester: 5 },
        { code: 'ECON202', name: 'Intermediate Macroeconomics', credits: 4, status: 'Pending', semester: 6 },
        { code: 'ECON301', name: 'Econometrics & Quantitative Economics', credits: 4, status: 'Pending', semester: 7 },
        { code: 'ECON302', name: 'Development & International Economics', credits: 4, status: 'Pending', semester: 8 }
      ]
    },
    semesterHistory: [
      { semester: 1, sgpa: 8.50, credits: 23, status: 'Completed' },
      { semester: 2, sgpa: 8.70, credits: 23, status: 'Completed' }
    ],
    completedCredits: 46,
    remainingCredits: 134,
    cgpa: 8.60,
    medicalLeave: { hasRecord: false, status: 'No medical leave recorded' },
    backlogs: [],
    enrolledCourses: [
      {
        code: 'UCOR207',
        name: 'Law and Ethics',
        ltp: '2-1-0',
        credits: 3,
        prerequisite: 'None',
        conducted: 24,
        attended: 21,
        category: 'University Core'
      },
      {
        code: 'SLAD206',
        name: 'Critical Thinking',
        ltp: '2-0-0',
        credits: 2,
        prerequisite: 'None',
        conducted: 20,
        attended: 17,
        category: 'Liberal Arts'
      },
      {
        code: 'MATH209',
        name: 'Linear Algebra',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'None',
        conducted: 30,
        attended: 27,
        category: 'Mathematics Core'
      },
      {
        code: 'COMP202',
        name: 'Theoretical Computer Science',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'None',
        conducted: 30,
        attended: 26,
        category: 'Core Engineering'
      },
      {
        code: 'COMP203',
        name: 'Analysis of Algorithms',
        ltp: '3-0-2',
        credits: 4,
        prerequisite: 'COMP201',
        conducted: 30,
        attended: 27,
        category: 'Core Engineering'
      },
      {
        code: 'DATA209',
        name: 'Advanced Exploratory Data Analysis',
        ltp: '2-0-4',
        credits: 4,
        prerequisite: 'DATA132, MATH203',
        conducted: 32,
        attended: 28,
        category: 'Major Core'
      }
    ],
    nextSemesterCourses: [
      { code: 'UCOR205', name: 'Socio-Cultural Perspectives on Indian Life', ltp: '2-1-0', credits: 3, prerequisite: 'None' },
      { code: 'MATH210', name: 'Advanced Statistical Analysis & Research Methods', ltp: '1-0-4', credits: 3, prerequisite: 'MATH203' },
      { code: 'COMP211', name: 'Operating Systems', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'COMP301', name: 'Artificial Intelligence', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'COMP205', name: 'Object Oriented Programming', ltp: '2-0-2', credits: 3, prerequisite: 'None' },
      { code: 'MATH301', name: 'Optimization Techniques for Data Science', ltp: '3-1-0', credits: 4, prerequisite: 'MATH201' }
    ],
    passwords: ['Student5@2025', 'Eshaan@VU2025']
  },

  // ── STUDENT 6: Batch 2026, Sem 1 (Freshman, First Term in Progress) ──
  {
    id: '2026UG00001',
    legacyAliases: ['VU-BTECH-2606'],
    display_name: 'Farhan Ahmed',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2026',
    semester: 1,
    specialisation: 'Not specified',
    degreeTotalCredits: 180,
    declaredMinor: 'Psychology',
    minorSchool: 'School of Liberal Arts & Design',
    minorStatus: 'Offered (24 defined credits for Batch 2026; note: Law is NOT DECIDED for Batch 2026)',
    minorCreditStructure: {
      totalCredits: 24,
      completedCredits: 0,
      remainingCredits: 24,
      school: 'School of Liberal Arts & Design',
      batch: '2026',
      coursesOffered: [
        { code: 'PSYC101', name: 'Introduction to Psychology', credits: 4, status: 'Pending', semester: 3 },
        { code: 'PSYC201', name: 'Cognitive Processes & Brain', credits: 4, status: 'Pending', semester: 4 },
        { code: 'PSYC202', name: 'Social Behavior & Influence', credits: 4, status: 'Pending', semester: 5 },
        { code: 'PSYC301', name: 'Lifespan Developmental Psychology', credits: 4, status: 'Pending', semester: 6 },
        { code: 'PSYC302', name: 'Mental Health & Clinical Psychology', credits: 4, status: 'Pending', semester: 7 },
        { code: 'PSYC401', name: 'Applied Behavioral & Work Psychology', credits: 4, status: 'Pending', semester: 8 }
      ]
    },
    semesterHistory: [],
    completedCredits: 0,
    remainingCredits: 180,
    cgpa: 'In progress (Semester 1 exams pending)',
    medicalLeave: { hasRecord: false, status: 'No medical leave recorded' },
    backlogs: [],
    enrolledCourses: [
      {
        code: 'UCOR107',
        name: 'Communication Skills',
        ltp: '2-0-2',
        credits: 3,
        prerequisite: 'None',
        conducted: 22,
        attended: 20,
        category: 'University Core'
      },
      {
        code: 'UCOR106',
        name: 'Learning to Learn',
        ltp: '1-0-2',
        credits: 2,
        prerequisite: 'None',
        conducted: 18,
        attended: 16,
        category: 'University Core'
      },
      {
        code: 'MATH208',
        name: 'Multivariate Calculus',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'None',
        conducted: 28,
        attended: 25,
        category: 'Mathematics Core'
      },
      {
        code: 'MTSC111',
        name: 'Materials for Smart Devices',
        ltp: '2-0-2',
        credits: 3,
        prerequisite: 'None',
        conducted: 22,
        attended: 19,
        category: 'Basic Science Core'
      },
      {
        code: 'DATA103',
        name: 'Programming in Python',
        ltp: '1-0-4',
        credits: 3,
        prerequisite: 'None',
        conducted: 30,
        attended: 28,
        category: 'Major Core'
      },
      {
        code: 'COMP204',
        name: 'Digital Design and Computer Organization',
        ltp: '3-1-0',
        credits: 4,
        prerequisite: 'None',
        conducted: 28,
        attended: 25,
        category: 'Core Engineering'
      },
      {
        code: 'MGMT101',
        name: 'Essentials of Business Management',
        ltp: '1-1-0',
        credits: 2,
        prerequisite: 'None',
        conducted: 18,
        attended: 16,
        category: 'Management Core'
      },
      {
        code: 'PSYC105/ECON106',
        name: 'Intro to Psychology / Principles of Economics',
        ltp: '1-1-0',
        credits: 2,
        prerequisite: 'None',
        conducted: 18,
        attended: 17,
        category: 'Interdisciplinary Core'
      }
    ],
    nextSemesterCourses: [
      { code: 'UCOR111', name: 'Environmental Studies and Sustainability', ltp: '0-0-0', credits: 2, prerequisite: 'None' },
      { code: 'LAWS101', name: 'Fundamentals of Indian Constitution & Human Rights', ltp: '1-1-0', credits: 2, prerequisite: 'None' },
      { code: 'UCOR701', name: 'Community Engagement & Service Experience', ltp: '0-0-0', credits: 1, prerequisite: 'None' },
      { code: 'MATH203', name: 'Probability and Statistics', ltp: '3-1-0', credits: 4, prerequisite: 'None' },
      { code: 'MTSC211', name: 'Sustainable Smart Materials', ltp: '2-0-2', credits: 3, prerequisite: 'MTSC111' },
      { code: 'COMP133', name: 'Design Workshop', ltp: '1-0-4', credits: 3, prerequisite: 'None' },
      { code: 'COMP201', name: 'Data Structures', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'DATA132', name: 'Data Visualization and Storytelling', ltp: '1-0-4', credits: 3, prerequisite: 'DATA103' },
      { code: 'COMP209', name: 'Databases Management', ltp: '3-0-2', credits: 4, prerequisite: 'None' }
    ],
    passwords: ['Student6@2026', 'Farhan@VU2026']
  }
];

// Initialize lookup tables and deterministic credential hashes
const STUDENT_STORE = new Map();
const ALIAS_LOOKUP = new Map();

RAW_STUDENT_DATA.forEach(raw => {
  const salt = getDeterministicSalt(raw.id);
  // Support both primary and alternate demo passwords
  const passwordHashes = (raw.passwords || []).map(p => hashPassword(p, salt));

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
    degreeTotalCredits: raw.degreeTotalCredits,
    completedCredits: raw.completedCredits,
    remainingCredits: raw.remainingCredits,
    cgpa: raw.cgpa,
    semesterHistory: raw.semesterHistory,
    declaredMinor: raw.declaredMinor,
    minorSchool: raw.minorSchool,
    minorStatus: raw.minorStatus,
    minorCreditStructure: raw.minorCreditStructure,
    enrolledCourses: enrichedEnrolled,
    nextSemesterCourses: raw.nextSemesterCourses,
    backlogs: raw.backlogs || [],
    medicalLeave: raw.medicalLeave || { hasRecord: false },
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
    passwordHashes
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
  delete clone.passwordHashes;
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
  const isMatch = record.passwordHashes.some(storedHash =>
    verifyPassword(inputPass, storedHash, record.salt)
  );

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

  // Major course calculations
  const degreeTotalCredits = 180;
  const completedCredits = typeof p.completedCredits === 'number' ? p.completedCredits : 0;
  const remainingCredits = degreeTotalCredits - completedCredits;
  const majorProgressPct = Math.round((completedCredits / (degreeTotalCredits - 24)) * 100);

  // Minor course calculations
  const minorTotalCredits = (p.minorCreditStructure && p.minorCreditStructure.totalCredits) || 24;
  const minorCompletedCredits = (p.minorCreditStructure && p.minorCreditStructure.completedCredits) || 0;
  const minorRemainingCredits = minorTotalCredits - minorCompletedCredits;
  const minorProgressPct = Math.round((minorCompletedCredits / minorTotalCredits) * 100);

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
      specialisation: p.specialisation || 'Not specified'
    },
    academicSummary: {
      overallCgpa: p.cgpa,
      completedCredits,
      remainingCredits,
      degreeTotalCredits,
      majorProgress: `${majorProgressPct}% (${completedCredits}/${degreeTotalCredits - 24} cr)`,
      minorProgress: `${minorProgressPct}% (${minorCompletedCredits}/${minorTotalCredits} cr)`,
      specialisationProgress: 'Not assigned'
    },
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
    medicalLeave: p.medicalLeave || { hasRecord: false },
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
