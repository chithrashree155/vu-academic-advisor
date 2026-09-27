/**
 * Advisory Decision Engine — VU Faculty Advisor Demo
 * Orchestrates Query Classification, Student Profile Context,
 * Deterministic Rule Evaluation, and RAG Evidence Retrieval.
 *
 * DATA TYPE: SYNTHETIC_PROFILES are demo data only.
 * Academic rules & course data are sourced from official VU documents only.
 */

'use strict';

const { retriever } = require('./rag/retriever.js');

// ============================================================
// SYNTHETIC DEMO STUDENT PROFILES
// data_type = "SYNTHETIC" — NOT real student data
// ============================================================
const SYNTHETIC_PROFILES = [
  // ── Student 01 ── B.Tech CSE – Data Science, Sem 5
  {
    id: 'VU-DEMO-001',
    data_type: 'SYNTHETIC',
    display_name: 'Student 01',
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
    notes: 'Has completed DATA301. Eligible for DATA302.'
  },

  // ── Student 02 ── B.Tech CSE – AI/ML, Sem 3
  {
    id: 'VU-DEMO-002',
    data_type: 'SYNTHETIC',
    display_name: 'Student 02',
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

  // ── Student 03 ── B.Tech CSE – Data Science, Sem 7
  {
    id: 'VU-DEMO-003',
    data_type: 'SYNTHETIC',
    display_name: 'Student 03',
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
    interests: ['Research', 'NLP', 'Generative AI'],
    notes: 'Senior student. Strong academic record.'
  },

  // ── Student 04 ── BMS – Digital Business, Sem 3
  {
    id: 'VU-DEMO-004',
    data_type: 'SYNTHETIC',
    display_name: 'Student 04',
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
    interests: ['Digital Marketing', 'Entrepreneurship'],
    notes: 'BMS student. Detailed curriculum not in source files.'
  },

  // ── Student 05 ── BMS – Digital Business, Sem 5
  {
    id: 'VU-DEMO-005',
    data_type: 'SYNTHETIC',
    display_name: 'Student 05',
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
    notes: 'Fees pending. BMS curriculum details not in source files.'
  },

  // ── Student 06 ── BMS with Research – Digital Business, Sem 7
  {
    id: 'VU-DEMO-006',
    data_type: 'SYNTHETIC',
    display_name: 'Student 06',
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
    interests: ['Research Methods', 'Strategy'],
    notes: 'Research track. Senior semester.'
  },

  // ── Student 07 ── BA – Psychology, Sem 3
  {
    id: 'VU-DEMO-007',
    data_type: 'SYNTHETIC',
    display_name: 'Student 07',
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
    interests: ['Counselling', 'Developmental Psychology'],
    notes: 'Psychology student. Detailed curriculum not in source files.'
  },

  // ── Student 08 ── BA – Psychology, Sem 5
  {
    id: 'VU-DEMO-008',
    data_type: 'SYNTHETIC',
    display_name: 'Student 08',
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
    interests: ['Clinical Psychology', 'Research'],
    notes: 'Mid-program Psychology student.'
  },

  // ── Student 09 ── BA – Economics, Sem 3
  {
    id: 'VU-DEMO-009',
    data_type: 'SYNTHETIC',
    display_name: 'Student 09',
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
    interests: ['Macroeconomics', 'Data Analysis'],
    notes: 'Economics student. Detailed curriculum not in source files.'
  },

  // ── Student 10 ── BA – Economics, Sem 5
  {
    id: 'VU-DEMO-010',
    data_type: 'SYNTHETIC',
    display_name: 'Student 10',
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
    interests: ['Econometrics', 'Public Policy'],
    notes: 'Mid-program Economics student.'
  },

  // ── Student 11 ── B.Des – Communication Design, Sem 3
  {
    id: 'VU-DEMO-011',
    data_type: 'SYNTHETIC',
    display_name: 'Student 11',
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
    interests: ['Visual Design', 'UI/UX'],
    notes: 'Design student. Curriculum details not in source files.'
  },

  // ── Student 12 ── BA LLB, Sem 5
  {
    id: 'VU-DEMO-012',
    data_type: 'SYNTHETIC',
    display_name: 'Student 12',
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
    interests: ['Constitutional Law', 'Human Rights'],
    notes: 'Law student. Curriculum details not in source files.'
  },

  // ── Student 13 ── BMS LLB, Sem 7
  {
    id: 'VU-DEMO-013',
    data_type: 'SYNTHETIC',
    display_name: 'Student 13',
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
    interests: ['Corporate Law', 'Business Regulation'],
    notes: 'Senior law-management student.'
  },

  // ── Student 14 ── BA Psychology with Research, Sem 7
  {
    id: 'VU-DEMO-014',
    data_type: 'SYNTHETIC',
    display_name: 'Student 14',
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
    interests: ['Research Methodology', 'Neuropsychology'],
    notes: 'Research track. Near graduation.'
  },

  // ── Student 15 ── BA Economics with Research, Sem 7
  {
    id: 'VU-DEMO-015',
    data_type: 'SYNTHETIC',
    display_name: 'Student 15',
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
    interests: ['Applied Economics', 'Research'],
    notes: 'Research track Economics. Senior semester.'
  },

  // ── Student 16 ── B.Tech CSE – AI/ML, Sem 5 (Low Attendance Scenario: 68.5%)
  {
    id: 'VU-DEMO-016',
    data_type: 'SYNTHETIC',
    display_name: 'Student 16',
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
    notes: 'Completed DATA301 prerequisite, but has low attendance (68.5%) requiring medical relaxation approval.'
  },

  // ── Student 17 ── B.Tech CSE – Data Science, Sem 5 (Fee Pending Block Scenario)
  {
    id: 'VU-DEMO-017',
    data_type: 'SYNTHETIC',
    display_name: 'Student 17',
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
    notes: 'Has pending fee dues. Course registration blocked until Digii ERP clearance.'
  },

  // ── Student 18 ── B.Des – Communication Design, Sem 5 (Minor & Summer Term Registration)
  {
    id: 'VU-DEMO-018',
    data_type: 'SYNTHETIC',
    display_name: 'Student 18',
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
    interests: ['Design Thinking', 'Communication Design', 'Minor Courses'],
    notes: 'B.Des student pursuing Design Minor and Summer Term registration.'
  }
];

// ============================================================
// Programs with detailed curriculum in source files
// ============================================================
const PROGRAMS_WITH_CURRICULUM = new Set(['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE']);

// ============================================================
// Out-of-scope guardrail
// ============================================================
const OUT_OF_SCOPE_TOPICS = [
  'weather', 'cricket', 'ipl', 'football', 'movie', 'actor', 'dating',
  'relationship', 'joke', 'best professor', 'favorite teacher', 'food',
  'mess food', 'canteen menu', 'party', 'politics', 'stock market',
  'cryptocurrency', 'gaming', 'social media followers'
];

// ============================================================
// Helper: short program context for non-B.Tech programs
// ============================================================
function noCurriculumResponse(programName) {
  return {
    state: 'INSUFFICIENT_INFORMATION',
    answer: `I can confirm that ${programName} is an official Vidyashilp University program.\n\nHowever, the detailed curriculum, prerequisites, and course structure for this program are not in the available academic source documents. I cannot provide specific course information.\n\nPlease contact your Faculty Advisor or the Registrar's Office for your program's course details.`,
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

// ============================================================
// Main Advisory Query Processor
// ============================================================
async function processAdvisorQuery(query, profileId = null) {
  try {
    const normalizedQuery = query.toLowerCase().trim();
    const profile = SYNTHETIC_PROFILES.find(p => p.id === profileId) || null;

    // ── 1. Out-of-Scope Guardrail ──
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

    // ── 2. Non-B.Tech programs: general academic rules still apply ──
    const profileHasNoCurriculum = profile && !PROGRAMS_WITH_CURRICULUM.has(profile.program);

    // ── 3. Medical Certificate / Exigency Query ──
    const isMedicalQ = normalizedQuery.includes('medical') || normalizedQuery.includes('sick leave') || normalizedQuery.includes('doctor certificate');
    if (isMedicalQ) {
      return {
        state: 'ANSWERABLE',
        answer: 'To submit a medical certificate / leave request:\n1. Submit the leave request together with medical documents (hospitalization, trauma, or contagious disease) to your Faculty Advisor for recommendation to the Program Chair.\n2. Submit signed medical applications and specified documents to the Office of the Registrar within 3 working days after rejoining.\n\nNote: Failing to submit within 3 working days will result in medical leave not being accepted. Approved medical leave can relax the attendance requirement down to a minimum of 65%.',
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

    // ── 4. Attendance Query ──
    const isAttendanceQ = normalizedQuery.includes('attendance') && (
      normalizedQuery.includes('minimum') ||
      normalizedQuery.includes('requirement') ||
      normalizedQuery.includes('shortage') ||
      normalizedQuery.includes('eligible') ||
      normalizedQuery.includes('how much') ||
      normalizedQuery.includes('percent') ||
      normalizedQuery.includes('compulsory')
    );

    if (isAttendanceQ) {
      const profileNote = profile
        ? `\n\nYour profile attendance: ${profile.attendance}% — ${profile.attendance >= 75 ? '✓ Above the 75% minimum.' : '⚠ Below the 75% minimum. You may be barred from end-semester exams.'}`
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

    // ── 5. Attendance general question ──
    if (normalizedQuery.includes('attendance') && !isAttendanceQ) {
      const profileNote = profile
        ? `\nYour current attendance: ${profile.attendance}%`
        : '';
      return {
        state: 'ANSWERABLE',
        answer: `You need at least 75% attendance in each registered course to be eligible for the end-semester exam.${profileNote}`,
        sources: [
          {
            documentTitle: '4. Student Handbook Aug 2026.pdf',
            hierarchyLevel: 1,
            pageOrSheet: 'Pages 21 & 29',
            clauseNumber: 'Section III, Clause 7.2',
            excerpt: 'To appear for end semester examination, the attendance requirement shall be a minimum of seventy five percent (75%) of the classes actually conducted in every Course.'
          }
        ],
        ruleResults: { standardThreshold: 75.0 },
        followUp: null
      };
    }

    // ── 6. Course Registration Rules ──
    if ((normalizedQuery.includes('course registration') || normalizedQuery.includes('how to register') || normalizedQuery.includes('register for courses')) &&
        (normalizedQuery.includes('rule') || normalizedQuery.includes('how') || normalizedQuery.includes('digii') || normalizedQuery.includes('process') || normalizedQuery.includes('step'))) {
      const feeNote = profile && !profile.feeCleared
        ? '\n\n⚠ Your profile shows pending fees. You must clear fees before you can register.'
        : '';
      return {
        state: 'ANSWERABLE',
        answer: `Course registration is done online via the Digii portal (CollPoll).\n\nKey rules & steps:\n1. Login to Digii portal (vidyashilp.digiicampus.com).\n2. Navigate to "Course Registration" menu.\n3. Add courses for the current semester and click "Complete Registration".\n4. Generate and print the Registration Card, obtain signatures from Faculty Advisor and Program Chair, and submit to Registrar.\n5. Students with pending fees or incomplete documentation cannot register.\n6. Maximum late registration: 1 calendar week (Dean approval required).${feeNote}`,
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

    // ── 7. Pending Fees / Registration with pending fees ──
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

    // ── 8. DATA302 Prerequisite ──
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

    // ── 9. Eligibility for DATA302 / Course ──
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
          answer: `I need your student profile to check eligibility for ${requestedCourse || 'this course'}.\n\nPlease select a demo student profile from the left sidebar first.`,
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
          followUp: 'Select a demo student profile from the sidebar to run the eligibility check.'
        };
      }

      // Profile selected but program has no curriculum data
      if (profileHasNoCurriculum && requestedCourse) {
        return {
          state: 'INSUFFICIENT_INFORMATION',
          answer: `I don't have verified prerequisite or curriculum data for ${profile.programName}.\n\nI cannot confirm eligibility for ${requestedCourse} without authoritative curriculum information.\n\nPlease check with your Faculty Advisor or the Registrar.`,
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

      // DATA302 eligibility with B.Tech profile
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

      // Generic eligibility — unknown course
      return {
        state: 'INSUFFICIENT_INFORMATION',
        answer: `I don't have verified prerequisite information for ${requestedCourse || 'this course'} in the available source documents.\n\nPlease check the official semester spread structure or contact your Faculty Advisor.`,
        sources: [],
        ruleResults: null,
        followUp: null
      };
    }

    // ── 10. Summer Term Courses ──
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

    // ── 11. Summer Term Registration Rules ──
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

    // ── 12. Psychology program specific query ──
    if (normalizedQuery.includes('psychology')) {
      return {
        state: 'INSUFFICIENT_INFORMATION',
        answer: 'I can confirm that BA (Hons.) – Psychology and BA (Hons. with Research) – Psychology are official Vidyashilp University programs.\n\nHowever, I don\'t have verified curriculum details, course prerequisites, or semester structures for Psychology in the available source documents.\n\nPlease check with your Faculty Advisor or the Registrar\'s Office for your program\'s course details.',
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

    // ── 13. Economics program specific query ──
    if (normalizedQuery.includes('economics')) {
      return {
        state: 'INSUFFICIENT_INFORMATION',
        answer: 'I can confirm that BA (Hons.) – Economics and BA (Hons. with Research) – Economics are official Vidyashilp University programs.\n\nI don\'t have verified curriculum details or prerequisites for Economics in the available source documents.\n\nPlease contact your Faculty Advisor or the Registrar\'s Office.',
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

    // ── 14. Minor Courses ──
    if (normalizedQuery.includes('minor')) {
      if (profile && !PROGRAMS_WITH_CURRICULUM.has(profile.program)) {
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

    // ── 15. Academic Calendar ──
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

    // ── 16. Program Information ──
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

    // ── 17. Ambiguous Queries ──
    if (normalizedQuery === 'courses' || normalizedQuery === 'tell me about courses' || normalizedQuery === 'course details') {
      return {
        state: 'NEEDS_CLARIFICATION',
        answer: 'Could you specify which course or program you would like to know about?\n\nExamples:\n• "What is the prerequisite for DATA302?"\n• "What courses are offered in Summer Term 2026?"\n• "What minor courses are available for B.Tech?"',
        sources: [],
        ruleResults: null,
        followUp: 'Select a demo student or refine your query.'
      };
    }

    // ── 18. Semantic RAG Fallback with Strict Threshold ──
    const retrievedEvidence = retriever.retrieve({
      query,
      batch: profile ? profile.batch : undefined,
      program: PROGRAMS_WITH_CURRICULUM.has(profile?.program) ? profile.program : undefined,
      topK: 4
    });

    if (retrievedEvidence.length > 0 && retrievedEvidence[0].rawScore >= 3.0) {
      const top = retrievedEvidence[0];
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

    // ── 19. LEVEL 4 Fallback: Out-of-Scope of Available University Data ──
    return {
      state: 'INSUFFICIENT_INFORMATION',
      answer: "I couldn't verify that from the available Vidyashilp University sources. Please check with the Faculty Advisor/Registrar for the official procedure.",
      sources: [],
      ruleResults: null,
      followUp: null
    };

  } catch (err) {
    console.error('Advisory Engine error:', err);
    // ── LEVEL 5 Fallback: Graceful Temporary System Failure ──
    return {
      state: 'INSUFFICIENT_INFORMATION',
      answer: `[SYSTEM_DIAGNOSTIC_ERROR]: ${err.message || String(err)}\nStack: ${err.stack || 'No stack'}`,
      sources: [],
      ruleResults: null,
      followUp: null,
      showRetry: true
    };
  }
}

module.exports = { processAdvisorQuery, SYNTHETIC_PROFILES };

