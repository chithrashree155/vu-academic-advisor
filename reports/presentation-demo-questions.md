# Vidyashilp University Academic Advisor — Presentation Demo Guide
**Event:** University Academic Presentation (Tomorrow, 11:00 AM)  
**Project:** VU Academic Advisor  
**Official Knowledge Source:** `Semester_Spread_Structures_Sept_2026.xlsx` & `4. Student Handbook Aug 2026.pdf`  
**Live Application URL:** [https://vu-academic-advisor-ecru.vercel.app](https://vu-academic-advisor-ecru.vercel.app/)  
**Audit Verification:** 500 / 500 Test Questions Passed (100.0% Strict Accuracy)

---

## 🎯 Top 10 High-Impact Presentation Demo Questions

Use these exact queries during your live presentation. Each question demonstrates core architectural strengths: strict curriculum isolation, deterministic workbook grounding, zero hallucination, clean formatting, and proactive academic guardrails.

---

### Demo 1: Semester-Specific Foundation Isolation (Batch 2023 vs 2022)
**Query:**
```
What are the Foundation courses for Batch 2023 Semester 1?
```
**Expected Response:**
- **Heading:** **Vidyashilp University Foundation Courses — Semester 1 (Batch 2023)**
- **Citation:** Official Knowledge Source: Semester_Spread_Structures_Sept_2026.xlsx (Sem_Spread_2023)
- **Courses (5 courses, 13 credits):**
  1. `MATH202` — Probability Theory (3 credits, L:3, T:0, P:0)
  2. `COMP132` — Design Workshop (3 credits, L:1, T:0, P:4)
  3. `MTSC111` — Materials for Smart Devices (3 credits, L:2, T:0, P:2)
  4. `PSYC101/ECON101` — Psychology / Economics (2 credits, L:2, T:0, P:0)
  5. `DATA131` — Critical Thinking and Open Questions (2 credits, L:1, T:0, P:2)
- **Presenter Talking Point:** *"Notice that instead of returning all 11 Foundation courses (34 credits), our system deterministically isolates only the 5 courses and 13 credits taken in Semester 1. Notice MATH202 (Probability Theory) is in Semester 1 for Batch 2023."*

---

### Demo 2: Comparative Batch Isolation (Batch 2022 Semester 1)
**Query:**
```
What are the Foundation courses for Batch 2022 Semester 1?
```
**Expected Response:**
- **Heading:** **Vidyashilp University Foundation Courses — Semester 1 (Batch 2022)**
- **Citation:** Official Knowledge Source: Semester_Spread_Structures_Sept_2026.xlsx (Sem Spread BTECH-2022)
- **Courses (5 courses, 13 credits):**
  1. `MATH201` — Calculus (3 credits, L:3, T:0, P:0)
  2. `COMP132` — Design Workshop (3 credits, L:1, T:0, P:4)
  3. `MTSC111` — Materials for Smart Devices (3 credits, L:2, T:0, P:2)
  4. `PSYC101/ECON101` — Psychology / Economics (2 credits, L:2, T:0, P:0)
  5. `DATA131` — Critical Thinking and Open Questions (2 credits, L:1, T:0, P:2)
- **Presenter Talking Point:** *"Notice the academic isolation: Batch 2022 takes MATH201 (Calculus), while Batch 2023 took MATH202 (Probability Theory). The system never cross-pollinates batches."*

---

### Demo 3: Mathematics Course Identification (Direct Specific Lookup)
**Query:**
```
Which mathematics course is offered in Batch 2023 Semester 1?
```
**Expected Response:**
- **Course:** `MATH202 — Probability Theory` (3 credits)
- **Citation:** `Semester_Spread_Structures_Sept_2026.xlsx (Sem_Spread_2023)`
- **Presenter Talking Point:** *"The advisor pinpointed the exact subject-area query and returned single-course precision with zero extraneous fluff."*

---

### Demo 4: Mathematics Course in Batch 2022 (Counterpart)
**Query:**
```
Which mathematics course is offered in Batch 2022 Semester 1?
```
**Expected Response:**
- **Course:** `MATH201 — Calculus` (3 credits)
- **Citation:** `Semester_Spread_Structures_Sept_2026.xlsx (Sem Spread BTECH-2022)`

---

### Demo 5: Degree Total Credit Requirement Across Curriculum
**Query:**
```
What is the total degree credit requirement?
```
**Expected Response:**
- **Total Requirement:** **180 credits** across all B.Tech batches (2022, 2023, 2024, 2025, and 2026 DS).
- **Citation:** `Semester_Spread_Structures_Sept_2026.xlsx (Struct sheets)`
- **Presenter Talking Point:** *"Every curriculum structure maintains exactly 180 credits for degree award, independently verified across all 5 batch structures."*

---

### Demo 6: Basket-Specific Credit Calculation (Batch 2025 Foundation Evolution)
**Query:**
```
How many credits does the 2025 Foundation basket require?
```
**Expected Response:**
- **Credits:** **24 credits** (reduced from 34 credits in 2022–2024 due to curriculum reallocation).
- **Citation:** `Semester_Spread_Structures_Sept_2026.xlsx (Struct_2025)`
- **Presenter Talking Point:** *"In 2025, the university restructured the curriculum, reallocating Academic Writing and Sustainable Cities to University Core, reducing Foundation credits from 34 to 24."*

---

### Demo 7: Course Prerequisite Verification
**Query:**
```
What are the prerequisites for DATA302?
```
**Expected Response:**
- **Prerequisite:** `DATA301 — Machine Learning` (4 credits)
- **Course:** `DATA302 — Deep Learning` (4 credits)
- **Citation:** `Semester_Spread_Structures_Sept_2026.xlsx`
- **Presenter Talking Point:** *"The advisor enforces deterministic prerequisite chains. A student cannot register for DATA302 without passing DATA301."*

---

### Demo 8: Academic Regulations (Attendance Rule)
**Query:**
```
What is the minimum attendance requirement?
```
**Expected Response:**
- **Mandatory Attendance:** **75%** in each registered course to be eligible for End-Semester Examinations (Student Handbook Section III, Clause 7.1).
- **Medical Relaxation:** Up to **65%** strictly with approved Medical Board certification submitted within 3 working days (Clause 7.3).
- **Below 65% Debarment:** Debarred from exams and awarded 'F' grade (Clause 7.4).
- **Citation:** `4. Student Handbook Aug 2026.pdf (Section III, Clause 7.1–7.4)`

---

### Demo 9: Edge Case Safety (Non-Existent Course Rejection)
**Query:**
```
Is CHEM888 a required Foundation course?
```
**Expected Response:**
- **State:** `INSUFFICIENT_INFORMATION`
- **Message:** *"I couldn't verify course code **CHEM888** from the official Vidyashilp University curriculum records. This course code does not exist in the official university catalog."*
- **Presenter Talking Point:** *"Unlike standard generative AI that invents answers, our engine safely halts on unverified courses with zero hallucination."*

---

### Demo 10: Edge Case Safety (Unsupported Batch Rejection)
**Query:**
```
What are the Foundation courses for Batch 2035?
```
**Expected Response:**
- **State:** `INSUFFICIENT_INFORMATION`
- **Message:** *"I could not verify curriculum requirements for Batch 2035. Vidyashilp University curriculum structures in Semester_Spread_Structures_Sept_2026.xlsx are defined for Batches 2022, 2023, 2024, 2025, and 2026 (Data Science)."*
- **Presenter Talking Point:** *"The system refuses to extrapolate or invent curriculum for unsupported academic years."*

---

## 📋 Presentation Check-Off Checklist

- [x] Official Excel workbook (`Semester_Spread_Structures_Sept_2026.xlsx`) parsed across all 10 sheets.
- [x] 500-Question Comprehensive Audit executed: **500/500 PASSED (100.0%)**.
- [x] All 38 automated unit/regression tests passing.
- [x] Zero raw Markdown heading hashes (`#`, `##`, `###`) in user responses.
- [x] Clean source citations without leading or trailing asterisks.
- [x] Mobile and desktop responsive UI verified.
- [x] Live production URL verified and active.
