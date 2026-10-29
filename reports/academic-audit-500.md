# Vidyashilp University Academic Advisor — Curriculum Basket Audit for ALL Batches (500 Questions)

**Date of Audit:** 2026-10-29T05:05:51.803Z  
**Official Grounding Document:** `Semester_Spread_Structures_Sept_2026.xlsx` (All 10 Sheets)  
**Total Questions Tested:** 500  
**Overall Strict Accuracy:** **100.0%** (500/500 strict PASS)  
**Partially Correct:** 0  
**Failures:** 0  

---

## 1. Executive Summary

This audit evaluates the Vidyashilp University Academic Advisor exclusively on curriculum baskets, course placements, semester spreads, and total degree credit structure across **all 5 curriculum versions** (Batches 2022, 2023, 2024, 2025, and 2026 Data Science) present in the official university workbook (`Semester_Spread_Structures_Sept_2026.xlsx`).

### Scope Compliance
- **100% Curriculum Focus:** Covers University Core Courses, Foundation Courses, Program Core Courses, Program Honors Courses, Specialization Tracks, Minor/Open Electives, Internship/Capstone Project, and Total Degree Credit Architecture.
- **Strict Exclusions Upheld:** Zero questions on attendance, medical condonation, registration rules, student profiles, or unrelated university policies.
- **Semester Bug Resolution Verified:** Semester-specific inquiries return strictly the courses and credits scheduled in that semester (e.g. Batch 2023 Semester 1 Foundation returns exactly 5 courses and 13 credits, not the full 34-credit basket).
- **All Batches Covered:** Batch 2022 (BTECH_CSE), Batch 2023 (BTECH_CSE), Batch 2024 (BTECH_CSE), Batch 2025 (BTECH_CSE), Batch 2026 (BTECH_DS).
- **Official Degree Credit Structure Verified:** 180 credits across all curriculum versions.

---

## 2. Category-Wise Performance

| Category | Description | Tested | Passed | Partial | Failed | Strict Accuracy |
|---|---|---|---|---|---|---|
| **basket_semester_listing** | basket semester listing | 160 | 160 | 0 | 0 | **100.0%** |
| **basket_full_listing** | basket full listing | 70 | 70 | 0 | 0 | **100.0%** |
| **batch_comparison** | batch comparison | 80 | 80 | 0 | 0 | **100.0%** |
| **course_lookup** | course lookup | 110 | 110 | 0 | 0 | **100.0%** |
| **credit_calculations** | credit calculations | 40 | 40 | 0 | 0 | **100.0%** |
| **degree_credit_structure** | degree credit structure | 40 | 40 | 0 | 0 | **100.0%** |

---

## 3. Accuracy by Admission Batch / Version

| Batch / Version | Degree Program | Questions Tested | Passed | Strict Accuracy |
|---|---|---|---|---|
| **Batch 2018** | B.Tech (Hons) CSE | 1 | 1 | **100.0%** |
| **Batch 2019** | B.Tech (Hons) CSE | 1 | 1 | **100.0%** |
| **Batch 2020** | B.Tech (Hons) CSE | 1 | 1 | **100.0%** |
| **Batch 2021** | B.Tech (Hons) CSE | 1 | 1 | **100.0%** |
| **Batch 2022** | B.Tech (Hons) CSE | 83 | 83 | **100.0%** |
| **Batch 2023** | B.Tech (Hons) CSE | 89 | 89 | **100.0%** |
| **Batch 2024** | B.Tech (Hons) CSE | 76 | 76 | **100.0%** |
| **Batch 2025** | B.Tech (Hons) CSE | 70 | 70 | **100.0%** |
| **Batch 2026** | B.Tech (Hons) Data Science | 70 | 70 | **100.0%** |
| **Batch 2030** | B.Tech (Hons) CSE | 1 | 1 | **100.0%** |
| **Batch 2035** | B.Tech (Hons) CSE | 1 | 1 | **100.0%** |
| **Batch 2022 vs 2023** | B.Tech (Hons) CSE | 7 | 7 | **100.0%** |
| **Batch 2023 vs 2024** | B.Tech (Hons) CSE | 7 | 7 | **100.0%** |
| **Batch 2024 vs 2025** | B.Tech (Hons) CSE | 7 | 7 | **100.0%** |
| **Batch 2025 vs 2026** | B.Tech (Hons) CSE | 7 | 7 | **100.0%** |
| **Batch 2022 vs 2024** | B.Tech (Hons) CSE | 7 | 7 | **100.0%** |
| **Batch 2023 vs 2025** | B.Tech (Hons) CSE | 7 | 7 | **100.0%** |
| **Batch 2024 vs 2026** | B.Tech (Hons) CSE | 7 | 7 | **100.0%** |
| **Batch 2022 vs 2026** | B.Tech (Hons) CSE | 7 | 7 | **100.0%** |
| **Batch Multi-Batch** | B.Tech (Hons) CSE | 24 | 24 | **100.0%** |
| **Batch All** | B.Tech (Hons) CSE | 14 | 14 | **100.0%** |
| **Batch Unsupported** | Non-B.Tech Programs | 12 | 12 | **100.0%** |

---

## 4. Degree Credit Architecture Verification

Official degree credit requirements verified against `Semester_Spread_Structures_Sept_2026.xlsx`:

| Curriculum Basket | Batch 2022 | Batch 2023 | Batch 2024 | Batch 2025 | Batch 2026 (Data Science) |
|---|---|---|---|---|---|
| **University Core** | 18 credits | 18 credits | 18 credits | 24 credits | 18 credits |
| **Foundation** | 34 credits | 34 credits | 34 credits | 24 credits | 26 credits |
| **Program Core** | 46 credits | 46 credits | 46 credits | 46 credits | 50 credits |
| **Program Honors** | 20 credits | 20 credits | 20 credits | 20 credits | 20 credits |
| **Specialization Tracks / Electives** | 20 credits | 20 credits | 20 credits | 20 credits | 20 credits |
| **Minor / Open Electives** | 24 credits | 24 credits | 24 credits | 32 credits | 32 credits |
| **Internship & Capstone Project** | 18 credits | 18 credits | 18 credits | 14 credits | 14 credits |
| **Total Credits for Degree Award** | **180 credits** | **180 credits** | **180 credits** | **180 credits** | **180 credits** |

---

## 5. Failure Analysis

✅ **Zero Failures.** All 500 test cases strictly matched the official university workbook data with clean formatting and exact citations.
