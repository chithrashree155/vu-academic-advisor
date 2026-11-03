/**
 * Official Vidyashilp University B.Tech Minor Courses Dataset & Advisory Module
 * Source: Minor_Courses_for_BTech_Students.xlsx / Gai stuff but for minors.pdf
 * 
 * Strict Ground Truth Rules:
 * - 7 Minors: Law, Design, Psychology, Economics, Finance, Marketing, Start-up
 * - 5 Batches: 2022, 2023, 2024, 2025, 2026
 * - Every minor adds up to exactly 24 credits per batch (counting TBD/TBA/Don't Know placeholder rows)
 * - Preserve university data anomalies without silently modifying them (state that university confirmation is required)
 */

const MINOR_KEYS = {
  LAW: 'Law',
  DESIGN: 'Design',
  PSYCHOLOGY: 'Psychology',
  ECONOMICS: 'Economics',
  FINANCE: 'Finance',
  MARKETING: 'Marketing',
  STARTUP: 'Start-up'
};

const MINORS_INFO = {
  Law: {
    name: 'Law Minor',
    code: 'MINOR_LAW',
    school: 'School of Law',
    sheetName: 'Law Minor',
    batches: {
      '2022': {
        status: 'NOT_OFFERED',
        reason: 'In the official university minor courses workbook (Minor_Courses_for_BTech_Students.xlsx / Gai stuff but for minors.pdf), there is no curriculum block or sheet allocation for the 2022 batch under the Law minor. The Law minor is therefore not offered to the 2022 batch.',
        decidedCredits: 0,
        undecidedCredits: 24,
        courses: []
      },
      '2023': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 19,
        undecidedCredits: 5,
        undecidedLabel: "Don't Know",
        courses: [
          { semester: 5, code: 'LAWM305', title: 'Regulating platform and Gig workers', l: 3, t: 0, p: 2, ltp: '3-0-2', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 6, code: 'LAWE200', title: 'Moral Philosophy and Justice', l: 2, t: 0, p: 0, ltp: '2-0-0', credits: 2, prerequisites: 'NIL', prereqNames: [] },
          { semester: 6, code: 'LAWC410', title: 'Introduction to Alternative Dispute Resolution Methods', l: 2, t: 0, p: 2, ltp: '2-0-2', credits: 3, prerequisites: 'NIL', prereqNames: [] },
          { semester: 6, code: 'LAWB210', title: 'Criminology and Victimology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 7, code: 'LAWM306', title: 'Law Relating to start-ups', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 7, code: 'LAWE301', title: 'Intellectual Property Rights', l: 2, t: 0, p: 0, ltp: '2-0-0', credits: 2, prerequisites: 'NIL', prereqNames: [] }
        ],
        slotMismatch: 'In the B.Tech DS plan for 2023, slot credits are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. The Law minor lists S3: 0 vs 4; S4: 0 vs 4; S6: 9 vs 8; S7: 6 vs 4 (plus 5 credits still undecided).'
      },
      '2024': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 14,
        undecidedCredits: 10,
        undecidedLabel: 'TBA',
        courses: [
          { semester: 3, code: 'LAWP100', title: 'Political Science I', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'NIL', prereqNames: [] },
          { semester: 3, code: 'LAWS301', title: 'Legal Methods', l: 2, t: 0, p: 2, ltp: '2-0-2', credits: 3, prerequisites: 'NIL', prereqNames: [] },
          { semester: 4, code: 'LAWM301', title: 'Constitution for Citizens', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 5, code: 'LAWM302', title: 'Basics of International Law', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'NIL', prereqNames: [] }
        ],
        slotMismatch: 'In the B.Tech DS plan for 2024, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. The Law minor lists S3: 6 vs 4; S6: 0 vs 8; S7: 0 vs 4 (plus 10 credits still TBA).'
      },
      '2025': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 7,
        undecidedCredits: 17,
        undecidedLabel: 'TBA',
        courses: [
          { semester: 2, code: 'LAWP101', title: 'Introduction to Political science', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 3, code: 'LAWS301', title: 'Legal Methods', l: 2, t: 0, p: 2, ltp: '2-0-2', credits: 3, prerequisites: 'NIL', prereqNames: [] }
        ],
        slotMismatch: 'In the B.Tech DS plan for 2025, slots are S3: 4, S4: 4, S5: 8, S6: 4, S7: 4. The Law minor lists S2: 4 vs 0; S3: 3 vs 4; S4: 0 vs 4; S5: 0 vs 8; S6: 0 vs 4; S7: 0 vs 4 (plus 17 credits still TBA).'
      },
      '2026': {
        status: 'NOT_DECIDED',
        decidedCredits: 0,
        undecidedCredits: 24,
        undecidedLabel: 'TBA',
        courses: [],
        notes: 'For the 2026 batch, all 24 credits in the Law minor are still undecided / TBA (no courses have been finalized yet in the university records).'
      }
    }
  },
  Design: {
    name: 'Design Minor',
    code: 'MINOR_DESIGN',
    school: 'School of Design',
    sheetName: 'Design Minor',
    batches: {
      '2022': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 20,
        undecidedCredits: 4,
        undecidedLabel: "DON'T KNOW",
        courses: [
          { semester: 3, code: 'CDES105', title: 'Appreciating and Deconstructing Art and Media', l: 3, t: 0, p: 0, ltp: '3-0-0', credits: 3, prerequisites: 'NIL', prereqNames: [] },
          { semester: 5, code: 'CDES203', title: 'Motion Graphic Design', l: 1, t: 0, p: 2, ltp: '1-0-2', credits: 2, prerequisites: 'NIL', prereqNames: [] },
          { semester: 5, code: 'CDES504', title: 'Environment Design and Communication', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'NIL', prereqNames: [] },
          { semester: 6, code: 'CDES704', title: 'Integrative Studio VI- Exhibition/Museum', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 6, code: 'CDES402', title: 'Interaction Design- UI UX', l: 1, t: 3, p: 0, ltp: '1-3-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 7, code: 'CDES216', title: 'Drawing and Moving Images', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'NIL', prereqNames: [] },
          { semester: 7, code: 'CDES712', title: 'Designing Futures', l: 1, t: 2, p: 0, ltp: '1-2-0', credits: 3, prerequisites: '(CDES402-Interaction Design- UI UX), (CDES504- Environment Design and Communication)', prereqNames: ['CDES402 Interaction Design- UI UX (this minor, S6)', 'CDES504 Environment Design and Communication (this minor, S5)'] }
        ],
        prerequisiteIssues: ['CDES712 Designing Futures (S7, 3 credits) requires CDES402 (taken in S6) AND CDES504 (taken in S5). Notice also that "Designing Futures" appears with code CDES712 (3 credits) for Batch 2022, but with code CDES312 (5 credits, L-T-P 2-2-2) for Batch 2023.'],
        slotMismatch: 'In the B.Tech DS plan for 2022, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. Design 2022 lists S3: 3 vs 4; S4: 0 vs 4; S7: 5 vs 4 (plus 4 credits still undecided).'
      },
      '2023': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'CDES105', title: 'Appreciating and Deconstructing Art and Media', l: 3, t: 0, p: 0, ltp: '3-0-0', credits: 3, prerequisites: 'NIL', prereqNames: [] },
          { semester: 4, code: 'CDES702', title: 'Integrative Studio II- Sensemaking, Visualization', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 5, code: 'CDES221', title: 'Information Architecture and Design', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 6, code: 'CDES219', title: 'Elements of Sound', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 6, code: 'CDES301', title: 'Sketch to Story', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 7, code: 'CDES312', title: 'Designing Futures', l: 2, t: 2, p: 2, ltp: '2-2-2', credits: 5, prerequisites: 'NIL', prereqNames: [] }
        ],
        slotMismatch: 'In the B.Tech DS plan for 2023, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. Design 2023 lists S3: 3 vs 4; S7: 5 vs 4.'
      },
      '2024': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 16,
        undecidedCredits: 8,
        undecidedLabel: 'TBD',
        courses: [
          { semester: 3, code: 'CDES217', title: 'Making with Reframed Media', l: 2, t: 3, p: 0, ltp: '2-3-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 4, code: 'CDES218', title: 'Frames and Frequencies', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 5, code: 'CDES221', title: 'Information Architecture and Design', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] },
          { semester: 5, code: 'CDES227', title: 'Drawing and Moving Image', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] }
        ],
        creditDiscrepancy: 'In Design minor 2024 batch, CDES217 (Making with Reframed Media, S3) has L-T-P 2-3-0 which under standard formula would calculate to 5 credits (2+3+0), but the workbook explicitly records 4 credits. Note that in Batch 2025, the same course is recorded with L-T-P 2-2-0 = 4 credits. University confirmation is required.',
        slotMismatch: 'In the B.Tech DS plan for 2024, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. Design 2024 lists S5: 8 vs 4; S6: 0 vs 8; S7: 0 vs 4 (plus 8 credits still TBD).'
      },
      '2025': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 4,
        undecidedCredits: 20,
        undecidedLabel: 'TBD',
        courses: [
          { semester: 3, code: 'CDES217', title: 'Making with Reframed Media', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'NIL', prereqNames: [] }
        ],
        slotMismatch: 'In the B.Tech DS plan for 2025, slots are S3: 4, S4: 4, S5: 8, S6: 4, S7: 4. Design 2025 lists S4: 0 vs 4; S5: 0 vs 8; S6: 0 vs 4; S7: 0 vs 4 (plus 20 credits still TBD).'
      },
      '2026': {
        status: 'NOT_DECIDED',
        decidedCredits: 0,
        undecidedCredits: 24,
        undecidedLabel: 'TBD',
        courses: [],
        notes: 'For the 2026 batch, all 24 credits in the Design minor are still undecided / TBD.'
      }
    }
  },
  Psychology: {
    name: 'Psychology Minor',
    code: 'MINOR_PSYCHOLOGY',
    school: 'School of Liberal Arts & Sciences',
    sheetName: 'Psychology',
    batches: {
      '2022': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'PSYC201', title: 'Biological Psychology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'PSYC202', title: 'Cognitive Psychology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 Introduction to Psychology (B.Tech DS plan, S1)'] },
          { semester: 5, code: 'PSYC255', title: 'Psychopathology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 6, code: 'PSYC241', title: 'Social Psychology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 Introduction to Psychology (B.Tech DS plan, S1)'] },
          { semester: 6, code: 'PSYC204', title: 'Developmental Psychology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 Introduction to Psychology (B.Tech DS plan, S1)'] },
          { semester: 7, code: 'PSYC303', title: 'Psychological Testing and Measurement', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'PSYC101, PSYC202, MATH131', prereqNames: ['PSYC101 Introduction to Psychology', 'PSYC202 Cognitive Psychology', 'MATH131 (Note: MATH131 does not exist anywhere in either university workbook; requires confirmation)'] }
        ],
        prerequisiteIssues: ['PSYC303 (S7) lists MATH131 as a prerequisite, but MATH131 does not exist anywhere in either university curriculum workbook. Please confirm with the university.']
      },
      '2023': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'PSYC201', title: 'Biological Psychology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'PSYC202', title: 'Cognitive Psychology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 Introduction to Psychology (B.Tech DS plan, S1)'] },
          { semester: 5, code: 'PSYC104', title: 'Lifespan Development I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 Introduction to Psychology (B.Tech DS plan, S1)'] },
          { semester: 6, code: 'PSYC241', title: 'Social Psychology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 Introduction to Psychology (B.Tech DS plan, S1)'] },
          { semester: 6, code: 'PSYC306', title: 'Health Psychology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'PSYC101, PSYC201', prereqNames: ['PSYC101 Introduction to Psychology (B.Tech DS plan, S1)', 'PSYC201 Biological Psychology (this minor, S3)'] },
          { semester: 7, code: 'PSYC255', title: 'Psychopathology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] }
        ]
      },
      '2024': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'PSYC201/PSYC103', title: 'Biological Psychology OR Foundations of Psychology I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: ['Student picks ONE in S3: PSYC201 Biological Psychology OR PSYC103 Foundations of Psychology I'] },
          { semester: 4, code: 'PSYC202', title: 'Cognitive Psychology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 Introduction to Psychology (B.Tech DS plan, S1)'] },
          { semester: 5, code: 'PSYC241', title: 'Social Psychology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 Introduction to Psychology (B.Tech DS plan, S1)'] },
          { semester: 6, code: 'PSYC306', title: 'Health Psychology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'PSYC101, PSYC201', prereqNames: ['PSYC101 Introduction to Psychology', 'PSYC201 Biological Psychology'] },
          { semester: 6, code: 'PSYC104', title: 'Lifespan Development I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 7, code: 'PSYC255', title: 'Psychopathology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] }
        ],
        prerequisiteIssues: ['In S3 the student picks PSYC201 Biological Psychology OR PSYC103 Foundations of Psychology I. PSYC306 Health Psychology (S6) explicitly requires PSYC201; a student who chose PSYC103 may not satisfy that prerequisite. Confirmation with the university is recommended.']
      },
      '2025': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'PSYC201/PSYC103', title: 'Biological Psychology OR Foundations of Psychology I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: ['Student picks ONE in S3'] },
          { semester: 4, code: 'PSYC202', title: 'Cognitive Psychology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 (Discrepancy: PSYC101 is NOT offered to the 2025 batch; 2025 batch has PSYC102)'] },
          { semester: 5, code: 'PSYC241', title: 'Social Psychology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 (Discrepancy: PSYC101 is NOT offered to the 2025 batch)'] },
          { semester: 6, code: 'PSYC306', title: 'Health Psychology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'PSYC101, PSYC201', prereqNames: ['PSYC101 (not offered to 2025 batch)', 'PSYC201 (requires student to have chosen PSYC201 in S3)'] },
          { semester: 6, code: 'PSYC104', title: 'Lifespan Development I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 7, code: 'PSYC255', title: 'Psychopathology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] }
        ],
        prerequisiteIssues: [
          'According to the supplied minor-course document, PSYC202, PSYC241, and PSYC306 list PSYC101 as a prerequisite, but PSYC101 (Introduction to Psychology) is not offered to the 2025 batch (the 2025 B.Tech DS plan offers PSYC102 instead). Please confirm with the university.',
          'In S3, students choose between PSYC201 and PSYC103. PSYC306 in S6 requires PSYC201; a student picking PSYC103 might not meet the requirement without university waiver.'
        ],
        slotMismatch: 'In the B.Tech DS plan for 2025, slots are S3: 4, S4: 4, S5: 8, S6: 4, S7: 4. Psychology 2025 places S5: 4 vs 8 and S6: 8 vs 4.'
      },
      '2026': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'PSYC201/PSYC103', title: 'Biological Psychology OR Foundations of Psychology I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: ['Student picks ONE in S3'] },
          { semester: 4, code: 'PSYC202', title: 'Cognitive Psychology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 (Discrepancy: PSYC101 is NOT offered to the 2026 batch; 2026 batch has PSYC105)'] },
          { semester: 5, code: 'PSYC241', title: 'Social Psychology', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'PSYC101', prereqNames: ['PSYC101 (Discrepancy: PSYC101 is NOT offered to the 2026 batch)'] },
          { semester: 6, code: 'PSYC306', title: 'Health Psychology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'PSYC101, PSYC201', prereqNames: ['PSYC101 (not offered to 2026 batch)', 'PSYC201 (requires student to have chosen PSYC201 in S3)'] },
          { semester: 6, code: 'PSYC104', title: 'Lifespan Development I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 7, code: 'PSYC255', title: 'Psychopathology', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] }
        ],
        prerequisiteIssues: [
          'According to the supplied minor-course document, PSYC101 is listed as a prerequisite for PSYC202, PSYC241, and PSYC306, but PSYC101 is not offered to the 2026 batch (Batch 2026 has PSYC105 in S1). Please confirm with the university.'
        ],
        slotMismatch: 'In the B.Tech DS plan for 2026, minor slots are S3: 4, S4: 4, S5: 8, S6: 8, S7: 0. Psychology 2026 places S5: 4 vs 8 and S7: 4 vs 0.'
      }
    }
  },
  Economics: {
    name: 'Economics Minor',
    code: 'MINOR_ECONOMICS',
    school: 'School of Liberal Arts & Sciences',
    sheetName: 'Economics',
    batches: {
      '2022': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'ECON201', title: 'Microeconomics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'ECON220', title: 'Behavourial Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 5, code: 'ECON207', title: 'Macroeconomics and Applicants to Indian Economy', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 6, code: 'ECON413', title: 'Industrial Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201, ECON202/ECON207', prereqNames: ['ECON201', 'ECON202 OR ECON207 (Note: ECON202 does not exist anywhere in either workbook)'] },
          { semester: 6, code: 'ECON325', title: 'Public Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201, ECON202/ECON207', prereqNames: ['ECON201', 'ECON202 OR ECON207 (Note: ECON202 does not exist anywhere in either workbook)'] },
          { semester: 7, code: 'ECON316', title: 'Digital Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201', prereqNames: ['ECON201'] }
        ],
        prerequisiteIssues: ['ECON413 and ECON325 list "ECON201, ECON202/ECON207" as prerequisite. ECON202 does not exist anywhere in either university workbook. Students fulfill the either/or branch using ECON207.']
      },
      '2023': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'ECON201', title: 'Microeconomics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'ECON209', title: 'Macroeconomics I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 5, code: 'ECON316', title: 'Digital Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201', prereqNames: ['ECON201 Microeconomics'] },
          { semester: 6, code: 'ECON315', title: 'Indian Economy', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201, ECON209', prereqNames: ['ECON201 Microeconomics', 'ECON209 Macroeconomics I'] },
          { semester: 6, code: 'ECON322', title: 'Economics of Health and Education', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201', prereqNames: ['ECON201 Microeconomics'] },
          { semester: 7, code: 'ECON301', title: 'International Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201, ECON202', prereqNames: ['ECON201 Microeconomics', 'ECON202 (Discrepancy: ECON202 does not exist anywhere in either workbook; requires confirmation)'] }
        ],
        prerequisiteIssues: ['ECON301 (S7) lists ECON202 as a prerequisite, but ECON202 does not exist anywhere in either curriculum workbook. Please confirm with the university.']
      },
      '2024': {
        status: 'NOT_RUNNING',
        reason: 'In the official university minor courses workbook (Minor_Courses_for_BTech_Students.xlsx / Gai stuff but for minors.pdf), the Economics minor for the 2024 batch is explicitly marked as "NOT RUNNING — No Students" because no students chose it. Therefore, no courses are scheduled or running for the 2024 batch.',
        decidedCredits: 0,
        undecidedCredits: 24,
        courses: []
      },
      '2025': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'ECON208', title: 'Microeconomics I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'ECON209', title: 'Macroeconomics I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 5, code: 'ECON316', title: 'Digital Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201', prereqNames: ['ECON201 (Discrepancy: ECON201 is NOT offered to 2025 batch; batch has ECON208 instead)'] },
          { semester: 6, code: 'ECON315', title: 'Indian Economy', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201, ECON209', prereqNames: ['ECON201 (not offered to 2025 batch)', 'ECON209 Macroeconomics I'] },
          { semester: 6, code: 'ECON346', title: 'Financial Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON208, ECON209', prereqNames: ['ECON208 Microeconomics I', 'ECON209 Macroeconomics I'] },
          { semester: 7, code: 'ECON301', title: 'International Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201, ECON202', prereqNames: ['ECON201 (not offered to 2025 batch)', 'ECON202 (does not exist in either workbook)'] }
        ],
        prerequisiteIssues: [
          'According to the supplied minor-course document, ECON316, ECON315, and ECON301 list ECON201 as prerequisite, but ECON201 is not offered to the 2025 batch (the 2025 batch has ECON208 Microeconomics I instead).',
          'ECON301 lists ECON202 which does not exist anywhere in either university workbook. University confirmation is required.'
        ],
        slotMismatch: 'In the B.Tech DS plan for 2025, slots are S3: 4, S4: 4, S5: 8, S6: 4, S7: 4. Economics 2025 places S5: 4 vs 8 and S6: 8 vs 4.'
      },
      '2026': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'ECON208', title: 'Microeconomics I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'ECON209', title: 'Macroeconomics I', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 5, code: 'ECON316', title: 'Digital Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201', prereqNames: ['ECON201 (Discrepancy: ECON201 is NOT offered to 2026 batch; batch has ECON208 instead)'] },
          { semester: 6, code: 'ECON315', title: 'Indian Economy', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201, ECON209', prereqNames: ['ECON201 (not offered to 2026 batch)', 'ECON209 Macroeconomics I'] },
          { semester: 6, code: 'ECON346', title: 'Financial Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON208, ECON209', prereqNames: ['ECON208 Microeconomics I', 'ECON209 Macroeconomics I'] },
          { semester: 7, code: 'ECON301', title: 'International Economics', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'ECON201, ECON202', prereqNames: ['ECON201 (not offered to 2026 batch)', 'ECON202 (does not exist in either workbook)'] }
        ],
        prerequisiteIssues: [
          'According to the supplied minor-course document, ECON301, ECON315, and ECON316 list ECON201 as prerequisite, but ECON201 is not offered to the 2026 batch (Batch 2026 takes ECON208 Microeconomics I instead).',
          'ECON301 lists ECON202 as prerequisite, which does not exist anywhere in either university workbook. University confirmation is required.'
        ],
        slotMismatch: 'In the B.Tech DS plan for 2026, minor slots are S3: 4, S4: 4, S5: 8, S6: 8, S7: 0. Economics 2026 places S5: 4 vs 8 and S7: 4 vs 0.'
      }
    }
  },
  Finance: {
    name: 'Finance Minor',
    code: 'MINOR_FINANCE',
    school: 'School of Business Studies',
    sheetName: 'Finance',
    batches: {
      '2022': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'FAMA (code unassigned)', title: 'Financial and Management Accounting (FAMA)', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'FINA333', title: 'Fiancial Institutions Markets and Services', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MGMT208', prereqNames: ['Introduction to Financial Accounting (Note: MGMT208 is not offered to 2022 batch; likely refers to S3 FAMA course)'] },
          { semester: 5, code: 'MGMT207', title: 'Corporate Finance', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'FAMA', prereqNames: ['Financial and management accounting'] },
          { semester: 6, code: 'MGMT209', title: 'Financial Statement Anaylsis', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'FINA201', prereqNames: ['Introduction to Financial Accounting (Note: FINA201 does not exist in either workbook; likely means S3 FAMA course)'] },
          { semester: 6, code: 'MGMT210', title: 'Basics of Investment Management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'FINA333', prereqNames: ['Financial Instituation, Markets and Services'] },
          { semester: 7, code: 'MGMT213', title: 'Introduction To Fintech', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'FINA333', prereqNames: ['Financial Instituation, Markets and Services'] },
          { semester: 7, code: 'MGMT323', title: 'Basics of Startup Finance', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'MGMT207', prereqNames: ['Corporate Finance'] },
          { semester: 7, code: 'MGMT203', title: 'Business Strategy Simulation', l: 0, t: 0, p: 0, ltp: '0-0-0', credits: 2, prerequisites: 'MKMT201/ MGMT207/ FINA201', prereqNames: ['Marketing Management OR Corporate Finance OR Financial and Management Accounting (any ONE)'] }
        ],
        prerequisiteIssues: [
          'FINA333 lists MGMT208 as prerequisite, but MGMT208 is not offered to 2022 batch (likely refers to S3 course FAMA).',
          'MGMT209 lists FINA201 which does not exist anywhere in either workbook.',
          'MGMT203 lists MKMT201 (a typo for MKTG201) and FINA201 (unknown code).'
        ],
        creditDiscrepancy: 'MGMT203 Business Strategy Simulation has L-T-P 0-0-0 with 2 credits (project/simulation course with no regular classroom lecture hours).',
        slotMismatch: 'In B.Tech DS 2022, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. Finance 2022 lists S3: 3 vs 4; S4: 3 vs 4; S5: 3 vs 4; S6: 7 vs 8; S7: 8 vs 4.'
      },
      '2023': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'MGMT208', title: 'Introduction to Financial Accounting', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'None', prereqNames: [] },
          { semester: 4, code: 'FINA333', title: 'Fiancial Institutions Markets and Services', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MGMT208', prereqNames: ['Introduction to Financial Accounting'] },
          { semester: 5, code: 'MGMT207', title: 'Corporate Finance', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MGMT208', prereqNames: ['Introduction to Financial Accounting'] },
          { semester: 6, code: 'MGMT209', title: 'Financial Statement Anaylsis', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'MGMT208', prereqNames: ['Introduction to Financial Accounting'] },
          { semester: 6, code: 'MGMT210', title: 'Basics of Investment Management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'FINA333', prereqNames: ['Financial Institutions Markets and Services'] },
          { semester: 6, code: 'MGMT323', title: 'Basics of Startup Finance', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MGMT207', prereqNames: ['Corporate Finance'] },
          { semester: 7, code: 'MGMT213', title: 'Introduction To Fintech', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'Nil', prereqNames: [] },
          { semester: 7, code: 'MGMT307', title: 'Strategy & Decision Making', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'Nil', prereqNames: [] }
        ],
        slotMismatch: 'In B.Tech DS 2023, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. Finance 2023 lists S3: 3 vs 4; S4: 3 vs 4; S5: 3 vs 4; S6: 11 vs 8; S7: 4 vs 4.'
      },
      '2024': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'MGMT208', title: 'Introduction to Financial Accounting', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'FINA333', title: 'Fiancial Institutions Markets and Services', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MGMT208', prereqNames: ['Introduction to Financial Accounting'] },
          { semester: 5, code: 'MGMT207', title: 'Corporate Finance', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MGMT208', prereqNames: ['Introduction to Financial Accounting'] },
          { semester: 5, code: 'MGMT209', title: 'Financial Statement Anaylsis', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MGMT208', prereqNames: ['Introduction to Financial Accounting'] },
          { semester: 6, code: 'MGMT210', title: 'Basics of Investment Management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'FINA333', prereqNames: ['Financial Institutions Markets and Services'] },
          { semester: 6, code: 'MGMT323', title: 'Basics of Startup Finance', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'MGMT207', prereqNames: ['Corporate Finance'] },
          { semester: 7, code: 'MGMT213', title: 'Introduction To Fintech', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'Nil', prereqNames: [] },
          { semester: 7, code: 'MGMT307', title: 'Strategy & Decision Making', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'Nil', prereqNames: [] }
        ],
        slotMismatch: 'In B.Tech DS 2024, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. Finance 2024 lists S3: 3 vs 4; S4: 3 vs 4; S5: 6 vs 4.'
      },
      '2025': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 14,
        undecidedCredits: 10,
        undecidedLabel: 'TBD',
        courses: [
          { semester: 3, code: 'MGMT330', title: 'Introduction to Financial Accounting (R)', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'New (code unassigned)', title: 'Financial Institutions Markets & Services with Fintech (GIVE NEW NAME)', l: null, t: null, p: null, ltp: 'TBA', credits: 4, prerequisites: 'not given', prereqNames: [] },
          { semester: 5, code: 'New (code unassigned)', title: 'Corporate Finance New Name', l: null, t: null, p: null, ltp: 'TBA', credits: 4, prerequisites: 'not given', prereqNames: [] },
          { semester: 6, code: 'MGMT210', title: 'Basics of Investment Management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'FINA333', prereqNames: ['Fiancial Institutions Markets and Services (Discrepancy: FINA333 is NOT offered to 2025 batch)'] },
          { semester: 6, code: 'MGMT213', title: 'Introduction To Fintech', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'Nil', prereqNames: [] },
          { semester: 7, code: 'MGMT323', title: 'Basics of Startup Finance', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'MGMT207', prereqNames: ['Corporate Finance (Discrepancy: MGMT207 is NOT offered to 2025 batch)'] }
        ],
        prerequisiteIssues: [
          'According to the supplied minor-course document, MGMT210 (S6) lists FINA333 (Financial Institutions Markets and Services) as prerequisite, but FINA333 is not offered to the 2025 batch (the 2025 batch has a new unassigned S4 course with fintech instead). Please confirm with the university.',
          'MGMT323 (S7) lists MGMT207 (Corporate Finance) as prerequisite, but MGMT207 is not offered to the 2025 batch (the 2025 batch has a new unassigned S5 Corporate Finance course instead). Please confirm with the university.'
        ],
        undecidedBreakdown: 'In Finance 2025, 14 credits are decided courses with assigned codes, 8 credits are in 2 new courses needing codes/names, and 2 credits are listed on a TBD placeholder row. Total undecided/unfinalized = 10 credits (leaving 14 decided). Overall total = 24 credits.',
        slotMismatch: 'In B.Tech DS 2025, slots are S3: 4, S4: 4, S5: 8, S6: 4, S7: 4. Finance 2025 lists S5: 4 vs 8; S6: 6 vs 4 (plus 10 credits still TBD/new).'
      },
      '2026': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 4,
        undecidedCredits: 20,
        undecidedLabel: 'TBD',
        courses: [
          { semester: 3, code: 'MGMT330', title: 'Introduction to Financial Accounting (R)', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] }
        ],
        undecidedBreakdown: 'In Finance 2026, 4 credits are decided (MGMT330 in S3), and the remaining 20 credits are marked as TBD (courses not decided yet). Total = 24 credits.',
        slotMismatch: 'In B.Tech DS 2026, slots are S3: 4, S4: 4, S5: 8, S6: 8, S7: 0. Finance 2026 lists S4: 0 vs 4; S5: 0 vs 8; S6: 0 vs 8 (plus 20 credits still TBD).'
      }
    }
  },
  Marketing: {
    name: 'Marketing Minor',
    code: 'MINOR_MARKETING',
    school: 'School of Business Studies',
    sheetName: 'Marketing',
    batches: {
      '2022': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'Marketing Management (code unassigned)', title: 'Marketing Management', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'MGMT302', title: 'Digital and Ecommerce Marketing', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business (Note: MKTG201 not offered to 2022 batch; likely refers to S3 Marketing Management)'] },
          { semester: 5, code: 'MGMT304', title: 'Integrated Marketing Communications', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MKTG201', prereqNames: ['Marketing management'] },
          { semester: 6, code: 'MGMT314', title: 'Sales and distribution management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'MKTG201', prereqNames: ['Marketing management'] },
          { semester: 7, code: 'MGMT320', title: 'Marketing Analytics', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 7, code: 'MGMT305', title: 'Services Marketing', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 7, code: 'MGMT211', title: 'Brand Management', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 7, code: 'MGMT203', title: 'Business Strategy Simulation', l: 0, t: 0, p: 0, ltp: '0-0-0', credits: 2, prerequisites: 'MKMT201/ MGMT207/ FINA201', prereqNames: ['Marketing Management/ Corporate Finance/ Financial and Management Accounting'] }
        ],
        prerequisiteIssues: [
          'All S4–S7 courses list MKTG201 as prerequisite, but MKTG201 is not offered to the 2022 batch (likely means the unassigned S3 Marketing Management course).',
          'MGMT203 lists MKMT201 (typo for MKTG201) and MGMT207 (from Finance minor).'
        ],
        creditDiscrepancy: 'MGMT203 has L-T-P 0-0-0 with 2 credits.',
        slotMismatch: 'In B.Tech DS 2022, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. Marketing 2022 lists S3: 3 vs 4; S5: 3 vs 4; S6: 4 vs 8; S7: 10 vs 4.'
      },
      '2023': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'MKTG201', title: 'Marketing Management', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'MGMT302', title: 'Digital and Ecommerce Marketing', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 5, code: 'MGMT304', title: 'Integrated Marketing Communications', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 6, code: 'MGMT314', title: 'Sales and Distribution Management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 6, code: 'MGMT305', title: 'Services Marketing', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 6, code: 'MGMT211', title: 'Brand Management', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 7, code: 'MGMT320', title: 'Marketing Analytics', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'Nil', prereqNames: [] },
          { semester: 7, code: 'MGMT307', title: 'Strategy & Decision Making', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'Nil', prereqNames: [] }
        ],
        slotMismatch: 'In B.Tech DS 2023, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. Marketing 2023 lists S3: 3 vs 4; S5: 3 vs 4; S6: 10 vs 8.'
      },
      '2024': {
        status: 'FULLY_DEFINED',
        decidedCredits: 24,
        undecidedCredits: 0,
        courses: [
          { semester: 3, code: 'MKTG201', title: 'Marketing Management', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'MGMT302', title: 'Digital and Ecommerce Marketing', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 5, code: 'MGMT305', title: 'Services Marketing', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'Nil', prereqNames: [] },
          { semester: 5, code: 'MGMT304', title: 'Integrated Marketing Communications', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'Nil', prereqNames: [] },
          { semester: 6, code: 'MGMT314', title: 'Sales and Distribution Management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 6, code: 'MGMT211', title: 'Brand Management', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business'] },
          { semester: 7, code: 'MGMT320', title: 'Marketing Analytics', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'Nil', prereqNames: [] },
          { semester: 7, code: 'MGMT307', title: 'Strategy & Decision Making', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'Nil', prereqNames: [] }
        ],
        slotMismatch: 'In B.Tech DS 2024, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. Marketing 2024 lists S3: 3 vs 4; S5: 6 vs 4; S6: 7 vs 8.'
      },
      '2025': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 15,
        undecidedCredits: 9,
        undecidedLabel: 'TBD',
        courses: [
          { semester: 3, code: 'MGMT328', title: 'Foundation of Marketing Management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 4, code: 'MGMT302', title: 'Digital and Ecommerce Marketing', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 4, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business (Discrepancy: MKTG201 is NOT offered to the 2025 batch)'] },
          { semester: 5, code: 'MGMT304', title: 'Integrated Marketing Communications', l: 2, t: 1, p: 0, ltp: '2-1-0', credits: 3, prerequisites: 'Nil', prereqNames: [] },
          { semester: 5, code: 'New (code unassigned)', title: 'Services Marketing', l: null, t: null, p: null, ltp: 'TBA', credits: 4, prerequisites: 'TBD', prereqNames: [] },
          { semester: 6, code: 'MGMT314', title: 'Sales and Distribution Management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business (Discrepancy: MKTG201 is NOT offered to the 2025 batch)'] }
        ],
        creditDiscrepancy: 'In Marketing minor 2025 batch, MGMT302 (Digital and Ecommerce Marketing, S4) is recorded with L-T-P 2-1-0 but the Credit column lists 4 credits. Under standard formula 2+1+0 would calculate to 3 credits (in other batches it is listed as 2-2-0 = 4 credits). This discrepancy requires university confirmation.',
        prerequisiteIssues: [
          'According to the supplied minor-course document, MGMT302 and MGMT314 list MKTG201 (Marketing Management / Introduction to digital business) as prerequisite, but MKTG201 is not offered to the 2025 batch (the 2025 batch takes MGMT328 Foundation of Marketing Management in S3 instead). Please confirm with the university.'
        ],
        undecidedBreakdown: 'In Marketing 2025, 15 credits are decided courses with assigned codes, 4 credits are in a new Services Marketing course, and 5 credits are on a TBD placeholder row. Total undecided/unfinalized = 9 credits (leaving 15 decided). Overall total = 24 credits.',
        slotMismatch: 'In B.Tech DS 2025, slots are S3: 4, S4: 4, S5: 8, S6: 4, S7: 4. Marketing 2025 lists S5: 7 vs 8; S7: 0 vs 4 (plus 9 credits still TBD/new).'
      },
      '2026': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 4,
        undecidedCredits: 20,
        undecidedLabel: 'TBD',
        courses: [
          { semester: 3, code: 'MGMT328', title: 'Foundations of Marketing Management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'not given', prereqNames: [] }
        ],
        undecidedBreakdown: 'In Marketing 2026, 4 credits are decided (MGMT328 in S3), and the remaining 20 credits are marked as TBD (courses not decided yet). Total = 24 credits.',
        slotMismatch: 'In B.Tech DS 2026, slots are S3: 4, S4: 4, S5: 8, S6: 8, S7: 0. Marketing 2026 lists S4: 0 vs 4; S5: 0 vs 8; S6: 0 vs 8 (plus 20 credits still TBD).'
      }
    }
  },
  'Start-up': {
    name: 'Start-up Minor',
    code: 'MINOR_STARTUP',
    school: 'School of Business Studies',
    sheetName: 'Start-up',
    batches: {
      '2022': {
        status: 'NOT_OFFERED',
        reason: 'In the official university minor courses workbook (Minor_Courses_for_BTech_Students.xlsx / Gai stuff but for minors.pdf), the Start-up minor has no allocation or sheet block for the 2022 batch. The Start-up minor is therefore not offered to the 2022 batch.',
        decidedCredits: 0,
        undecidedCredits: 24,
        courses: []
      },
      '2023': {
        status: 'NOT_OFFERED',
        reason: 'In the official university minor courses workbook (Minor_Courses_for_BTech_Students.xlsx / Gai stuff but for minors.pdf), the Start-up minor has no allocation or sheet block for the 2023 batch. The Start-up minor is therefore not offered to the 2023 batch.',
        decidedCredits: 0,
        undecidedCredits: 24,
        courses: []
      },
      '2024': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 8,
        undecidedCredits: 16,
        undecidedLabel: 'TBD',
        courses: [
          { semester: 4, code: 'MGMT326', title: 'Product Development', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'MKTG201', prereqNames: ['Introduction to digital business (Note: MKTG201 belongs to the Marketing minor, not this one)'] },
          { semester: 5, code: 'MGMT336', title: 'Design Thinking for Entrepreneurship', l: 2, t: 1, p: 2, ltp: '2-1-2', credits: 4, prerequisites: 'Nil', prereqNames: [] }
        ],
        prerequisiteIssues: ['MGMT326 lists MKTG201 as prerequisite, but MKTG201 belongs to the Marketing minor, not the Start-up minor. University confirmation is required.'],
        undecidedBreakdown: 'In Start-up 2024, 8 credits are decided (MGMT326 and MGMT336), and the remaining 16 credits are marked as TBD (courses not decided yet). Total = 24 credits.',
        slotMismatch: 'In B.Tech DS 2024, slots are S3: 4, S4: 4, S5: 4, S6: 8, S7: 4. Start-up 2024 lists S3: 0 vs 4; S6: 0 vs 8; S7: 0 vs 4 (plus 16 credits still TBD).'
      },
      '2025': {
        status: 'PARTLY_DEFINED',
        decidedCredits: 14,
        undecidedCredits: 10,
        undecidedLabel: 'TBD',
        courses: [
          { semester: 3, code: 'MGMT330', title: 'Introduction to Financial Accounting (R)', l: 3, t: 1, p: 0, ltp: '3-1-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 3, code: 'MGMT328', title: 'Foundation of Marketing Management', l: 2, t: 2, p: 0, ltp: '2-2-0', credits: 4, prerequisites: 'Nil', prereqNames: [] },
          { semester: 5, code: 'MGMT336', title: 'Design Thinking for Entrepreneurship', l: 2, t: 1, p: 2, ltp: '2-1-2', credits: 4, prerequisites: 'not given', prereqNames: [] },
          { semester: 6, code: 'MGMT213', title: 'Introduction To Fintech', l: 1, t: 1, p: 0, ltp: '1-1-0', credits: 2, prerequisites: 'Nil', prereqNames: [] }
        ],
        undecidedBreakdown: 'In Start-up 2025, 14 credits are decided (MGMT330, MGMT328, MGMT336, MGMT213), and the remaining 10 credits are marked as TBD (courses not decided yet). Total = 24 credits.',
        slotMismatch: 'In B.Tech DS 2025, slots are S3: 4, S4: 4, S5: 8, S6: 4, S7: 4. Start-up 2025 lists S3: 8 vs 4; S4: 0 vs 4; S5: 4 vs 8; S6: 2 vs 4; S7: 0 vs 4 (plus 10 credits still TBD).'
      },
      '2026': {
        status: 'NOT_OFFERED',
        reason: 'In the official university minor courses workbook (Minor_Courses_for_BTech_Students.xlsx / Gai stuff but for minors.pdf), the Start-up minor is NOT OFFERED to the 2026 batch (nor to the 2022 and 2023 batches). It is only available for the 2024 and 2025 batches.',
        decidedCredits: 0,
        undecidedCredits: 24,
        courses: []
      }
    }
  }
};

/**
 * Standard slot credits for B.Tech DS plan across semesters
 */
const DS_OPEN_MINOR_SLOTS = {
  '2022': { S3: 4, S4: 4, S5: 4, S6: 8, S7: 4, total: 24 },
  '2023': { S3: 4, S4: 4, S5: 4, S6: 8, S7: 4, total: 24 },
  '2024': { S3: 4, S4: 4, S5: 4, S6: 8, S7: 4, total: 24 },
  '2025': { S3: 4, S4: 4, S5: 8, S6: 4, S7: 4, total: 24 },
  '2026': { S3: 4, S4: 4, S5: 8, S6: 8, S7: 0, total: 24 }
};

/**
 * Resolve canonical minor key from user input
 */
function resolveMinorKey(inputStr) {
  if (!inputStr || typeof inputStr !== 'string') return null;
  const lower = inputStr.toLowerCase();
  if (lower.includes('law')) return 'Law';
  if ((lower.includes('compiler design') || lower.includes('design workshop')) && !lower.includes('minor')) {
    return null;
  }
  if (lower.includes('design minor') || (lower.includes('design') && lower.includes('minor')) || /\bcdes\s?(217|312|402|504|712)\b/i.test(lower)) return 'Design';
  if (lower.includes('design') && !lower.includes('workshop') && !lower.includes('compiler')) return 'Design';
  if (lower.includes('psych') || lower.includes('psyc')) return 'Psychology';
  if (lower.includes('econ')) return 'Economics';
  if (lower.includes('finan') || lower.includes('fina')) return 'Finance';
  if (lower.includes('market') || lower.includes('mktg')) return 'Marketing';
  if (lower.includes('start-up') || lower.includes('startup') || lower.includes('start up') || lower.includes('entrepreneur')) return 'Start-up';
  return null;
}

/**
 * Helper to get available minors for a specific batch
 */
function getAvailableMinorsForBatch(batch) {
  const targetBatch = String(batch || '2024').trim();
  const available = [];
  const unavailable = [];

  for (const [key, data] of Object.entries(MINORS_INFO)) {
    const bInfo = data.batches[targetBatch];
    if (!bInfo) continue;
    if (bInfo.status === 'NOT_OFFERED') {
      unavailable.push({ minor: key, reason: bInfo.reason });
    } else if (bInfo.status === 'NOT_RUNNING') {
      unavailable.push({ minor: key, reason: bInfo.reason });
    } else {
      available.push({
        minor: key,
        name: data.name,
        school: data.school,
        status: bInfo.status,
        decidedCredits: bInfo.decidedCredits,
        undecidedCredits: bInfo.undecidedCredits,
        totalCredits: 24
      });
    }
  }

  return { batch: targetBatch, available, unavailable };
}

/**
 * Helper to get courses for a minor and batch
 */
function getMinorCourses(minorKey, batch) {
  const key = resolveMinorKey(minorKey);
  if (!key || !MINORS_INFO[key]) return null;
  const bData = MINORS_INFO[key].batches[String(batch)];
  if (!bData) return null;
  return {
    minor: key,
    minorName: MINORS_INFO[key].name,
    school: MINORS_INFO[key].school,
    batch: String(batch),
    ...bData
  };
}

// Pre-compute all known minor course codes for instant lookup
const ALL_MINOR_CODES = new Set();
for (const mKey of Object.keys(MINORS_INFO)) {
  const m = MINORS_INFO[mKey];
  for (const b of Object.keys(m.batches)) {
    const bData = m.batches[b];
    if (Array.isArray(bData.courses)) {
      for (const c of bData.courses) {
        if (c.code) ALL_MINOR_CODES.add(c.code.toUpperCase().replace(/\s+/g, ''));
        if (c.prerequisites) {
          const matched = c.prerequisites.match(/[A-Z]{3,4}\s?\d{3}/gi);
          if (matched) {
            matched.forEach(code => ALL_MINOR_CODES.add(code.toUpperCase().replace(/\s+/g, '')));
          }
        }
      }
    }
  }
}
// Prerequisite references mentioned in anomaly notes
[
  'PSYC101', 'PSYC102', 'PSYC103', 'PSYC105', 'PSYC201', 'PSYC202', 'PSYC241', 'PSYC306', 'PSYC255', 'PSYC104',
  'ECON201', 'ECON202', 'ECON301', 'MATH131', 'FINA333', 'MKTG201', 'MGMT203', 'MGMT210', 'MGMT302', 'MGMT328', 'MGMT330',
  'CDES217', 'CDES312', 'CDES712', 'CDES402', 'CDES504', 'LAWM305', 'LAWE200', 'LAWC410', 'LAWB210', 'LAWM306', 'LAWE301'
].forEach(c => ALL_MINOR_CODES.add(c));

function isMinorCourseCode(code) {
  if (!code) return false;
  return ALL_MINOR_CODES.has(code.toUpperCase().replace(/\s+/g, ''));
}

module.exports = {
  MINOR_KEYS,
  MINORS_INFO,
  DS_OPEN_MINOR_SLOTS,
  ALL_MINOR_CODES,
  isMinorCourseCode,
  resolveMinorKey,
  getAvailableMinorsForBatch,
  getMinorCourses
};

