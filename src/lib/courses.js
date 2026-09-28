/**
 * Authoritative Vidyashilp University Course Catalog & Summer Term June 2026 Data
 * Structured level-1 facts for deterministic academic query resolution.
 */

'use strict';

const OFFICIAL_COURSE_CATALOG = [
  { code: 'LAWS310', name: 'Administrative Law', credits: 4, isSummer: false },
  { code: 'MATH206', name: 'Advanced Statistical Analysis and Research Methods with R', credits: 4, isSummer: false },
  { code: 'COMP203', name: 'Analysis of Algorithms', credits: 4, isSummer: false },
  { code: 'CDES105', name: 'Appreciating and Deconstructing Art and Media', credits: 3, isSummer: false },
  { code: 'COMP301', name: 'Artificial Intelligence', credits: 4, isSummer: false },
  { code: 'DATA206', name: 'Artificial Intelligence for Decision Making', credits: 3, isSummer: false },
  { code: 'MGMT210', name: 'Basics of Investment Management', credits: 4, isSummer: false },
  { code: 'PSYC201', name: 'Biological Psychology', credits: 4, isSummer: false },
  { code: 'MATH201', name: 'Calculus', credits: 3, isSummer: false },
  { code: 'COMP403', name: 'Cloud Computing', credits: 4, isSummer: false },
  { code: 'PSYC202', name: 'Cognitive Psychology', credits: 4, isSummer: false },
  { code: 'UCOR105', name: 'Communication and Leadership Skills', credits: 3, isSummer: false },
  { code: 'UCOR103', name: 'Communication Skills', credits: 2, isSummer: false },
  { code: 'COMP208', name: 'Computer Networks', credits: 4, isSummer: false },
  { code: 'LAWM301', name: 'Constitution for Citizens', credits: 4, isSummer: false },
  { code: 'LAWS202', name: 'Constitutional Law-I', credits: 4, isSummer: false },
  { code: 'LAWB210', name: 'Criminology and Victimology', credits: 4, isSummer: false },
  { code: 'UCOR310', name: 'Critical Thinking', credits: 3, isSummer: false },
  { code: 'COMP201', name: 'Data Structures', credits: 4, isSummer: false },
  { code: 'DATA132', name: 'Data Visualization and Story Telling', credits: 3, isSummer: false },
  { code: 'COMP209', name: 'Databases Management', credits: 4, isSummer: false },
  { code: 'DATA302', name: 'Deep Learning', credits: 4, isSummer: false },
  { code: 'DATA306', name: 'Deep Learning and Natural Language Processing', credits: 4, isSummer: false },
  { code: 'COMP132', name: 'Design Workshop', credits: 2, isSummer: false },
  { code: 'COMP204', name: 'Digital Design and Computer Organization', credits: 4, isSummer: false },
  { code: 'MGMT212', name: 'Digital Supply Chains', credits: 2, isSummer: false },
  { code: 'ECON322', name: 'Economics of Health and Education', credits: 4, isSummer: false },
  { code: 'LAWS316', name: 'Environmental Law', credits: 4, isSummer: false },
  { code: 'COMP210', name: 'Essentials of Artificial Intelligence', credits: 4, isSummer: false },
  { code: 'MGMT101', name: 'Essentials of Business Management', credits: 2, isSummer: false },
  { code: 'CDES219', name: 'Elements of Sound', credits: 4, isSummer: false },
  { code: 'DATA202', name: 'Exploratory Data Analysis', credits: 3, isSummer: false },
  { code: 'FINA333', name: 'Financial Institutions, Markets and Services', credits: 4, isSummer: false },
  { code: 'FINA202', name: 'Financial Management', credits: 3, isSummer: false },
  { code: 'PSYC212', name: 'Foundations of Psychology II', credits: 4, isSummer: false },
  { code: 'DATA201', name: 'Foundations to Data Science', credits: 3, isSummer: false },
  { code: 'CDES218', name: 'Frames and Frequencies', credits: 4, isSummer: false },
  { code: 'LAWS101', name: 'Fundamentals of Indian Constitution and Human Rights', credits: 2, isSummer: false },
  { code: 'LAWS203', name: 'General Principles of Contract Law (Law of Contract-I)', credits: 4, isSummer: false },
  { code: 'HIST200', name: 'Indian Legal and Constitutional History', credits: 4, isSummer: false },
  { code: 'CDES701', name: 'Integrative Design Studio I', credits: 4, isSummer: false },
  { code: 'CDES702', name: 'Integrative Design Studio II', credits: 4, isSummer: false },
  { code: 'CDES403', name: 'Interactive Narratives', credits: 6, isSummer: false },
  { code: 'COMP302', name: 'Internet of Things', credits: 2, isSummer: false },
  { code: 'MGMT201', name: 'Introduction to Digital Business', credits: 2, isSummer: true },
  { code: 'UCOR201', name: 'Introduction to Epistemology', credits: 2, isSummer: true },
  { code: 'ETHN105', name: 'Introduction to Ethnography', credits: 2, isSummer: true },
  { code: 'MGMT208', name: 'Introduction to Financial Accounting', credits: 3, isSummer: true },
  { code: 'LAWP101', name: 'Introduction to Political Science', credits: 4, isSummer: true },
  { code: 'PSYC102', name: 'Introduction to Psychology', credits: 3, isSummer: true },
  { code: 'UCOR102', name: 'Introduction to Writing', credits: 2, isSummer: true },
  { code: 'ENGL303', name: 'Law and Literature', credits: 3, isSummer: true },
  { code: 'LAWS111', name: 'Law of Tort including MV Accident and Consumer Protection Laws', credits: 4, isSummer: true },
  { code: 'UCOR106', name: 'Learning to Learn', credits: 2, isSummer: true },
  { code: 'LAWS301', name: 'Legal Methods', credits: 3, isSummer: true },
  { code: 'LAWS201', name: 'Legal Writing and Research Methodology', credits: 3, isSummer: true },
  { code: 'PSYC213', name: 'Lifespan Development II', credits: 4, isSummer: true },
  { code: 'MATH204', name: 'Linear Algebra', credits: 3, isSummer: true },
  { code: 'ECON206', name: 'Macroeconomics and Indian Economy', credits: 3, isSummer: true },
  { code: 'ECON209', name: 'Macroeconomics I', credits: 4, isSummer: true },
  { code: 'CDES217', name: 'Making with Reframed Media', credits: 4, isSummer: true },
  { code: 'MKTG201', name: 'Marketing Management', credits: 3, isSummer: true },
  { code: 'MTSC111', name: 'Materials for Smart Devices', credits: 3, isSummer: true },
  { code: 'CDES222', name: 'Material as Metaphor', credits: 2, isSummer: true },
  { code: 'SLAD211', name: 'Mathematics - I', credits: 3, isSummer: true },
  { code: 'ECON208', name: 'Microeconomics', credits: 4, isSummer: true },
  { code: 'DATA303', name: 'MLOps & Model Deployment', credits: 2, isSummer: true },
  { code: 'LAWE200', name: 'Moral Philosophy and Justice', credits: 2, isSummer: true },
  { code: 'MATH208', name: 'Multivariate Calculus', credits: 4, isSummer: true },
  { code: 'MGMT306', name: 'Operations Research', credits: 3, isSummer: true },
  { code: 'MATH301', name: 'Optimization Techniques for Data Science', credits: 4, isSummer: true },
  { code: 'MGMT202', name: 'Organizational Behaviour', credits: 3, isSummer: true },
  { code: 'MGMT206', name: 'People and Talent Management', credits: 3, isSummer: true },
  { code: 'ECON105', name: 'Principles of Economics', credits: 2, isSummer: true },
  { code: 'MATH203', name: 'Probability and Statistics', credits: 4, isSummer: true },
  { code: 'UCOR104', name: 'Problem Solving with Design Thinking', credits: 2, isSummer: true },
  { code: 'MGMT326', name: 'Product Development', credits: 4, isSummer: true },
  { code: 'DATA103', name: 'Programming in Python', credits: 3, isSummer: true },
  { code: 'DATA405', name: 'Reinforcement Learning', credits: 4, isSummer: true },
  { code: 'MGMT314', name: 'Sales and Distribution Management', credits: 4, isSummer: true },
  { code: 'CDES301', name: 'Sketch to Story', credits: 4, isSummer: true },
  { code: 'UCOR205', name: 'Socio-cultural Perspectives on Indian Life', credits: 3, isSummer: true },
  { code: 'MTSC211', name: 'Sustainable Smart Materials', credits: 3, isSummer: true },
  { code: 'COMP202', name: 'Theoretical Computer Science', credits: 4, isSummer: true },
  { code: 'DATA131', name: 'Visualizing Data for Story Telling', credits: 2, isSummer: true },
  { code: 'LAWE497', name: 'Women and the Law', credits: 4, isSummer: true }
];

// Additional prerequisite course aliases used in curriculum spreads
const COURSE_PREREQUISITES = {
  'DATA302': ['DATA301'],
  'DATA301': ['DATA201'],
  'DATA206': ['DATA103'],
  'DATA403': ['DATA302'],
  'COMP203': ['COMP201'],
  'COMP209': ['DATA103']
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
 * Finds a course by name (case-insensitive keyword/phrase match)
 */
function findCourseByName(nameQuery) {
  if (!nameQuery || typeof nameQuery !== 'string') return null;
  const clean = nameQuery.toLowerCase().trim();
  
  // Direct match
  const exact = OFFICIAL_COURSE_CATALOG.find(c => c.name.toLowerCase() === clean);
  if (exact) return exact;

  // Substring match for distinct course titles
  return OFFICIAL_COURSE_CATALOG.find(c => {
    const title = c.name.toLowerCase();
    return title.includes(clean) || clean.includes(title);
  }) || null;
}

/**
 * Gets all courses offered in Summer Term June 2026
 */
function getSummerCourses() {
  return OFFICIAL_COURSE_CATALOG.filter(c => c.isSummer);
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
  return COURSE_PREREQUISITES[clean] || [];
}

module.exports = {
  OFFICIAL_COURSE_CATALOG,
  COURSE_PREREQUISITES,
  findCourseByCode,
  findCourseByName,
  getSummerCourses,
  getCoursesByCredits,
  getCoursePrerequisites
};
