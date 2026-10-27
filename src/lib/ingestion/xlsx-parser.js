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

function cleanStr(val) {
  if (val === null || val === undefined) return '';
  return val.toString().trim().replace(/^["']|["']$/g, '').trim();
}

function parseSemesterSpreadWorkbook(filePath) {
  const wb = XLSX.readFile(filePath);
  const courses = [];
  const curriculumEntries = [];
  const prerequisites = [];
  const chunks = [];
  let chunkIdx = 0;

  const docName = 'Semester_Spread_Structures_Sept_2026.xlsx';

  // 1. Parse Semester Spread sheets
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
    for (let r = 2; r < Math.min(30, rows.length); r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      // Check if row declares a new basket
      const basketCandidate = sanitizeString(row[1] || row[0]);
      if (basketCandidate && basketCandidate.length > 2 && !/^\d+$/.test(basketCandidate) && !basketCandidate.toLowerCase().includes('total')) {
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

        if (!rawCode || rawCode.length < 3 || rawCode.toLowerCase().includes('total') || rawCode.toLowerCase() === 'nil') {
          continue;
        }

        const isUncertain = rawCode.toLowerCase().includes('don') || rawCode.toLowerCase().includes('tbd') || rawCode.toLowerCase() === 'tba';
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
          uncertaintyNote: isUncertain ? `Uncertain code in sheet ${sheetName}` : null,
          sourceReference: docName
        };
        courses.push(courseRecord);

        curriculumEntries.push({
          programCode: config.program,
          batch: config.batch,
          semesterNum: block.semesterNum,
          basketName: currentBasket,
          courseCode: rawCode.toUpperCase(),
          courseName: rawName || rawCode,
          credits: credits,
          prerequisite: rawPrereq || 'None',
          lectureHours: l,
          tutorialHours: t,
          practicalHours: p,
          isMandatory: true,
          sourceSheetName: sheetName
        });

        // Prerequisite extraction
        if (rawPrereq && !['NIL', 'NONE', 'N/A', '-'].includes(rawPrereq.toUpperCase())) {
          prerequisites.push({
            courseCode: rawCode.toUpperCase(),
            courseName: rawName || rawCode,
            rawPrerequisiteText: rawPrereq,
            batch: config.batch,
            programCode: config.program,
            isUncertain: rawPrereq.includes('/') || rawPrereq.includes(',') || rawPrereq.toLowerCase().includes('tbd'),
            sourceDocument: docName
          });
        }

        // RAG searchable chunk
        chunks.push({
          chunkIndex: chunkIdx++,
          documentName: docName,
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
            courseName: rawName,
            credits: credits,
            prerequisite: rawPrereq || 'None'
          }
        });
      }
    }
  }

  // 2. Parse Curriculum Structures (Struct_* sheets)
  const curriculumStructures = {};

  function parseStruct2022_2023(sheet, version, prog) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const basketCredits = {};
    for (let r = 2; r <= 9; r++) {
      const row = data[r] || [];
      const b = cleanStr(row[0]);
      const c = parseFloat(row[1]);
      if (b && !isNaN(c)) basketCredits[b] = c;
    }

    function getColList(startRow, endRow, nameCol, crCol) {
      const list = [];
      for (let r = startRow; r <= endRow; r++) {
        const row = data[r] || [];
        const name = cleanStr(row[nameCol]);
        const cr = parseFloat(row[crCol]);
        if (name && !name.toLowerCase().includes('total credits') && !isNaN(cr)) {
          list.push({ name, credits: cr });
        }
      }
      return list;
    }

    return {
      version,
      program: prog,
      totalCredits: 180,
      basketCredits,
      baskets: {
        universityCore: getColList(2, 10, 4, 5),
        foundation: getColList(1, 13, 8, 9),
        programCore: getColList(2, 14, 12, 13),
        programHonors: getColList(2, 7, 16, 17),
        specializationTracks: [
          { trackName: 'Applied Deep Learning', courses: getColList(1, 5, 20, 21) },
          { trackName: 'Full Stack Development', courses: getColList(1, 5, 24, 25) }
        ],
        capstone: getColList(2, 4, 28, 29)
      }
    };
  }

  function parseStruct2024(sheet) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const basketCredits = {};
    for (let r = 2; r <= 9; r++) {
      const row = data[r] || [];
      const b = cleanStr(row[12]);
      const c = parseFloat(row[13]);
      if (b && !isNaN(c)) basketCredits[b] = c;
    }

    function getColList(startRow, endRow, nameCol, crCol) {
      const list = [];
      for (let r = startRow; r <= endRow; r++) {
        const row = data[r] || [];
        const name = cleanStr(row[nameCol]);
        const cr = parseFloat(row[crCol]);
        if (name && !name.toLowerCase().includes('total credits') && !isNaN(cr)) {
          list.push({ name, credits: cr });
        }
      }
      return list;
    }

    return {
      version: '2024',
      program: 'BTECH_CSE',
      totalCredits: 180,
      basketCredits,
      baskets: {
        universityCore: getColList(2, 9, 1, 2),
        foundation: getColList(14, 25, 1, 2),
        programCore: getColList(2, 14, 5, 6),
        programHonors: getColList(18, 23, 5, 6),
        specializationTracks: [
          { trackName: 'Applied Deep Learning', courses: getColList(2, 6, 9, 10) },
          { trackName: 'Full Stack Development', courses: getColList(10, 14, 9, 10) }
        ],
        capstone: getColList(19, 21, 9, 10)
      }
    };
  }

  function parseStruct2025(sheet) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const basketCredits = {};
    for (let r = 2; r <= 9; r++) {
      const row = data[r] || [];
      const b = cleanStr(row[12]);
      const c = parseFloat(row[13]);
      if (b && !isNaN(c)) basketCredits[b] = c;
    }

    function getColList(startRow, endRow, nameCol, crCol) {
      const list = [];
      for (let r = startRow; r <= endRow; r++) {
        const row = data[r] || [];
        const name = cleanStr(row[nameCol]);
        const cr = parseFloat(row[crCol]);
        if (name && !name.toLowerCase().includes('total credits') && !isNaN(cr)) {
          list.push({ name, credits: cr });
        }
      }
      return list;
    }

    return {
      version: '2025',
      program: 'BTECH_CSE',
      totalCredits: 180,
      basketCredits,
      baskets: {
        universityCore: getColList(2, 12, 1, 2),
        foundation: getColList(16, 23, 1, 2),
        programCore: getColList(2, 14, 5, 6),
        programHonors: getColList(18, 22, 5, 6),
        specializationTracks: [
          { trackName: 'Applied Deep Learning', courses: getColList(2, 6, 9, 10) },
          { trackName: 'Full Stack Development', courses: getColList(10, 14, 9, 10) }
        ],
        capstone: getColList(19, 20, 9, 10)
      }
    };
  }

  function parseStruct2026(sheet) {
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const basketCredits = {};
    for (let r = 2; r <= 9; r++) {
      const row = data[r] || [];
      const b = cleanStr(row[12]);
      const c = parseFloat(row[13]);
      if (b && !isNaN(c)) basketCredits[b] = c;
    }

    function getColList(startRow, endRow, nameCol, crCol) {
      const list = [];
      for (let r = startRow; r <= endRow; r++) {
        const row = data[r] || [];
        const name = cleanStr(row[nameCol]);
        const cr = parseFloat(row[crCol]);
        if (name && !name.toLowerCase().includes('total credits') && !isNaN(cr)) {
          list.push({ name, credits: cr });
        }
      }
      return list;
    }

    return {
      version: '2026',
      program: 'BTECH_DS',
      totalCredits: 180,
      basketCredits,
      baskets: {
        universityCore: getColList(2, 9, 1, 2),
        foundation: getColList(13, 20, 1, 2),
        programCore: getColList(2, 15, 5, 6),
        programHonors: getColList(19, 23, 5, 6),
        electives: getColList(2, 9, 9, 10),
        capstone: getColList(14, 15, 9, 10)
      }
    };
  }

  if (wb.Sheets['Struct_2022']) curriculumStructures['2022'] = parseStruct2022_2023(wb.Sheets['Struct_2022'], '2022', 'BTECH_CSE');
  if (wb.Sheets['Struct_2023']) curriculumStructures['2023'] = parseStruct2022_2023(wb.Sheets['Struct_2023'], '2023', 'BTECH_CSE');
  if (wb.Sheets['Struct_2024']) curriculumStructures['2024'] = parseStruct2024(wb.Sheets['Struct_2024']);
  if (wb.Sheets['Struct_2025']) curriculumStructures['2025'] = parseStruct2025(wb.Sheets['Struct_2025']);
  if (wb.Sheets['Struct_2026_DS']) curriculumStructures['2026'] = parseStruct2026(wb.Sheets['Struct_2026_DS']);

  // Create RAG chunks for curriculum structures
  for (const [ver, struct] of Object.entries(curriculumStructures)) {
    const bcStr = Object.entries(struct.basketCredits).map(([b, c]) => `${b}: ${c} cr`).join(', ');
    chunks.push({
      chunkIndex: chunkIdx++,
      documentName: docName,
      sourceType: 'CURRICULUM_STRUCTURE',
      hierarchyLevel: 2,
      pageNumber: 1,
      sectionNumber: `Curriculum Structure - Batch ${ver} (${struct.program})`,
      clauseNumber: `Credit Architecture Batch ${ver}`,
      batchScope: [ver],
      program: struct.program,
      content: `Vidyashilp University Curriculum Structure for Batch ${ver} (${struct.program}): Total Credits for Degree Award = 180 credits. Basket Credit Allocation: ${bcStr}. Source Sheet: Struct_${ver === '2026' ? '2026_DS' : ver}.`,
      metadata: {
        version: ver,
        program: struct.program,
        totalCredits: 180,
        basketCredits: struct.basketCredits
      }
    });

    // Chunk for Foundation Courses
    if (struct.baskets.foundation && struct.baskets.foundation.length > 0) {
      const fList = struct.baskets.foundation.map((c, i) => `${i + 1}. ${c.name} (${c.credits} cr)`).join('; ');
      const totalFCr = struct.baskets.foundation.reduce((a, b) => a + b.credits, 0);
      chunks.push({
        chunkIndex: chunkIdx++,
        documentName: docName,
        sourceType: 'CURRICULUM_STRUCTURE',
        hierarchyLevel: 2,
        pageNumber: 1,
        sectionNumber: `Foundation Courses - Batch ${ver}`,
        clauseNumber: `Foundation Basket (Batch ${ver})`,
        batchScope: [ver],
        program: struct.program,
        content: `Foundation Courses for Batch ${ver} (${struct.program}) — Total Credits: ${totalFCr} (Basket Allocation: ${struct.basketCredits['Foundation'] || totalFCr} cr): ${fList}. Source: Struct_${ver === '2026' ? '2026_DS' : ver}.`,
        metadata: {
          version: ver,
          basket: 'Foundation',
          totalCredits: totalFCr,
          courses: struct.baskets.foundation
        }
      });
    }

    // Chunk for University Core Courses
    if (struct.baskets.universityCore && struct.baskets.universityCore.length > 0) {
      const ucList = struct.baskets.universityCore.map((c, i) => `${i + 1}. ${c.name} (${c.credits} cr)`).join('; ');
      const totalUCCr = struct.baskets.universityCore.reduce((a, b) => a + b.credits, 0);
      chunks.push({
        chunkIndex: chunkIdx++,
        documentName: docName,
        sourceType: 'CURRICULUM_STRUCTURE',
        hierarchyLevel: 2,
        pageNumber: 1,
        sectionNumber: `University Core Courses - Batch ${ver}`,
        clauseNumber: `University Core Basket (Batch ${ver})`,
        batchScope: [ver],
        program: struct.program,
        content: `University Core Courses for Batch ${ver} (${struct.program}) — Total Credits: ${totalUCCr} (Basket Allocation: ${struct.basketCredits['University Core'] || totalUCCr} cr): ${ucList}. Source: Struct_${ver === '2026' ? '2026_DS' : ver}.`,
        metadata: {
          version: ver,
          basket: 'University Core',
          totalCredits: totalUCCr,
          courses: struct.baskets.universityCore
        }
      });
    }

    // Chunk for Program Core Courses
    if (struct.baskets.programCore && struct.baskets.programCore.length > 0) {
      const pcList = struct.baskets.programCore.map((c, i) => `${i + 1}. ${c.name} (${c.credits} cr)`).join('; ');
      const totalPCCr = struct.baskets.programCore.reduce((a, b) => a + b.credits, 0);
      chunks.push({
        chunkIndex: chunkIdx++,
        documentName: docName,
        sourceType: 'CURRICULUM_STRUCTURE',
        hierarchyLevel: 2,
        pageNumber: 1,
        sectionNumber: `Program Core Courses - Batch ${ver}`,
        clauseNumber: `Program Core Basket (Batch ${ver})`,
        batchScope: [ver],
        program: struct.program,
        content: `Program Core Courses for Batch ${ver} (${struct.program}) — Total Credits: ${totalPCCr} (Basket Allocation: ${struct.basketCredits['Program Core'] || totalPCCr} cr): ${pcList}. Source: Struct_${ver === '2026' ? '2026_DS' : ver}.`,
        metadata: {
          version: ver,
          basket: 'Program Core',
          totalCredits: totalPCCr,
          courses: struct.baskets.programCore
        }
      });
    }

    // Chunk for Program Honors / Electives
    if (struct.baskets.programHonors && struct.baskets.programHonors.length > 0) {
      const phList = struct.baskets.programHonors.map((c, i) => `${i + 1}. ${c.name} (${c.credits} cr)`).join('; ');
      chunks.push({
        chunkIndex: chunkIdx++,
        documentName: docName,
        sourceType: 'CURRICULUM_STRUCTURE',
        hierarchyLevel: 2,
        pageNumber: 1,
        sectionNumber: `Program Honors Courses - Batch ${ver}`,
        clauseNumber: `Program Honors Basket (Batch ${ver})`,
        batchScope: [ver],
        program: struct.program,
        content: `Program Honors Courses for Batch ${ver} (${struct.program}) — Total Credits: ${struct.basketCredits['Program Honors'] || 20} cr: ${phList}. Source: Struct_${ver === '2026' ? '2026_DS' : ver}.`,
        metadata: {
          version: ver,
          basket: 'Program Honors',
          courses: struct.baskets.programHonors
        }
      });
    }

    if (struct.baskets.electives && struct.baskets.electives.length > 0) {
      const elList = struct.baskets.electives.map((c, i) => `${i + 1}. ${c.name} (${c.credits} cr)`).join('; ');
      chunks.push({
        chunkIndex: chunkIdx++,
        documentName: docName,
        sourceType: 'CURRICULUM_STRUCTURE',
        hierarchyLevel: 2,
        pageNumber: 1,
        sectionNumber: `Electives - Batch ${ver}`,
        clauseNumber: `Electives Basket (Batch ${ver})`,
        batchScope: [ver],
        program: struct.program,
        content: `Elective Courses for Batch ${ver} (${struct.program}) — Total Credits: ${struct.basketCredits['Electives'] || 20} cr: ${elList}. Source: Struct_2026_DS.`,
        metadata: {
          version: ver,
          basket: 'Electives',
          courses: struct.baskets.electives
        }
      });
    }
  }

  // Curriculum Version Comparison Chunks
  chunks.push({
    chunkIndex: chunkIdx++,
    documentName: docName,
    sourceType: 'CURRICULUM_STRUCTURE',
    hierarchyLevel: 2,
    pageNumber: 1,
    sectionNumber: 'Curriculum Evolution & Version Comparison (Batches 2022 to 2026)',
    clauseNumber: 'Curriculum Comparison',
    batchScope: ['2022', '2023', '2024', '2025', '2026'],
    content: `Vidyashilp University Curriculum Version Comparison across Batches 2022, 2023, 2024, 2025, and 2026 DS:
1. Total Credits for Degree Award: Exactly 180 credits across all curriculum versions.
2. Foundation Courses: 34 credits in Batches 2022, 2023, and 2024; reduced to 24 credits in Batch 2025; adjusted to 26 credits in Batch 2026 DS.
3. University Core: 18 credits in Batches 2022, 2023, and 2024; expanded to 24 credits in Batch 2025 (adding Environmental Studies, Humanistic Leadership, Analytical Academic Writing); adjusted to 18 credits in Batch 2026 DS.
4. Program Core: 46 credits in Batches 2022, 2023, 2024, and 2025; expanded to 50 credits in Batch 2026 DS (adding Compiler Design, 3 credits, and Operating Systems becoming 4 credits).
5. Program Honors: Exactly 20 credits across all batches (2022 to 2026).
6. Minor / Open: 24 credits in Batches 2022, 2023, and 2024; increased to 32 credits in Batches 2025 and 2026 DS.
7. Internship / Capstone: 18 credits in Batches 2022, 2023, and 2024; reduced to 14 credits in Batches 2025 and 2026 DS.
Source: Semester_Spread_Structures_Sept_2026.xlsx (Struct sheets).`,
    metadata: {
      type: 'CURRICULUM_COMPARISON',
      totalCredits: 180
    }
  });

  return {
    courses,
    curriculumEntries,
    prerequisites,
    curriculumStructures,
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
        }
      });
    }
  }

  return {
    minorCourses,
    chunks
  };
}

function parseFacultyInchargeWorkbook(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets['Faculty Incharge'] || wb.Sheets[wb.SheetNames[0]];
  const chunks = [];
  const facultyMappings = [];
  let chunkIdx = 0;

  if (sheet) {
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length < 4) continue;
      const code = sanitizeString(row[1]);
      const name = sanitizeString(row[2]);
      const faculty = sanitizeString(row[3]);

      if (code && /^[A-Z]{3,4}\d{3}/.test(code)) {
        facultyMappings.push({ courseCode: code, courseName: name, facultyIncharge: faculty });
        chunks.push({
          chunkIndex: chunkIdx++,
          documentName: 'Faculty Assigned - F Cases - May Exam 2026 - Final.xlsx',
          sourceType: 'FACULTY_ASSIGNMENT',
          hierarchyLevel: 3,
          pageNumber: 1,
          sectionNumber: 'Faculty Incharge - Special Provision Exam (F Grade)',
          clauseNumber: code,
          batchScope: ['2022', '2023', '2024', '2025', '2026'],
          content: `Special Provision Examination for F Grade (May Exam 2026): Course Code: ${code} | Course Name: ${name} | Faculty Incharge: ${faculty}.`,
          metadata: { courseCode: code, facultyIncharge: faculty, examTerm: 'May Exam 2026' }
        });
      }
    }
  }

  return { facultyMappings, chunks };
}

module.exports = {
  parseSemesterSpreadWorkbook,
  parseMinorCoursesWorkbook,
  parseFacultyInchargeWorkbook
};

