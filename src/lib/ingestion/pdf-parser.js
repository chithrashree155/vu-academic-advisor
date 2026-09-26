/**
 * PDF Parsing & Chunking Module
 * Extracts text, preserves page numbers, sections, clauses, and document metadata.
 * Flags scanned PDFs as pending_verification.
 */

const fs = require('fs');
const pdfParse = require('pdf-parse');

async function parseHandbook(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  
  // Custom page renderer to track page numbers
  const pageTexts = [];
  const options = {
    pagerender: function (pageData) {
      return pageData.getTextContent().then(function (textContent) {
        let lastY, text = '';
        for (let item of textContent.items) {
          if (lastY === item.transform[5] || !lastY) {
            text += item.str + ' ';
          } else {
            text += '\n' + item.str + ' ';
          }
          lastY = item.transform[5];
        }
        pageTexts.push({
          pageNumber: pageTexts.length + 1,
          text: text.trim()
        });
        return text;
      });
    }
  };

  await pdfParse(dataBuffer, options);

  const chunks = [];
  let chunkIndex = 0;

  for (const page of pageTexts) {
    if (!page.text || page.text.length < 20) continue;

    // Detect section or clause headers
    const lines = page.text.split('\n').map(l => l.trim()).filter(Boolean);
    let currentSection = 'General';
    let currentClause = '';

    for (const line of lines) {
      if (/^SECTION\s+[IVX]+/i.test(line)) {
        currentSection = line;
      } else if (/^\d+\.\d+/.test(line)) {
        currentClause = line.slice(0, 30);
      }
    }

    // Split page into manageable chunks (~400-600 characters) respecting paragraph breaks
    const paragraphs = page.text.split(/\n\s*\n/).filter(p => p.trim().length > 30);

    if (paragraphs.length === 0) {
      chunks.push({
        chunkIndex: chunkIndex++,
        documentName: '4. Student Handbook Aug 2026.pdf',
        sourceType: 'STUDENT_HANDBOOK',
        hierarchyLevel: 1,
        pageNumber: page.pageNumber,
        sectionNumber: currentSection,
        clauseNumber: currentClause,
        batchScope: ['2022', '2023', '2024', '2025', '2026'],
        content: page.text.trim(),
        metadata: {
          academicYear: '2026-27',
          version: 'August 2026',
        }
      });
    } else {
      for (const para of paragraphs) {
        chunks.push({
          chunkIndex: chunkIndex++,
          documentName: '4. Student Handbook Aug 2026.pdf',
          sourceType: 'STUDENT_HANDBOOK',
          hierarchyLevel: 1,
          pageNumber: page.pageNumber,
          sectionNumber: currentSection,
          clauseNumber: currentClause,
          batchScope: ['2022', '2023', '2024', '2025', '2026'],
          content: para.trim(),
          metadata: {
            academicYear: '2026-27',
            version: 'August 2026',
          }
        });
      }
    }
  }

  return {
    documentName: '4. Student Handbook Aug 2026.pdf',
    sourceType: 'STUDENT_HANDBOOK',
    hierarchyLevel: 1,
    totalPages: pageTexts.length,
    totalChunks: chunks.length,
    chunks: chunks
  };
}

async function parseSOP(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pageTexts = [];
  const options = {
    pagerender: function (pageData) {
      return pageData.getTextContent().then(function (textContent) {
        let text = textContent.items.map(item => item.str).join(' ');
        pageTexts.push({
          pageNumber: pageTexts.length + 1,
          text: text.trim()
        });
        return text;
      });
    }
  };

  await pdfParse(dataBuffer, options);
  const chunks = [];
  let chunkIndex = 0;

  for (const page of pageTexts) {
    if (!page.text || page.text.length < 20) continue;
    // Split into clauses (e.g. 1. Course Registration, 2. Student Attendance, etc.)
    const sections = page.text.split(/(?=\b\d+\.\s+[A-Za-z])/g).filter(s => s.trim().length > 30);
    
    for (const sec of sections) {
      const match = sec.match(/^(\d+)\.\s+([A-Za-z\s]+)/);
      const clauseTitle = match ? `${match[1]}. ${match[2].trim()}` : 'General SOP';

      chunks.push({
        chunkIndex: chunkIndex++,
        documentName: 'SOP STUDENT 19082025 - Final.pdf',
        sourceType: 'STUDENT_SOP',
        hierarchyLevel: 5,
        pageNumber: page.pageNumber,
        sectionNumber: 'Student SOP',
        clauseNumber: clauseTitle,
        batchScope: ['2022', '2023', '2024', '2025', '2026'],
        content: sec.trim(),
        metadata: {
          version: '19082025 - Final',
          academicYear: '2025-26',
        }
      });
    }
  }

  return {
    documentName: 'SOP STUDENT 19082025 - Final.pdf',
    sourceType: 'STUDENT_SOP',
    hierarchyLevel: 5,
    totalPages: pageTexts.length,
    totalChunks: chunks.length,
    chunks: chunks
  };
}

async function parseSummerCoursesOffered(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const parsed = await pdfParse(dataBuffer);
  const text = parsed.text;

  // Split lines and parse Course Code, Name, Credits
  // Pattern: ^([A-Z]{3,4}\d{3})\s*(.+?)\s*(\d+)$
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const courses = [];
  const chunks = [];
  let chunkIdx = 0;

  for (const line of lines) {
    const match = line.match(/^([A-Z]{4}\d{3}|[A-Z]{3}\d{3})\s*(.+?)\s*(\d)$/);
    if (match) {
      const code = match[1].trim();
      const name = match[2].trim();
      const credits = parseInt(match[3].trim(), 10);
      courses.push({
        courseCode: code,
        courseName: name,
        credits: credits,
        academicYear: '2025-26',
        termName: 'Summer Term June 2026',
        termType: 'SUMMER',
        isOffered: true
      });

      chunks.push({
        chunkIndex: chunkIdx++,
        documentName: 'Courses Offered.pdf',
        sourceType: 'COURSE_OFFERING',
        hierarchyLevel: 4,
        pageNumber: 1,
        sectionNumber: 'Summer Term June 2026 Course Offerings',
        clauseNumber: code,
        batchScope: ['2022', '2023', '2024', '2025', '2026'],
        content: `Course Code: ${code} | Course Name: ${name} | Credits: ${credits} | Term: Summer Term June 2026 (Vidyashilp University). This course is offered specifically for the Summer Term June 2026.`,
        metadata: {
          academicYear: '2025-26',
          termName: 'Summer Term June 2026',
          courseCode: code,
          credits: credits
        }
      });
    }
  }

  return {
    documentName: 'Courses Offered.pdf',
    sourceType: 'COURSE_OFFERING',
    hierarchyLevel: 4,
    totalCourses: courses.length,
    courses: courses,
    chunks: chunks
  };
}

function parseScannedCalendar(filePath, docName, academicYear, semesterType) {
  // Scanned image PDF: cannot extract text safely without OCR
  return {
    documentName: docName,
    sourceType: 'ACADEMIC_CALENDAR',
    hierarchyLevel: 6,
    isRasterScan: true,
    calendarExtractionStatus: 'pending_verification',
    warning: 'Scanned image-based academic calendar. Exact dates require OCR or manual verification. Do not answer exact calendar dates with high confidence.',
    chunks: [
      {
        chunkIndex: 0,
        documentName: docName,
        sourceType: 'ACADEMIC_CALENDAR',
        hierarchyLevel: 6,
        pageNumber: 1,
        sectionNumber: 'Academic Calendar',
        clauseNumber: 'UNVERIFIED_RASTER_SCAN',
        batchScope: ['2022', '2023', '2024', '2025', '2026'],
        content: `Document [${docName}] for Academic Year ${academicYear} (${semesterType} Semester) is currently pending OCR / manual verification. Official exact dates must be confirmed via the Digii portal or the Office of the Registrar.`,
        metadata: {
          academicYear: academicYear,
          semesterType: semesterType,
          calendarExtractionStatus: 'pending_verification'
        }
      }
    ]
  };
}

module.exports = {
  parseHandbook,
  parseSOP,
  parseSummerCoursesOffered,
  parseScannedCalendar
};
