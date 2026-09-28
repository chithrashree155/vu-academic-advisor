/**
 * Authoritative Vidyashilp University Course Catalog & Course Master Database
 * Structured course taxonomy and data for deterministic academic eligibility calculations.
 */

'use strict';

// 6 Structured Domains / Schools
const SCHOOL_TAXONOMY = {
  CS_DATA_AI: 'School of Computer Science / Data / AI',
  BUSINESS_MGMT: 'School of Business / Management',
  PSYCHOLOGY_SOCIAL: 'School of Psychology / Social Sciences',
  LAW: 'School of Law',
  DESIGN: 'School of Design / Creative Design',
  UNIVERSITY_CORE: 'University Core / Common Courses'
};

const OFFICIAL_COURSE_CATALOG = [
  // ── SCHOOL OF COMPUTER SCIENCE / DATA / AI ──
  { code: 'COMP132', name: 'Design Workshop', credits: 2, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 100, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'COMP201', name: 'Data Structures', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 200, semester_availability: 'regular', prerequisites: ['DATA103'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'COMP202', name: 'Theoretical Computer Science', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 200, semester_availability: 'both', prerequisites: ['COMP201'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'COMP203', name: 'Analysis of Algorithms', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 200, semester_availability: 'regular', prerequisites: ['COMP201'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'COMP204', name: 'Digital Design and Computer Organization', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 200, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'COMP208', name: 'Computer Networks', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 200, semester_availability: 'regular', prerequisites: ['COMP204'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'COMP209', name: 'Databases Management', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 200, semester_availability: 'regular', prerequisites: ['DATA103'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'COMP210', name: 'Essentials of Artificial Intelligence', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 200, semester_availability: 'regular', prerequisites: ['DATA103'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'COMP301', name: 'Artificial Intelligence', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 300, semester_availability: 'regular', prerequisites: ['DATA103', 'COMP201'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'COMP302', name: 'Internet of Things', credits: 2, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 300, semester_availability: 'regular', prerequisites: ['COMP208'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'COMP403', name: 'Cloud Computing', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 400, semester_availability: 'regular', prerequisites: ['COMP208'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },

  { code: 'DATA103', name: 'Programming in Python', credits: 3, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 100, semester_availability: 'both', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'DATA131', name: 'Visualizing Data for Story Telling', credits: 2, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 100, semester_availability: 'both', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'DATA132', name: 'Data Visualization and Story Telling', credits: 3, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 100, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'DATA201', name: 'Foundations to Data Science', credits: 3, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 200, semester_availability: 'regular', prerequisites: ['DATA103'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'DATA202', name: 'Exploratory Data Analysis', credits: 3, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 200, semester_availability: 'regular', prerequisites: ['DATA103', 'DATA201'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'DATA206', name: 'Artificial Intelligence for Decision Making', credits: 3, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 200, semester_availability: 'regular', prerequisites: ['DATA103'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'DATA301', name: 'Machine Learning', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 300, semester_availability: 'regular', prerequisites: ['DATA201'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'DATA302', name: 'Deep Learning', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 300, semester_availability: 'regular', prerequisites: ['DATA301'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'DATA303', name: 'MLOps & Model Deployment', credits: 2, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 300, semester_availability: 'both', prerequisites: ['DATA301'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'DATA306', name: 'Deep Learning and Natural Language Processing', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 300, semester_availability: 'regular', prerequisites: ['DATA301'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'DATA405', name: 'Reinforcement Learning', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Computer Science & Data', level: 400, semester_availability: 'both', prerequisites: ['DATA301'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },

  { code: 'MATH201', name: 'Calculus', credits: 3, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Mathematics & Quantitative', level: 200, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MATH203', name: 'Probability and Statistics', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Mathematics & Quantitative', level: 200, semester_availability: 'both', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE', 'BMS_DB', 'BA_ECO'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MATH204', name: 'Linear Algebra', credits: 3, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Mathematics & Quantitative', level: 200, semester_availability: 'both', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MATH206', name: 'Advanced Statistical Analysis and Research Methods with R', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Mathematics & Quantitative', level: 200, semester_availability: 'regular', prerequisites: ['MATH203'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE', 'BA_ECO_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MATH208', name: 'Multivariate Calculus', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Mathematics & Quantitative', level: 200, semester_availability: 'both', prerequisites: ['MATH201'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MATH301', name: 'Optimization Techniques for Data Science', credits: 4, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Mathematics & Quantitative', level: 300, semester_availability: 'both', prerequisites: ['MATH204'], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'SLAD211', name: 'Mathematics - I', credits: 3, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Mathematics & Quantitative', level: 200, semester_availability: 'summer', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'MTSC111', name: 'Materials for Smart Devices', credits: 3, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Applied Sciences', level: 100, semester_availability: 'summer', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'MTSC211', name: 'Sustainable Smart Materials', credits: 3, school: SCHOOL_TAXONOMY.CS_DATA_AI, domain: 'Applied Sciences', level: 200, semester_availability: 'summer', prerequisites: [], allowed_programs: ['BTECH_DS', 'BTECH_AIML', 'BTECH_CSE'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },

  // ── SCHOOL OF BUSINESS / MANAGEMENT ──
  { code: 'MGMT101', name: 'Essentials of Business Management', credits: 2, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Management', level: 100, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH', 'BA_ECO'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MGMT201', name: 'Introduction to Digital Business', credits: 2, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Management', level: 200, semester_availability: 'both', prerequisites: ['MGMT101'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MGMT202', name: 'Organizational Behaviour', credits: 3, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Management', level: 200, semester_availability: 'both', prerequisites: ['MGMT101'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MGMT206', name: 'People and Talent Management', credits: 3, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Management', level: 200, semester_availability: 'both', prerequisites: ['MGMT101'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MGMT208', name: 'Introduction to Financial Accounting', credits: 3, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Finance', level: 200, semester_availability: 'both', prerequisites: [], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH', 'BA_ECO'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MGMT210', name: 'Basics of Investment Management', credits: 4, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Finance', level: 200, semester_availability: 'regular', prerequisites: ['MGMT208'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH', 'BA_ECO'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MGMT212', name: 'Digital Supply Chains', credits: 2, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Management', level: 200, semester_availability: 'regular', prerequisites: ['MGMT101'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MGMT306', name: 'Operations Research', credits: 3, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Management', level: 300, semester_availability: 'both', prerequisites: ['MATH203'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MGMT314', name: 'Sales and Distribution Management', credits: 4, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Marketing', level: 300, semester_availability: 'both', prerequisites: ['MKTG201'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'MGMT326', name: 'Product Development', credits: 4, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Management', level: 300, semester_availability: 'both', prerequisites: ['MGMT101'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },

  { code: 'MKTG201', name: 'Marketing Management', credits: 3, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Marketing', level: 200, semester_availability: 'both', prerequisites: ['MGMT101'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH', 'BA_ECO'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },

  { code: 'FINA202', name: 'Financial Management', credits: 3, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Finance', level: 200, semester_availability: 'regular', prerequisites: ['MGMT208'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH', 'BA_ECO'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'FINA333', name: 'Financial Institutions, Markets and Services', credits: 4, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Business & Finance', level: 300, semester_availability: 'regular', prerequisites: ['FINA202'], allowed_programs: ['BMS_DB', 'BMS_DB_RESEARCH', 'BA_ECO'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },

  { code: 'ECON105', name: 'Principles of Economics', credits: 2, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Economics', level: 100, semester_availability: 'both', prerequisites: [], allowed_programs: ['BA_ECO', 'BA_ECO_RESEARCH', 'BMS_DB'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'ECON206', name: 'Macroeconomics and Indian Economy', credits: 3, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Economics', level: 200, semester_availability: 'both', prerequisites: ['ECON105'], allowed_programs: ['BA_ECO', 'BA_ECO_RESEARCH', 'BMS_DB'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'ECON208', name: 'Microeconomics', credits: 4, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Economics', level: 200, semester_availability: 'both', prerequisites: ['ECON105'], allowed_programs: ['BA_ECO', 'BA_ECO_RESEARCH', 'BMS_DB'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'ECON209', name: 'Macroeconomics I', credits: 4, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Economics', level: 200, semester_availability: 'both', prerequisites: ['ECON105'], allowed_programs: ['BA_ECO', 'BA_ECO_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'ECON322', name: 'Economics of Health and Education', credits: 4, school: SCHOOL_TAXONOMY.BUSINESS_MGMT, domain: 'Economics', level: 300, semester_availability: 'regular', prerequisites: ['ECON208'], allowed_programs: ['BA_ECO', 'BA_ECO_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },

  // ── SCHOOL OF PSYCHOLOGY / SOCIAL SCIENCES ──
  { code: 'PSYC102', name: 'Introduction to Psychology', credits: 3, school: SCHOOL_TAXONOMY.PSYCHOLOGY_SOCIAL, domain: 'Psychology', level: 100, semester_availability: 'both', prerequisites: [], allowed_programs: ['BA_PSY', 'BA_PSY_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'PSYC201', name: 'Biological Psychology', credits: 4, school: SCHOOL_TAXONOMY.PSYCHOLOGY_SOCIAL, domain: 'Psychology', level: 200, semester_availability: 'regular', prerequisites: ['PSYC102'], allowed_programs: ['BA_PSY', 'BA_PSY_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'PSYC202', name: 'Cognitive Psychology', credits: 4, school: SCHOOL_TAXONOMY.PSYCHOLOGY_SOCIAL, domain: 'Psychology', level: 200, semester_availability: 'regular', prerequisites: ['PSYC102'], allowed_programs: ['BA_PSY', 'BA_PSY_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'PSYC212', name: 'Foundations of Psychology II', credits: 4, school: SCHOOL_TAXONOMY.PSYCHOLOGY_SOCIAL, domain: 'Psychology', level: 200, semester_availability: 'regular', prerequisites: ['PSYC102'], allowed_programs: ['BA_PSY', 'BA_PSY_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'PSYC213', name: 'Lifespan Development II', credits: 4, school: SCHOOL_TAXONOMY.PSYCHOLOGY_SOCIAL, domain: 'Psychology', level: 200, semester_availability: 'both', prerequisites: ['PSYC102'], allowed_programs: ['BA_PSY', 'BA_PSY_RESEARCH'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },

  // ── SCHOOL OF LAW ──
  { code: 'LAWB210', name: 'Criminology and Victimology', credits: 4, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 200, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'LAWE200', name: 'Moral Philosophy and Justice', credits: 2, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 200, semester_availability: 'both', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'LAWE497', name: 'Women and the Law', credits: 4, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 400, semester_availability: 'both', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'LAWM301', name: 'Constitution for Citizens', credits: 4, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 300, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB', 'BA_ECO', 'BMS_DB'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'LAWP101', name: 'Introduction to Political Science', credits: 4, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 100, semester_availability: 'both', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'LAWS101', name: 'Fundamentals of Indian Constitution and Human Rights', credits: 2, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 100, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'LAWS111', name: 'Law of Tort including MV Accident and Consumer Protection Laws', credits: 4, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 100, semester_availability: 'both', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'LAWS201', name: 'Legal Writing and Research Methodology', credits: 3, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 200, semester_availability: 'both', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'LAWS202', name: 'Constitutional Law-I', credits: 4, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 200, semester_availability: 'regular', prerequisites: ['LAWS101'], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'LAWS203', name: 'General Principles of Contract Law (Law of Contract-I)', credits: 4, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 200, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'LAWS301', name: 'Legal Methods', credits: 3, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 300, semester_availability: 'both', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'LAWS310', name: 'Administrative Law', credits: 4, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 300, semester_availability: 'regular', prerequisites: ['LAWS202'], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'LAWS316', name: 'Environmental Law', credits: 4, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 300, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'HIST200', name: 'Indian Legal and Constitutional History', credits: 4, school: SCHOOL_TAXONOMY.LAW, domain: 'Law & Legal Studies', level: 200, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BA_LLB', 'BMS_LLB'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },

  // ── SCHOOL OF DESIGN / CREATIVE DESIGN ──
  { code: 'CDES105', name: 'Appreciating and Deconstructing Art and Media', credits: 3, school: SCHOOL_TAXONOMY.DESIGN, domain: 'Design & Creative Practice', level: 100, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BDES_CD'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'CDES217', name: 'Making with Reframed Media', credits: 4, school: SCHOOL_TAXONOMY.DESIGN, domain: 'Design & Creative Practice', level: 200, semester_availability: 'both', prerequisites: ['CDES105'], allowed_programs: ['BDES_CD'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'CDES218', name: 'Frames and Frequencies', credits: 4, school: SCHOOL_TAXONOMY.DESIGN, domain: 'Design & Creative Practice', level: 200, semester_availability: 'regular', prerequisites: ['CDES105'], allowed_programs: ['BDES_CD'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'CDES219', name: 'Elements of Sound', credits: 4, school: SCHOOL_TAXONOMY.DESIGN, domain: 'Design & Creative Practice', level: 200, semester_availability: 'regular', prerequisites: ['CDES105'], allowed_programs: ['BDES_CD'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'CDES222', name: 'Material as Metaphor', credits: 2, school: SCHOOL_TAXONOMY.DESIGN, domain: 'Design & Creative Practice', level: 200, semester_availability: 'both', prerequisites: ['CDES105'], allowed_programs: ['BDES_CD'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'CDES301', name: 'Sketch to Story', credits: 4, school: SCHOOL_TAXONOMY.DESIGN, domain: 'Design & Creative Practice', level: 300, semester_availability: 'both', prerequisites: ['CDES105'], allowed_programs: ['BDES_CD'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'CDES403', name: 'Interactive Narratives', credits: 6, school: SCHOOL_TAXONOMY.DESIGN, domain: 'Design & Creative Practice', level: 400, semester_availability: 'regular', prerequisites: ['CDES301'], allowed_programs: ['BDES_CD'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'CDES701', name: 'Integrative Design Studio I', credits: 4, school: SCHOOL_TAXONOMY.DESIGN, domain: 'Design & Creative Practice', level: 700, semester_availability: 'regular', prerequisites: [], allowed_programs: ['BDES_CD'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'CDES702', name: 'Integrative Design Studio II', credits: 4, school: SCHOOL_TAXONOMY.DESIGN, domain: 'Design & Creative Practice', level: 700, semester_availability: 'regular', prerequisites: ['CDES701'], allowed_programs: ['BDES_CD'], cross_school_allowed: false, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },

  // ── UNIVERSITY CORE / COMMON COURSES ──
  { code: 'UCOR102', name: 'Introduction to Writing', credits: 2, school: SCHOOL_TAXONOMY.UNIVERSITY_CORE, domain: 'University Core', level: 100, semester_availability: 'both', prerequisites: [], allowed_programs: ['ALL'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'UCOR103', name: 'Communication Skills', credits: 2, school: SCHOOL_TAXONOMY.UNIVERSITY_CORE, domain: 'University Core', level: 100, semester_availability: 'regular', prerequisites: [], allowed_programs: ['ALL'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'UCOR104', name: 'Problem Solving with Design Thinking', credits: 2, school: SCHOOL_TAXONOMY.UNIVERSITY_CORE, domain: 'University Core', level: 100, semester_availability: 'both', prerequisites: [], allowed_programs: ['ALL'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'UCOR105', name: 'Communication and Leadership Skills', credits: 3, school: SCHOOL_TAXONOMY.UNIVERSITY_CORE, domain: 'University Core', level: 100, semester_availability: 'regular', prerequisites: [], allowed_programs: ['ALL'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },
  { code: 'UCOR106', name: 'Learning to Learn', credits: 2, school: SCHOOL_TAXONOMY.UNIVERSITY_CORE, domain: 'University Core', level: 100, semester_availability: 'both', prerequisites: [], allowed_programs: ['ALL'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'UCOR201', name: 'Introduction to Epistemology', credits: 2, school: SCHOOL_TAXONOMY.UNIVERSITY_CORE, domain: 'University Core', level: 200, semester_availability: 'both', prerequisites: [], allowed_programs: ['ALL'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'UCOR205', name: 'Socio-cultural Perspectives on Indian Life', credits: 3, school: SCHOOL_TAXONOMY.UNIVERSITY_CORE, domain: 'University Core', level: 200, semester_availability: 'both', prerequisites: [], allowed_programs: ['ALL'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'UCOR310', name: 'Critical Thinking', credits: 3, school: SCHOOL_TAXONOMY.UNIVERSITY_CORE, domain: 'University Core', level: 300, semester_availability: 'regular', prerequisites: [], allowed_programs: ['ALL'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: '118225_Semester_Spread_Structures_Sept_2026.xlsx' },

  { code: 'ETHN105', name: 'Introduction to Ethnography', credits: 2, school: SCHOOL_TAXONOMY.UNIVERSITY_CORE, domain: 'Interdisciplinary', level: 100, semester_availability: 'both', prerequisites: [], allowed_programs: ['ALL'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' },
  { code: 'ENGL303', name: 'Law and Literature', credits: 3, school: SCHOOL_TAXONOMY.UNIVERSITY_CORE, domain: 'Interdisciplinary', level: 300, semester_availability: 'both', prerequisites: [], allowed_programs: ['ALL'], cross_school_allowed: true, source_type: 'OFFICIAL_EXCEL', source_reference: 'Courses Offered.pdf' }
];

// Verified prerequisite map
const COURSE_PREREQUISITES = {
  'DATA302': ['DATA301'],
  'DATA301': ['DATA201'],
  'DATA206': ['DATA103'],
  'COMP201': ['DATA103'],
  'COMP202': ['COMP201'],
  'COMP203': ['COMP201'],
  'COMP208': ['COMP204'],
  'COMP209': ['DATA103'],
  'COMP210': ['DATA103'],
  'COMP301': ['DATA103', 'COMP201'],
  'COMP302': ['COMP208'],
  'COMP403': ['COMP208'],
  'DATA202': ['DATA103', 'DATA201'],
  'DATA303': ['DATA301'],
  'DATA306': ['DATA301'],
  'DATA405': ['DATA301'],
  'MATH206': ['MATH203'],
  'MATH208': ['MATH201'],
  'MATH301': ['MATH204'],
  'MGMT201': ['MGMT101'],
  'MGMT202': ['MGMT101'],
  'MGMT206': ['MGMT101'],
  'MGMT210': ['MGMT208'],
  'MGMT212': ['MGMT101'],
  'MGMT306': ['MATH203'],
  'MGMT314': ['MKTG201'],
  'MGMT326': ['MGMT101'],
  'MKTG201': ['MGMT101'],
  'FINA202': ['MGMT208'],
  'FINA333': ['FINA202'],
  'ECON206': ['ECON105'],
  'ECON208': ['ECON105'],
  'ECON209': ['ECON105'],
  'ECON322': ['ECON208'],
  'PSYC201': ['PSYC102'],
  'PSYC202': ['PSYC102'],
  'PSYC212': ['PSYC102'],
  'PSYC213': ['PSYC102'],
  'LAWS202': ['LAWS101'],
  'LAWS310': ['LAWS202'],
  'CDES217': ['CDES105'],
  'CDES218': ['CDES105'],
  'CDES219': ['CDES105'],
  'CDES222': ['CDES105'],
  'CDES301': ['CDES105'],
  'CDES403': ['CDES301'],
  'CDES702': ['CDES701']
};

// Common natural language aliases mapping to official course codes
const COURSE_ALIASES = {
  'machine learning': 'DATA301',
  'ml': 'DATA301',
  'deep learning': 'DATA302',
  'dl': 'DATA302',
  'artificial intelligence': 'COMP301',
  'ai': 'COMP301',
  'data structures': 'COMP201',
  'dsa': 'COMP201',
  'algorithms': 'COMP203',
  'analysis of algorithms': 'COMP203',
  'databases': 'COMP209',
  'database management': 'COMP209',
  'dbms': 'COMP209',
  'reinforcement learning': 'DATA405',
  'rl': 'DATA405',
  'natural language processing': 'DATA306',
  'nlp': 'DATA306',
  'mlops': 'DATA303',
  'model deployment': 'DATA303',
  'linear algebra': 'MATH204',
  'calculus': 'MATH201',
  'probability': 'MATH203',
  'probability and statistics': 'MATH203',
  'statistics': 'MATH203',
  'cloud computing': 'COMP403',
  'python': 'DATA103',
  'programming in python': 'DATA103',
  'microeconomics': 'ECON208',
  'macroeconomics': 'ECON209',
  'principles of economics': 'ECON105',
  'financial accounting': 'MGMT208',
  'financial management': 'FINA202',
  'marketing management': 'MKTG201',
  'organizational behaviour': 'MGMT202',
  'biological psychology': 'PSYC201',
  'cognitive psychology': 'PSYC202',
  'administrative law': 'LAWS310',
  'environmental law': 'LAWS316',
  'sketch to story': 'CDES301',
  'interactive narratives': 'CDES403'
};

/**
 * Finds a course by code (case-insensitive)
 */
function findCourseByCode(code) {
  if (!code || typeof code !== 'string') return null;
  const clean = code.replace(/\s+/, '').toUpperCase();
  return OFFICIAL_COURSE_CATALOG.find(c => c.code.replace(/\s+/, '').toUpperCase() === clean) || null;
}

/**
 * Finds a course by name or natural language alias
 */
function findCourseByNameOrAlias(queryStr) {
  if (!queryStr || typeof queryStr !== 'string') return null;
  const clean = queryStr.toLowerCase().trim();

  // 1. Direct course code match
  const codeMatch = queryStr.match(/\b[A-Z]{3,4}\s?\d{3}\b/i);
  if (codeMatch) {
    const found = findCourseByCode(codeMatch[0]);
    if (found) return found;
  }

  // 2. Alias match
  for (const [alias, targetCode] of Object.entries(COURSE_ALIASES)) {
    if (clean.includes(alias) || alias === clean) {
      const found = findCourseByCode(targetCode);
      if (found) return found;
    }
  }

  // 3. Exact title match
  const exact = OFFICIAL_COURSE_CATALOG.find(c => c.name.toLowerCase() === clean);
  if (exact) return exact;

  // 4. Substring match
  return OFFICIAL_COURSE_CATALOG.find(c => {
    const title = c.name.toLowerCase();
    return title.includes(clean) || clean.includes(title);
  }) || null;
}

/**
 * Returns candidate real courses for suggestion when an unknown course is queried
 */
function getSuggestedCourses() {
  return [
    findCourseByCode('DATA302'),
    findCourseByCode('DATA306'),
    findCourseByCode('DATA405')
  ].filter(Boolean);
}

/**
 * Gets all courses offered in Summer Term June 2026
 */
function getSummerCourses() {
  return OFFICIAL_COURSE_CATALOG.filter(c => c.semester_availability === 'summer' || c.semester_availability === 'both');
}

/**
 * Gets courses by exact credit value
 */
function getCoursesByCredits(credits) {
  return OFFICIAL_COURSE_CATALOG.filter(c => c.credits === credits);
}

/**
 * Gets verified prerequisites for a course code
 */
function getCoursePrerequisites(courseCode) {
  const clean = courseCode ? courseCode.replace(/\s+/, '').toUpperCase() : '';
  if (COURSE_PREREQUISITES[clean]) return COURSE_PREREQUISITES[clean];
  const c = findCourseByCode(clean);
  return c && Array.isArray(c.prerequisites) ? c.prerequisites : [];
}

module.exports = {
  SCHOOL_TAXONOMY,
  OFFICIAL_COURSE_CATALOG,
  COURSE_PREREQUISITES,
  COURSE_ALIASES,
  findCourseByCode,
  findCourseByName: findCourseByNameOrAlias,
  findCourseByNameOrAlias,
  getSuggestedCourses,
  getSummerCourses,
  getCoursesByCredits,
  getCoursePrerequisites
};
