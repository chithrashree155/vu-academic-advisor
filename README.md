# Vidyashilp University (VU) AI Academic Advisor
## Phase 1: Project Architecture & Data Model

---

## 1. System Overview

The **Vidyashilp University AI Academic Advisor** is an evidence-grounded advisory system designed to provide students with accurate, verifiable, and policy-compliant guidance regarding their academic progress, curriculum requirements, prerequisites, attendance regulations, and course offerings.

Unlike naive conversational bots, the VU Academic Advisor separates **deterministic verification** from **natural language synthesis**. It operates under strict academic safeguards:
- **No Hallucination:** Academic policies, course codes, and prerequisites are never guessed or inferred.
- **Batch Isolation:** Curricula and credit distributions vary significantly between batches (2022 through 2026); batches are strictly segregated and never merged.
- **Evidence Grounding:** Every factual assertion must link to an official source with page, section, or sheet metadata.
- **Clear System States:** Ambiguous or out-of-scope queries are explicitly categorized into one of 6 formal system states.

---

## 2. End-to-End System Architecture

```
                               ┌────────────────────────────────┐
                               │           User Query           │
                               └───────────────┬────────────────┘
                                               │
                                   [ Query Classification ]
                                               │
               ┌───────────────────────────────┴───────────────────────────────┐
               │                                                               │
     [ Scope & Context Check ]                                                 │
     • Is it outside academic scope? ──> "I can only answer academic questions." [OUT_OF_SCOPE]
     • Does it need student profile? ──> Ask student for Batch/Roll No [NEEDS_STUDENT_INFORMATION]
               │
               ▼ (Academic Inquiry)
     ┌────────────────────────────────────────────────────────────────────────┐
     │                       Parallel Retrieval Phase                         │
     ├───────────────────────────────────┬────────────────────────────────────┤
     │       Unstructured RAG            │          Structured DB             │
     │  - Student Handbook (PDF)         │  - Semester Spread (XLSX)          │
     │  - Student SOP (PDF)              │  - Minor Tracks (XLSX)             │
     │  - Academic Calendars (OCR/PDF)   │  - Summer 2026 Offerings (PDF)     │
     └─────────────────┬─────────────────┴──────────────────┬─────────────────┘
                       │                                    │
                       └─────────────────┬──────────────────┘
                                         ▼
                     ┌──────────────────────────────────────┐
                     │      Deterministic Rules Engine      │
                     │  - Prerequisite graph validation     │
                     │  - Progression criteria (CGPA 4/5)   │
                     │  - Attendance threshold audit (75/65)│
                     │  - Credit basket audit (180 credits) │
                     └───────────────────┬──────────────────┘
                                         ▼
                     ┌──────────────────────────────────────┐
                     │    Sufficiency & Conflict Check      │
                     │  - Missing course codes? (DON'T KNOW)│
                     │  - Unverified scan? (OCR pending)    │
                     └───────────────────┬──────────────────┘
                                         ▼
                     ┌──────────────────────────────────────┐
                     │        LLM Synthesis Engine          │
                     │  - Generate grounded explanation     │
                     │  - Attach source hierarchy citations │
                     │  - Format response with System State │
                     └───────────────────┬──────────────────┘
                                         ▼
                               ┌───────────────────┐
                               │  Advisor Response │
                               │  + System State   │
                               │  + Citations      │
                               └───────────────────┘
```

---

## 3. Separation of Responsibilities

| Subsystem | Responsibilities | Sources / Data |
| :--- | :--- | :--- |
| **RAG (Unstructured Retrieval)** | Institutional policies, fee rules, appeal workflows, student code of conduct, disciplinary guidelines, attendance policies. | `4. Student Handbook Aug 2026.pdf`, `SOP STUDENT 19082025 - Final.pdf`, `Academic Calendars` |
| **Structured Relational Database** | Academic programs, isolated batch curricula, master course catalogue, semester spreads, minor courses, synthetic student profiles, term offerings. | `118225_Semester_Spread_Structures_Sept_2026.xlsx`, `118351_Minor Courses for BTech_Students.xlsx`, `Courses Offered.pdf` |
| **Deterministic Rules Engine** | Hard gate verification, prerequisite graph checks, attendance relaxation eligibility, yearly progression, degree audits. | Code implementations in `src/lib/rules/` applying exact clauses from official documents. |
| **LLM (Language Model)** | Query classification, parameter extraction, multi-turn follow-up queries, translating rule engine outputs into natural language. | OpenAI-compatible APIs using strict system instructions and negative constraints. |

---

## 4. Formal System States

Every response from the Academic Advisor resolves into exactly one of the following states:

1. **`ANSWERABLE`**: The query can be completely and conclusively answered with verified university evidence and/or deterministic rule outputs.
2. **`NEEDS_STUDENT_INFORMATION`**: The academic regulation is clear, but answering for the student requires their specific batch, roll number, completed courses, or CGPA.
3. **`NEEDS_CLARIFICATION`**: The query is ambiguous (e.g., asking about credit requirements without specifying which batch year).
4. **`INSUFFICIENT_INFORMATION`**: The university sources do not contain sufficient evidence to answer (e.g., course code marked `"DON’T KNOW"`, unverified scanned calendars, unannounced course schedules).
5. **`CONFLICTING_SOURCES`**: Multiple official sources provide differing policies or contradictory information.
6. **`OUT_OF_SCOPE`**: Non-academic questions (sports, entertainment, gossip, unrelated topics) triggering the strict standard fallback: *"I can only answer academic questions."*

---

## 5. Source Authority Hierarchy

When synthesizing evidence or resolving discrepancies, sources are ranked in descending order of authority:

1. **Level 1 — Official Student Handbook & Academic Regulations** (`4. Student Handbook Aug 2026.pdf`)
2. **Level 2 — Program & Curriculum Structure** (`118225_Semester_Spread_Structures_Sept_2026.xlsx`)
3. **Level 3 — Master Course Catalogue**
4. **Level 4 — Term Course Offerings** (`Courses Offered.pdf` — Summer Term June 2026)
5. **Level 5 — Student Standard Operating Procedure** (`SOP STUDENT 19082025 - Final.pdf`)
6. **Level 6 — Academic Calendar** (`Academic Calendar Even 2025-26`, `Academic Calendar Odd 2026-27`)
7. **Level 7 — Supporting Information** (Digii Portal notices, official website)

---

## 6. Database Schema Design (PostgreSQL / Supabase + pgvector)

The database schema (`database/schema.sql`) implements 14 dedicated relational entities:

1. **`documents`**: Source authority registry with hierarchy rankings and verification flags.
2. **`document_chunks`**: Text chunk embeddings (`vector(1536)`) with HNSW indexing for RAG.
3. **`programs`**: University degree programs (e.g. `BTECH_CSE`, `BTECH_DS`).
4. **`courses`**: Master catalogue with L-T-P-C distributions and uncertainty flags.
5. **`course_prerequisites`**: Batch- and program-isolated prerequisite relationships.
6. **`curriculum_courses`**: Semester mappings (Sem 1 to Sem 8) and credit baskets (`University Core`, `Program Core`, `Foundation`, etc.).
7. **`course_offerings`**: Term-specific availability (e.g. Summer Term June 2026).
8. **`minor_programs`**: Minor disciplines (Law, Design, Psychology, Economics, Finance, Marketing, Start-up).
9. **`minor_courses`**: Minor tracks, batch allocations, and prerequisites.
10. **`academic_calendar`**: Milestones and term dates with `is_ocr_verified` flags.
11. **`students`**: Synthetic test profiles with batch, current semester, CGPA, and attendance.
12. **`student_courses`**: Student enrollment history, letter grades, and earned credits.
13. **`evaluation_cases`**: Golden benchmark test suite across all 6 system states.
14. **`evaluation_results`**: Automated evaluation outputs, hallucination checks, and latencies.

---

## 7. Repository Directory Structure

```
VU-Academic-Advisor/
├── .env.example                     # Environment template (no secrets)
├── README.md                        # Architecture & data flow documentation
├── database/
│   ├── schema.sql                   # Complete PostgreSQL schema with pgvector
│   └── migrations/                  # Versioned schema migrations
├── data/                            # Canonical source files (read-only)
│   ├── 118225_Semester_Spread_Structures_Sept_2026.xlsx
│   ├── 118351_Minor Courses for BTech_Students.xlsx
│   ├── 4. Student Handbook Aug 2026.pdf
│   ├── Academic Calendar Even Semester 2025-26 (1).pdf
│   ├── Academic_Calendar_ODD Semester_2026_27.pdf
│   ├── Courses Offered.pdf
│   ├── SOP STUDENT 19082025 - Final.pdf
│   ├── Semester_Spread_Structures_Sept._2026.xlsx
│   └── academic_rag_chatbot_flowchart.pdf
└── src/
    ├── app/
    │   └── api/
    │       ├── advisory/route.ts    # Advisory API contract & pipeline orchestrator
    │       └── chat/                # Interactive chat route (Phase 3)
    ├── components/
    │   └── ui/                      # UI stubs & component placeholders
    ├── config/
    │   └── env.ts                   # Typed environment validator
    └── lib/
        ├── database/
        │   ├── client.ts            # Supabase / PostgreSQL client abstraction
        │   └── index.ts
        ├── evaluation/
        │   ├── benchmark_cases.ts   # 6-state test benchmark cases
        │   └── index.ts
        ├── ingestion/
        │   ├── types.ts             # Parser interfaces & ingestion contracts
        │   └── index.ts
        ├── llm/
        │   ├── classifier.ts        # Intent classification & parameter extraction
        │   ├── prompts.ts           # Grounded advisor prompts & guardrails
        │   └── index.ts
        ├── rag/
        │   ├── retriever.ts         # Hierarchy-enforced evidence retriever
        │   └── index.ts
        ├── rules/
        │   ├── attendance.ts        # Deterministic 75% / 65% attendance rules
        │   ├── prerequisites.ts     # Batch-isolated prerequisite checker
        │   ├── progression.ts       # Table 3 (CGPA 4.00 / 5.00) progression rules
        │   └── index.ts
        └── types/
            ├── database.ts          # Database entity interfaces
            ├── index.ts             # Unified types export
            ├── rag.ts               # RAG chunk & search types
            ├── rules.ts             # Deterministic rules audit contracts
            └── system.ts            # System states, intents & citations
```
