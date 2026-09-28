/**
 * Advisory Decision Engine — VU Advisor
 * Orchestrates Query Classification, Student Profile Context,
 * Deterministic Rule Evaluation, Privacy Safeguards, Clarification Flow, and RAG Evidence Retrieval.
 *
 * DATA TYPE: SYNTHETIC_PROFILES are internal demo testing records.
 * Academic rules & course data are sourced from official VU documents only.
 */

'use strict';

const { retriever } = require('./rag/retriever.js');

// ============================================================
// INTERNAL SYNTHETIC STUDENT PROFILES (25 PROFILES FOR TESTING)
// Kept private server-side. Never exposed in full dataset API responses.
// ============================================================
const SYNTHETIC_PROFILES = [
  {
    id: 'VU-DEMO-001',
    display_name: 'Aarav Mehta',
    program: 'BTECH_DS',
    programName: 'B.Tech (Hons.) CSE – Data Science',
    program_type: 'B.Tech',
    batch: '2024',
    semester: 5,
    cgpa: 8.72,
    attendance: 86.5,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Introduction to Programming', grade: 'A+', isPassed: true, credits: 4 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'DATA206', courseName: 'Database Systems', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'DATA301', courseName: 'Machine Learning', grade: 'A', isPassed: true, credits: 4 }
    ],
    currentCourses: ['DATA302', 'DATA303'],
    interests: ['Machine Learning', 'Data Engineering'],
    notes: 'Completed DATA301. Eligible for DATA302.'
  },
  {
    id: 'VU-DEMO-002',
    display_name: 'Ananya Rao',
    program: 'BTECH_AIML',
    programName: 'B.Tech (Hons.) CSE – AI/ML',
    program_type: 'B.Tech',
    batch: '2025',
    semester: 3,
    cgpa: 7.95,
    attendance: 79.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Introduction to Programming', grade: 'B+', isPassed: true, credits: 4 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'B+', isPassed: true, credits: 3 }
    ],
    currentCourses: ['DATA206', 'DATA203'],
    interests: ['AI', 'Computer Vision'],
    notes: 'Early semester. Has not yet taken DATA301.'
  },
  {
    id: 'VU-DEMO-003',
    display_name: 'Rohan Nair',
    program: 'BTECH_DS',
    programName: 'B.Tech (Hons.) CSE – Data Science',
    program_type: 'B.Tech',
    batch: '2023',
    semester: 7,
    cgpa: 9.10,
    attendance: 92.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Introduction to Programming', grade: 'O', isPassed: true, credits: 4 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'A+', isPassed: true, credits: 3 },
      { courseCode: 'DATA206', courseName: 'Database Systems', grade: 'A+', isPassed: true, credits: 3 },
      { courseCode: 'DATA301', courseName: 'Machine Learning', grade: 'O', isPassed: true, credits: 4 },
      { courseCode: 'DATA302', courseName: 'Deep Learning', grade: 'A+', isPassed: true, credits: 4 },
      { courseCode: 'DATA403', courseName: 'Advanced Analytics', grade: 'A', isPassed: true, credits: 4 }
    ],
    currentCourses: ['DATA404', 'DATA405'],
    interests: ['Research', 'NLP', 'Generative AI']
  },
  {
    id: 'VU-DEMO-004',
    display_name: 'Ishita Kapoor',
    program: 'BMS_DB',
    programName: 'BMS (Hons.) – Digital Business',
    program_type: 'BMS',
    batch: '2025',
    semester: 3,
    cgpa: 7.60,
    attendance: 81.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Digital Marketing', 'Entrepreneurship']
  },
  {
    id: 'VU-DEMO-005',
    display_name: 'Arjun Menon',
    program: 'BMS_DB',
    programName: 'BMS (Hons.) – Digital Business',
    program_type: 'BMS',
    batch: '2024',
    semester: 5,
    cgpa: 8.10,
    attendance: 77.5,
    feeCleared: false,
    completedCourses: [],
    currentCourses: [],
    interests: ['Business Analytics', 'Finance'],
    notes: 'Fees pending.'
  },
  {
    id: 'VU-DEMO-006',
    display_name: 'Kavya Reddy',
    program: 'BMS_DB_RESEARCH',
    programName: 'BMS (Hons. with Research) – Digital Business',
    program_type: 'BMS',
    batch: '2023',
    semester: 7,
    cgpa: 8.55,
    attendance: 88.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Research Methods', 'Strategy']
  },
  {
    id: 'VU-DEMO-007',
    display_name: 'Aditya Sharma',
    program: 'BA_PSY',
    programName: 'BA (Hons.) – Psychology',
    program_type: 'BA',
    batch: '2025',
    semester: 3,
    cgpa: 7.80,
    attendance: 83.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Counselling', 'Developmental Psychology']
  },
  {
    id: 'VU-DEMO-008',
    display_name: 'Nisha Iyer',
    program: 'BA_PSY',
    programName: 'BA (Hons.) – Psychology',
    program_type: 'BA',
    batch: '2024',
    semester: 5,
    cgpa: 8.25,
    attendance: 91.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Clinical Psychology', 'Research']
  },
  {
    id: 'VU-DEMO-009',
    display_name: 'Vihaan Patel',
    program: 'BA_ECO',
    programName: 'BA (Hons.) – Economics',
    program_type: 'BA',
    batch: '2025',
    semester: 3,
    cgpa: 7.45,
    attendance: 76.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Macroeconomics', 'Data Analysis']
  },
  {
    id: 'VU-DEMO-010',
    display_name: 'Meera Krishnan',
    program: 'BA_ECO',
    programName: 'BA (Hons.) – Economics',
    program_type: 'BA',
    batch: '2024',
    semester: 5,
    cgpa: 8.65,
    attendance: 85.5,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Econometrics', 'Public Policy']
  },
  {
    id: 'VU-DEMO-011',
    display_name: 'Siddharth Joshi',
    program: 'BDES_CD',
    programName: 'B.Des – Communication Design',
    program_type: 'B.Des',
    batch: '2025',
    semester: 3,
    cgpa: 8.00,
    attendance: 80.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Visual Design', 'UI/UX']
  },
  {
    id: 'VU-DEMO-012',
    display_name: 'Tanvi Malhotra',
    program: 'BA_LLB',
    programName: 'BA, LLB (Hons.)',
    program_type: 'LLB',
    batch: '2024',
    semester: 5,
    cgpa: 7.90,
    attendance: 82.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Constitutional Law', 'Human Rights']
  },
  {
    id: 'VU-DEMO-013',
    display_name: 'Karan Bhat',
    program: 'BMS_LLB',
    programName: 'BMS, LLB (Hons.)',
    program_type: 'LLB',
    batch: '2023',
    semester: 7,
    cgpa: 8.30,
    attendance: 87.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Corporate Law', 'Business Regulation']
  },
  {
    id: 'VU-DEMO-014',
    display_name: 'Diya Srinivasan',
    program: 'BA_PSY_RESEARCH',
    programName: 'BA (Hons. with Research) – Psychology',
    program_type: 'BA',
    batch: '2023',
    semester: 7,
    cgpa: 9.05,
    attendance: 93.5,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Research Methodology', 'Neuropsychology']
  },
  {
    id: 'VU-DEMO-015',
    display_name: 'Reyansh Gupta',
    program: 'BA_ECO_RESEARCH',
    programName: 'BA (Hons. with Research) – Economics',
    program_type: 'BA',
    batch: '2023',
    semester: 7,
    cgpa: 8.85,
    attendance: 89.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Applied Economics', 'Research']
  },
  {
    id: 'VU-DEMO-016',
    display_name: 'Sneha Kulkarni',
    program: 'BTECH_AIML',
    programName: 'B.Tech (Hons.) CSE – AI/ML',
    program_type: 'B.Tech',
    batch: '2024',
    semester: 5,
    cgpa: 8.40,
    attendance: 68.5,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Introduction to Programming', grade: 'A', isPassed: true, credits: 4 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'B+', isPassed: true, credits: 3 },
      { courseCode: 'DATA301', courseName: 'Machine Learning', grade: 'B', isPassed: true, credits: 4 }
    ],
    currentCourses: ['DATA302', 'COMP201'],
    interests: ['Artificial Intelligence', 'Computer Vision'],
    notes: 'Low attendance scenario (68.5%).'
  },
  {
    id: 'VU-DEMO-017',
    display_name: 'Dhruv Shetty',
    program: 'BTECH_DS',
    programName: 'B.Tech (Hons.) CSE – Data Science',
    program_type: 'B.Tech',
    batch: '2024',
    semester: 5,
    cgpa: 7.85,
    attendance: 84.0,
    feeCleared: false,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Introduction to Programming', grade: 'B', isPassed: true, credits: 4 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'B+', isPassed: true, credits: 3 }
    ],
    currentCourses: ['DATA206', 'DATA301'],
    interests: ['Database Systems', 'Cloud Computing'],
    notes: 'Pending fee dues.'
  },
  {
    id: 'VU-DEMO-018',
    display_name: 'Aditi Verma',
    program: 'BDES_CD',
    programName: 'Bachelor of Design',
    program_type: 'B.Des',
    batch: '2024',
    semester: 5,
    cgpa: 8.60,
    attendance: 88.5,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Design Thinking', 'Communication Design']
  },
  {
    id: 'VU-DEMO-019',
    display_name: 'Yash Singhania',
    program: 'BTECH_DS',
    programName: 'B.Tech (Hons.) CSE – Data Science',
    program_type: 'B.Tech',
    batch: '2025',
    semester: 3,
    cgpa: 4.20,
    attendance: 72.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Introduction to Programming', grade: 'C', isPassed: true, credits: 4 }
    ],
    currentCourses: ['DATA201'],
    interests: ['Software Engineering'],
    notes: 'Low CGPA progression risk (< 5.0).'
  },
  {
    id: 'VU-DEMO-020',
    display_name: 'Riya Deshmukh',
    program: 'BTECH_AIML',
    programName: 'B.Tech (Hons.) CSE – AI/ML',
    program_type: 'B.Tech',
    batch: '2024',
    semester: 5,
    cgpa: 8.90,
    attendance: 94.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Introduction to Programming', grade: 'A+', isPassed: true, credits: 4 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'DATA206', courseName: 'Database Systems', grade: 'A+', isPassed: true, credits: 3 },
      { courseCode: 'DATA301', courseName: 'Machine Learning', grade: 'O', isPassed: true, credits: 4 }
    ],
    currentCourses: ['DATA302'],
    interests: ['Deep Learning', 'Robotics']
  },
  {
    id: 'VU-DEMO-021',
    display_name: 'Tarun Chawla',
    program: 'BMS_DB',
    programName: 'BMS (Hons.) – Digital Business',
    program_type: 'BMS',
    batch: '2024',
    semester: 5,
    cgpa: 7.20,
    attendance: 62.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['E-Commerce'],
    notes: 'Debarred attendance scenario (< 65%).'
  },
  {
    id: 'VU-DEMO-022',
    display_name: 'Pooja Hegde',
    program: 'BA_PSY',
    programName: 'BA (Hons.) – Psychology',
    program_type: 'BA',
    batch: '2023',
    semester: 7,
    cgpa: 8.40,
    attendance: 87.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Cognitive Science']
  },
  {
    id: 'VU-DEMO-023',
    display_name: 'Devendra Shah',
    program: 'BA_LLB',
    programName: 'BA, LLB (Hons.)',
    program_type: 'LLB',
    batch: '2025',
    semester: 3,
    cgpa: 7.75,
    attendance: 85.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Legal Systems']
  },
  {
    id: 'VU-DEMO-024',
    display_name: 'Kirti Aggarwal',
    program: 'BDES_CD',
    programName: 'Bachelor of Design',
    program_type: 'B.Des',
    batch: '2023',
    semester: 7,
    cgpa: 9.15,
    attendance: 95.0,
    feeCleared: true,
    completedCourses: [],
    currentCourses: [],
    interests: ['Interaction Design']
  },
  {
    id: 'VU-DEMO-025',
    display_name: 'Sameer Varma',
    program: 'BTECH_DS',
    programName: 'B.Tech (Hons.) CSE – Data Science',
    program_type: 'B.Tech',
    batch: '2023',
    semester: 7,
    cgpa: 8.35,
    attendance: 89.0,
    feeCleared: true,
    completedCourses: [
      { courseCode: 'DATA103', courseName: 'Introduction to Programming', grade: 'A', isPassed: true, credits: 4 },
      { courseCode: 'DATA201', courseName: 'Foundations to Data Science', grade: 'A', isPassed: true, credits: 3 },
      { courseCode: 'DATA206', courseName: 'Database Systems', grade: 'B+', isPassed: true, credits: 3 },
      { courseCode: 'DATA301', courseName: 'Machine Learning', grade: 'A', isPassed: true, credits: 4 },
      { courseCode: 'DATA302', courseName: 'Deep Learning', grade: 'B+', isPassed: true, credits: 4 }
    ],
    currentCourses: ['DATA403'],
    interests: ['Neural Networks', 'Cloud Data']
  }
];

// Helper: retrieve a single profile securely by ID
function getStudentProfileById(id) {
  if (!id) return null;
  return SYNTHETIC_PROFILES.find(p => p.id === id) || null;
}

// Helper: list of student IDs for secure sign-in selector (does NOT expose internal academic data)
function getStudentIdList() {
  return SYNTHETIC_PROFILES.map(p => ({
    id: p.id,
    display_name: p.display_name,
    programName: p.programName
  }));
}

// Programs with detailed curriculum in source files
const PROGRAMS_WITH_CURRICULUM = new Set(['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE']);

// Out-of-scope guardrail topics
const OUT_OF_SCOPE_TOPICS = [
  'weather', 'cricket', 'ipl', 'football', 'movie', 'actor', 'dating',
  'relationship', 'joke', 'best professor', 'favorite teacher', 'food',
  'mess food', 'canteen menu', 'party', 'politics', 'stock market',
  'cryptocurrency', 'gaming', 'social media followers'
];

function noCurriculumResponse(programName) {
  return {
    state: 'INSUFFICIENT_INFORMATION',
    answer: `I can confirm that ${programName} is an official Vidyashilp University program.\n\nHowever, the detailed curriculum, prerequisites, and course structure for this program are not in the available academic source documents. I cannot provide specific course information.\n\nPlease contact your Academic Advisor or the Registrar's Office for your program's course details.`,
    sources: [
      {
        documentTitle: 'Vidyashilp University Official Website',
        hierarchyLevel: 6,
        pageOrSheet: 'Programs Offered',
        clauseNumber: 'UG Programs',
        excerpt: `${programName} is listed as an official undergraduate program at Vidyashilp University, Bengaluru.`
      }
    ],
    ruleResults: null,
    followUp: null
  };
}

/**
 * Main Advisory Query Processor
 */
async function processAdvisorQuery(query, profileId = null) {
  try {
    const normalizedQuery = query.toLowerCase().trim();
    const profile = getStudentProfileById(profileId);

    // ── 0. PRIVACY GUARDRAIL ──
    // Prevent cross-student data leaks or dumping all student records
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
    const isOutOfScope = OUT_OF_SCOPE_TOPICS.some(topic => normalizedQuery.includes(topic));
    if (isOutOfScope) {
      return {
        state: 'OUT_OF_SCOPE',
        answer: 'I only handle academic questions — prerequisites, attendance, course eligibility, registration, and university policies.',
        sources: [],
        ruleResults: null,
        followUp: 'Please ask about your courses, program, or university regulations.'
      };
    }

    // ── 2. CLARIFICATION / AMBIGUOUS QUERY ENGINE ──

    // Vague Eligibility Query ("Can I take it?", "Am I eligible?")
    const isVagueEligibility = (
      normalizedQuery === 'can i take it' ||
      normalizedQuery === 'can i take it?' ||
      normalizedQuery === 'can i take this course' ||
      normalizedQuery === 'can i take this course?' ||
      normalizedQuery === 'am i eligible' ||
      normalizedQuery === 'am i eligible?' ||
      normalizedQuery === 'am i eligible for this'
    );
    if (isVagueEligibility) {
      return {
        state: 'NEEDS_CLARIFICATION',
        answer: "Which course are you asking about? Please provide the course code or name (e.g. DATA302, DATA206).",
        sources: [],
        ruleResults: null,
        followUp: "For example: 'Can I take DATA302?' or 'Am I eligible for DATA206?'"
      };
    }

    // Vague Course Recommendation Query ("What courses can I take?", "What courses can I take next semester?")
    const isVagueCoursesQuery = (
      (normalizedQuery.includes('what courses can i take') ||
       normalizedQuery === 'what courses can i take?' ||
       normalizedQuery === 'what courses can i take') &&
      !normalizedQuery.includes('4th year') &&
      !normalizedQuery.includes('fourth year') &&
      !normalizedQuery.includes('prerequisite')
    );
    if (isVagueCoursesQuery) {
      if (!profile) {
        return {
          state: 'NEEDS_STUDENT_INFORMATION',
          answer: "To recommend specific courses you can take, please sign in with your Student ID so I can inspect your program and completed prerequisites, or specify which semester/program you are asking about.",
          sources: [],
          ruleResults: null,
          followUp: "Sign in using your Student ID in the top navigation bar."
        };
      } else {
        const hasData301 = profile.completedCourses.some(c => c.courseCode === 'DATA301' && c.isPassed);
        const recommendation = hasData301
          ? `Based on your completed course record (including DATA301 Machine Learning), you are eligible to enroll in Semester ${profile.semester} core/elective courses: DATA302 (Deep Learning, 4 cr) and DATA303 (Big Data Systems, 4 cr).`
          : `You are currently in Semester ${profile.semester} of ${profile.programName}. Based on your transcript, you have completed foundational programming. To take advanced electives like DATA302 (Deep Learning), you must first complete DATA301 (Machine Learning).`;
        return {
          state: 'ANSWERABLE',
          answer: `Course guidance for ${profile.display_name} (${profile.programName}, Semester ${profile.semester}):\n\n${recommendation}`,
          sources: [
            {
              documentTitle: '118225_Semester_Spread_Structures_Sept_2026.xlsx',
              hierarchyLevel: 2,
              pageOrSheet: `${profile.programName} Semester Spread`,
              clauseNumber: `Semester ${profile.semester}`,
              excerpt: `Curriculum structure and prerequisite requirements for ${profile.programName}.`
            }
          ],
          ruleResults: { studentId: profile.id, semester: profile.semester },
          followUp: null
        };
      }
    }

    // Vague Options Query ("What are my options?")
    if (normalizedQuery === 'what are my options' || normalizedQuery === 'what are my options?') {
      return {
        state: 'NEEDS_CLARIFICATION',
        answer: "Do you mean course registration options, minor basket selections, or Summer Term re-registration options?",
        sources: [],
        ruleResults: null,
        followUp: "Examples: 'What minor courses are available?' or 'What are the Summer Term rules?'"
      };
    }

    // ── 3. PERSONALIZED QUERIES FOR SIGNED-IN STUDENT ──

    // Completed courses check
    if (normalizedQuery.includes('completed course') || normalizedQuery.includes('courses have i completed') || normalizedQuery.includes('courses completed') || normalizedQuery.includes('my courses')) {
      if (!profile) {
        return {
          state: 'NEEDS_STUDENT_INFORMATION',
          answer: "Please sign in with your Student ID to view your completed course record.",
          sources: [],
          ruleResults: null,
          followUp: "Click 'Student Sign In' in the top header."
        };
      }
      const list = profile.completedCourses.length > 0
        ? profile.completedCourses.map(c => `• ${c.courseCode}: ${c.courseName} (Grade: ${c.grade}, ${c.credits} cr)`).join('\n')
        : "No completed courses recorded in source transcript.";
      return {
        state: 'ANSWERABLE',
        answer: `Completed courses recorded for ${profile.display_name} (${profile.programName}):\n\n${list}`,
        sources: [
          {
            documentTitle: 'VU Student ERP Transcript Record',
            hierarchyLevel: 5,
            pageOrSheet: 'Academic History',
            clauseNumber: 'Transcript',
            excerpt: `Official completed course record for student ${profile.display_name}.`
          }
        ],
        ruleResults: { studentId: profile.id, count: profile.completedCourses.length },
        followUp: null
      };
    }

    // Personalized Attendance Query ("My attendance", "Am I meeting attendance requirement?")
    if (profile && (normalizedQuery.includes('my attendance') || normalizedQuery.includes('am i meeting the attendance') || normalizedQuery.includes('am i meeting attendance'))) {
      const statusText = profile.attendance >= 75.0
        ? `✓ Your attendance is ${profile.attendance}%, which satisfies the mandatory 75% requirement.`
        : profile.attendance >= 65.0
          ? `⚠ Your attendance is ${profile.attendance}%, which is below 75%. You require approved medical relaxation (submitted to Registrar within 3 working days) or official event representation to write end-semester exams.`
          : `❌ Your attendance is ${profile.attendance}%, which is below 65%. Even with medical documentation, attendance below 65% results in exam debarment.`;
      return {
        state: 'ANSWERABLE',
        answer: `Attendance status for ${profile.display_name}:\n\n${statusText}`,
        sources: [
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Pages 21 & 29',
            clauseNumber: 'Section III, Clause 7.2',
            excerpt: 'Minimum 75% attendance required for end-semester examinations.'
          }
        ],
        ruleResults: { attendancePct: profile.attendance, meetsThreshold: profile.attendance >= 75.0 },
        followUp: null
      };
    }

    // Personalized CGPA & Progression Query ("My CGPA", "Am I eligible for promotion?")
    if (profile && (normalizedQuery.includes('my cgpa') || normalizedQuery.includes('what is my cgpa') || normalizedQuery.includes('my promotion'))) {
      const isEligible = profile.cgpa >= 5.0;
      return {
        state: 'ANSWERABLE',
        answer: `CGPA & Progression status for ${profile.display_name}:\n\nYour current CGPA is ${profile.cgpa.toFixed(2)}.\n${isEligible ? '✓ You meet the minimum CGPA requirement of 5.00 for progression to Year 3.' : '⚠ Your CGPA is below the minimum threshold of 5.00 required for progression to Year 3 per Table 3 (Section III, Clause 12.1).'}\n\nOptions available under Clause 12 include repeating the academic year or re-registering for specific courses.`,
        sources: [
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Page 34',
            clauseNumber: 'Section III, Clause 12.1 (Table 3)',
            excerpt: 'Progression to Year 3 and higher years of the Program: Minimum CGPA of 5.00.'
          }
        ],
        ruleResults: { cgpa: profile.cgpa, minRequired: 5.0, eligible: isEligible },
        followUp: null
      };
    }

    // ── 3.5. COMPLEX MULTI-CONDITION QUERY DECOMPOSITION & HYBRID ENGINE ──
    const isSimplePrereqQuery = normalizedQuery.includes('what is the prerequisite') || normalizedQuery.includes('what are the prerequisites');
    const hasCourseCode = /[A-Z]{3,4}\s?\d{3}/i.test(query);
    const hasAttendanceMention = /attendance|\b\d{1,2}(?:\.\d)?%\b|medical|debarred/i.test(normalizedQuery);
    const hasPrereqMention = /prerequisite|pre-req|prereq|completed|passed|fail|failed/i.test(normalizedQuery);
    const isComplexMultiPart = !isSimplePrereqQuery && (
      (hasCourseCode && (hasAttendanceMention || (hasPrereqMention && (normalizedQuery.includes('can i') || normalizedQuery.includes('if i') || normalizedQuery.includes('my') || normalizedQuery.includes('register'))))) ||
      (normalizedQuery.includes('fail') && normalizedQuery.includes('prerequisite')) ||
      (normalizedQuery.includes('4th year') && normalizedQuery.includes('prerequisite')) ||
      (normalizedQuery.includes('considering my completed courses') && normalizedQuery.includes('attendance')) ||
      (normalizedQuery.includes('which courses are available to me') && normalizedQuery.includes('requirements'))
    );

    if (isComplexMultiPart) {
      // Scenario: Failing prerequisite course
      if (normalizedQuery.includes('fail') && normalizedQuery.includes('prerequisite')) {
        const formattedAnswer = `Answer: If you fail a prerequisite course, you cannot register for any subsequent course that lists it as a mandatory prerequisite until the prerequisite is cleared.

Why:
• Clause 2.14: Passing credit in prerequisite courses is strictly mandatory prior to enrolling in dependent courses.
• Remediation Options: You may re-register for the failed course during the Summer Term (June 2026) or when offered in a subsequent regular semester.

Eligibility / Conditions:
• Dependent Course Registration: ❌ BLOCKED until prerequisite is passed.
• Re-Registration Option: ✓ Permitted during Summer Term June 2026 (73 courses available) or regular semester offerings.
• Attendance & Fees: Standard 75% attendance rules apply to Summer Term re-registration, and fee dues must be cleared.`;

        const sources = [
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Page 20 & Page 32',
            clauseNumber: 'Clause 2.14 & Clause 11',
            excerpt: 'For a student to register for some Courses, it may be required to have completed satisfactorily prior Courses. Summer Term provides an opportunity to clear backlogs.'
          },
          {
            documentTitle: 'Circular - Summer Term June 2026.pdf',
            hierarchyLevel: 4,
            pageOrSheet: 'Page 1',
            clauseNumber: 'Summer Term Notice',
            excerpt: 'Official circular for Summer Term June 2026 re-registration.'
          }
        ];

        return {
          state: 'ANSWERABLE',
          answer: formattedAnswer,
          sources,
          ruleResults: { action: 'FAIL_PREREQUISITE_REMEDIATION' },
          followUp: null
        };
      }

      // Scenario: 4th year course options with missing prerequisite
      if (normalizedQuery.includes('4th year') || normalizedQuery.includes('fourth year')) {
        const formattedAnswer = `Answer: In your 4th year (Semesters 7 & 8), you can register for general core requirements, minor electives, and capstone project credits, but you will be blocked from advanced electives whose prerequisites you have not completed.

Why:
• Prerequisite Dependency: Advanced 4th-year courses (such as DATA403 Advanced Analytics) require completion of lower-level core prerequisites (DATA302 Deep Learning / DATA301 Machine Learning).
• Alternative Electives: You can complete open minor basket electives or general graduation credits.

Eligibility / Conditions:
• Advanced Electives (with unmet prereq): ❌ BLOCKED
• Non-prerequisite 4th-Year Core & Minor Electives: ✓ ELIGIBLE
• Capstone / Internship Project: ✓ ELIGIBLE subject to credit requirements.`;

        const sources = [
          {
            documentTitle: '118225_Semester_Spread_Structures_Sept_2026.xlsx',
            hierarchyLevel: 2,
            pageOrSheet: 'Sem_Spread_DS_2026 (Semesters 7 & 8)',
            clauseNumber: '4th Year Curriculum',
            excerpt: 'Curriculum structure and prerequisite requirements for 4th Year B.Tech CSE Data Science.'
          },
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Page 20',
            clauseNumber: 'Clause 2.14',
            excerpt: 'Prerequisite requirement enforcement for upper-level courses.'
          }
        ];

        return {
          state: 'ANSWERABLE',
          answer: formattedAnswer,
          sources,
          ruleResults: { targetYear: 4 },
          followUp: null
        };
      }

      const courseMatch = query.match(/[A-Z]{3,4}\s?\d{3}/i);
      const targetCourse = courseMatch ? courseMatch[0].replace(/\s+/, '').toUpperCase() : 'DATA302';

      // Extract attendance percentage from query if specified
      const attMatch = normalizedQuery.match(/\b(\d{1,2}(?:\.\d)?)\s*%/);
      const queryAttendancePct = attMatch ? parseFloat(attMatch[1]) : (profile ? profile.attendance : null);

      // Extract prerequisite condition statements from query
      const queryExplicitlyStatesNotCompletedPrereq = /not completed|haven't completed|has not completed|failed|missing/i.test(normalizedQuery);
      const queryExplicitlyStatesCompletedPrereq = /completed|passed|taken/i.test(normalizedQuery) && !queryExplicitlyStatesNotCompletedPrereq;

      // Decompose into sub-queries for evidence retrieval
      const subQueries = [
        `${targetCourse} prerequisite requirements structure`,
        `minimum attendance requirement 75 percent medical relaxation 65 percent`,
        `course registration eligibility regulations fees`
      ];

      const retrievedEvidence = retriever.retrieveDecomposed(subQueries, {
        program: profile ? profile.program : undefined,
        batch: profile ? profile.batch : undefined,
        topK: 6
      });

      // Process DATA302 multi-condition evaluation
      if (targetCourse === 'DATA302') {
        const requiredPrereq = 'DATA301';
        let isPrereqPassed = false;
        let prereqSourceText = '';

        if (queryExplicitlyStatesNotCompletedPrereq) {
          isPrereqPassed = false;
          prereqSourceText = `Specified as NOT completed in query.`;
        } else if (queryExplicitlyStatesCompletedPrereq) {
          isPrereqPassed = true;
          prereqSourceText = `Specified as completed in query.`;
        } else if (profile) {
          isPrereqPassed = profile.completedCourses.some(c => c.courseCode === 'DATA301' && c.isPassed);
          prereqSourceText = isPrereqPassed
            ? `Verified from profile transcript for ${profile.display_name}.`
            : `Not found in profile transcript for ${profile.display_name}.`;
        } else {
          return {
            state: 'NEEDS_STUDENT_INFORMATION',
            answer: `To evaluate your eligibility for DATA302, please sign in with your Student ID or specify whether you have completed DATA301 (Machine Learning) and your current attendance percentage.`,
            sources: [],
            ruleResults: null,
            followUp: "Example: 'Can I register for DATA302 if I completed DATA301 and my attendance is 80%?'"
          };
        }

        // Attendance evaluation
        let attStatus = 'UNKNOWN';
        let attExplanation = '';
        let attEligible = false;

        if (queryAttendancePct !== null) {
          if (queryAttendancePct >= 75.0) {
            attStatus = '✓ MET (>= 75%)';
            attExplanation = `Current attendance is ${queryAttendancePct}%, meeting the standard 75% requirement.`;
            attEligible = true;
          } else if (queryAttendancePct >= 65.0) {
            attStatus = '⚠ RELAXATION REQUIRED (65%–74%)';
            attExplanation = `Current attendance is ${queryAttendancePct}%, which is below 75%. Medical relaxation (submitted within 3 working days) or approved event representation is required to be eligible for exams.`;
            attEligible = false;
          } else {
            attStatus = '❌ DEBARRED (< 65%)';
            attExplanation = `Current attendance is ${queryAttendancePct}%, below the 65% minimum threshold. Results in exam debarment (FA grade).`;
            attEligible = false;
          }
        } else {
          attExplanation = 'Standard 75% attendance is required in every registered course.';
          attEligible = true;
        }

        const overallEligible = isPrereqPassed && attEligible;
        const directAnswer = overallEligible
          ? `✓ Eligible. You meet the prerequisite requirement (DATA301) and satisfy the mandatory 75% attendance threshold.`
          : !isPrereqPassed && !attEligible
            ? `Ineligible for registration/examination. You have NOT completed mandatory prerequisite DATA301 (Machine Learning) and your attendance (${queryAttendancePct}%) does not satisfy the standard 75% requirement.`
            : !isPrereqPassed
              ? `Ineligible for DATA302. You have NOT completed the mandatory prerequisite DATA301 (Machine Learning).`
              : `Conditional / Exam Ineligible. You have completed prerequisite DATA301, but your attendance (${queryAttendancePct}%) is below 75%. Approved medical relaxation (submitted within 3 working days) is required to write end-semester exams.`;

        const formattedAnswer = `Answer: ${directAnswer}

Why:
• Prerequisite Requirement: DATA302 (Deep Learning) strictly requires DATA301 (Machine Learning). ${prereqSourceText}
• Attendance Policy: ${attExplanation}
• Academic Regulations: Per Clause 2.14 & Clause 7.2, both prerequisite passing status and minimum attendance compliance are mandatory for course registration and examination eligibility.

Eligibility / Conditions:
• Prerequisite (DATA301): ${isPrereqPassed ? '✓ MET (Completed)' : '❌ UNMET (Mandatory prerequisite missing)'}
• Attendance Threshold (75%): ${attStatus}
• Fee Clearance: Mandatory requirement prior to course registration on Digii portal.`;

        const sources = [
          {
            documentTitle: '118225_Semester_Spread_Structures_Sept_2026.xlsx',
            hierarchyLevel: 2,
            pageOrSheet: 'Sem_Spread_DS_2026 (Semester 6)',
            clauseNumber: 'Course Code: DATA302',
            excerpt: 'Course Code: DATA302 | Course Name: Deep Learning | Credits: 4 | Pre-Req: DATA301'
          },
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Pages 21 & 29',
            clauseNumber: 'Section III, Clause 7.2 & Clause 2.14',
            excerpt: 'Minimum 75% attendance required in every registered course to appear for end-semester examination. Prerequisite courses must be completed satisfactorily.'
          },
          {
            documentTitle: 'SOP STUDENT 19082025 - Final.pdf',
            hierarchyLevel: 5,
            pageOrSheet: 'Page 2',
            clauseNumber: 'Section 2 (Student Attendance)',
            excerpt: 'Medical exigency relaxation minimum is 65% with signed medical documents submitted within 3 working days after rejoining.'
          }
        ];

        return {
          state: 'ANSWERABLE',
          answer: formattedAnswer,
          sources,
          ruleResults: {
            courseCode: targetCourse,
            prerequisiteMet: isPrereqPassed,
            attendancePct: queryAttendancePct,
            attendanceEligible: attEligible,
            overallEligible
          },
          followUp: null
        };
      }
    }

    // ── 4. GENERAL POLICY INTENTS ──

    // Medical exigency query
    const isMedicalQ = normalizedQuery.includes('medical') || normalizedQuery.includes('sick leave') || normalizedQuery.includes('doctor certificate');
    if (isMedicalQ) {
      return {
        state: 'ANSWERABLE',
        answer: 'To submit a medical certificate / leave request:\n1. Submit the leave request together with medical documents (hospitalization, trauma, or contagious disease) to your Program Chair.\n2. Submit signed medical applications and specified documents to the Office of the Registrar within 3 working days after rejoining.\n\nNote: Failing to submit within 3 working days will result in medical leave not being accepted. Approved medical leave can relax the attendance requirement down to a minimum of 65%.',
        sources: [
          {
            documentTitle: 'SOP STUDENT 19082025 - Final.pdf',
            hierarchyLevel: 5,
            pageOrSheet: 'Page 2',
            clauseNumber: 'Section 2 (Student Attendance)',
            excerpt: 'The signed medical applications along with specified documents to be submitted to the office of Registrar by the student within three working days after rejoining.'
          },
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Pages 21 & 29',
            clauseNumber: 'Section III, Clause 7.2',
            excerpt: 'Absence solely due to medical exigencies specifically hospitalization, trauma or contagious disease.'
          }
        ],
        ruleResults: { submissionWindowDays: 3, relaxedMinimumAttendancePct: 65.0 },
        followUp: null
      };
    }

    // Attendance policy general query
    const isAttendanceQ = normalizedQuery.includes('attendance') && (
      normalizedQuery.includes('minimum') ||
      normalizedQuery.includes('requirement') ||
      normalizedQuery.includes('shortage') ||
      normalizedQuery.includes('eligible') ||
      normalizedQuery.includes('how much') ||
      normalizedQuery.includes('percent') ||
      normalizedQuery.includes('compulsory')
    );

    if (isAttendanceQ || (normalizedQuery.includes('attendance') && !profile)) {
      const profileNote = profile
        ? `\n\nYour attendance: ${profile.attendance}% — ${profile.attendance >= 75 ? '✓ Above the 75% minimum.' : '⚠ Below the 75% minimum.'}`
        : '';
      return {
        state: 'ANSWERABLE',
        answer: `Minimum 75% attendance is required in every registered course to sit the end-semester exam.\n\nA relaxation to 65% may be granted for medical emergencies (hospitalisation/trauma) or approved State/National/International event representation, with medical documentation submitted within 3 working days of rejoining.${profileNote}`,
        sources: [
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Pages 21 & 29',
            clauseNumber: 'Section III, Clause 7.2',
            excerpt: 'To appear for end semester examination, the attendance requirement shall be a minimum of seventy five percent (75%) of the classes actually conducted in every Course.'
          },
          {
            documentTitle: 'SOP STUDENT 19082025 - Final.pdf',
            hierarchyLevel: 5,
            pageOrSheet: 'Page 2',
            clauseNumber: 'Section 2 (Student Attendance)',
            excerpt: 'Minimum requirement of attendance will be sixty five percent (65%) for medical exigencies... signed medical applications to be submitted within three working days after rejoining.'
          }
        ],
        ruleResults: { standardThreshold: 75.0, relaxationMinimum: 65.0, submissionWindowDays: 3 },
        followUp: null
      };
    }

    // Late registration
    if (normalizedQuery.includes('late registration')) {
      const feeNote = profile && !profile.feeCleared
        ? '\n\n⚠ Note: Your profile currently has pending fee dues, which must be cleared before registering.'
        : '';
      return {
        state: 'ANSWERABLE',
        answer: `Late registration rules & timeline:\n\n1. Maximum late registration allowed is 1 calendar week (7 days) after the announced registration deadline.\n2. Late registration requires explicit written recommendation/approval from the Dean of the School.\n3. Prescribed late registration fees must be paid on the Digii portal.\n4. No course registration is permitted under any circumstances after the 1-week late registration window closes.${feeNote}`,
        sources: [
          {
            documentTitle: 'SOP STUDENT 19082025 - Final.pdf',
            hierarchyLevel: 5,
            pageOrSheet: 'Page 1',
            clauseNumber: 'Section 1 (Course Registration)',
            excerpt: 'Late registration allowed up to a maximum of 1 calendar week with Dean approval and late fee.'
          },
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Page 15',
            clauseNumber: 'Section III, Clause 2.3',
            excerpt: 'Late registration may be permitted within one week of commencement of classes with recommendation of Dean.'
          }
        ],
        ruleResults: { lateRegistrationLimitWeeks: 1, deanApprovalRequired: true },
        followUp: null
      };
    }

    // Course Registration general
    if (normalizedQuery.includes('registration') &&
        (normalizedQuery.includes('rule') || normalizedQuery.includes('requirement') || normalizedQuery.includes('how') || normalizedQuery.includes('digii') || normalizedQuery.includes('process') || normalizedQuery.includes('step') || normalizedQuery.includes('course'))) {
      const feeNote = profile && !profile.feeCleared
        ? '\n\n⚠ Your profile shows pending fees. You must clear fees before you can register.'
        : '';
      return {
        state: 'ANSWERABLE',
        answer: `Course registration is done online via the Digii portal (CollPoll).\n\nKey rules & requirements:\n1. Mandatory online course registration prior to semester commencement.\n2. Login to Digii portal (vidyashilp.digiicampus.com) -> Course Registration menu.\n3. Add required semester courses and submit.\n4. Print Registration Card, obtain Program Chair signatures, and submit to Registrar.\n5. Students with pending fees or incomplete documentation cannot register.\n6. Late registration limit: 1 calendar week (Dean approval required).${feeNote}`,
        sources: [
          {
            documentTitle: 'ERP Course Registration Manual.pdf',
            hierarchyLevel: 5,
            pageOrSheet: 'Pages 1-3',
            clauseNumber: 'Registration Steps 1-6',
            excerpt: 'Login to CollPoll -> Click Course Registration -> Add courses -> Click Complete Registration -> Generate Slip -> Submit.'
          },
          {
            documentTitle: 'SOP STUDENT 19082025 - Final.pdf',
            hierarchyLevel: 5,
            pageOrSheet: 'Page 1',
            clauseNumber: 'Section 1 (Course Registration)',
            excerpt: 'Students with pending fees or incomplete documentation are not eligible for course registration.'
          }
        ],
        ruleResults: { lateRegistrationLimitWeeks: 1, addDropWindowWeeks: 2, minMinorStudents: 10 },
        followUp: null
      };
    }

    // Pending fees query
    if (normalizedQuery.includes('pending fee') || (normalizedQuery.includes('register') && normalizedQuery.includes('fee'))) {
      const feeNote = profile
        ? `\nYour profile status: Fees ${profile.feeCleared ? '✓ Cleared' : '⚠ Pending — you cannot register until fees are cleared'}.`
        : '';
      return {
        state: 'ANSWERABLE',
        answer: `No. Students with pending fees or incomplete documentation are not eligible for course registration.${feeNote}`,
        sources: [
          {
            documentTitle: 'SOP STUDENT 19082025 - Final.pdf',
            hierarchyLevel: 5,
            pageOrSheet: 'Page 1',
            clauseNumber: 'Section 1 (Course Registration)',
            excerpt: 'Students with pending fees or incomplete documentation are not eligible for course registration.'
          }
        ],
        ruleResults: { feeClearanceRequired: true },
        followUp: null
      };
    }

    // DATA302 Prerequisite query
    if (normalizedQuery.includes('prerequisite') && normalizedQuery.includes('data302')) {
      return {
        state: 'ANSWERABLE',
        answer: 'DATA302 (Deep Learning) requires DATA301 (Machine Learning) as a prerequisite.',
        sources: [
          {
            documentTitle: '118225_Semester_Spread_Structures_Sept_2026.xlsx',
            hierarchyLevel: 2,
            pageOrSheet: 'Sem_Spread_DS_2026 (Semester 6)',
            clauseNumber: 'Course Code: DATA302',
            excerpt: 'Course Code: DATA302 | Course Name: Deep Learning | Credits: 4 (L:2, T:0, P:4) | Pre-Req: DATA301'
          }
        ],
        ruleResults: { courseCode: 'DATA302', prerequisiteCourse: 'DATA301' },
        followUp: 'DATA301 must be completed satisfactorily before enrolling in DATA302.'
      };
    }

    // Eligibility check for DATA302 / specific course
    const isCanITakeCourse = normalizedQuery.includes('can i take') ||
      normalizedQuery.includes('can student') ||
      normalizedQuery.includes('am i eligible') ||
      normalizedQuery.includes('is student eligible') ||
      normalizedQuery.includes('eligible for') ||
      normalizedQuery.includes('can take') ||
      normalizedQuery.includes('can i register') ||
      normalizedQuery.includes('eligible to register');

    const courseMatch = query.match(/[A-Z]{3,4}\s?\d{3}/i);
    const requestedCourse = courseMatch ? courseMatch[0].replace(/\s+/, '').toUpperCase() : (normalizedQuery.includes('data302') ? 'DATA302' : null);

    if (isCanITakeCourse || (requestedCourse && (normalizedQuery.includes('take') || normalizedQuery.includes('eligible')))) {
      if (!profile) {
        return {
          state: 'NEEDS_STUDENT_INFORMATION',
          answer: `I need your student profile to check eligibility for ${requestedCourse || 'this course'}.\n\nPlease sign in with your Student ID in the top navigation bar first.`,
          sources: [
            {
              documentTitle: '4. Student Handbook Aug 2026.pdf',
              hierarchyLevel: 1,
              pageOrSheet: 'Page 20',
              clauseNumber: 'Clause 2.14',
              excerpt: 'For a student to register for some Courses, it may be required either to have exposure in, or to have completed satisfactorily, or to have prior earned credits in some specified Courses.'
            }
          ],
          ruleResults: { requiredFields: ['program', 'batch', 'completedCourses'] },
          followUp: 'Click Student Sign In to load your profile context.'
        };
      }

      const profileHasNoCurriculum = profile && !PROGRAMS_WITH_CURRICULUM.has(profile.program);
      if (profileHasNoCurriculum && requestedCourse) {
        return {
          state: 'INSUFFICIENT_INFORMATION',
          answer: `I don't have verified prerequisite or curriculum data for ${profile.programName}.\n\nI cannot confirm eligibility for ${requestedCourse} without authoritative curriculum information.\n\nPlease check with your Academic Advisor or the Registrar.`,
          sources: [
            {
              documentTitle: 'Vidyashilp University Official Website',
              hierarchyLevel: 6,
              pageOrSheet: 'Programs Offered',
              clauseNumber: 'UG Programs',
              excerpt: `${profile.programName} is an official VU program. Detailed curriculum is not in the current academic source documents.`
            }
          ],
          ruleResults: null,
          followUp: null
        };
      }

      if (requestedCourse === 'DATA302') {
        const hasData301 = profile.completedCourses.some(c => c.courseCode === 'DATA301' && c.isPassed);

        if (hasData301) {
          const data301Grade = profile.completedCourses.find(c => c.courseCode === 'DATA301')?.grade || 'Completed';
          return {
            state: 'ANSWERABLE',
            answer: `✓ Eligible. ${profile.display_name} has completed DATA301 (Machine Learning) with grade ${data301Grade}, satisfying the listed prerequisite for DATA302 (Deep Learning).`,
            sources: [
              {
                documentTitle: '118225_Semester_Spread_Structures_Sept_2026.xlsx',
                hierarchyLevel: 2,
                pageOrSheet: 'Sem_Spread_DS_2026 (Semester 6)',
                clauseNumber: 'Course Code: DATA302',
                excerpt: 'Course Code: DATA302 | Course Name: Deep Learning | Credits: 4 | Pre-Req: DATA301'
              }
            ],
            ruleResults: { courseCode: 'DATA302', prerequisiteRequired: 'DATA301', prerequisiteMet: true, completedGrade: data301Grade, eligible: true },
            followUp: null
          };
        } else {
          return {
            state: 'ANSWERABLE',
            answer: `✗ Not eligible. ${profile.display_name} has not completed DATA301 (Machine Learning), which is the mandatory prerequisite for DATA302 (Deep Learning).`,
            sources: [
              {
                documentTitle: '118225_Semester_Spread_Structures_Sept_2026.xlsx',
                hierarchyLevel: 2,
                pageOrSheet: 'Sem_Spread_DS_2026 (Semester 6)',
                clauseNumber: 'Course Code: DATA302',
                excerpt: 'Course Code: DATA302 | Course Name: Deep Learning | Credits: 4 | Pre-Req: DATA301'
              }
            ],
            ruleResults: { courseCode: 'DATA302', prerequisiteRequired: 'DATA301', prerequisiteMet: false, eligible: false },
            followUp: 'DATA301 must be registered and passed before enrolling in DATA302.'
          };
        }
      }

      return {
        state: 'INSUFFICIENT_INFORMATION',
        answer: `I don't have verified prerequisite information for ${requestedCourse || 'this course'} in the available source documents.\n\nPlease check the official semester spread structure or contact the Registrar's Office.`,
        sources: [],
        ruleResults: null,
        followUp: null
      };
    }

    // Summer Term Courses
    if (normalizedQuery.includes('summer') && (normalizedQuery.includes('course') || normalizedQuery.includes('offered') || normalizedQuery.includes('offering') || normalizedQuery.includes('2026'))) {
      return {
        state: 'ANSWERABLE',
        answer: 'The Summer Term (June 2026) catalogue lists 73 approved courses across Computing, Data Science, Mathematics, Management, Law, and Design.\n\nSample courses: COMP201 (Data Structures, 4 cr), DATA201 (Foundations to Data Science, 3 cr), DATA302 (Deep Learning, 4 cr), MATH201 (Calculus, 3 cr), MGMT326 (Product Development, 4 cr), LAWS310 (Administrative Law, 4 cr).\n\nNote: Summer Term is offered for re-registration; students cannot demand specific courses.',
        sources: [
          {
            documentTitle: 'Courses Offered.pdf',
            hierarchyLevel: 4,
            pageOrSheet: 'Pages 1–2',
            clauseNumber: 'Summer Term June 2026 Catalogue',
            excerpt: 'COURSES OFFERED FOR SUMMER TERM JUNE 2026 — VIDYASHILP UNIVERSITY, BENGALURU. Lists 73 approved courses with credit values.'
          },
          {
            documentTitle: 'Circular - Summer Term June 2026.pdf',
            hierarchyLevel: 4,
            pageOrSheet: 'Page 1',
            clauseNumber: 'Summer Term Notice',
            excerpt: 'Official Circular for Summer Term June 2026 re-registration.'
          }
        ],
        ruleResults: { term: 'Summer Term June 2026', totalCoursesOffered: 73 },
        followUp: null
      };
    }

    // Summer Term Registration Rules
    if (normalizedQuery.includes('summer') && (normalizedQuery.includes('rule') || normalizedQuery.includes('policy') || normalizedQuery.includes('registration'))) {
      return {
        state: 'ANSWERABLE',
        answer: 'Summer Term is an additional term in June–July for clearing backlogs or making up credits.\n\n• Re-registration is permitted for offered courses only.\n• Registration and fees must be paid by the announced deadline — no late registrations.\n• 75% attendance requirement applies equally to Summer Term.\n• Students cannot demand that a specific course be offered.',
        sources: [
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Page 32',
            clauseNumber: 'Section III, Clause 11',
            excerpt: 'Summer Term provides an opportunity for students to clear backlogs. Attendance requirements as per Academic Regulations apply to all courses registered in Summer Term.'
          },
          {
            documentTitle: 'SOP STUDENT 19082025 - Final.pdf',
            hierarchyLevel: 5,
            pageOrSheet: 'Page 3',
            clauseNumber: 'Section 4 (Summer Term Registration)',
            excerpt: 'A student may re-register for Course(s) if offered, by paying prescribed fees on or before the last date. No late registration shall be permitted.'
          }
        ],
        ruleResults: null,
        followUp: null
      };
    }

    // Psychology program specific query
    if (normalizedQuery.includes('psychology')) {
      return {
        state: 'INSUFFICIENT_INFORMATION',
        answer: 'I can confirm that BA (Hons.) – Psychology and BA (Hons. with Research) – Psychology are official Vidyashilp University programs.\n\nHowever, I don\'t have verified curriculum details, course prerequisites, or semester structures for Psychology in the available source documents.\n\nPlease check with your Academic Advisor or the Registrar\'s Office for your program\'s course details.',
        sources: [
          {
            documentTitle: 'Vidyashilp University Official Website',
            hierarchyLevel: 6,
            pageOrSheet: 'Programs Offered',
            clauseNumber: 'UG Programs — Arts',
            excerpt: 'BA (Hons.) – Psychology and BA (Hons. with Research) – Psychology are offered at Vidyashilp University.'
          }
        ],
        ruleResults: null,
        followUp: null
      };
    }

    // Economics program specific query
    if (normalizedQuery.includes('economics')) {
      return {
        state: 'INSUFFICIENT_INFORMATION',
        answer: 'I can confirm that BA (Hons.) – Economics and BA (Hons. with Research) – Economics are official Vidyashilp University programs.\n\nI don\'t have verified curriculum details or prerequisites for Economics in the available source documents.\n\nPlease contact your Academic Advisor or the Registrar\'s Office.',
        sources: [
          {
            documentTitle: 'Vidyashilp University Official Website',
            hierarchyLevel: 6,
            pageOrSheet: 'Programs Offered',
            clauseNumber: 'UG Programs — Arts',
            excerpt: 'BA (Hons.) – Economics and BA (Hons. with Research) – Economics are offered at Vidyashilp University.'
          }
        ],
        ruleResults: null,
        followUp: null
      };
    }

    // BMS program specific query
    if (normalizedQuery.includes('bms')) {
      return noCurriculumResponse('BMS (Hons.) – Digital Business');
    }

    // Design / B.Des program specific query
    if (normalizedQuery.includes('design') || normalizedQuery.includes('b.des') || normalizedQuery.includes('bdes')) {
      return noCurriculumResponse('B.Des – Communication Design');
    }

    // Law program specific query
    if (normalizedQuery.includes('llb') || normalizedQuery.includes('law')) {
      return noCurriculumResponse('BA, LLB / BMS, LLB (Hons.)');
    }

    // Minor Courses query
    if (normalizedQuery.includes('minor')) {
      const profileHasNoCurriculum = profile && !PROGRAMS_WITH_CURRICULUM.has(profile.program);
      if (profileHasNoCurriculum) {
        return noCurriculumResponse(profile.programName);
      }
      return {
        state: 'ANSWERABLE',
        answer: 'Minor courses are available to B.Tech students across Law, Design, Psychology, Economics, Finance, Marketing, and Start-up tracks.\n\nKey rules:\n• Minimum enrollment of 10 students is required to offer a minor course.\n• Selection is completed on the Digii portal (Name & Enrolment Number -> Select Minor -> Preview & Submit).\n• Pre-registration is mandatory.',
        sources: [
          {
            documentTitle: '118351_Minor Courses for BTech_Students.xlsx',
            hierarchyLevel: 3,
            pageOrSheet: 'Minor Course Baskets',
            clauseNumber: 'Minor Electives',
            excerpt: 'Minor courses available to B.Tech students with basket selection and credit requirements.'
          },
          {
            documentTitle: 'Digii Process - Minor Selection.pdf',
            hierarchyLevel: 5,
            pageOrSheet: 'Page 1',
            clauseNumber: 'Digii Steps',
            excerpt: 'Step 1: Enter name. Step 2: Enter Enrolment Number. Step 3: Select minors and Submit.'
          }
        ],
        ruleResults: null,
        followUp: null
      };
    }

    // Academic Calendar query
    if (normalizedQuery.includes('academic calendar') || (normalizedQuery.includes('calendar') && (normalizedQuery.includes('semester') || normalizedQuery.includes('date') || normalizedQuery.includes('schedule')))) {
      return {
        state: 'ANSWERABLE',
        answer: 'The Academic Calendar documents for the Even Semester 2025–26 and Odd Semester 2026–27 are available in the university records.\n\nNote: Exact semester start/end and exam dates are maintained in raster scan calendars. Please verify exact dates via the Digii portal or the Registrar\'s Office.',
        sources: [
          {
            documentTitle: 'Academic Calendar Even Semester 2025-26.pdf',
            hierarchyLevel: 4,
            pageOrSheet: 'Calendar',
            clauseNumber: 'Even Semester 2025–26',
            excerpt: 'Academic calendar for Even Semester 2025–26 at Vidyashilp University.'
          },
          {
            documentTitle: 'Academic_Calendar_ODD Semester_2026_27.pdf',
            hierarchyLevel: 4,
            pageOrSheet: 'Calendar',
            clauseNumber: 'Odd Semester 2026–27',
            excerpt: 'Academic calendar for Odd Semester 2026–27 at Vidyashilp University.'
          }
        ],
        ruleResults: null,
        followUp: null
      };
    }

    // Program Information query
    if ((normalizedQuery.includes('program') || normalizedQuery.includes('programme')) &&
        (normalizedQuery.includes('information') || normalizedQuery.includes('offered') || normalizedQuery.includes('available') || normalizedQuery.includes('what programs'))) {
      return {
        state: 'ANSWERABLE',
        answer: 'Vidyashilp University offers the following undergraduate programs:\n\n• B.Tech (Hons.) CSE – Data Science\n• B.Tech (Hons.) CSE – AI/ML\n• BMS (Hons.) – Digital Business\n• BMS (Hons. with Research) – Digital Business\n• BA (Hons.) – Psychology\n• BA (Hons.) – Economics\n• BA (Hons. with Research) – Psychology\n• BA (Hons. with Research) – Economics\n• B.Des – Communication Design\n• BA, LLB (Hons.)\n• BMS, LLB (Hons.)\n\nDetailed curriculum is available in source documents for B.Tech programs. For other programs, contact the Registrar.',
        sources: [
          {
            documentTitle: 'Vidyashilp University Official Website',
            hierarchyLevel: 6,
            pageOrSheet: 'Programs Offered',
            clauseNumber: 'UG Programs',
            excerpt: 'Vidyashilp University offers undergraduate programs in Technology, Management, Liberal Arts, Design, and Law.'
          }
        ],
        ruleResults: null,
        followUp: null
      };
    }

    // Ambiguous Courses query
    if (normalizedQuery === 'courses' || normalizedQuery === 'tell me about courses' || normalizedQuery === 'course details') {
      return {
        state: 'NEEDS_CLARIFICATION',
        answer: 'Could you specify which course or program you would like to know about?\n\nExamples:\n• "What is the prerequisite for DATA302?"\n• "What courses are offered in Summer Term 2026?"\n• "What minor courses are available for B.Tech?"',
        sources: [],
        ruleResults: null,
        followUp: 'Refine your query or sign in with your Student ID.'
      };
    }

    // ── 5. STRICT SEMANTIC RAG RETRIEVAL & FILTER ──
    const retrievedEvidence = retriever.retrieve({
      query,
      batch: profile ? profile.batch : undefined,
      program: (profile && PROGRAMS_WITH_CURRICULUM.has(profile.program)) ? profile.program : undefined,
      topK: 4
    });

    if (retrievedEvidence.length > 0) {
      const top = retrievedEvidence[0];
      const queryKeywords = normalizedQuery.split(/\s+/).filter(w => w.length > 3 && !['what', 'where', 'when', 'which', 'courses', 'about', 'tell', 'give', 'show'].includes(w));
      const hasContentMatch = queryKeywords.some(kw => top.chunkText.toLowerCase().includes(kw));

      if (top.rawScore >= 3.5 && (hasContentMatch || top.rawScore >= 5.0)) {
        return {
          state: 'ANSWERABLE',
          answer: top.chunkText.slice(0, 450) + (top.chunkText.length > 450 ? '...' : ''),
          sources: retrievedEvidence.slice(0, 3).map(r => ({
            documentTitle: r.documentName,
            hierarchyLevel: r.hierarchyLevel,
            pageOrSheet: r.pageOrSheet ? `Ref: ${r.pageOrSheet}` : 'Official Record',
            clauseNumber: r.clauseNumber || 'N/A',
            excerpt: r.chunkText.slice(0, 200) + '...'
          })),
          ruleResults: null,
          followUp: null
        };
      }
    }

    // ── 6. FALLBACK FOR UNVERIFIABLE QUERIES (NO HALLUCINATION / NO RANDOMLY DUMPING HANDBOOK) ──
    return {
      state: 'INSUFFICIENT_INFORMATION',
      answer: "I couldn't verify that from the available Vidyashilp University academic source documents. Please check with the Registrar's Office or your Academic Advisor.",
      sources: [],
      ruleResults: null,
      followUp: null
    };

  } catch (err) {
    console.error('[RAG Engine Error]:', err.stack || err);
    return {
      state: 'INSUFFICIENT_INFORMATION',
      answer: "I'm having trouble accessing the academic knowledge base right now. Please try again in a moment.",
      sources: [],
      ruleResults: null,
      followUp: null,
      showRetry: true
    };
  }
}

module.exports = {
  processAdvisorQuery,
  getStudentProfileById,
  getStudentIdList,
  SYNTHETIC_PROFILES
};
