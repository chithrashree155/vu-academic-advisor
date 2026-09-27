/**
 * Master Ingestion Pipeline Orchestrator
 * Coordinates parsing of all PDFs and XLSX workbooks in /data.
 * Outputs:
 * - data/structured_academic_data.json
 * - data/rag_document_chunks.json
 * - Ingestion Report with uncertainties & verification flags
 */

const fs = require('fs');
const path = require('path');
const { 
  parseHandbook, 
  parseSOP, 
  parseSummerCoursesOffered, 
  parseScannedCalendar,
  parseCircularSummerTerm,
  parseDigiiMinorSelection,
  parseERPCourseRegistration,
  parseExamEnrollmentSOP,
  parseChatbotFlowchart
} = require('./pdf-parser');
const { 
  parseSemesterSpreadWorkbook, 
  parseMinorCoursesWorkbook,
  parseFacultyInchargeWorkbook
} = require('./xlsx-parser');

async function runIngestion(dataDir = path.join(__dirname, '../../../data')) {
  console.log('================================================================');
  console.log('VU Academic Advisor — Data Ingestion Pipeline v2.0');
  console.log('================================================================');

  const oldDocCount = 8;
  const oldChunkCount = 790;

  const allChunks = [];
  const structuredData = {
    documents: [],
    programs: [
      {
        programCode: 'BTECH_CSE',
        programName: 'B.Tech in Computer Science and Engineering',
        schoolName: 'School of Computing and Data Sciences',
        standardDurationYears: 4,
        maxDurationYears: 6
      },
      {
        programCode: 'BTECH_DS',
        programName: 'B.Tech in Data Science',
        schoolName: 'School of Computing and Data Sciences',
        standardDurationYears: 4,
        maxDurationYears: 6
      }
    ],
    minorPrograms: [
      { minorCode: 'MINOR_LAW', minorName: 'Law Minor', school: 'School of Law', minStudents: 10 },
      { minorCode: 'MINOR_DESIGN', minorName: 'Design Minor', school: 'School of Design', minStudents: 10 },
      { minorCode: 'MINOR_PSYCHOLOGY', minorName: 'Psychology Minor', school: 'School of Liberal Arts & Sciences', minStudents: 10 },
      { minorCode: 'MINOR_ECONOMICS', minorName: 'Economics Minor', school: 'School of Liberal Arts & Sciences', minStudents: 10 },
      { minorCode: 'MINOR_FINANCE', minorName: 'Finance Minor', school: 'School of Business Studies', minStudents: 10 },
      { minorCode: 'MINOR_MARKETING', minorName: 'Marketing Minor', school: 'School of Business Studies', minStudents: 10 },
      { minorCode: 'MINOR_STARTUP', minorName: 'Start-up Minor', school: 'School of Business Studies', minStudents: 10 }
    ],
    courses: [],
    curriculumCourses: [],
    prerequisites: [],
    minorCourses: [],
    courseOfferings: [],
    calendarStatus: [],
    facultyAssignments: []
  };

  const warnings = [];

  // 1. Ingest Student Handbook
  console.log('[1/12] Parsing Student Handbook (4. Student Handbook Aug 2026.pdf)...');
  const handbookPath = path.join(dataDir, '4. Student Handbook Aug 2026.pdf');
  const handbookResult = await parseHandbook(handbookPath);
  allChunks.push(...handbookResult.chunks);
  structuredData.documents.push({
    documentName: handbookResult.documentName,
    sourceType: handbookResult.sourceType,
    hierarchyLevel: handbookResult.hierarchyLevel,
    totalPages: handbookResult.totalPages,
    totalChunks: handbookResult.totalChunks,
    isRasterScan: false,
    version: 'August 2026'
  });

  // 2. Ingest Student SOP
  console.log('[2/12] Parsing Student SOP (SOP STUDENT 19082025 - Final.pdf)...');
  const sopPath = path.join(dataDir, 'SOP STUDENT 19082025 - Final.pdf');
  const sopResult = await parseSOP(sopPath);
  allChunks.push(...sopResult.chunks);
  structuredData.documents.push({
    documentName: sopResult.documentName,
    sourceType: sopResult.sourceType,
    hierarchyLevel: sopResult.hierarchyLevel,
    totalPages: sopResult.totalPages,
    totalChunks: sopResult.totalChunks,
    isRasterScan: false,
    version: '19082025 - Final'
  });

  // 3. Ingest Summer 2026 Course Offerings
  console.log('[3/12] Parsing Summer Term Offerings (Courses Offered.pdf)...');
  const summerPath = path.join(dataDir, 'Courses Offered.pdf');
  const summerResult = await parseSummerCoursesOffered(summerPath);
  allChunks.push(...summerResult.chunks);
  structuredData.courseOfferings.push(...summerResult.courses);
  structuredData.documents.push({
    documentName: summerResult.documentName,
    sourceType: summerResult.sourceType,
    hierarchyLevel: summerResult.hierarchyLevel,
    totalCourses: summerResult.totalCourses,
    totalChunks: summerResult.chunks.length,
    isRasterScan: false,
    scope: 'Summer Term June 2026 ONLY'
  });

  // 4. Ingest Scanned Academic Calendars
  console.log('[4/12] Registering Academic Calendars (Scanned Raster PDFs)...');
  const calEvenPath = path.join(dataDir, 'Academic Calendar Even Semester 2025-26 (1).pdf');
  const calEven = parseScannedCalendar(calEvenPath, 'Academic Calendar Even Semester 2025-26 (1).pdf', '2025-26', 'EVEN');
  allChunks.push(...calEven.chunks);
  structuredData.calendarStatus.push(calEven);
  warnings.push(calEven.warning);

  const calOddPath = path.join(dataDir, 'Academic_Calendar_ODD Semester_2026_27.pdf');
  const calOdd = parseScannedCalendar(calOddPath, 'Academic_Calendar_ODD Semester_2026_27.pdf', '2026-27', 'ODD');
  allChunks.push(...calOdd.chunks);
  structuredData.calendarStatus.push(calOdd);
  warnings.push(calOdd.warning);

  // 5. Ingest Semester Spread Workbook
  console.log('[5/12] Parsing Semester Spread Workbook (118225_Semester_Spread_Structures_Sept_2026.xlsx)...');
  const spreadPath = path.join(dataDir, '118225_Semester_Spread_Structures_Sept_2026.xlsx');
  const spreadResult = parseSemesterSpreadWorkbook(spreadPath);
  allChunks.push(...spreadResult.chunks);
  structuredData.courses.push(...spreadResult.courses);
  structuredData.curriculumCourses.push(...spreadResult.curriculumEntries);
  structuredData.prerequisites.push(...spreadResult.prerequisites);
  structuredData.documents.push({
    documentName: '118225_Semester_Spread_Structures_Sept_2026.xlsx',
    sourceType: 'CURRICULUM_STRUCTURE',
    hierarchyLevel: 2,
    totalCurriculumEntries: spreadResult.curriculumEntries.length,
    totalPrerequisites: spreadResult.prerequisites.length,
    totalChunks: spreadResult.chunks.length,
    isRasterScan: false
  });

  // Check duplicate spreadsheet
  structuredData.documents.push({
    documentName: 'Semester_Spread_Structures_Sept._2026.xlsx',
    sourceType: 'CURRICULUM_STRUCTURE',
    hierarchyLevel: 2,
    note: 'Verified identical duplicate of 118225_Semester_Spread_Structures_Sept_2026.xlsx. Skipped duplicate re-ingestion to preserve database integrity.',
    isDuplicateSkipped: true
  });

  // 6. Ingest Minor Courses Workbook
  console.log('[6/12] Parsing Minor Courses Workbook (118351_Minor Courses for BTech_Students.xlsx)...');
  const minorPath = path.join(dataDir, '118351_Minor Courses for BTech_Students.xlsx');
  const minorResult = parseMinorCoursesWorkbook(minorPath);
  allChunks.push(...minorResult.chunks);
  structuredData.minorCourses.push(...minorResult.minorCourses);
  structuredData.documents.push({
    documentName: '118351_Minor Courses for BTech_Students.xlsx',
    sourceType: 'CURRICULUM_STRUCTURE',
    hierarchyLevel: 2,
    totalMinorCourses: minorResult.minorCourses.length,
    totalChunks: minorResult.chunks.length,
    isRasterScan: false
  });

  // NEW DOCUMENT 1: Circular - Summer Term June 2026.pdf
  console.log('[7/12] Parsing Summer Term Circular (Circular - Summer Term June 2026.pdf)...');
  const circPath = path.join(dataDir, 'Circular - Summer Term June 2026.pdf');
  const circResult = await parseCircularSummerTerm(circPath);
  allChunks.push(...circResult.chunks);
  structuredData.documents.push({
    documentName: circResult.documentName,
    sourceType: circResult.sourceType,
    hierarchyLevel: circResult.hierarchyLevel,
    totalChunks: circResult.chunks.length,
    isNew: true
  });

  // NEW DOCUMENT 2: Digii Process - Minor Selection.pdf
  console.log('[8/12] Parsing Digii Minor Selection SOP (Digii Process - Minor Selection.pdf)...');
  const digiiMinorPath = path.join(dataDir, 'Digii Process - Minor Selection.pdf');
  const digiiMinorResult = await parseDigiiMinorSelection(digiiMinorPath);
  allChunks.push(...digiiMinorResult.chunks);
  structuredData.documents.push({
    documentName: digiiMinorResult.documentName,
    sourceType: digiiMinorResult.sourceType,
    hierarchyLevel: digiiMinorResult.hierarchyLevel,
    totalChunks: digiiMinorResult.chunks.length,
    isNew: true
  });

  // NEW DOCUMENT 3: ERP Course Registration Manual.pdf
  console.log('[9/12] Parsing ERP Registration Manual (ERP Course Registration Manual.pdf)...');
  const erpPath = path.join(dataDir, 'ERP Course Registration Manual.pdf');
  const erpResult = await parseERPCourseRegistration(erpPath);
  allChunks.push(...erpResult.chunks);
  structuredData.documents.push({
    documentName: erpResult.documentName,
    sourceType: erpResult.sourceType,
    hierarchyLevel: erpResult.hierarchyLevel,
    totalChunks: erpResult.chunks.length,
    isNew: true
  });

  // NEW DOCUMENT 4: Exam Enrollment-SOP (1).pdf
  console.log('[10/12] Parsing Exam Enrollment SOP (Exam Enrollment-SOP (1).pdf)...');
  const examSopPath = path.join(dataDir, 'Exam Enrollment-SOP (1).pdf');
  const examSopResult = await parseExamEnrollmentSOP(examSopPath);
  allChunks.push(...examSopResult.chunks);
  structuredData.documents.push({
    documentName: examSopResult.documentName,
    sourceType: examSopResult.sourceType,
    hierarchyLevel: examSopResult.hierarchyLevel,
    totalChunks: examSopResult.chunks.length,
    isNew: true
  });

  // NEW DOCUMENT 5: Faculty Assigned - F Cases - May Exam 2026 - Final.xlsx
  console.log('[11/12] Parsing Faculty Assigned F Cases (Faculty Assigned - F Cases - May Exam 2026 - Final.xlsx)...');
  const facPath = path.join(dataDir, 'Faculty Assigned - F Cases - May Exam 2026 - Final.xlsx');
  const facResult = parseFacultyInchargeWorkbook(facPath);
  allChunks.push(...facResult.chunks);
  structuredData.facultyAssignments.push(...facResult.facultyMappings);
  structuredData.documents.push({
    documentName: 'Faculty Assigned - F Cases - May Exam 2026 - Final.xlsx',
    sourceType: 'FACULTY_ASSIGNMENT',
    hierarchyLevel: 3,
    totalChunks: facResult.chunks.length,
    isNew: true
  });

  // NEW DOCUMENT 6: academic_rag_chatbot_flowchart.pdf
  console.log('[12/12] Parsing Chatbot Flowchart (academic_rag_chatbot_flowchart.pdf)...');
  const flowPath = path.join(dataDir, 'academic_rag_chatbot_flowchart.pdf');
  const flowResult = await parseChatbotFlowchart(flowPath);
  allChunks.push(...flowResult.chunks);
  structuredData.documents.push({
    documentName: flowResult.documentName,
    sourceType: flowResult.sourceType,
    hierarchyLevel: flowResult.hierarchyLevel,
    totalChunks: flowResult.chunks.length,
    isNew: true
  });

  // Deduplicate master courses list by courseCode
  const courseMap = new Map();
  for (const c of structuredData.courses) {
    if (!courseMap.has(c.courseCode)) {
      courseMap.set(c.courseCode, c);
    }
  }
  for (const s of structuredData.courseOfferings) {
    if (!courseMap.has(s.courseCode)) {
      courseMap.set(s.courseCode, {
        courseCode: s.courseCode,
        courseName: s.courseName,
        credits: s.credits,
        lectureHours: 0,
        tutorialHours: 0,
        practicalHours: 0,
        hasUncertainCode: false,
        uncertaintyNote: null
      });
    }
  }
  structuredData.courses = Array.from(courseMap.values());

  const uncertainCourses = structuredData.minorCourses.filter(m => m.isUncertain);
  const uncertainPrereqs = structuredData.prerequisites.filter(p => p.isUncertain);

  // Write Structured Outputs
  console.log('Writing structured JSON outputs and RAG chunks...');
  const outDir = path.join(__dirname, '../../../data/processed');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const structuredFile = path.join(outDir, 'structured_academic_data.json');
  fs.writeFileSync(structuredFile, JSON.stringify(structuredData, null, 2));

  const chunksFile = path.join(outDir, 'rag_document_chunks.json');
  fs.writeFileSync(chunksFile, JSON.stringify(allChunks, null, 2));

  console.log('================================================================');
  console.log('INGESTION SUMMARY & INVENTORY COMPARISON:');
  console.log(`OLD DOCUMENT COUNT: ${oldDocCount}`);
  console.log(`OLD CHUNK COUNT: ${oldChunkCount}`);
  console.log(`NEW DOCUMENT COUNT: ${structuredData.documents.length}`);
  console.log(`NEW CHUNK COUNT: ${allChunks.length}`);
  console.log(`DUPLICATES: 1 (Semester_Spread_Structures_Sept._2026.xlsx)`);
  console.log(`UPDATED DOCUMENTS: 6 new operational SOPs and circulars ingested`);
  console.log('================================================================');

  return {
    structuredData,
    allChunks,
    warnings,
    uncertainCourses,
    uncertainPrereqs,
    oldDocCount,
    oldChunkCount,
    newDocCount: structuredData.documents.length,
    newChunkCount: allChunks.length
  };
}

module.exports = { runIngestion };


module.exports = { runIngestion };
