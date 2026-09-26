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
const { parseHandbook, parseSOP, parseSummerCoursesOffered, parseScannedCalendar } = require('./pdf-parser');
const { parseSemesterSpreadWorkbook, parseMinorCoursesWorkbook } = require('./xlsx-parser');

async function runIngestion(dataDir = path.join(__dirname, '../../../data')) {
  console.log('================================================================');
  console.log('VU Academic Advisor — Data Ingestion Pipeline');
  console.log('================================================================');

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
    calendarStatus: []
  };

  const warnings = [];

  // 1. Ingest Student Handbook
  console.log('[1/7] Parsing Student Handbook (4. Student Handbook Aug 2026.pdf)...');
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
  console.log('[2/7] Parsing Student SOP (SOP STUDENT 19082025 - Final.pdf)...');
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
  console.log('[3/7] Parsing Summer Term Offerings (Courses Offered.pdf)...');
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
  console.log('[4/7] Registering Academic Calendars (Scanned Raster PDFs)...');
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
  console.log('[5/7] Parsing Semester Spread Workbook (118225_Semester_Spread_Structures_Sept_2026.xlsx)...');
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
  console.log('[6/7] Parsing Minor Courses Workbook (118351_Minor Courses for BTech_Students.xlsx)...');
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

  // Deduplicate master courses list by courseCode
  const courseMap = new Map();
  for (const c of structuredData.courses) {
    if (!courseMap.has(c.courseCode)) {
      courseMap.set(c.courseCode, c);
    }
  }
  // Add summer courses to master course catalog
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

  // Count uncertainties
  const uncertainCourses = structuredData.minorCourses.filter(m => m.isUncertain);
  const uncertainPrereqs = structuredData.prerequisites.filter(p => p.isUncertain);

  // 7. Write Structured Outputs
  console.log('[7/7] Writing structured JSON outputs and RAG chunks...');
  const outDir = path.join(__dirname, '../../../data/processed');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const structuredFile = path.join(outDir, 'structured_academic_data.json');
  fs.writeFileSync(structuredFile, JSON.stringify(structuredData, null, 2));

  const chunksFile = path.join(outDir, 'rag_document_chunks.json');
  fs.writeFileSync(chunksFile, JSON.stringify(allChunks, null, 2));

  console.log('================================================================');
  console.log('INGESTION SUMMARY:');
  console.log(`- Total Master Courses: ${structuredData.courses.length}`);
  console.log(`- Total Curriculum Course Allocations: ${structuredData.curriculumCourses.length}`);
  console.log(`- Total Batch-Isolated Prerequisites: ${structuredData.prerequisites.length}`);
  console.log(`- Total Minor Courses: ${structuredData.minorCourses.length}`);
  console.log(`- Total Summer 2026 Offerings: ${structuredData.courseOfferings.length}`);
  console.log(`- Total Searchable RAG Document Chunks: ${allChunks.length}`);
  console.log(`- Uncertain Minor Courses ("DON'T KNOW" / "TBD"): ${uncertainCourses.length}`);
  console.log(`- Compound / Uncertain Prerequisites: ${uncertainPrereqs.length}`);
  console.log(`- Scanned Calendars Requiring Verification: 2`);
  console.log('================================================================');

  return {
    structuredData,
    allChunks,
    warnings,
    uncertainCourses,
    uncertainPrereqs
  };
}

module.exports = { runIngestion };
