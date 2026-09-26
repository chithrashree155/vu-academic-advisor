/**
 * Ingestion Pipeline Interfaces & Parser Contracts
 */

export interface ParsedSpreadsheetCourse {
  batch: string;
  semesterNum: number;
  basketName: string;
  courseCode: string;
  courseName: string;
  rawPrerequisite: string;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  credits: number;
  isUncertain: boolean;
  uncertaintyReason?: string;
  sourceSheet: string;
}

export interface ParsedMinorCourse {
  minorCode: string;
  minorName: string;
  batch: string;
  semesterNum: number;
  courseCode: string;
  courseName: string;
  rawPrerequisite: string;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  credits: number;
  isUncertain: boolean;
  sourceSheet: string;
}

export interface IngestionReport {
  documentId: string;
  filename: string;
  totalRecordsExtracted: number;
  uncertainPlaceholdersIdentified: number;
  warnings: string[];
}
