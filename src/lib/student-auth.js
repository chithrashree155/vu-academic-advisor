/**
 * Secure Student Authentication & Profile Management Engine
 * Vidyashilp University (VU Academic Advisor)
 *
 * Implements salted password hashing (crypto.scryptSync), cryptographic session management,
 * and 6 secure synthetic B.Tech student profiles grounded strictly in official university datasets:
 * - Semester_Spread_Structures_Sept_2026.xlsx
 * - Minor_Courses_for_BTech_Students.xlsx
 * - Student Handbook Aug 2026.pdf
 */

'use strict';

const crypto = require('crypto');

// Session storage: Map<token, { studentId: string, createdAt: number, expiresAt: number }>
const activeSessions = new Map();
// Per-student isolated chat history: Map<studentId, Array<{ sender: string, text: string, timestamp: number }>>
const studentChatHistories = new Map();

// Session validity: 24 hours
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

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

// ── 6 SECURE SYNTHETIC B.TECH STUDENT PROFILES GROUNDED IN OFFICIAL DATA ──
// All students are enrolled in B.Tech (Hons.) Computer Science & Engineering,
// School of Computational and Data Sciences.

const RAW_STUDENT_DATA = [
  {
    id: 'VU-BTECH-2201',
    display_name: 'Aarav Sharma',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2022',
    semester: 5,
    specialisation: 'Not specified',
    degreeTotalCredits: 180,
    completedCredits: 'Not available in local records (refer to ERP)',
    remainingCredits: 'Not available until completed credits are recorded',
    cgpa: 'Not available in local records (maintained in university ERP)',
    attendance: 'Not available in local records (maintained in university ERP)',
    feeCleared: 'Official fee records maintained in Digii ERP',
    declaredMinor: 'Finance',
    minorSchool: 'School of Business Studies',
    minorStatus: 'Offered (24 defined credits for Batch 2022 in official minor curriculum)',
    minorCreditStructure: {
      totalCredits: 24,
      school: 'School of Business Studies',
      batch: '2022',
      coursesOffered: [
        { code: 'BUSS201', name: 'Financial Accounting & Reporting', credits: 4 },
        { code: 'BUSS202', name: 'Corporate Finance', credits: 4 },
        { code: 'BUSS301', name: 'Security Analysis & Portfolio Management', credits: 4 },
        { code: 'BUSS302', name: 'Financial Markets & Institutions', credits: 4 },
        { code: 'BUSS401', name: 'Derivatives & Risk Management', credits: 4 },
        { code: 'BUSS402', name: 'Fintech & Financial Modeling', credits: 4 }
      ]
    },
    enrolledCourses: [
      { code: 'COMP208', name: 'Computer Networks', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'COMP207', name: 'Operating Systems', ltp: '2-0-2', credits: 3, prerequisite: 'None' },
      { code: 'DATA301', name: 'Machine Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA202, MATH301' },
      { code: 'DATA207', name: 'Big Data / Human Centric AI', ltp: '1-0-2', credits: 2, prerequisite: 'None' },
      { code: 'DATA801', name: 'Summer Training / Internship (Project-3)', ltp: '0-0-4', credits: 2, prerequisite: 'None' }
    ],
    nextSemesterCourses: [
      { code: 'LANG101', name: 'Language (Kannada Kali / Manasu)', ltp: '0-0-0', credits: 3, prerequisite: 'None' },
      { code: 'COMP206', name: 'Microprocessors and Computer Architecture', ltp: '3-0-2', credits: 4, prerequisite: 'COMP204, COMP207' },
      { code: 'DATA302', name: 'Deep Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA301' },
      { code: 'DATA402', name: 'Advanced Visualization and Big Data Framework', ltp: '2-0-4', credits: 4, prerequisite: 'DATA301' }
    ],
    passwordPlain: 'Aarav@VU2022'
  },
  {
    id: 'VU-BTECH-2202',
    display_name: 'Bhavya Patel',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2022',
    semester: 7,
    specialisation: 'Not specified',
    degreeTotalCredits: 180,
    completedCredits: 'Not available in local records (refer to ERP)',
    remainingCredits: 'Not available until completed credits are recorded',
    cgpa: 'Not available in local records (maintained in university ERP)',
    attendance: 'Not available in local records (maintained in university ERP)',
    feeCleared: 'Official fee records maintained in Digii ERP',
    declaredMinor: 'Psychology',
    minorSchool: 'School of Liberal Arts & Design',
    minorStatus: 'Offered (24 defined credits for Batch 2022 in official minor curriculum)',
    minorCreditStructure: {
      totalCredits: 24,
      school: 'School of Liberal Arts & Design',
      batch: '2022',
      coursesOffered: [
        { code: 'PSYC101', name: 'Introduction to Psychology', credits: 4 },
        { code: 'PSYC201', name: 'Cognitive Psychology', credits: 4 },
        { code: 'PSYC202', name: 'Social Psychology', credits: 4 },
        { code: 'PSYC301', name: 'Developmental Psychology', credits: 4 },
        { code: 'PSYC302', name: 'Abnormal Psychology', credits: 4 },
        { code: 'PSYC401', name: 'Organizational Psychology', credits: 4 }
      ]
    },
    enrolledCourses: [
      { code: 'COMP302', name: 'Internet of Things / Compiler Design', ltp: '0-0-4', credits: 2, prerequisite: 'COMP132, COMP201, COMP206, COMP208, COMP301' },
      { code: 'DATA403', name: 'Natural Language Processing / Software Architecture', ltp: '2-0-4', credits: 4, prerequisite: 'DATA302' },
      { code: 'DATA404', name: 'Multi Modal Learning / Cloud Computing', ltp: '2-0-4', credits: 4, prerequisite: 'DATA302' },
      { code: 'DATA405', name: 'Reinforcement Learning / Cognitive Computing', ltp: '2-0-4', credits: 4, prerequisite: 'MATH202, MATH204' },
      { code: 'DATA802', name: 'Interdisciplinary Project (Capstone Phase-1)', ltp: '0-0-0', credits: 4, prerequisite: 'None' }
    ],
    nextSemesterCourses: [
      { code: 'DATA803', name: 'Capstone Project / Industrial Internship', ltp: '0-0-0', credits: 12, prerequisite: 'DATA802' }
    ],
    passwordPlain: 'Bhavya@VU2022'
  },
  {
    id: 'VU-BTECH-2303',
    display_name: 'Chirag Verma',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2023',
    semester: 5,
    specialisation: 'Not specified',
    degreeTotalCredits: 180,
    completedCredits: 'Not available in local records (refer to ERP)',
    remainingCredits: 'Not available until completed credits are recorded',
    cgpa: 'Not available in local records (maintained in university ERP)',
    attendance: 'Not available in local records (maintained in university ERP)',
    feeCleared: 'Official fee records maintained in Digii ERP',
    declaredMinor: 'Design',
    minorSchool: 'School of Design',
    minorStatus: 'Offered (24 defined credits for Batch 2023 in official minor curriculum)',
    minorCreditStructure: {
      totalCredits: 24,
      school: 'School of Design',
      batch: '2023',
      coursesOffered: [
        { code: 'DESN101', name: 'Design Fundamentals & Visual Language', credits: 4 },
        { code: 'DESN201', name: 'User Experience (UX) Design', credits: 4 },
        { code: 'DESN202', name: 'Interaction Design & Prototyping', credits: 4 },
        { code: 'DESN301', name: 'Design Research & Human Centered Methods', credits: 4 },
        { code: 'DESN302', name: 'Information Design & Visual Systems', credits: 4 },
        { code: 'DESN401', name: 'Design Project & Portfolio', credits: 4 }
      ]
    },
    enrolledCourses: [
      { code: 'LANG101', name: 'Language (Kannada Kali / Manasu)', ltp: '2-1-0', credits: 3, prerequisite: 'None' },
      { code: 'COMP208', name: 'Computer Networks', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'COMP207', name: 'Operating Systems', ltp: '2-0-2', credits: 3, prerequisite: 'None' },
      { code: 'COMP206', name: 'Computer Organisation and Architecture', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'DATA301', name: 'Machine Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA202, MATH301' },
      { code: 'DATA801', name: 'Summer Training / Internship (Project-3)', ltp: '0-0-4', credits: 2, prerequisite: 'None' }
    ],
    nextSemesterCourses: [
      { code: 'COMP302', name: 'Internet of Things', ltp: '0-0-4', credits: 2, prerequisite: 'COMP132, COMP201, COMP206, COMP208, COMP301' },
      { code: 'DATA302', name: 'Deep Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA301' },
      { code: 'COMP401', name: 'Web Framework & Scalable Systems', ltp: '2-0-4', credits: 4, prerequisite: 'None' },
      { code: 'UCOR215', name: 'Humanistic Leadership Development', ltp: '1-1-0', credits: 2, prerequisite: 'None' }
    ],
    passwordPlain: 'Chirag@VU2023'
  },
  {
    id: 'VU-BTECH-2404',
    display_name: 'Divya Nair',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2024',
    semester: 4,
    specialisation: 'Not specified',
    degreeTotalCredits: 180,
    completedCredits: 'Not available in local records (refer to ERP)',
    remainingCredits: 'Not available until completed credits are recorded',
    cgpa: 'Not available in local records (maintained in university ERP)',
    attendance: 'Not available in local records (maintained in university ERP)',
    feeCleared: 'Official fee records maintained in Digii ERP',
    declaredMinor: 'Marketing',
    minorSchool: 'School of Business Studies',
    minorStatus: 'Offered (24 defined credits for Batch 2024; note: Economics is NOT RUNNING for 2024)',
    minorCreditStructure: {
      totalCredits: 24,
      school: 'School of Business Studies',
      batch: '2024',
      coursesOffered: [
        { code: 'MKTG101', name: 'Principles of Marketing', credits: 4 },
        { code: 'MKTG201', name: 'Consumer Behavior & Insights', credits: 4 },
        { code: 'MKTG202', name: 'Digital & Social Media Marketing', credits: 4 },
        { code: 'MKTG301', name: 'Brand Strategy & Management', credits: 4 },
        { code: 'MKTG302', name: 'Marketing Analytics & Metrics', credits: 4 },
        { code: 'MKTG401', name: 'Integrated Marketing Communications', credits: 4 }
      ]
    },
    enrolledCourses: [
      { code: 'UCOR310', name: 'The Startup Game', ltp: '2-1-0', credits: 3, prerequisite: 'None' },
      { code: 'SLAD206', name: 'India and the World', ltp: '2-0-0', credits: 2, prerequisite: 'None' },
      { code: 'COMP403', name: 'Artificial Intelligence', ltp: '2-0-2', credits: 3, prerequisite: 'None' },
      { code: 'COMP209', name: 'Databases Management', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'COMP204', name: 'Digital Design and Computer Organization', ltp: '3-1-0', credits: 4, prerequisite: 'None' },
      { code: 'COMP301', name: 'Software Engineering', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'MATH301', name: 'Linear Algebra / Optimization', ltp: '3-1-0', credits: 4, prerequisite: 'None' }
    ],
    nextSemesterCourses: [
      { code: 'COMP206', name: 'Microprocessors and Computer Architecture', ltp: '3-0-2', credits: 4, prerequisite: 'COMP204, COMP207' },
      { code: 'DATA301', name: 'Machine Learning', ltp: '2-0-4', credits: 4, prerequisite: 'DATA206, MATH301' },
      { code: 'COMP401', name: 'Probabilistic Graph Models / Web Framework', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'DATA801', name: 'Summer Training / Internship', ltp: '0-0-0', credits: 2, prerequisite: 'None' }
    ],
    passwordPlain: 'Divya@VU2024'
  },
  {
    id: 'VU-BTECH-2505',
    display_name: 'Eshaan Kulkarni',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2025',
    semester: 3,
    specialisation: 'Not specified',
    degreeTotalCredits: 180,
    completedCredits: 'Not available in local records (refer to ERP)',
    remainingCredits: 'Not available until completed credits are recorded',
    cgpa: 'Not available in local records (maintained in university ERP)',
    attendance: 'Not available in local records (maintained in university ERP)',
    feeCleared: 'Official fee records maintained in Digii ERP',
    declaredMinor: 'Economics',
    minorSchool: 'School of Liberal Arts & Design',
    minorStatus: 'Offered (24 defined credits for Batch 2025 in official minor curriculum)',
    minorCreditStructure: {
      totalCredits: 24,
      school: 'School of Liberal Arts & Design',
      batch: '2025',
      coursesOffered: [
        { code: 'ECON101', name: 'Microeconomics Principles', credits: 4 },
        { code: 'ECON102', name: 'Macroeconomics Principles', credits: 4 },
        { code: 'ECON201', name: 'Intermediate Microeconomics', credits: 4 },
        { code: 'ECON202', name: 'Intermediate Macroeconomics', credits: 4 },
        { code: 'ECON301', name: 'Econometrics & Quantitative Economics', credits: 4 },
        { code: 'ECON302', name: 'Development & International Economics', credits: 4 }
      ]
    },
    enrolledCourses: [
      { code: 'UCOR207', name: 'Law and Ethics', ltp: '2-1-0', credits: 3, prerequisite: 'None' },
      { code: 'SLAD206', name: 'Critical Thinking', ltp: '2-0-0', credits: 2, prerequisite: 'None' },
      { code: 'MATH209', name: 'Linear Algebra', ltp: '3-1-0', credits: 4, prerequisite: 'None' },
      { code: 'COMP202', name: 'Theoretical Computer Science', ltp: '3-1-0', credits: 4, prerequisite: 'None' },
      { code: 'COMP203', name: 'Analysis of Algorithms', ltp: '3-0-2', credits: 4, prerequisite: 'COMP201' },
      { code: 'DATA209', name: 'Advanced Exploratory Data Analysis', ltp: '2-0-4', credits: 4, prerequisite: 'DATA132, MATH203' }
    ],
    nextSemesterCourses: [
      { code: 'UCOR205', name: 'Socio-Cultural Perspectives on Indian Life', ltp: '2-1-0', credits: 3, prerequisite: 'None' },
      { code: 'MATH210', name: 'Advanced Statistical Analysis & Research Methods', ltp: '1-0-4', credits: 3, prerequisite: 'MATH203' },
      { code: 'COMP211', name: 'Operating Systems', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'COMP301', name: 'Artificial Intelligence', ltp: '3-0-2', credits: 4, prerequisite: 'None' },
      { code: 'COMP205', name: 'Object Oriented Programming', ltp: '2-0-2', credits: 3, prerequisite: 'None' },
      { code: 'MATH301', name: 'Optimization Techniques for Data Science', ltp: '3-1-0', credits: 4, prerequisite: 'MATH201' }
    ],
    passwordPlain: 'Eshaan@VU2025'
  },
  {
    id: 'VU-BTECH-2606',
    display_name: 'Farhan Ahmed',
    program: 'BTECH_CSE',
    programName: 'B.Tech (Hons.) Computer Science and Engineering',
    school: 'School of Computational and Data Sciences',
    batch: '2026',
    semester: 1,
    specialisation: 'Not specified',
    degreeTotalCredits: 180,
    completedCredits: 'Not available in local records (refer to ERP)',
    remainingCredits: 'Not available until completed credits are recorded',
    cgpa: 'Not available in local records (maintained in university ERP)',
    attendance: 'Not available in local records (maintained in university ERP)',
    feeCleared: 'Official fee records maintained in Digii ERP',
    declaredMinor: 'Psychology',
    minorSchool: 'School of Liberal Arts & Design',
    minorStatus: 'Offered (24 defined credits for Batch 2026; note: Law is NOT DECIDED for Batch 2026)',
    minorCreditStructure: {
      totalCredits: 24,
      school: 'School of Liberal Arts & Design',
      batch: '2026',
      coursesOffered: [
        { code: 'PSYC101', name: 'Introduction to Psychology', credits: 4 },
        { code: 'PSYC201', name: 'Cognitive Processes & Brain', credits: 4 },
        { code: 'PSYC202', name: 'Social Behavior & Influence', credits: 4 },
        { code: 'PSYC301', name: 'Lifespan Developmental Psychology', credits: 4 },
        { code: 'PSYC302', name: 'Mental Health & Clinical Psychology', credits: 4 },
        { code: 'PSYC401', name: 'Applied Behavioral & Work Psychology', credits: 4 }
      ]
    },
    enrolledCourses: [
      { code: 'UCOR107', name: 'Communication Skills', ltp: '2-0-2', credits: 3, prerequisite: 'None' },
      { code: 'UCOR106', name: 'Learning to Learn', ltp: '1-0-2', credits: 2, prerequisite: 'None' },
      { code: 'MATH208', name: 'Multivariate Calculus', ltp: '3-1-0', credits: 4, prerequisite: 'None' },
      { code: 'MTSC111', name: 'Materials for Smart Devices', ltp: '2-0-2', credits: 3, prerequisite: 'None' },
      { code: 'DATA103', name: 'Programming in Python', ltp: '1-0-4', credits: 3, prerequisite: 'None' },
      { code: 'COMP204', name: 'Digital Design and Computer Organization', ltp: '3-1-0', credits: 4, prerequisite: 'None' },
      { code: 'MGMT101', name: 'Essentials of Business Management', ltp: '1-1-0', credits: 2, prerequisite: 'None' },
      { code: 'PSYC105/ECON106', name: 'Intro to Psychology / Principles of Economics', ltp: '1-1-0', credits: 2, prerequisite: 'None' }
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
    passwordPlain: 'Farhan@VU2026'
  }
];

// Initialize secure store with salted hashes
const STUDENT_STORE = new Map();

RAW_STUDENT_DATA.forEach(raw => {
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(raw.passwordPlain, salt);

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
    attendance: raw.attendance,
    feeCleared: raw.feeCleared,
    declaredMinor: raw.declaredMinor,
    minorSchool: raw.minorSchool,
    minorStatus: raw.minorStatus,
    minorCreditStructure: raw.minorCreditStructure,
    enrolledCourses: raw.enrolledCourses,
    nextSemesterCourses: raw.nextSemesterCourses
  };

  STUDENT_STORE.set(raw.id, {
    profile,
    salt,
    passwordHash
  });
});

/**
 * Strips internal security fields from student profile
 */
function sanitizeProfile(profile) {
  if (!profile) return null;
  const clone = { ...profile };
  delete clone.salt;
  delete clone.passwordHash;
  delete clone.passwordPlain;
  return clone;
}

/**
 * Authenticates a student with ID and password.
 * Returns { token, student } on success, or null on failure.
 */
function authenticateStudent(studentId, password) {
  if (!studentId || !password) return null;
  const cleanId = String(studentId).trim().toUpperCase();
  const record = STUDENT_STORE.get(cleanId);
  if (!record) return null;

  const isValid = verifyPassword(String(password), record.passwordHash, record.salt);
  if (!isValid) return null;

  // Generate cryptographically secure session token
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  activeSessions.set(token, {
    studentId: cleanId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS
  });

  return {
    token,
    student: sanitizeProfile(record.profile)
  };
}

/**
 * Validates a session token and returns the student profile.
 * Automatically cleans up expired sessions.
 */
function validateSession(token) {
  if (!token || typeof token !== 'string') return null;
  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  const record = STUDENT_STORE.get(session.studentId);
  if (!record) return null;

  return sanitizeProfile(record.profile);
}

/**
 * Destroys a session token (logout)
 */
function destroySession(token) {
  if (!token) return false;
  return activeSessions.delete(token);
}

/**
 * Retrieves a sanitized student profile by ID (internal only)
 */
function getStudentProfileById(studentId) {
  if (!studentId) return null;
  const record = STUDENT_STORE.get(String(studentId).trim().toUpperCase());
  return record ? sanitizeProfile(record.profile) : null;
}

/**
 * Structured 3-Section Dashboard Data
 */
function getStudentDashboardData(studentId) {
  const p = getStudentProfileById(studentId);
  if (!p) return null;

  return {
    // Section 1: Student Information
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
    // Section 2: Academic Information (Current Enrolled Courses)
    academicInfo: {
      currentSemester: p.semester,
      enrolledCourses: p.enrolledCourses.map(c => ({
        code: c.code,
        title: c.name,
        ltp: c.ltp,
        credits: c.credits,
        prerequisite: c.prerequisite
      })),
      totalSemesterCredits: p.enrolledCourses.reduce((sum, c) => sum + (c.credits || 0), 0)
    },
    // Section 3: Credit Overview
    creditOverview: {
      totalDegreeCreditsRequired: 180,
      degreeRequirementNote: 'Official Vidyashilp University B.Tech (Hons.) CSE norm across all curriculum batches (2022–2026).',
      completedCredits: p.completedCredits,
      remainingCredits: p.remainingCredits,
      cgpa: p.cgpa,
      attendance: p.attendance,
      feeStatus: p.feeCleared,
      minorCreditStructure: {
        minor: p.declaredMinor,
        offeringSchool: p.minorSchool,
        status: p.minorStatus,
        requiredCredits: p.minorCreditStructure.totalCredits,
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
  return studentChatHistories.get(studentId) || [];
}

function appendStudentHistory(studentId, entry) {
  if (!studentId || !entry) return;
  if (!studentChatHistories.has(studentId)) {
    studentChatHistories.set(studentId, []);
  }
  const hist = studentChatHistories.get(studentId);
  hist.push({
    sender: entry.sender,
    text: entry.text,
    timestamp: Date.now()
  });
  // Cap at 50 messages per session
  if (hist.length > 50) {
    hist.shift();
  }
}

function clearStudentHistory(studentId) {
  if (!studentId) return;
  studentChatHistories.delete(studentId);
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
  hashPassword,
  verifyPassword,
  // Export list of sanitized profiles for internal engine lookups (WITHOUT passwords/hashes/salts)
  ALL_PROFILES: RAW_STUDENT_DATA.map(r => sanitizeProfile(r))
};

