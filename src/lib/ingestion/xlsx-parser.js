/**
 * XLSX Parsing Module for VU Academic Advisor
 * Ingests:
 * 1. 118225_Semester_Spread_Structures_Sept_2026.xlsx (Canonical curriculum)
 * 2. 118351_Minor Courses for BTech_Students.xlsx (Minor tracks)
 * 
 * STRICT RULES:
 * - Never merge batches.
 * - Preserve uncertainty ("DON'T KNOW", "TBD").
 * - Preserve L-T-P-C, semester numbers, and raw prerequisite strings.
 */

const XLSX = require('xlsx');

// Semester column mappings for the semester spread sheets
const SEMESTER_BLOCKS = [
  { semesterNum: 1, startCol: 4, name: 'S1' },
  { semesterNum: 2, startCol: 11, name: 'S2' },
  { semesterNum: 3, startCol: 19, name: 'S3' },
  { semesterNum: 4, startCol: 26, name: 'S4' },
  { semesterNum: 5, startCol: 34, name: 'S5' },
  { semesterNum: 6, startCol: 41, name: 'S6' },
  { semesterNum: 7, startCol: 49, name: 'S7' },
  { semesterNum: 8, startCol: 56, name: 'S8' }
];

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

function parseSemesterSpreadWorkbook(filePath) {
  const wb = XLSX.readFile(filePath);
  const courses = [];
  const curriculumEntries = [];
  const prerequisites = [];
  const chunks = [];
  let chunkIdx = 0;

  const batchMap = {
    'Sem Spread BTECH-2022': { batch: '2022', program: 'BTECH_CSE' },
    'Sem_Spread_2023': { batch: '2023', program: 'BTECH_CSE' },
    'Sem_Spread_2024': { batch: '2024', program: 'BTECH_CSE' },
    'Sem_Spread_2025': { batch: '2025', program: 'BTECH_CSE' },
    'Sem_Spread_DS_2026': { batch: '2026', program: 'BTECH_DS' }
  };

  for (const [sheetName, config] of Object.entries(batchMap)) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    let currentBasket = 'General';

    // Data starts from row 2
    for (let r = 2; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      // Check if row declares a new basket
      const basketCandidate = sanitizeString(row[1] || row[0]);
      if (basketCandidate && basketCandidate.length > 2 && !/^\d+$/.test(basketCandidate)) {
        currentBasket = basketCandidate;
      }

      // Process each semester block
      for (const block of SEMESTER_BLOCKS) {
        const rawCode = sanitizeString(row[block.startCol]);
        const rawName = sanitizeString(row[block.startCol + 1]);
        const rawPrereq = sanitizeString(row[block.startCol + 2]);
        const rawL = row[block.startCol + 3];
        const rawT = row[block.startCol + 4];
        const rawP = row[block.startCol + 5];
        const rawC = row[block.startCol + 6];

        if (!rawCode || rawCode.length < 3 || rawCode.toLowerCase().includes('total')) {
          continue;
        }

        const isUncertain = rawCode.toLowerCase().includes('don') || rawCode.toLowerCase().includes('tbd');
        const credits = typeof rawC === 'number' ? rawC : parseFloat(rawC) || 0;
        const l = typeof rawL === 'number' ? rawL : parseInt(rawL, 10) || 0;
        const t = typeof rawT === 'number' ? rawT : parseInt(rawT, 10) || 0;
        const p = typeof rawP === 'number' ? rawP : parseInt(rawP, 10) || 0;

        const courseRecord = {
          courseCode: rawCode.toUpperCase(),
          courseName: rawName || rawCode,
          credits: credits,
          lectureHours: l,
          tutorialHours: t,
          practicalHours: p,
          hasUncertainCode: isUncertain,
          uncertaintyNote: isUncertain ? `Uncertain code in sheet ${sheetName}` : null
        };
        courses.push(courseRecord);

        curriculumEntries.push({
          programCode: config.program,
          batch: config.batch,
          semesterNum: block.semesterNum,
          basketName: currentBasket,
          courseCode: rawCode.toUpperCase(),
          credits: credits,
          isMandatory: true,
          sourceSheetName: sheetName
        });

        // Prerequisite extraction
        if (rawPrereq && !['NIL', 'NONE', 'N/A', '-'].includes(rawPrereq.toUpperCase())) {
          prerequisites.push({
            courseCode: rawCode.toUpperCase(),
            rawPrerequisiteText: rawPrereq,
            batch: config.batch,
            programCode: config.program,
            isUncertain: rawPrereq.includes('/') || rawPrereq.includes(',') || rawPrereq.toLowerCase().includes('tbd'),
            sourceDocument: '118225_Semester_Spread_Structures_Sept_2026.xlsx'
          });
        }

        // RAG searchable chunk
        chunks.push({
          chunkIndex: chunkIdx++,
          documentName: '118225_Semester_Spread_Structures_Sept_2026.xlsx',
          sourceType: 'CURRICULUM_STRUCTURE',
          hierarchyLevel: 2,
          pageNumber: block.semesterNum,
          sectionNumber: `${config.program} Batch ${config.batch}`,
          clauseNumber: `Semester ${block.semesterNum} - ${currentBasket}`,
          batchScope: [config.batch],
          program: config.program,
          content: `Program: ${config.program} | Batch: ${config.batch} | Semester: ${block.semesterNum} | Basket: ${currentBasket} | Course Code: ${rawCode.toUpperCase()} | Course Name: ${rawName} | Credits: ${credits} (L:${l}, T:${t}, P:${p}) | Prerequisite: ${rawPrereq || 'None'} | Source: ${sheetName}`,
          metadata: {
            program: config.program,
            batch: config.batch,
            semester: block.semesterNum,
            basket: currentBasket,
            courseCode: rawCode.toUpperCase(),
            credits: credits,
            prerequisite: rawPrereq || 'None'
          }
        });
      }
    }
  }

  return {
    courses,
    curriculumEntries,
    prerequisites,
    chunks
  };
}

function parseMinorCoursesWorkbook(filePath) {
  const wb = XLSX.readFile(filePath);
  const minorCourses = [];
  const chunks = [];
  let chunkIdx = 0;

  const minorMap = {
    'Law Minor': { code: 'MINOR_LAW', name: 'Law Minor' },
    'Design Minor': { code: 'MINOR_DESIGN', name: 'Design Minor' },
    'Psychology': { code: 'MINOR_PSYCHOLOGY', name: 'Psychology Minor' },
    'Economics': { code: 'MINOR_ECONOMICS', name: 'Economics Minor' },
    'Finance': { code: 'MINOR_FINANCE', name: 'Finance Minor' },
    'Marketing': { code: 'MINOR_MARKETING', name: 'Marketing Minor' },
    'Start-up': { code: 'MINOR_STARTUP', name: 'Start-up Minor' }
  };

  for (const [sheetName, minorInfo] of Object.entries(minorMap)) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    let currentBatch = '2022'; // default starting batch

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      // Check if row defines a batch header (e.g. '2022 Batch', '2023 Batch')
      for (const cell of row) {
        if (typeof cell === 'string') {
          const batchMatch = cell.match(/(\d{4})\s*Batch/i);
          if (batchMatch) {
            currentBatch = batchMatch[1];
          }
        }
      }

      // Check course row: looks for course code or title
      let code = '';
      let title = '';
      let sem = 0;
      let cred = 0;
      let prereq = 'Nil';

      for (let c = 0; c < row.length; c++) {
        const val = row[c];
        if (typeof val === 'string') {
          if (/^[A-Z]{3,4}\d{3}/.test(val.trim())) {
            code = val.trim();
          } else if (val.toLowerCase().includes('don’t know') || val.toLowerCase().includes("don't know")) {
            code = "DON'T KNOW";
          } else if (val.toLowerCase().trim() === 'tbd') {
            code = 'TBD';
          }
        }
      }

      if (!code) continue;

      // Find title, semester, credits, prereq in row
      for (let c = 0; c < row.length; c++) {
        const val = row[c];
        if (typeof val === 'string' && val.length > 5 && val !== code) {
          if (!title) title = val.trim();
          else if (!prereq || prereq === 'Nil') prereq = val.trim();
        } else if (typeof val === 'number') {
          if (val >= 3 && val <= 8 && sem === 0) {
            sem = val;
          } else if (val >= 1 && val <= 6 && cred === 0) {
            cred = val;
          }
        }
      }

      const isUncertain = code === "DON'T KNOW" || code === 'TBD';

      const minorRecord = {
        minorCode: minorInfo.code,
        minorName: minorInfo.name,
        batch: currentBatch,
        semesterNum: sem || 5,
        courseCode: code,
        courseName: title || code,
        credits: cred || 3,
        rawPrerequisiteText: prereq,
        isUncertain: isUncertain,
        sourceSheetName: sheetName
      };

      minorCourses.push(minorRecord);

      chunks.push({
        chunkIndex: chunkIdx++,
        documentName: '118351_Minor Courses for BTech_Students.xlsx',
        sourceType: 'CURRICULUM_STRUCTURE',
        hierarchyLevel: 2,
        pageNumber: sem || 5,
        sectionNumber: `${minorInfo.name} (Batch ${currentBatch})`,
        clauseNumber: `Semester ${sem || 5} - ${code}`,
        batchScope: [currentBatch],
        content: `Minor: ${minorInfo.name} | Batch: ${currentBatch} | Semester: ${sem || 5} | Course Code: ${code} | Course Title: ${title || code} | Credits: ${cred || 3} | Prerequisite: ${prereq} | Uncertainty Flag: ${isUncertain ? 'YES (Pending formal code/prereq assignment)' : 'NO'} | Source Sheet: ${sheetName}`,
        metadata: {
          minorCode: minorInfo.code,
          batch: currentBatch,
          semester: sem || 5,
          courseCode: code,
          isUncertain: isUncertain
        }
      });
    }
  }

  return {
    minorCourses,
    chunks
  };
}

module.exports = {
  parseSemesterSpreadWorkbook,
  parseMinorCoursesWorkbook
};
