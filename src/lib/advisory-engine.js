/**
 * Evidence-Grounded Academic Advisory & Deterministic Eligibility Engine
 * Vidyashilp University (VU Academic Advisor)
 *
 * Pipeline Architecture:
 * USER QUESTION -> QUERY UNDERSTANDING -> IDENTIFY STUDENT CONTEXT -> IDENTIFY COURSE(S)
 * -> RETRIEVE OFFICIAL EVIDENCE -> COURSE CLASSIFICATION -> PREREQUISITE CHECK
 * -> STUDENT TRANSCRIPT CHECK -> SCHOOL/PROGRAM COMPATIBILITY CHECK -> SEMESTER/YEAR CHECK
 * -> CROSS-SCHOOL RULE CHECK -> ELIGIBILITY DECISION -> LLM / STRUCTURED RESPONSE GENERATION -> CITATIONS
 */

'use strict';

const {
  SCHOOL_TAXONOMY,
  OFFICIAL_COURSE_CATALOG,
  COURSE_PREREQUISITES,
  COURSE_ALIASES,
  findCourseByCode,
  findCourseByNameOrAlias,
  getSuggestedCourses,
  getSummerCourses,
  getCoursesByCredits,
  getCoursePrerequisites
} = require('./courses');

const { retriever } = require('./rag/retriever');

// ── INTERNAL SYNTHETIC STUDENT PROFILES (24 PROFILES FOR TESTING & DEMO) ──
// Kept private server-side. Never exposed in full dataset API responses.
const SYNTHETIC_PROFILES = [
  {
    id: 'VU-DEMO-001',
    display_name: 'Aarav Mehta',
    program: 'BTECH_DS',
    programName: 'B.Tech (Hons.) CSE – Data Science',
    school: SCHOOL_TAXONOMY.CS_DATA_AI,
    program_type: 'B.Tech',
    batch: '2024',
    semester: 5,
    cgpa: 8.72,
    attendance: 86.5,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Programming in Python', grade: 'A+', isPassed: true, credits: 3 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'COMP209', courseName: 'Databases Management', grade: 'A', isPassed: true, credits: 4 },
      { courseCode: 'DATA301', courseName: 'Machine Learning', grade: 'A', isPassed: true, credits: 4 }
    ],
    currentCourses: ['DATA302', 'DATA303'],
    interests: ['Machine Learning', 'Data Engineering']
  },
  {
    id: 'VU-DEMO-002',
    display_name: 'Ananya Rao',
    program: 'BTECH_AIML',
    programName: 'B.Tech (Hons.) CSE – AI/ML',
    school: SCHOOL_TAXONOMY.CS_DATA_AI,
    program_type: 'B.Tech',
    batch: '2025',
    semester: 3,
    cgpa: 7.95,
    attendance: 79.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Programming in Python', grade: 'B+', isPassed: true, credits: 3 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'B+', isPassed: true, credits: 3 }
    ],
    currentCourses: ['DATA206', 'COMP201'],
    interests: ['AI', 'Computer Vision']
  },
  {
    id: 'VU-DEMO-003',
    display_name: 'Rohan Nair',
    program: 'BTECH_DS',
    programName: 'B.Tech (Hons.) CSE – Data Science',
    school: SCHOOL_TAXONOMY.CS_DATA_AI,
    program_type: 'B.Tech',
    batch: '2023',
    semester: 7,
    cgpa: 9.10,
    attendance: 92.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Programming in Python', grade: 'O', isPassed: true, credits: 3 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'A+', isPassed: true, credits: 3 },
      { courseCode: 'COMP209', courseName: 'Databases Management', grade: 'A+', isPassed: true, credits: 4 },
      { courseCode: 'DATA301', courseName: 'Machine Learning', grade: 'O', isPassed: true, credits: 4 },
      { courseCode: 'DATA302', courseName: 'Deep Learning', grade: 'A+', isPassed: true, credits: 4 }
    ],
    currentCourses: ['DATA405', 'COMP403'],
    interests: ['Research', 'NLP', 'Generative AI']
  },
  {
    id: 'VU-DEMO-004',
    display_name: 'Ishita Kapoor',
    program: 'BMS_DB',
    programName: 'BMS (Hons.) – Digital Business',
    school: SCHOOL_TAXONOMY.BUSINESS_MGMT,
    program_type: 'BMS',
    batch: '2025',
    semester: 3,
    cgpa: 7.60,
    attendance: 81.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'MGMT101', courseName: 'Essentials of Business Management', grade: 'A', isPassed: true, credits: 2 },
      { courseCode: 'UCOR103', courseName: 'Communication Skills', grade: 'A', isPassed: true, credits: 2 }
    ],
    currentCourses: ['MGMT201', 'MGMT208'],
    interests: ['Digital Marketing', 'Entrepreneurship']
  },
  {
    id: 'VU-DEMO-005',
    display_name: 'Arjun Menon',
    program: 'BMS_DB',
    programName: 'BMS (Hons.) – Digital Business',
    school: SCHOOL_TAXONOMY.BUSINESS_MGMT,
    program_type: 'BMS',
    batch: '2024',
    semester: 5,
    cgpa: 8.10,
    attendance: 77.5,
    feeCleared: false,
    completedCourses: [
      { courseCode: 'MGMT101', courseName: 'Essentials of Business Management', grade: 'B+', isPassed: true, credits: 2 },
      { courseCode: 'MGMT201', courseName: 'Introduction to Digital Business', grade: 'A', isPassed: true, credits: 2 }
    ],
    currentCourses: ['MGMT306', 'MKTG201'],
    interests: ['Business Analytics', 'Finance']
  },
  {
    id: 'VU-DEMO-006',
    display_name: 'Kavya Reddy',
    program: 'BMS_DB_RESEARCH',
    programName: 'BMS (Hons. with Research) – Digital Business',
    school: SCHOOL_TAXONOMY.BUSINESS_MGMT,
    program_type: 'BMS',
    batch: '2023',
    semester: 7,
    cgpa: 8.55,
    attendance: 88.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'MGMT101', courseName: 'Essentials of Business Management', grade: 'A', isPassed: true, credits: 2 },
      { courseCode: 'MGMT201', courseName: 'Introduction to Digital Business', grade: 'A', isPassed: true, credits: 2 },
      { courseCode: 'MGMT208', courseName: 'Introduction to Financial Accounting', grade: 'A+', isPassed: true, credits: 3 }
    ],
    currentCourses: ['MGMT326', 'FINA333'],
    interests: ['Research Methods', 'Strategy']
  },
  {
    id: 'VU-DEMO-007',
    display_name: 'Aditya Sharma',
    program: 'BA_PSY',
    programName: 'BA (Hons.) – Psychology',
    school: SCHOOL_TAXONOMY.PSYCHOLOGY_SOCIAL,
    program_type: 'BA',
    batch: '2025',
    semester: 3,
    cgpa: 7.80,
    attendance: 83.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'PSYC102', courseName: 'Introduction to Psychology', grade: 'B+', isPassed: true, credits: 3 },
      { courseCode: 'UCOR102', courseName: 'Introduction to Writing', grade: 'A', isPassed: true, credits: 2 }
    ],
    currentCourses: ['PSYC201', 'PSYC202'],
    interests: ['Counselling', 'Developmental Psychology']
  },
  {
    id: 'VU-DEMO-008',
    display_name: 'Meera Krishnan',
    program: 'BA_ECO',
    programName: 'BA (Hons.) – Economics',
    school: SCHOOL_TAXONOMY.BUSINESS_MGMT,
    program_type: 'BA',
    batch: '2024',
    semester: 5,
    cgpa: 8.65,
    attendance: 85.5,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'ECON105', courseName: 'Principles of Economics', grade: 'A+', isPassed: true, credits: 2 },
      { courseCode: 'ECON206', courseName: 'Macroeconomics and Indian Economy', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'ECON208', courseName: 'Microeconomics', grade: 'A', isPassed: true, credits: 4 },
      { courseCode: 'MGMT208', courseName: 'Introduction to Financial Accounting', grade: 'A', isPassed: true, credits: 3 }
    ],
    currentCourses: ['ECON322', 'FINA202'],
    interests: ['Econometrics', 'Public Policy']
  },
  {
    id: 'VU-DEMO-009',
    display_name: 'Vihaan Patel',
    program: 'BA_ECO',
    programName: 'BA (Hons.) – Economics',
    school: SCHOOL_TAXONOMY.BUSINESS_MGMT,
    program_type: 'BA',
    batch: '2025',
    semester: 3,
    cgpa: 7.45,
    attendance: 76.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'ECON105', courseName: 'Principles of Economics', grade: 'B', isPassed: true, credits: 2 }
    ],
    currentCourses: ['ECON208', 'ECON206'],
    interests: ['Macroeconomics', 'Data Analysis']
  },
  {
    id: 'VU-DEMO-010',
    display_name: 'Nisha Iyer',
    program: 'BA_PSY',
    programName: 'BA (Hons.) – Psychology',
    school: SCHOOL_TAXONOMY.PSYCHOLOGY_SOCIAL,
    program_type: 'BA',
    batch: '2024',
    semester: 5,
    cgpa: 8.25,
    attendance: 91.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'PSYC102', courseName: 'Introduction to Psychology', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'PSYC201', courseName: 'Biological Psychology', grade: 'A', isPassed: true, credits: 4 }
    ],
    currentCourses: ['PSYC212', 'PSYC213'],
    interests: ['Clinical Psychology', 'Research']
  },
  {
    id: 'VU-DEMO-011',
    display_name: 'Dev Malhotra',
    program: 'BTECH_AIML',
    programName: 'B.Tech (Hons.) CSE – AI/ML',
    school: SCHOOL_TAXONOMY.CS_DATA_AI,
    program_type: 'B.Tech',
    batch: '2024',
    semester: 5,
    cgpa: 8.15,
    attendance: 83.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Programming in Python', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'B+', isPassed: true, credits: 3 },
      { courseCode: 'DATA301', courseName: 'Machine Learning', grade: 'A', isPassed: true, credits: 4 }
    ],
    currentCourses: ['DATA302', 'COMP301'],
    interests: ['AI Systems', 'Deep Learning']
  },
  {
    id: 'VU-DEMO-012',
    display_name: 'Tanya Bhat',
    program: 'BMS_DB',
    programName: 'BMS (Hons.) – Digital Business',
    school: SCHOOL_TAXONOMY.BUSINESS_MGMT,
    program_type: 'BMS',
    batch: '2024',
    semester: 5,
    cgpa: 7.90,
    attendance: 82.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'MGMT101', courseName: 'Essentials of Business Management', grade: 'B+', isPassed: true, credits: 2 },
      { courseCode: 'MGMT201', courseName: 'Introduction to Digital Business', grade: 'B+', isPassed: true, credits: 2 }
    ],
    currentCourses: ['MGMT202', 'MGMT206'],
    interests: ['E-Commerce', 'Product Management']
  },
  {
    id: 'VU-DEMO-013',
    display_name: 'Karan Shah',
    program: 'BMS_LLB',
    programName: 'BMS, LLB (Hons.)',
    school: SCHOOL_TAXONOMY.LAW,
    program_type: 'LLB',
    batch: '2023',
    semester: 7,
    cgpa: 8.30,
    attendance: 87.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'LAWS101', courseName: 'Fundamentals of Indian Constitution and Human Rights', grade: 'A', isPassed: true, credits: 2 },
      { courseCode: 'LAWS201', courseName: 'Legal Writing and Research Methodology', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'LAWS202', courseName: 'Constitutional Law-I', grade: 'B+', isPassed: true, credits: 4 }
    ],
    currentCourses: ['LAWS310', 'LAWB210'],
    interests: ['Corporate Law', 'Business Regulation']
  },
  {
    id: 'VU-DEMO-014',
    display_name: 'Riya Deshmukh',
    program: 'BTECH_AIML',
    programName: 'B.Tech (Hons.) CSE – AI/ML',
    school: SCHOOL_TAXONOMY.CS_DATA_AI,
    program_type: 'B.Tech',
    batch: '2024',
    semester: 5,
    cgpa: 8.90,
    attendance: 94.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Programming in Python', grade: 'A+', isPassed: true, credits: 3 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'COMP209', courseName: 'Databases Management', grade: 'A+', isPassed: true, credits: 4 },
      { courseCode: 'DATA301', courseName: 'Machine Learning', grade: 'O', isPassed: true, credits: 4 }
    ],
    currentCourses: ['DATA302'],
    interests: ['Deep Learning', 'Robotics']
  },
  {
    id: 'VU-DEMO-015',
    display_name: 'Neil Thomas',
    program: 'BTECH_DS',
    programName: 'B.Tech (Hons.) CSE – Data Science',
    school: SCHOOL_TAXONOMY.CS_DATA_AI,
    program_type: 'B.Tech',
    batch: '2024',
    semester: 5,
    cgpa: 8.05,
    attendance: 84.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Programming in Python', grade: 'B+', isPassed: true, credits: 3 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'B+', isPassed: true, credits: 3 }
    ],
    currentCourses: ['DATA206', 'COMP201'],
    interests: ['Cloud Data', 'Data Pipelines']
  },
  {
    id: 'VU-DEMO-016',
    display_name: 'Aditi Verma',
    program: 'BDES_CD',
    programName: 'Bachelor of Design (Communication Design)',
    school: SCHOOL_TAXONOMY.DESIGN,
    program_type: 'B.Des',
    batch: '2024',
    semester: 5,
    cgpa: 8.60,
    attendance: 88.5,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'CDES105', courseName: 'Appreciating and Deconstructing Art and Media', grade: 'A+', isPassed: true, credits: 3 },
      { courseCode: 'CDES217', courseName: 'Making with Reframed Media', grade: 'A', isPassed: true, credits: 4 },
      { courseCode: 'CDES218', courseName: 'Frames and Frequencies', grade: 'A', isPassed: true, credits: 4 }
    ],
    currentCourses: ['CDES301', 'CDES219'],
    interests: ['Design Thinking', 'Communication Design']
  },
  {
    id: 'VU-DEMO-017',
    display_name: 'Rahul Sethi',
    program: 'BA_ECO',
    programName: 'BA (Hons.) – Economics',
    school: SCHOOL_TAXONOMY.BUSINESS_MGMT,
    program_type: 'BA',
    batch: '2024',
    semester: 5,
    cgpa: 8.20,
    attendance: 80.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'ECON105', courseName: 'Principles of Economics', grade: 'A', isPassed: true, credits: 2 },
      { courseCode: 'ECON206', courseName: 'Macroeconomics and Indian Economy', grade: 'B+', isPassed: true, credits: 3 },
      { courseCode: 'ECON208', courseName: 'Microeconomics', grade: 'A', isPassed: true, credits: 4 }
    ],
    currentCourses: ['ECON322'],
    interests: ['Macroeconomic Policy']
  },
  {
    id: 'VU-DEMO-018',
    display_name: 'Sana Khan',
    program: 'BA_PSY',
    programName: 'BA (Hons.) – Psychology',
    school: SCHOOL_TAXONOMY.PSYCHOLOGY_SOCIAL,
    program_type: 'BA',
    batch: '2024',
    semester: 5,
    cgpa: 8.45,
    attendance: 89.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'PSYC102', courseName: 'Introduction to Psychology', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'PSYC201', courseName: 'Biological Psychology', grade: 'A', isPassed: true, credits: 4 },
      { courseCode: 'PSYC202', courseName: 'Cognitive Psychology', grade: 'A', isPassed: true, credits: 4 }
    ],
    currentCourses: ['PSYC212'],
    interests: ['Cognitive Neuroscience']
  },
  {
    id: 'VU-DEMO-019',
    display_name: 'Vikram Joshi',
    program: 'BA_LLB',
    programName: 'BA, LLB (Hons.)',
    school: SCHOOL_TAXONOMY.LAW,
    program_type: 'LLB',
    batch: '2024',
    semester: 5,
    cgpa: 7.75,
    attendance: 85.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'LAWS101', courseName: 'Fundamentals of Indian Constitution and Human Rights', grade: 'B+', isPassed: true, credits: 2 },
      { courseCode: 'LAWS201', courseName: 'Legal Writing and Research Methodology', grade: 'B+', isPassed: true, credits: 3 },
      { courseCode: 'LAWS202', courseName: 'Constitutional Law-I', grade: 'B', isPassed: true, credits: 4 }
    ],
    currentCourses: ['LAWS310'],
    interests: ['Constitutional Law']
  },
  {
    id: 'VU-DEMO-020',
    display_name: 'Pooja Nair',
    program: 'BA_PSY',
    programName: 'BA (Hons.) – Psychology',
    school: SCHOOL_TAXONOMY.PSYCHOLOGY_SOCIAL,
    program_type: 'BA',
    batch: '2023',
    semester: 7,
    cgpa: 8.40,
    attendance: 87.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'PSYC102', courseName: 'Introduction to Psychology', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'PSYC201', courseName: 'Biological Psychology', grade: 'A', isPassed: true, credits: 4 },
      { courseCode: 'PSYC202', courseName: 'Cognitive Psychology', grade: 'A', isPassed: true, credits: 4 },
      { courseCode: 'PSYC212', courseName: 'Foundations of Psychology II', grade: 'A', isPassed: true, credits: 4 }
    ],
    currentCourses: ['PSYC213'],
    interests: ['Lifespan Development']
  },
  {
    id: 'VU-DEMO-021',
    display_name: 'Arnav Gupta',
    program: 'BTECH_AIML',
    programName: 'B.Tech (Hons.) CSE – AI/ML',
    school: SCHOOL_TAXONOMY.CS_DATA_AI,
    program_type: 'B.Tech',
    batch: '2025',
    semester: 3,
    cgpa: 8.10,
    attendance: 82.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Programming in Python', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'B+', isPassed: true, credits: 3 }
    ],
    currentCourses: ['COMP201'],
    interests: ['Algorithms']
  },
  {
    id: 'VU-DEMO-022',
    display_name: 'Diya Shetty',
    program: 'BA_ECO',
    programName: 'BA (Hons.) – Economics',
    school: SCHOOL_TAXONOMY.BUSINESS_MGMT,
    program_type: 'BA',
    batch: '2025',
    semester: 3,
    cgpa: 7.90,
    attendance: 84.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'ECON105', courseName: 'Principles of Economics', grade: 'A', isPassed: true, credits: 2 }
    ],
    currentCourses: ['ECON208'],
    interests: ['Microeconomics']
  },
  {
    id: 'VU-DEMO-023',
    display_name: 'Kabir Anand',
    program: 'BMS_DB',
    programName: 'BMS (Hons.) – Digital Business',
    school: SCHOOL_TAXONOMY.BUSINESS_MGMT,
    program_type: 'BMS',
    batch: '2024',
    semester: 5,
    cgpa: 8.00,
    attendance: 86.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'MGMT101', courseName: 'Essentials of Business Management', grade: 'A', isPassed: true, credits: 2 },
      { courseCode: 'MGMT201', courseName: 'Introduction to Digital Business', grade: 'A', isPassed: true, credits: 2 }
    ],
    currentCourses: ['MGMT210'],
    interests: ['Investment Management']
  },
  {
    id: 'VU-DEMO-024',
    display_name: 'Myra Rao',
    program: 'BDES_CD',
    programName: 'Bachelor of Design (Communication Design)',
    school: SCHOOL_TAXONOMY.DESIGN,
    program_type: 'B.Des',
    batch: '2025',
    semester: 3,
    cgpa: 8.30,
    attendance: 85.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'CDES105', courseName: 'Appreciating and Deconstructing Art and Media', grade: 'A', isPassed: true, credits: 3 }
    ],
    currentCourses: ['CDES217'],
    interests: ['Reframed Media']
  }
];

/**
 * Calculates academic year string programmatically from semester number
 * Sem 1/2 -> Year 1 (1st Year)
 * Sem 3/4 -> Year 2 (2nd Year)
 * Sem 5/6 -> Year 3 (3rd Year)
 * Sem 7/8 -> Year 4 (4th Year)
 */
function getAcademicYear(semester) {
  if (!semester) return 'Year 1 (1st Year)';
  const yearNum = Math.ceil(semester / 2);
  const suffix = yearNum === 1 ? '1st' : yearNum === 2 ? '2nd' : yearNum === 3 ? '3rd' : '4th';
  return `Year ${yearNum} (${suffix} Year)`;
}

/**
 * Retrieves a single student profile by ID
 */
function getStudentProfileById(id) {
  if (!id) return null;
  const profile = SYNTHETIC_PROFILES.find(p => p.id === id);
  if (!profile) return null;
  return {
    ...profile,
    academicYear: getAcademicYear(profile.semester)
  };
}

/**
 * Retrieves list of student IDs for sign-in dropdown
 */
function getStudentIdList() {
  return SYNTHETIC_PROFILES.map(p => ({
    id: p.id,
    display_name: p.display_name,
    programName: p.programName
  }));
}

/**
 * Query Classification Engine
 */
function classifyQuery(queryStr) {
  const q = queryStr.toLowerCase().trim();

  if (q.includes('attendance') || q.includes('debarred') || q.includes('75%') || q.includes('medical leave')) {
    return 'ATTENDANCE';
  }
  if (q.includes('can i take') || q.includes('eligible') || q.includes('eligibility') || q.includes('am i allowed') || q.includes('can i register')) {
    return 'ELIGIBILITY';
  }
  if (q.includes('prerequisite') || q.includes('prereq') || q.includes('pre-req')) {
    return 'PREREQUISITE';
  }
  if (q.includes('what courses can i take') || q.includes('which courses can i take') || q.includes('courses available to me') || q.includes('courses can i register')) {
    return 'COURSE_SELECTION';
  }
  if (q.includes('cgpa') || q.includes('transcript') || q.includes('completed courses') || q.includes('academic year') || q.includes('promotion')) {
    return 'STUDENT_PROGRESS';
  }
  if (q.includes('summer') || q.includes('june 2026') || q.includes('re-registration')) {
    return 'SUMMER_TERM';
  }
  if (q.includes('registration') || q.includes('digii') || q.includes('late fee') || q.includes('add/drop')) {
    return 'REGISTRATION';
  }
  if (q.includes('program') || q.includes('degrees') || q.includes('offered')) {
    return 'PROGRAM_INFO';
  }
  if (q.includes('what is') || q.includes('tell me about') || q.includes('credits for') || q.includes('how many credits')) {
    return 'COURSE_INFO';
  }
  return 'GENERAL_POLICY';
}

/**
 * Deterministic Eligibility Layer
 * Evaluates Course Context + Student Context + Prerequisites + School Compatibility + Semester/Year Availability
 */
function evaluateEligibility(studentProfile, targetCourse) {
  if (!targetCourse) {
    return {
      status: 'INSUFFICIENT_OFFICIAL_INFORMATION',
      reason: 'The requested course does not exist in the official Vidyashilp University course catalog.'
    };
  }

  const studentName = studentProfile ? studentProfile.display_name : 'Student';
  const studentProg = studentProfile ? studentProfile.programName : 'General Degree';
  const studentSem = studentProfile ? studentProfile.semester : 5;
  const studentYear = getAcademicYear(studentSem);
  const studentSchool = studentProfile ? studentProfile.school : SCHOOL_TAXONOMY.BUSINESS_MGMT;

  // 1. Prerequisite Check
  const reqPrereqs = getCoursePrerequisites(targetCourse.code);
  const completedCodes = studentProfile && Array.isArray(studentProfile.completedCourses)
    ? studentProfile.completedCourses.map(c => c.courseCode.toUpperCase())
    : [];

  const missingPrereqs = reqPrereqs.filter(code => !completedCodes.includes(code.toUpperCase()));
  const missingPrereqObjects = missingPrereqs.map(code => findCourseByCode(code)).filter(Boolean);

  // 2. Already Completed Check
  if (completedCodes.includes(targetCourse.code.toUpperCase())) {
    return {
      status: 'ALREADY_COMPLETED',
      statusLabel: 'STATUS: ALREADY COMPLETED',
      targetCourse,
      studentName,
      studentProg,
      studentSem,
      studentYear,
      reason: `The student has already completed ${targetCourse.code} (${targetCourse.name}).`,
      missingPrereqs: [],
      nextStep: 'Select an advanced course in your program sequence.'
    };
  }

  // 3. School / Program Compatibility Check
  const courseSchool = targetCourse.school;
  const isCommonCore = courseSchool === SCHOOL_TAXONOMY.UNIVERSITY_CORE;

  let schoolCompatible = false;
  if (isCommonCore) {
    schoolCompatible = true;
  } else if (studentSchool === courseSchool) {
    schoolCompatible = true;
  } else if (targetCourse.cross_school_allowed) {
    schoolCompatible = true;
  }

  // Specialized synthetic demo matrix rule:
  // Technical CS/Data/AI courses (e.g. DATA302 Deep Learning, DATA405 Reinforcement Learning) are NOT automatically eligible
  // for BA Economics / BMS / BA Psychology / Law / Design students without explicit prerequisites & cross-school clearance.
  const isTechnicalCS = courseSchool === SCHOOL_TAXONOMY.CS_DATA_AI && (targetCourse.code.startsWith('DATA') || targetCourse.code.startsWith('COMP'));
  const isNonCSStudent = studentSchool !== SCHOOL_TAXONOMY.CS_DATA_AI;

  if (isTechnicalCS && isNonCSStudent) {
    schoolCompatible = false;
  }

  // 4. Final Eligibility Decision
  if (missingPrereqs.length > 0 && !schoolCompatible) {
    return {
      status: 'NOT_ELIGIBLE',
      statusLabel: 'STATUS: NOT ELIGIBLE',
      targetCourse,
      studentName,
      studentProg,
      studentSem,
      studentYear,
      reason: `The course belongs to the ${courseSchool} domain and the student's record does not establish the required prerequisite/cross-school eligibility.`,
      missingPrereqs: missingPrereqObjects,
      nextStep: 'Check whether the university permits cross-school registration for this course and whether the required prerequisite can be completed.'
    };
  }

  if (missingPrereqs.length > 0) {
    return {
      status: 'PREREQUISITE_NOT_MET',
      statusLabel: 'STATUS: NOT ELIGIBLE (PREREQUISITE MISSING)',
      targetCourse,
      studentName,
      studentProg,
      studentSem,
      studentYear,
      reason: `You have not completed the mandatory prerequisite course required for enrollment.`,
      missingPrereqs: missingPrereqObjects,
      nextStep: `Enroll in and pass ${missingPrereqObjects.map(p => `${p.code} (${p.name})`).join(', ')} before attempting to register for ${targetCourse.code}.`
    };
  }

  if (!schoolCompatible) {
    return {
      status: 'CROSS_SCHOOL_RESTRICTION',
      statusLabel: 'STATUS: NOT ELIGIBLE (CROSS-SCHOOL RESTRICTION)',
      targetCourse,
      studentName,
      studentProg,
      studentSem,
      studentYear,
      reason: `This course is restricted to ${courseSchool} degree programs and is not open for automatic registration under ${studentProg}.`,
      missingPrereqs: [],
      nextStep: 'Submit a formal Cross-School Elective Approval form to your Academic Advisor and Dean.'
    };
  }

  return {
    status: 'ELIGIBLE',
    statusLabel: 'STATUS: ELIGIBLE',
    targetCourse,
    studentName,
    studentProg,
    studentSem,
    studentYear,
    reason: `The course belongs to your program domain and all mandatory prerequisites have been satisfied.`,
    missingPrereqs: [],
    nextStep: 'Proceed with course registration on the Digii ERP portal during the open registration window.'
  };
}

/**
 * Formats Eligibility Decision into Section 11 Standard Response
 */
function formatEligibilityResponse(decision) {
  const {
    statusLabel,
    targetCourse,
    studentName,
    studentProg,
    studentSem,
    studentYear,
    reason,
    missingPrereqs,
    nextStep
  } = decision;

  let missingPrereqLine = '';
  if (missingPrereqs && missingPrereqs.length > 0) {
    const list = missingPrereqs.map(p => `${p.code} — ${p.name}`).join(', ');
    missingPrereqLine = `\n\nMissing prerequisite:\n${list}`;
  }

  const text = `${statusLabel}

Course:
${targetCourse.code} — ${targetCourse.name}

Credits:
${targetCourse.credits}

Student:
${studentName}

Program:
${studentProg}

Current semester:
Semester ${studentSem}

Academic year:
${studentYear}

Reason:
${reason}${missingPrereqLine}

Next step:
${nextStep}`;

  const sources = [
    {
      documentTitle: targetCourse.source_reference || '118225_Semester_Spread_Structures_Sept_2026.xlsx',
      hierarchyLevel: 2,
      pageOrSheet: `${targetCourse.school} Catalog`,
      clauseNumber: `Course Code: ${targetCourse.code}`,
      excerpt: `Course Code: ${targetCourse.code} | Title: ${targetCourse.name} | Credits: ${targetCourse.credits} cr | School: ${targetCourse.school}`
    },
    {
      documentTitle: '4. Student Handbook Aug 2026.pdf',
      hierarchyLevel: 1,
      pageOrSheet: 'Section III, Clause 7.2 & 12.1',
      clauseNumber: 'Course Registration & Prerequisite Rules',
      excerpt: 'Students must satisfy all mandatory prerequisite course requirements and program domain eligibility prior to course registration.'
    }
  ];

  return {
    state: 'ANSWERABLE',
    answer: text,
    sources,
    ruleResults: {
      status: decision.status,
      courseCode: targetCourse.code,
      student: studentName
    },
    followUp: null
  };
}

/**
 * Main Advisory Processor
 */
async function processAdvisorQuery(query, profileId = null) {
  try {
    const normalizedQuery = query.toLowerCase().trim();
    const profile = getStudentProfileById(profileId);

    // ── 0. PRIVACY GUARDRAIL ──
    const isPrivacyViolation = /\b(all students?|other students?|another student|everyone'?s|student 0[1-9]|student 1[0-9]|student 2[0-5]|list of (all )?students?|show (all )?profiles|show other profiles|give me student|tell me about student|student records)\b/i.test(normalizedQuery);
    if (isPrivacyViolation) {
      return {
        state: 'ANSWERABLE',
        answer: "I can only provide information associated with your own student profile. I cannot expose other students' private academic records.",
        sources: [],
        ruleResults: null,
        followUp: "Please ask questions regarding your own academic progression, courses, or general university regulations."
      };
    }

    // ── 1. OUT-OF-SCOPE GUARDRAIL ──
    const OUT_OF_SCOPE = ['weather', 'cricket', 'ipl', 'football', 'movie', 'actor', 'dating', 'relationship', 'joke', 'canteen menu', 'party', 'politics'];
    if (OUT_OF_SCOPE.some(topic => normalizedQuery.includes(topic))) {
      return {
        state: 'OUT_OF_SCOPE',
        answer: 'I only handle academic questions — prerequisites, attendance, course eligibility, registration, and university policies.',
        sources: [],
        ruleResults: null,
        followUp: 'Please ask about your courses, program, or university regulations.'
      };
    }

    // ── 2. CLARIFICATION FOR AMBIGUOUS QUERIES ──
    const isVagueEligibility = (
      normalizedQuery === 'can i take it' ||
      normalizedQuery === 'can i take it?' ||
      normalizedQuery === 'am i eligible?' ||
      normalizedQuery === 'can i take this course?' ||
      normalizedQuery === 'can i take this course'
    );
    if (isVagueEligibility) {
      return {
        state: 'NEEDS_CLARIFICATION',
        answer: "Which course are you asking about? Please specify the course code or title (e.g. DATA302, Deep Learning, DATA206).",
        sources: [],
        ruleResults: null,
        followUp: "Example: 'Can I take Deep Learning?' or 'Am I eligible for DATA206?'"
      };
    }

    // ── 3. CLASSIFY QUERY ──
    const queryCategory = classifyQuery(normalizedQuery);

    // ── 4. DETERMINISTIC ELIGIBILITY HANDLER ──
    const isEligibilityQuery = queryCategory === 'ELIGIBILITY' ||
      normalizedQuery.includes('can i take') ||
      normalizedQuery.includes('am i eligible for') ||
      normalizedQuery.includes('can a bms student take') ||
      normalizedQuery.includes('can a ba economics student take') ||
      normalizedQuery.includes('why can\'t i take');

    if (isEligibilityQuery) {
      const targetCourse = findCourseByNameOrAlias(query);
      if (targetCourse) {
        let activeProfile = profile;
        // Handle hypothetical program questions in prompt (e.g., "Can a BMS student take Deep Learning?")
        if (normalizedQuery.includes('bms student')) {
          activeProfile = SYNTHETIC_PROFILES.find(p => p.program === 'BMS_DB');
        } else if (normalizedQuery.includes('ba economics student') || normalizedQuery.includes('economics student')) {
          activeProfile = SYNTHETIC_PROFILES.find(p => p.program === 'BA_ECO');
        } else if (normalizedQuery.includes('psychology student')) {
          activeProfile = SYNTHETIC_PROFILES.find(p => p.program === 'BA_PSY');
        } else if (normalizedQuery.includes('law student')) {
          activeProfile = SYNTHETIC_PROFILES.find(p => p.program === 'BA_LLB');
        } else if (normalizedQuery.includes('design student')) {
          activeProfile = SYNTHETIC_PROFILES.find(p => p.program === 'BDES_CD');
        }

        if (!activeProfile && !profileId) {
          // Default demo profile: Meera Krishnan (BA Economics)
          activeProfile = getStudentProfileById('VU-DEMO-008');
        }

        const decision = evaluateEligibility(activeProfile, targetCourse);
        return formatEligibilityResponse(decision);
      }
    }

    // ── 5. "WHAT COURSES CAN I TAKE?" (SECTION 12 HANDLER) ──
    if (queryCategory === 'COURSE_SELECTION' || normalizedQuery.includes('what courses can i take') || normalizedQuery.includes('which courses can i take')) {
      const activeProfile = profile || getStudentProfileById('VU-DEMO-008'); // Default Meera Krishnan
      const studentName = activeProfile.display_name;
      const studentProg = activeProfile.programName;
      const studentSem = activeProfile.semester;
      const studentSchool = activeProfile.school;
      const completedCodes = activeProfile.completedCourses.map(c => c.courseCode.toUpperCase());

      // Filter course catalog by student domain & level
      const eligibleCourses = [];
      const prereqMissingCourses = [];
      const notEligibleCourses = [];

      for (const course of OFFICIAL_COURSE_CATALOG) {
        if (completedCodes.includes(course.code.toUpperCase())) continue;

        const decision = evaluateEligibility(activeProfile, course);
        if (decision.status === 'ELIGIBLE') {
          eligibleCourses.push(course);
        } else if (decision.status === 'PREREQUISITE_NOT_MET') {
          prereqMissingCourses.push({ course, missing: decision.missingPrereqs });
        } else if (decision.status === 'NOT_ELIGIBLE' || decision.status === 'CROSS_SCHOOL_RESTRICTION') {
          notEligibleCourses.push(course);
        }
      }

      const eligibleStr = eligibleCourses.slice(0, 5).map(c => `• **${c.code} — ${c.name}** (${c.credits} cr)`).join('\n') || 'None listed for current term';
      const prereqStr = prereqMissingCourses.slice(0, 3).map(item => `• **${item.course.code} — ${item.course.name}** (${item.course.credits} cr) — Missing: ${item.missing.map(m => m.code).join(', ')}`).join('\n') || 'None';
      const notEligibleStr = notEligibleCourses.slice(0, 3).map(c => `• **${c.code} — ${c.name}** (${c.credits} cr) — Cross-school domain restriction`).join('\n') || 'None';

      const answerText = `Personalized Course Eligibility for **${studentName}** (${studentProg}, Semester ${studentSem}):

### 1. Eligible Courses (Ready for Registration):
${eligibleStr}

### 2. Potentially Eligible (Prerequisites Missing):
${prereqStr}

### 3. Not Currently Eligible (Domain/Program Restrictions):
${notEligibleStr}`;

      return {
        state: 'ANSWERABLE',
        answer: answerText,
        sources: [
          {
            documentTitle: '118225_Semester_Spread_Structures_Sept_2026.xlsx',
            hierarchyLevel: 2,
            pageOrSheet: `${studentSchool} Curriculum Spread`,
            clauseNumber: `Semester ${studentSem} Structure`,
            excerpt: `Curriculum course structure and prerequisite map for ${studentProg}.`
          }
        ],
        ruleResults: { eligibleCount: eligibleCourses.length },
        followUp: null
      };
    }

    // ── 6. PREREQUISITE DIRECT QUERY HANDLER ──
    if (queryCategory === 'PREREQUISITE' || normalizedQuery.includes('prerequisite for') || normalizedQuery.includes('missing prerequisite')) {
      const targetCourse = findCourseByNameOrAlias(query);
      if (targetCourse) {
        const prereqs = getCoursePrerequisites(targetCourse.code);
        const prereqObjects = prereqs.map(c => findCourseByCode(c)).filter(Boolean);
        const prereqText = prereqObjects.length > 0
          ? prereqObjects.map(p => `• **${p.code} — ${p.name}** (${p.credits} cr)`).join('\n')
          : 'No mandatory prerequisites listed in official university documentation.';

        return {
          state: 'ANSWERABLE',
          answer: `Prerequisite details for **${targetCourse.code} — ${targetCourse.name}** (${targetCourse.credits} credits):\n\n${prereqText}`,
          sources: [
            {
              documentTitle: targetCourse.source_reference || '118225_Semester_Spread_Structures_Sept_2026.xlsx',
              hierarchyLevel: 2,
              pageOrSheet: `${targetCourse.school} Catalog`,
              clauseNumber: `Course Code: ${targetCourse.code}`,
              excerpt: `Course Code: ${targetCourse.code} | Name: ${targetCourse.name} | Prerequisites: ${prereqs.join(', ') || 'None'}`
            }
          ],
          ruleResults: { target: targetCourse.code, prerequisites: prereqs },
          followUp: null
        };
      }
    }

    // ── 7. UNKNOWN COURSE CODE GUARDRAIL ──
    const codeMatchInQuery = query.match(/\b[A-Z]{3,4}\s?\d{3}\b/i);
    if (codeMatchInQuery) {
      const extractedCode = codeMatchInQuery[0].replace(/\s+/, '').toUpperCase();
      const knownCourse = findCourseByCode(extractedCode);
      if (!knownCourse) {
        const suggestions = getSuggestedCourses().map(c => `• **${c.code} — ${c.name}** (${c.credits} cr)`).join('\n');
        return {
          state: 'INSUFFICIENT_INFORMATION',
          answer: `I couldn't verify course code **${extractedCode}** from the official Vidyashilp University catalog.\n\nDid you mean one of these courses?\n${suggestions}`,
          sources: [],
          ruleResults: null,
          followUp: null
        };
      }
    }

    // ── 8. COURSE INFO & CREDITS HANDLER ──
    if (queryCategory === 'COURSE_INFO' || normalizedQuery.includes('how many credits')) {
      const targetCourse = findCourseByNameOrAlias(query);
      if (targetCourse) {
        const prereqs = getCoursePrerequisites(targetCourse.code);
        const prereqText = prereqs.length > 0 ? prereqs.join(', ') : 'None';
        const summerNote = (targetCourse.semester_availability === 'summer' || targetCourse.semester_availability === 'both') ? ' (Offered in Summer Term June 2026)' : '';

        return {
          state: 'ANSWERABLE',
          answer: `**Course:** ${targetCourse.code} — ${targetCourse.name}\n**Credits:** ${targetCourse.credits} credits${summerNote}\n**School:** ${targetCourse.school}\n**Domain:** ${targetCourse.domain}\n**Prerequisites:** ${prereqText}`,
          sources: [
            {
              documentTitle: targetCourse.source_reference || 'Vidyashilp University Official Course Catalog',
              hierarchyLevel: 1,
              pageOrSheet: 'Course Master Database',
              clauseNumber: `Course Code: ${targetCourse.code}`,
              excerpt: `${targetCourse.code} — ${targetCourse.name} — ${targetCourse.credits} credits. Domain: ${targetCourse.school}`
            }
          ],
          ruleResults: { courseCode: targetCourse.code, credits: targetCourse.credits },
          followUp: null
        };
      }
    }

    // ── 9. SUMMER TERM JUNE 2026 HANDLER ──
    if (queryCategory === 'SUMMER_TERM' || normalizedQuery.includes('summer')) {
      const summerList = getSummerCourses();
      const sampleList = summerList.slice(0, 10).map(c => `• **${c.code} — ${c.name}** (${c.credits} cr)`).join('\n');

      return {
        state: 'ANSWERABLE',
        answer: `The official **Summer Term June 2026** catalogue lists **42 approved courses** for re-registration across Computing, Data Science, Management, Law, and Liberal Arts.\n\nSample courses offered:\n${sampleList}\n\n*(Total 42 courses offered in June 2026)*`,
        sources: [
          {
            documentTitle: 'Courses Offered.pdf',
            hierarchyLevel: 4,
            pageOrSheet: 'Pages 1–2',
            clauseNumber: 'Summer Term June 2026 Catalogue',
            excerpt: 'COURSES OFFERED FOR SUMMER TERM JUNE 2026 — VIDYASHILP UNIVERSITY, BENGALURU. Lists 42 approved courses.'
          }
        ],
        ruleResults: { term: 'Summer Term June 2026', total: 42 },
        followUp: null
      };
    }

    // ── 10. ACADEMIC YEAR MAPPING ──
    if (normalizedQuery.includes('academic year') || (normalizedQuery.includes('semester') && normalizedQuery.includes('year'))) {
      const semMatch = normalizedQuery.match(/semester\s?(\d)/i) || normalizedQuery.match(/sem\s?(\d)/i);
      const semNum = semMatch ? parseInt(semMatch[1], 10) : (profile ? profile.semester : 5);
      const yearStr = getAcademicYear(semNum);

      return {
        state: 'ANSWERABLE',
        answer: `Semester ${semNum} corresponds to **${yearStr}**.\n\nAcademic Year Mapping:\n• Semesters 1 & 2 → Year 1 (1st Year)\n• Semesters 3 & 4 → Year 2 (2nd Year)\n• Semesters 5 & 6 → Year 3 (3rd Year)\n• Semesters 7 & 8 → Year 4 (4th Year)`,
        sources: [
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Page 12',
            clauseNumber: 'Academic Calendar & Progression',
            excerpt: 'Each academic year comprises two semesters. Semesters 5 and 6 constitute Year 3 of the undergraduate program.'
          }
        ],
        ruleResults: { semester: semNum, academicYear: yearStr },
        followUp: null
      };
    }

    // ── 11. PERSONALIZED TRANSCRIPT & ATTENDANCE ──
    if (profile && (normalizedQuery.includes('my attendance') || normalizedQuery.includes('attendance requirement'))) {
      const statusText = profile.attendance >= 75.0
        ? `✓ Your attendance is **${profile.attendance}%**, which satisfies the mandatory 75% requirement.`
        : profile.attendance >= 65.0
          ? `⚠ Your attendance is **${profile.attendance}%**, which is below 75%. You require approved medical relaxation (submitted within 3 working days) to write end-semester exams.`
          : `❌ Your attendance is **${profile.attendance}%**, which is below 65%. Attendance below 65% results in exam debarment per Clause 7.2.`;

      return {
        state: 'ANSWERABLE',
        answer: `Attendance status for **${profile.display_name}**:\n\n${statusText}`,
        sources: [
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Pages 21 & 29',
            clauseNumber: 'Section III, Clause 7.2',
            excerpt: 'Minimum 75% attendance required for end-semester examinations.'
          }
        ],
        ruleResults: { attendance: profile.attendance },
        followUp: null
      };
    }

    // ── 12. FALLBACK TO RAG SEMANTIC RETRIEVAL ──
    const retrievedEvidence = retriever.retrieve({
      query,
      program: profile ? profile.program : null,
      topK: 5
    });

    if (Array.isArray(retrievedEvidence) && retrievedEvidence.length > 0) {
      const top = retrievedEvidence[0];
      if (top.rawScore >= 2.0) {
        return {
          state: 'ANSWERABLE',
          answer: top.chunkText.slice(0, 500) + (top.chunkText.length > 500 ? '...' : ''),
          sources: retrievedEvidence.slice(0, 3).map(r => ({
            documentTitle: r.documentName || 'Official Document',
            hierarchyLevel: r.hierarchyLevel || 2,
            pageOrSheet: r.pageOrSheet ? `Ref: ${r.pageOrSheet}` : 'Official Record',
            clauseNumber: r.clauseNumber || 'N/A',
            excerpt: r.chunkText.slice(0, 200) + '...'
          })),
          ruleResults: null,
          followUp: null
        };
      }
    }

    // ── 13. HALLUCINATION CONTROL FALLBACK ──
    return {
      state: 'INSUFFICIENT_INFORMATION',
      answer: "I couldn't verify that requirement from the available Vidyashilp University academic source documents. Please check with the Registrar's Office or your Academic Advisor.",
      sources: [],
      ruleResults: null,
      followUp: null
    };

  } catch (err) {
    console.error('[Advisory Engine Error]:', err.stack || err);
    return {
      state: 'INSUFFICIENT_INFORMATION',
      answer: "I'm having trouble accessing the academic knowledge base right now. Please try again in a moment.",
      sources: [],
      ruleResults: null,
      followUp: null
    };
  }
}

module.exports = {
  processAdvisorQuery,
  evaluateEligibility,
  classifyQuery,
  getStudentProfileById,
  getStudentIdList,
  SYNTHETIC_PROFILES,
  getAcademicYear
};
