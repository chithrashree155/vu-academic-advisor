/**
 * Advisory Decision Engine — VU Faculty Advisor Demo
 * Orchestrates Query Classification, Student Profile Context,
 * Deterministic Rule Evaluation, and RAG Evidence Retrieval.
 *
 * DATA TYPE: SYNTHETIC_PROFILES are demo data only.
 * Academic rules & course data are sourced from official VU documents only.
 */

'use strict';

const { retriever } = require('./rag/retriever');

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

  // ── 3. Attendance Query ──
  const isAttendanceQ = normalizedQuery.includes('attendance') && (
    normalizedQuery.includes('minimum') ||
    normalizedQuery.includes('requirement') ||
    normalizedQuery.includes('shortage') ||
    normalizedQuery.includes('eligible') ||
    normalizedQuery.includes('how much') ||
    normalizedQuery.includes('percent')
  );

  if (isAttendanceQ) {
    const profileNote = profile
      ? `\nYour attendance: ${profile.attendance}% — ${profile.attendance >= 75 ? '✓ Above the 75% minimum.' : '⚠ Below the 75% minimum. You may be barred from end-semester exams.'}`
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

  // ── 4. Attendance general question ──
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

  // ── 5. Course Registration Rules ──
  if ((normalizedQuery.includes('course registration') || normalizedQuery.includes('how to register') || normalizedQuery.includes('register for courses')) &&
      (normalizedQuery.includes('rule') || normalizedQuery.includes('how') || normalizedQuery.includes('digii') || normalizedQuery.includes('process') || normalizedQuery.includes('step'))) {
    const feeNote = profile && !profile.feeCleared
      ? '\n\n⚠ Your profile shows pending fees. You must clear fees before you can register.'
      : '';
    return {
      state: 'ANSWERABLE',
      answer: `Course registration is done online via the Digii portal. Key rules:\n• Students with pending fees or incomplete documentation cannot register.\n• Late registration: max 1 calendar week, only for medical emergencies or official events (Dean approval required).\n• Add/Drop: within 2 weeks of class commencement, after mentor consultation.\n• Audit courses earn zero credits.${feeNote}`,
      sources: [
        {
          documentTitle: 'SOP STUDENT 19082025 - Final.pdf',
          hierarchyLevel: 5,
          pageOrSheet: 'Page 1',
          clauseNumber: 'Section 1 (Course Registration)',
          excerpt: 'Students with pending fees or incomplete documentation are not eligible for course registration. Maximum late registration shall not be more than one (01) calendar week.'
        },
        {
          documentTitle: '4. Student Handbook Aug 2026.pdf',
          hierarchyLevel: 1,
          pageOrSheet: 'Pages 15–18',
          clauseNumber: 'Section III, Clause 2 (Registration)',
          excerpt: 'Pre-registration for specialization and minor courses is mandatory. Minimum enrollment of 10 students is required to offer a minor course.'
        }
      ],
      ruleResults: { lateRegistrationLimitWeeks: 1, addDropWindowWeeks: 2, minMinorStudents: 10 },
      followUp: null
    };
  }

  // ── 6. Pending Fees / Registration with pending fees ──
  if (normalizedQuery.includes('pending fee') || (normalizedQuery.includes('register') && normalizedQuery.includes('fee'))) {
    const feeNote = profile
      ? `\nYour profile: Fees ${profile.feeCleared ? '✓ Cleared' : '⚠ Pending — you cannot register until fees are paid'}.`
      : '';
    return {
      state: 'ANSWERABLE',
      answer: `No. Students with pending fees are not eligible for course registration.${feeNote}`,
      sources: [
        {
          documentTitle: 'SOP STUDENT 19082025 - Final.pdf',
          hierarchyLevel: 5,
          pageOrSheet: 'Page 1',
          clauseNumber: 'Section 1 (Course Registration)',
          excerpt: 'Students with pending fees or incomplete documentation are not eligible for course registration.'
        }
      ],
      ruleResults: null,
      followUp: null
    };
  }

  // ── 7. DATA302 Prerequisite ──
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
      followUp: 'DATA301 must be satisfactorily completed before enrolling in DATA302.'
    };
  }

  // ── 8. Eligibility for DATA302 ──
  const isCanITakeCourse = normalizedQuery.includes('can i take') || normalizedQuery.includes('am i eligible for') || normalizedQuery.includes('can i register for') || normalizedQuery.includes('eligible to register');
  const courseMatch = query.match(/[A-Z]{3,4}\s?\d{3}/i);
  const requestedCourse = courseMatch ? courseMatch[0].replace(/\s+/, '').toUpperCase() : null;

  if (isCanITakeCourse) {
    if (!profile) {
      return {
        state: 'NEEDS_STUDENT_INFORMATION',
        answer: `I need your student profile to check eligibility for ${requestedCourse || 'this course'}.\n\nPlease select a demo student from the sidebar.`,
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
        const data301Grade = profile.completedCourses.find(c => c.courseCode === 'DATA301')?.grade || '–';
        return {
          state: 'ANSWERABLE',
          answer: `✓ Eligible. You have completed DATA301 (Machine Learning) with grade ${data301Grade}, satisfying the prerequisite for DATA302 (Deep Learning).\n\nYou can register during the open registration period via the Digii portal.`,
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
          answer: `✗ Not eligible. DATA302 (Deep Learning) requires DATA301 (Machine Learning) as a prerequisite, which is not in your completed courses.\n\nComplete DATA301 first before registering for DATA302.`,
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
          followUp: 'You must register for and pass DATA301 before enrolling in DATA302.'
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

  // ── 9. Summer Term Courses ──
  if (normalizedQuery.includes('summer term') && (normalizedQuery.includes('course') || normalizedQuery.includes('offered') || normalizedQuery.includes('offering'))) {
    const retrieved = retriever.retrieve({ query: 'Summer Term June 2026 Courses Offered', sourceType: 'COURSE_OFFERING', topK: 4 });
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
        }
      ],
      ruleResults: { term: 'Summer Term June 2026', totalCoursesOffered: 73 },
      followUp: null
    };
  }

  // ── 10. Summer Term Registration Rules ──
  if (normalizedQuery.includes('summer term') && (normalizedQuery.includes('registration') || normalizedQuery.includes('rule') || normalizedQuery.includes('policy'))) {
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

  // ── 11. What info do you need / eligibility info ──
  if (normalizedQuery.includes('what information do you need') || normalizedQuery.includes('how do you determine eligibility')) {
    return {
      state: 'ANSWERABLE',
      answer: 'To check your course eligibility I need:\n• Your academic program (e.g. B.Tech Data Science)\n• Your batch year\n• Your current semester\n• Completed courses (to verify prerequisites)',
      sources: [
        {
          documentTitle: '4. Student Handbook Aug 2026.pdf',
          hierarchyLevel: 1,
          pageOrSheet: 'Page 20',
          clauseNumber: 'Clause 2.14',
          excerpt: 'Course Pre-Requisites: For a student to register for some Courses, it may be required either to have exposure in, or to have completed satisfactorily, or to have prior earned credits in some specified Courses.'
        }
      ],
      ruleResults: null,
      followUp: profile ? `Currently using profile: ${profile.display_name} (${profile.programName})` : 'Select a demo student from the sidebar to test personalised eligibility checks.'
    };
  }

  // ── 12. Minor Courses ──
  if (normalizedQuery.includes('minor') && (normalizedQuery.includes('course') || normalizedQuery.includes('credits') || normalizedQuery.includes('eligib'))) {
    if (profile && !PROGRAMS_WITH_CURRICULUM.has(profile.program)) {
      return noCurriculumResponse(profile.programName);
    }
    const retrieved = retriever.retrieve({ query: 'minor courses BTech credits basket', topK: 4 });
    if (retrieved.length > 0) {
      const top = retrieved[0];
      return {
        state: 'ANSWERABLE',
        answer: `Based on the official minor course document: ${top.chunkText.slice(0, 400)}`,
        sources: retrieved.slice(0, 3).map(r => ({
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
    return {
      state: 'ANSWERABLE',
      answer: 'Minor courses are available to B.Tech students. A minimum of 10 students must enrol for a minor course to be offered. Pre-registration is mandatory.\n\nFor the complete minor basket and credit requirements, refer to the Minor Courses document or contact your Faculty Advisor.',
      sources: [
        {
          documentTitle: '118351_Minor Courses for BTech_Students.xlsx',
          hierarchyLevel: 3,
          pageOrSheet: 'Minor Course Baskets',
          clauseNumber: 'Minor Electives',
          excerpt: 'Minor courses available to B.Tech students with basket selection and credit requirements.'
        },
        {
          documentTitle: '4. Student Handbook Aug 2026.pdf',
          hierarchyLevel: 1,
          pageOrSheet: 'Pages 15–18',
          clauseNumber: 'Clause 2 (Registration)',
          excerpt: 'Minimum enrollment of 10 students is required to offer a minor course.'
        }
      ],
      ruleResults: null,
      followUp: null
    };
  }

  // ── 13. Academic Calendar ──
  if (normalizedQuery.includes('academic calendar') || (normalizedQuery.includes('calendar') && (normalizedQuery.includes('semester') || normalizedQuery.includes('date') || normalizedQuery.includes('schedule')))) {
    const retrieved = retriever.retrieve({ query: 'academic calendar semester dates schedule', topK: 4 });
    if (retrieved.length > 0) {
      return {
        state: 'ANSWERABLE',
        answer: `From the official academic calendar: ${retrieved[0].chunkText.slice(0, 400)}`,
        sources: retrieved.slice(0, 3).map(r => ({
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
    return {
      state: 'ANSWERABLE',
      answer: 'The Academic Calendar documents for the Even Semester 2025–26 and Odd Semester 2026–27 are available in the university records. Please refer to the Digii portal or the official calendar documents for specific dates.',
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

  // ── 14. Program Information ──
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

  // ── 15. Psychology program specific query ──
  if (normalizedQuery.includes('psychology') && (normalizedQuery.includes('course') || normalizedQuery.includes('curriculum') || normalizedQuery.includes('prerequisite') || normalizedQuery.includes('subject'))) {
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

  // ── 16. Economics program specific query ──
  if (normalizedQuery.includes('economics') && (normalizedQuery.includes('course') || normalizedQuery.includes('curriculum') || normalizedQuery.includes('prerequisite') || normalizedQuery.includes('subject'))) {
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

  // ── 17. BMS program specific query ──
  if ((normalizedQuery.includes('bms') || normalizedQuery.includes('business management')) &&
      (normalizedQuery.includes('course') || normalizedQuery.includes('curriculum') || normalizedQuery.includes('prerequisite'))) {
    return {
      state: 'INSUFFICIENT_INFORMATION',
      answer: 'BMS (Hons.) – Digital Business and BMS (Hons. with Research) – Digital Business are official Vidyashilp University programs.\n\nThe detailed BMS curriculum is not in the available academic source documents. I cannot confirm course-specific information.\n\nPlease contact your Faculty Advisor or the Registrar.',
      sources: [
        {
          documentTitle: 'Vidyashilp University Official Website',
          hierarchyLevel: 6,
          pageOrSheet: 'Programs Offered',
          clauseNumber: 'UG Programs — Management',
          excerpt: 'BMS (Hons.) – Digital Business is offered at Vidyashilp University.'
        }
      ],
      ruleResults: null,
      followUp: null
    };
  }

  // ── 18. Design program specific query ──
  if ((normalizedQuery.includes('design') || normalizedQuery.includes('bdes') || normalizedQuery.includes('b.des')) &&
      (normalizedQuery.includes('course') || normalizedQuery.includes('curriculum') || normalizedQuery.includes('prerequisite'))) {
    return {
      state: 'INSUFFICIENT_INFORMATION',
      answer: 'B.Des – Communication Design is an official Vidyashilp University program.\n\nI don\'t have verified curriculum or course details for B.Des in the available source documents.\n\nPlease contact your Faculty Advisor or the Registrar\'s Office.',
      sources: [
        {
          documentTitle: 'Vidyashilp University Official Website',
          hierarchyLevel: 6,
          pageOrSheet: 'Programs Offered',
          clauseNumber: 'UG Programs — Design',
          excerpt: 'B.Des – Communication Design is offered at Vidyashilp University.'
        }
      ],
      ruleResults: null,
      followUp: null
    };
  }

  // ── 19. Law program specific query ──
  if ((normalizedQuery.includes('llb') || normalizedQuery.includes('law')) &&
      (normalizedQuery.includes('course') || normalizedQuery.includes('curriculum') || normalizedQuery.includes('prerequisite') || normalizedQuery.includes('subject'))) {
    return {
      state: 'INSUFFICIENT_INFORMATION',
      answer: 'BA, LLB (Hons.) and BMS, LLB (Hons.) are official Vidyashilp University programs.\n\nI don\'t have verified curriculum or course details for the Law programs in the available source documents.\n\nPlease contact your Faculty Advisor or the Registrar\'s Office.',
      sources: [
        {
          documentTitle: 'Vidyashilp University Official Website',
          hierarchyLevel: 6,
          pageOrSheet: 'Programs Offered',
          clauseNumber: 'UG Programs — Law',
          excerpt: 'BA, LLB (Hons.) and BMS, LLB (Hons.) are offered at Vidyashilp University.'
        }
      ],
      ruleResults: null,
      followUp: null
    };
  }

  // ── 20. Progression / CGPA / Backlog ──
  if (normalizedQuery.includes('progression') || normalizedQuery.includes('backlog') || normalizedQuery.includes('cgpa requirement') || normalizedQuery.includes('detained')) {
    const retrieved = retriever.retrieve({ query: 'academic progression CGPA backlog detained semester', topK: 4 });
    if (retrieved.length > 0) {
      return {
        state: 'ANSWERABLE',
        answer: `From official university records: ${retrieved[0].chunkText.slice(0, 400)}`,
        sources: retrieved.slice(0, 3).map(r => ({
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

  // ── 21. Semantic RAG Fallback ──
  const retrievedEvidence = retriever.retrieve({
    query,
    batch: profile ? profile.batch : undefined,
    program: PROGRAMS_WITH_CURRICULUM.has(profile?.program) ? profile.program : undefined,
    topK: 4
  });

  if (retrievedEvidence.length > 0) {
    const top = retrievedEvidence[0];
    return {
      state: 'ANSWERABLE',
      answer: top.chunkText.slice(0, 500) + (top.chunkText.length > 500 ? '...' : ''),
      sources: retrievedEvidence.map(r => ({
        documentTitle: r.documentName,
        hierarchyLevel: r.hierarchyLevel,
        pageOrSheet: r.pageOrSheet ? `Ref: ${r.pageOrSheet}` : 'Official Record',
        clauseNumber: r.clauseNumber || 'N/A',
        excerpt: r.chunkText.slice(0, 220) + '...'
      })),
      ruleResults: null,
      followUp: null
    };
  }

  // ── 22. Insufficient Information Fallback ──
  return {
    state: 'INSUFFICIENT_INFORMATION',
    answer: 'I don\'t have enough verified information in the available university documents to answer this accurately.\n\nPlease consult the Registrar\'s Office or your Faculty Advisor.',
    sources: [],
    ruleResults: null,
    followUp: null
  };
}

module.exports = { processAdvisorQuery, SYNTHETIC_PROFILES };
