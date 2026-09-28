/**
 * Complete Supabase Database Seeder
 * Ingests all structured academic data, synthetic student profiles,
 * and vector document chunks using local Hugging Face Transformers.js embeddings.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { generateEmbeddingsBatch, EMBEDDING_MODEL, EMBEDDING_DIMENSION } = require('../src/lib/rag/embeddings');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function detectVectorDimension(docId) {
  // Try 384
  const test384 = new Array(384).fill(0.001);
  const { error: err384 } = await supabase.from('document_chunks').insert({
    document_id: docId,
    content: 'dim_detect_384',
    chunk_index: -9999,
    embedding: test384
  });

  if (!err384) {
    await supabase.from('document_chunks').delete().eq('chunk_index', -9999);
    return 384;
  }

  // Fallback to 1536
  const test1536 = new Array(1536).fill(0.001);
  const { error: err1536 } = await supabase.from('document_chunks').insert({
    document_id: docId,
    content: 'dim_detect_1536',
    chunk_index: -9999,
    embedding: test1536
  });

  if (!err1536) {
    await supabase.from('document_chunks').delete().eq('chunk_index', -9999);
    return 1536;
  }

  return 384;
}

async function runSeed() {
  console.log('================================================================');
  console.log('SEEDING SUPABASE DATABASE WITH ACADEMIC SOURCES & EMBEDDINGS');
  console.log(`Supabase Project: ${supabaseUrl}`);
  console.log(`Local Embedding Model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION} dims)`);
  console.log('================================================================\n');

  const structuredPath = path.join(__dirname, '../data/processed/structured_academic_data.json');
  const chunksPath = path.join(__dirname, '../data/processed/rag_document_chunks.json');

  if (!fs.existsSync(structuredPath) || !fs.existsSync(chunksPath)) {
    console.error('Processed data not found. Please run "node scripts/run-ingestion.js" first.');
    process.exit(1);
  }

  const structuredData = JSON.parse(fs.readFileSync(structuredPath, 'utf8'));
  const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));

  // 1. Seed Documents Table
  console.log('[1/8] Seeding official university documents registry...');
  const docMap = new Map(); // filename -> uuid

  for (const doc of structuredData.documents) {
    if (doc.isDuplicateSkipped) continue;

    let dbSourceType = doc.sourceType;
    if (dbSourceType === 'SUMMER_CIRCULAR') dbSourceType = 'COURSE_OFFERING';
    else if (dbSourceType === 'PROCEDURAL_GUIDE') dbSourceType = 'STUDENT_SOP';
    else if (dbSourceType === 'FACULTY_ASSIGNMENT') dbSourceType = 'CURRICULUM_STRUCTURE';
    else if (dbSourceType === 'SYSTEM_ARCHITECTURE') dbSourceType = 'STUDENT_HANDBOOK';

    const { data, error } = await supabase.from('documents').upsert({
      filename: doc.documentName,
      file_type: doc.documentName.endsWith('.pdf') ? 'pdf' : 'xlsx',
      title: doc.documentName.replace(/\.[^/.]+$/, ''),
      source_type: dbSourceType,
      hierarchy_level: doc.hierarchyLevel,
      is_verified: true,
      is_raster_scan: Boolean(doc.isRasterScan),
      version: doc.version || 'Official 2026',
      metadata: { totalPages: doc.totalPages, totalChunks: doc.totalChunks }
    }, { onConflict: 'filename' }).select('id, filename');

    if (error) {
      console.error(`Error inserting doc ${doc.documentName}:`, error.message);
    } else if (data && data.length > 0) {
      docMap.set(doc.documentName, data[0].id);
    }
  }

  // Get a fallback document ID
  const anyDocId = docMap.values().next().value;
  const targetDim = await detectVectorDimension(anyDocId);
  console.log(`Supabase pgvector column dimension detected: ${targetDim} (Will format vectors to ${targetDim} dimensions).`);

  // 2. Seed Programs Table
  console.log('[2/8] Seeding academic programs...');
  for (const prog of structuredData.programs) {
    await supabase.from('programs').upsert({
      program_code: prog.programCode,
      program_name: prog.programName,
      school_name: prog.schoolName,
      degree_level: 'UG',
      standard_duration_years: prog.standardDurationYears,
      max_duration_years: prog.maxDurationYears
    }, { onConflict: 'program_code' });
  }

  // 3. Seed Master Courses Table
  console.log(`[3/8] Seeding ${structuredData.courses.length} master courses...`);
  const courseBatches = [];
  for (let i = 0; i < structuredData.courses.length; i += 50) {
    const slice = structuredData.courses.slice(i, i + 50).map(c => ({
      course_code: c.courseCode,
      course_name: c.courseName,
      credits: c.credits,
      lecture_hours: c.lectureHours || 0,
      tutorial_hours: c.tutorialHours || 0,
      practical_hours: c.practicalHours || 0,
      has_uncertain_code: Boolean(c.hasUncertainCode),
      uncertainty_note: c.uncertaintyNote
    }));
    await supabase.from('courses').upsert(slice, { onConflict: 'course_code' });
  }

  // 4. Seed Minor Programs & Minor Courses
  console.log(`[4/8] Seeding minor programs and ${structuredData.minorCourses.length} minor courses...`);
  for (const m of structuredData.minorPrograms) {
    await supabase.from('minor_programs').upsert({
      minor_code: m.minorCode,
      minor_name: m.minorName,
      offering_school: m.school,
      total_required_credits: 24,
      minimum_enrolled_threshold: m.minStudents
    }, { onConflict: 'minor_code' });
  }

  for (let i = 0; i < structuredData.minorCourses.length; i += 50) {
    const slice = structuredData.minorCourses.slice(i, i + 50).map(mc => ({
      minor_code: mc.minorCode,
      batch: mc.batch,
      semester_num: mc.semesterNum,
      course_code: mc.courseCode,
      course_name: mc.courseName,
      credits: mc.credits,
      raw_prerequisite_text: mc.rawPrerequisiteText,
      is_uncertain: Boolean(mc.isUncertain),
      source_sheet_name: mc.sourceSheetName,
      source_document_id: docMap.get('118351_Minor Courses for BTech_Students.xlsx')
    }));
    await supabase.from('minor_courses').insert(slice);
  }

  // 5. Seed Summer Offerings
  console.log(`[5/8] Seeding ${structuredData.courseOfferings.length} summer term offerings...`);
  for (const o of structuredData.courseOfferings) {
    await supabase.from('course_offerings').upsert({
      course_code: o.courseCode,
      academic_year: o.academicYear,
      term_name: o.termName,
      term_type: o.termType,
      credits: o.credits,
      is_offered: o.isOffered,
      source_document_id: docMap.get('Courses Offered.pdf')
    }, { onConflict: 'course_code,academic_year,term_name' });
  }

  // 6. Seed Synthetic Student Demo Profiles
  console.log('[6/8] Seeding 3 synthetic student demo profiles...');
  const syntheticStudents = [
    {
      roll_number: 'VU2026BTECHDS001',
      student_name: 'Aarav Mehta (Demo Student A - Eligible for DATA302)',
      program_code: 'BTECH_DS',
      batch: '2026',
      current_semester: 5,
      cumulative_gpa: 8.72,
      total_earned_credits: 88.0,
      fee_dues_cleared: true,
      overall_attendance_pct: 86.5,
      has_pending_disciplinary: false
    },
    {
      roll_number: 'VU2026BTECHDS002',
      student_name: 'Ananya Rao (Demo Student B - Missing Prerequisite for DATA302)',
      program_code: 'BTECH_DS',
      batch: '2026',
      current_semester: 5,
      cumulative_gpa: 7.15,
      total_earned_credits: 76.0,
      fee_dues_cleared: true,
      overall_attendance_pct: 71.0, // Shortage below 75%
      has_pending_disciplinary: false
    },
    {
      roll_number: 'VU2024BTECHCSE042',
      student_name: 'Rohan Nair (Demo Student C - Batch 2024 Isolation Test)',
      program_code: 'BTECH_CSE',
      batch: '2024',
      current_semester: 5,
      cumulative_gpa: 9.10,
      total_earned_credits: 92.0,
      fee_dues_cleared: true,
      overall_attendance_pct: 92.0,
      has_pending_disciplinary: false
    }
  ];

  const studentIdMap = new Map();
  for (const s of syntheticStudents) {
    const { data: stData } = await supabase.from('students').upsert(s, { onConflict: 'roll_number' }).select('id, roll_number');
    if (stData && stData.length > 0) {
      studentIdMap.set(stData[0].roll_number, stData[0].id);
    }
  }

  // Seed course histories for Student A (passed DATA301) and Student B (not passed DATA301)
  const studentAId = studentIdMap.get('VU2026BTECHDS001');
  if (studentAId) {
    await supabase.from('student_courses').upsert([
      { student_id: studentAId, course_code: 'COMP201', academic_year: '2025-26', term_name: 'Semester 3', semester_num: 3, grade: 'A', grade_points: 8.0, credits_earned: 4.0, attendance_pct: 88.0, status: 'COMPLETED' },
      { student_id: studentAId, course_code: 'MATH201', academic_year: '2025-26', term_name: 'Semester 3', semester_num: 3, grade: 'O', grade_points: 10.0, credits_earned: 3.0, attendance_pct: 90.0, status: 'COMPLETED' },
      { student_id: studentAId, course_code: 'DATA201', academic_year: '2025-26', term_name: 'Semester 4', semester_num: 4, grade: 'A+', grade_points: 9.0, credits_earned: 3.0, attendance_pct: 85.0, status: 'COMPLETED' },
      { student_id: studentAId, course_code: 'DATA301', academic_year: '2025-26', term_name: 'Semester 4', semester_num: 4, grade: 'A', grade_points: 8.0, credits_earned: 4.0, attendance_pct: 86.0, status: 'COMPLETED' }
    ], { onConflict: 'student_id,course_code,academic_year,term_name' });
  }

  const studentBId = studentIdMap.get('VU2026BTECHDS002');
  if (studentBId) {
    await supabase.from('student_courses').upsert([
      { student_id: studentBId, course_code: 'COMP201', academic_year: '2025-26', term_name: 'Semester 3', semester_num: 3, grade: 'B+', grade_points: 7.0, credits_earned: 4.0, attendance_pct: 72.0, status: 'COMPLETED' },
      { student_id: studentBId, course_code: 'MATH201', academic_year: '2025-26', term_name: 'Semester 3', semester_num: 3, grade: 'B', grade_points: 6.0, credits_earned: 3.0, attendance_pct: 70.0, status: 'COMPLETED' },
      { student_id: studentBId, course_code: 'DATA201', academic_year: '2025-26', term_name: 'Semester 4', semester_num: 4, grade: 'B+', grade_points: 7.0, credits_earned: 3.0, attendance_pct: 71.0, status: 'COMPLETED' }
      // Student B has NOT taken DATA301 (Machine Learning), so DATA302 eligibility will correctly fail!
    ], { onConflict: 'student_id,course_code,academic_year,term_name' });
  }

  // 7. Seed Curriculum Courses
  console.log(`[7/8] Seeding ${structuredData.curriculumCourses.length} curriculum courses...`);
  for (let i = 0; i < structuredData.curriculumCourses.length; i += 50) {
    const slice = structuredData.curriculumCourses.slice(i, i + 50).map(cc => ({
      program_code: cc.programCode,
      batch: cc.batch,
      semester_num: cc.semesterNum,
      basket_name: cc.basketName,
      course_code: cc.courseCode,
      credits: cc.credits,
      is_mandatory: true,
      source_sheet_name: cc.sourceSheetName,
      source_document_id: docMap.get('118225_Semester_Spread_Structures_Sept_2026.xlsx')
    }));
    await supabase.from('curriculum_courses').upsert(slice, {
      onConflict: 'program_code,batch,semester_num,course_code,basket_name'
    });
  }

  // 8. Generate Local Embeddings & Ingest Document Chunks into pgvector
  console.log(`[8/8] Generating local embeddings and storing ${chunks.length} chunks into pgvector...`);
  
  // Clean existing chunks to prevent duplicates
  await supabase.from('document_chunks').delete().neq('chunk_index', -99999);

  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const slice = chunks.slice(i, i + batchSize);
    const texts = slice.map(c => c.content);

    // Generate local 384-dim normalized embeddings
    const embeddings384 = await generateEmbeddingsBatch(texts);

    const rowsToInsert = slice.map((c, idx) => {
      let vec = embeddings384[idx];
      // Format vector to target dimension (pad with zeros if table is 1536)
      if (targetDim === 1536 && vec.length === 384) {
        vec = [...vec, ...new Array(1536 - 384).fill(0)];
      }

      const assignedDocId = docMap.get(c.documentName) || anyDocId;

      return {
        document_id: assignedDocId,
        content: c.content,
        embedding: vec,
        chunk_index: c.chunkIndex,
        page_number: typeof c.pageNumber === 'number' ? c.pageNumber : null,
        section_number: c.sectionNumber || 'General',
        clause_number: c.clauseNumber || 'N/A',
        batch: c.metadata?.batch || null,
        program: c.metadata?.program || null,
        metadata: {
          ...c.metadata,
          documentName: c.documentName,
          sourceType: c.sourceType,
          hierarchyLevel: c.hierarchyLevel
        }
      };
    });

    const { error: insertErr } = await supabase.from('document_chunks').insert(rowsToInsert);
    if (insertErr) {
      console.error(`Error inserting chunk batch ${i} to ${i + slice.length}:`, insertErr.message);
    } else {
      console.log(`  -> Stored vector chunks ${i + 1} to ${Math.min(i + batchSize, chunks.length)} / ${chunks.length}`);
    }
  }

  console.log('\n================================================================');
  console.log('ALL ACADEMIC DATA, SYNTHETIC PROFILES, AND EMBEDDINGS STORED IN SUPABASE!');
  console.log('================================================================');
}

runSeed().catch(err => {
  console.error('Seeding encountered an error:', err);
  process.exit(1);
});
