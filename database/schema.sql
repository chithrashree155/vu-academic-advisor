-- ==============================================================================
-- Vidyashilp University AI Academic Advisor
-- Phase 1: Database Schema & Entity Modeling
-- Target DB: Supabase / PostgreSQL with pgvector extension
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ------------------------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------------------------

-- System state enumeration as required by system architecture
CREATE TYPE system_state_enum AS ENUM (
    'ANSWERABLE',
    'NEEDS_STUDENT_INFORMATION',
    'NEEDS_CLARIFICATION',
    'INSUFFICIENT_INFORMATION',
    'CONFLICTING_SOURCES',
    'OUT_OF_SCOPE'
);

-- Source hierarchy type
CREATE TYPE source_type_enum AS ENUM (
    'STUDENT_HANDBOOK',       -- Priority 1: Official handbook & academic regulations
    'CURRICULUM_STRUCTURE',   -- Priority 2: Program semester spreads & baskets
    'COURSE_CATALOGUE',       -- Priority 3: Master course definitions
    'COURSE_OFFERING',        -- Priority 4: Term-specific course lists (e.g. Summer 2026)
    'STUDENT_SOP',            -- Priority 5: Standard Operating Procedures
    'ACADEMIC_CALENDAR',      -- Priority 6: Dates & term milestones
    'SUPPORTING_INFO'         -- Priority 7: Official university announcements / portal info
);

-- Prerequisite relationship types
CREATE TYPE prerequisite_type_enum AS ENUM (
    'STRICT_PASS',            -- Must earn a passing grade (non-F, non-FA)
    'MINIMUM_GRADE',          -- Must earn a specific minimum grade
    'EXPOSURE',               -- Must have attended/registered previously
    'COREQUISITE',            -- Must be taken concurrently or prior
    'UNCERTAIN_PENDING'       -- Source lists "DON'T KNOW", "TBD", or informal text
);

-- Course grading scale (from VU Student Handbook Table 2)
CREATE TYPE course_grade_enum AS ENUM (
    'O',    -- Outstanding (10)
    'A+',   -- Excellent (9)
    'A',    -- Very Good (8)
    'B+',   -- Good (7)
    'B',    -- Above Average (6)
    'C',    -- Average (5)
    'D',    -- Pass (4)
    'F',    -- Fail (0)
    'FA',   -- Failure due to Attendance shortage (0)
    'S',    -- Satisfactory (Non-credit / Audit / Internship)
    'U',    -- Unsatisfactory
    'I',    -- Incomplete
    'W'     -- Withdrawn
);

-- Student course registration status
CREATE TYPE registration_status_enum AS ENUM (
    'REGISTERED',
    'COMPLETED',
    'DROPPED',
    'AUDIT',
    'WITHDRAWN'
);

-- ------------------------------------------------------------------------------
-- 1. DOCUMENTS TABLE (Source Authority)
-- ------------------------------------------------------------------------------
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL UNIQUE,
    file_type TEXT NOT NULL,                     -- 'pdf', 'xlsx', etc.
    title TEXT NOT NULL,
    source_type source_type_enum NOT NULL,
    hierarchy_level INT NOT NULL,               -- 1 to 7 corresponding to source hierarchy
    academic_year TEXT,                          -- e.g. '2025-26', '2026-27'
    batch_scope TEXT[],                         -- e.g. ['2022', '2023', '2024', '2025', '2026']
    version TEXT,                                -- e.g. 'August 2026', '19082025 - Final'
    is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- Must be verified before ingestion
    is_raster_scan BOOLEAN NOT NULL DEFAULT FALSE, -- True for scanned PDFs requiring OCR
    sha256_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. DOCUMENT CHUNKS TABLE (RAG Knowledge Base with Embeddings)
-- ------------------------------------------------------------------------------
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(384),                      -- Local HuggingFace all-MiniLM-L6-v2 dimension
    chunk_index INT NOT NULL,
    page_number INT,                            -- 1-indexed page number
    section_number TEXT,                        -- e.g. 'Section III'
    clause_number TEXT,                         -- e.g. 'Clause 12.1', 'Clause 7'
    academic_year TEXT,
    batch TEXT,                                 -- Isolated batch, NEVER merged
    program TEXT,                               -- e.g. 'BTECH_CSE', 'BTECH_DS'
    token_count INT,
    metadata JSONB DEFAULT '{}'::jsonb,         -- Contains hierarchy_level, citations, tags
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_batch ON document_chunks(batch);
CREATE INDEX idx_document_chunks_program ON document_chunks(program);

-- HNSW vector index for high-speed similarity search
CREATE INDEX idx_document_chunks_embedding ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ------------------------------------------------------------------------------
-- 3. PROGRAMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_code TEXT NOT NULL UNIQUE,          -- e.g. 'BTECH_CSE', 'BTECH_DS'
    program_name TEXT NOT NULL,                 -- e.g. 'B.Tech in Computer Science and Engineering'
    school_name TEXT NOT NULL,                  -- 'School of Computing and Data Sciences'
    degree_level TEXT NOT NULL DEFAULT 'UG',    -- 'UG', 'PG', 'PHD'
    standard_duration_years INT NOT NULL DEFAULT 4,
    max_duration_years INT NOT NULL DEFAULT 6,  -- N + 2 years rule (Student Handbook Clause 6)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. COURSES TABLE (Master Catalogue)
-- ------------------------------------------------------------------------------
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code TEXT NOT NULL UNIQUE,           -- e.g. 'COMP201', trimmed and sanitized
    course_name TEXT NOT NULL,                  -- e.g. 'Data Structures'
    credits NUMERIC(4, 1) NOT NULL,             -- e.g. 4.0, 3.0, 2.0
    lecture_hours INT NOT NULL DEFAULT 0,       -- L
    tutorial_hours INT NOT NULL DEFAULT 0,      -- T
    practical_hours INT NOT NULL DEFAULT 0,     -- P
    school_or_dept TEXT,
    has_uncertain_code BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE if code was 'DON’T KNOW' or 'TBD'
    uncertainty_note TEXT,                      -- e.g. 'Placeholder in Finance Minor row 2'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_code ON courses(course_code);

-- ------------------------------------------------------------------------------
-- 5. COURSE PREREQUISITES TABLE (Batch & Program Isolated)
-- ------------------------------------------------------------------------------
CREATE TABLE course_prerequisites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code TEXT NOT NULL REFERENCES courses(course_code) ON DELETE CASCADE,
    prerequisite_course_code TEXT,              -- Can be null if uncertain / placeholder
    batch TEXT NOT NULL,                        -- Critical: never merge batch prerequisites
    program_code TEXT NOT NULL REFERENCES programs(program_code) ON DELETE CASCADE,
    prerequisite_type prerequisite_type_enum NOT NULL DEFAULT 'STRICT_PASS',
    raw_prerequisite_text TEXT NOT NULL,        -- Preserves original source string exactly
    is_uncertain BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE if source has informal name or 'TBD'
    source_document_id UUID REFERENCES documents(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_code, prerequisite_course_code, batch, program_code)
);

CREATE INDEX idx_prereq_lookup ON course_prerequisites(course_code, batch, program_code);

-- ------------------------------------------------------------------------------
-- 6. CURRICULUM COURSES TABLE (Semester Spreads & Credit Baskets)
-- ------------------------------------------------------------------------------
CREATE TABLE curriculum_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_code TEXT NOT NULL REFERENCES programs(program_code) ON DELETE CASCADE,
    batch TEXT NOT NULL,                        -- e.g. '2022', '2023', '2024', '2025', '2026'
    semester_num INT NOT NULL,                  -- 1 to 8; 0 for Summer Term / special
    basket_name TEXT NOT NULL,                  -- 'University Core', 'Foundation', 'Program Core', etc.
    course_code TEXT NOT NULL REFERENCES courses(course_code) ON DELETE CASCADE,
    credits NUMERIC(4, 1) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    source_sheet_name TEXT,                     -- e.g. 'Sem_Spread_2024'
    source_document_id UUID REFERENCES documents(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(program_code, batch, semester_num, course_code, basket_name)
);

CREATE INDEX idx_curriculum_lookup ON curriculum_courses(program_code, batch, semester_num);
CREATE INDEX idx_curriculum_basket ON curriculum_courses(program_code, batch, basket_name);

-- ------------------------------------------------------------------------------
-- 7. COURSE OFFERINGS TABLE (Term-Specific Offerings)
-- ------------------------------------------------------------------------------
CREATE TABLE course_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code TEXT NOT NULL REFERENCES courses(course_code) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,                -- e.g. '2025-26'
    term_name TEXT NOT NULL,                    -- e.g. 'Summer Term June 2026', 'Odd Semester 2026'
    term_type TEXT NOT NULL,                    -- 'SUMMER', 'ODD', 'EVEN'
    credits NUMERIC(4, 1) NOT NULL,
    max_capacity INT,
    is_offered BOOLEAN NOT NULL DEFAULT TRUE,
    source_document_id UUID REFERENCES documents(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_code, academic_year, term_name)
);

CREATE INDEX idx_offerings_term ON course_offerings(academic_year, term_name);

-- ------------------------------------------------------------------------------
-- 8. MINOR PROGRAMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE minor_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    minor_code TEXT NOT NULL UNIQUE,            -- e.g. 'MINOR_LAW', 'MINOR_FINANCE', 'MINOR_STARTUP'
    minor_name TEXT NOT NULL,                   -- e.g. 'Finance Minor'
    offering_school TEXT NOT NULL,
    total_required_credits INT NOT NULL,        -- 24 for earlier batches, 32 for 2025+
    minimum_enrolled_threshold INT NOT NULL DEFAULT 10, -- Clause 2.13: min 10 students
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. MINOR COURSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE minor_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    minor_code TEXT NOT NULL REFERENCES minor_programs(minor_code) ON DELETE CASCADE,
    batch TEXT NOT NULL,                        -- Batches explicitly identified (2022, 2023, 2024)
    semester_num INT NOT NULL,                  -- e.g. 3, 4, 5, 6
    course_code TEXT NOT NULL,                  -- References courses(course_code) or temporary placeholder
    course_name TEXT NOT NULL,
    credits NUMERIC(4, 1) NOT NULL,
    lecture_hours INT NOT NULL DEFAULT 0,
    tutorial_hours INT NOT NULL DEFAULT 0,
    practical_hours INT NOT NULL DEFAULT 0,
    raw_prerequisite_text TEXT,
    is_uncertain BOOLEAN NOT NULL DEFAULT FALSE,
    source_sheet_name TEXT,                     -- e.g. 'Finance', 'Start-up'
    source_document_id UUID REFERENCES documents(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_minor_courses_lookup ON minor_courses(minor_code, batch, semester_num);

-- ------------------------------------------------------------------------------
-- 10. ACADEMIC CALENDAR TABLE (Milestones & Deadlines)
-- ------------------------------------------------------------------------------
CREATE TABLE academic_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year TEXT NOT NULL,                -- e.g. '2025-26', '2026-27'
    semester_type TEXT NOT NULL,                -- 'ODD', 'EVEN', 'SUMMER'
    event_category TEXT NOT NULL,               -- 'REGISTRATION', 'ADD_DROP', 'EXAMINATION', 'HOLIDAY'
    event_name TEXT NOT NULL,                   -- e.g. 'Last date for Course Add/Drop'
    start_date DATE,
    end_date DATE,
    is_tentative BOOLEAN NOT NULL DEFAULT FALSE,
    is_ocr_verified BOOLEAN NOT NULL DEFAULT FALSE, -- Must be FALSE for scanned calendars until confirmed
    source_document_id UUID REFERENCES documents(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calendar_event ON academic_calendar(academic_year, semester_type, event_category);

-- ------------------------------------------------------------------------------
-- 11. STUDENTS TABLE (Synthetic Profiles for Verification & Advisory)
-- ------------------------------------------------------------------------------
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roll_number TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    program_code TEXT NOT NULL REFERENCES programs(program_code),
    batch TEXT NOT NULL,                        -- Critical for determining exact curriculum
    current_semester INT NOT NULL,
    cumulative_gpa NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    total_earned_credits NUMERIC(5, 1) NOT NULL DEFAULT 0.0,
    enrolled_minor_code TEXT REFERENCES minor_programs(minor_code),
    fee_dues_cleared BOOLEAN NOT NULL DEFAULT TRUE, -- SOP Clause 1 & 5: fee clearance check
    overall_attendance_pct NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
    has_pending_disciplinary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_roll ON students(roll_number);
CREATE INDEX idx_students_program_batch ON students(program_code, batch);

-- ------------------------------------------------------------------------------
-- 12. STUDENT COURSES TABLE (Academic History & Enrollment)
-- ------------------------------------------------------------------------------
CREATE TABLE student_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_code TEXT NOT NULL REFERENCES courses(course_code),
    academic_year TEXT NOT NULL,
    term_name TEXT NOT NULL,
    semester_num INT NOT NULL,
    grade course_grade_enum,
    grade_points NUMERIC(3, 1),
    credits_earned NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    attendance_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    status registration_status_enum NOT NULL DEFAULT 'REGISTERED',
    is_passed BOOLEAN GENERATED ALWAYS AS (
        grade IS NOT NULL AND grade NOT IN ('F', 'FA', 'U', 'I', 'W')
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_code, academic_year, term_name)
);

CREATE INDEX idx_student_courses_history ON student_courses(student_id, course_code);

-- ------------------------------------------------------------------------------
-- 13. EVALUATION CASES TABLE (Benchmark Suite)
-- ------------------------------------------------------------------------------
CREATE TABLE evaluation_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id TEXT NOT NULL UNIQUE,               -- e.g. 'TC-PREREQ-01', 'TC-ATTEND-02'
    category TEXT NOT NULL,                     -- 'PREREQUISITE', 'ELIGIBILITY', 'ATTENDANCE', etc.
    query TEXT NOT NULL,                        -- User prompt
    student_context JSONB,                      -- Injected student context (batch, CGPA, courses taken)
    expected_state system_state_enum NOT NULL,  -- Expected system state
    expected_sources TEXT[] NOT NULL,           -- Documents that MUST be cited
    ground_truth_answer TEXT NOT NULL,          -- Canonical golden answer
    deterministic_assertions JSONB,             -- Expected rule outputs (e.g. {"eligible": false, "reason": "Missing COMP201"})
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. EVALUATION RESULTS TABLE (Validation Benchmarks)
-- ------------------------------------------------------------------------------
CREATE TABLE evaluation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_case_id UUID NOT NULL REFERENCES evaluation_cases(id) ON DELETE CASCADE,
    run_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model_name TEXT NOT NULL,
    actual_state system_state_enum NOT NULL,
    state_matches BOOLEAN NOT NULL,
    grounded_score NUMERIC(3, 2),               -- 0.00 to 1.00
    hallucination_detected BOOLEAN NOT NULL DEFAULT FALSE,
    rule_engine_output JSONB,
    retrieved_sources JSONB,
    generated_answer TEXT NOT NULL,
    latency_ms INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_eval_results_case ON evaluation_results(evaluation_case_id);
