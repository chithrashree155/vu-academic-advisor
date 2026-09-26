/**
 * Query & Intent Classifier Interface and Deterministic Fallback Classifier
 */

import { IntentClassificationResult } from '../types/system';

const OUT_OF_SCOPE_KEYWORDS = [
  'weather',
  'cricket',
  'movie',
  'dating',
  'cryptocurrency',
  'joke',
  'restaurant',
  'party',
];

export function classifyIntentDeterministically(query: string): IntentClassificationResult {
  const normalized = query.toLowerCase().trim();

  // Check out of scope
  if (OUT_OF_SCOPE_KEYWORDS.some((kw) => normalized.includes(kw))) {
    return {
      intent: 'OUT_OF_SCOPE',
      requiresStudentProfile: false,
      extractedParameters: {},
      confidence: 0.95,
    };
  }

  // Attendance check
  if (normalized.includes('attendance') || normalized.includes('shortage') || normalized.includes('75%') || normalized.includes('debarred')) {
    return {
      intent: 'ATTENDANCE_POLICY',
      requiresStudentProfile: normalized.includes('my attendance') || normalized.includes('am i eligible'),
      extractedParameters: {},
      confidence: 0.85,
    };
  }

  // Prerequisite check
  if (normalized.includes('prerequisite') || normalized.includes('pre-req') || normalized.includes('prior course')) {
    const courseMatch = query.match(/[A-Z]{3,4}\s?\d{3}/i);
    return {
      intent: 'PREREQUISITE_INQUIRY',
      requiresStudentProfile: false,
      extractedParameters: {
        courseCode: courseMatch ? courseMatch[0].replace(/\s+/, '').toUpperCase() : undefined,
      },
      confidence: 0.9,
    };
  }

  // Progression / Promotion check
  if (normalized.includes('progression') || normalized.includes('promote') || normalized.includes('year 2') || normalized.includes('year 3') || normalized.includes('cgpa to pass')) {
    return {
      intent: 'PROGRESSION_CHECK',
      requiresStudentProfile: normalized.includes('my cgpa') || normalized.includes('will i be promoted'),
      extractedParameters: {},
      confidence: 0.85,
    };
  }

  // Summer Term Offerings
  if (normalized.includes('summer term') || normalized.includes('summer 2026') || normalized.includes('summer course')) {
    const courseMatch = query.match(/[A-Z]{3,4}\s?\d{3}/i);
    return {
      intent: 'SUMMER_TERM_OFFERING',
      requiresStudentProfile: false,
      extractedParameters: {
        courseCode: courseMatch ? courseMatch[0].replace(/\s+/, '').toUpperCase() : undefined,
        term: 'Summer Term June 2026',
      },
      confidence: 0.9,
    };
  }

  // Minor enrollment
  if (normalized.includes('minor')) {
    return {
      intent: 'MINOR_ENROLLMENT',
      requiresStudentProfile: false,
      extractedParameters: {},
      confidence: 0.8,
    };
  }

  // Default to general policy inquiry
  return {
    intent: 'GENERAL_POLICY',
    requiresStudentProfile: false,
    extractedParameters: {},
    confidence: 0.7,
  };
}
