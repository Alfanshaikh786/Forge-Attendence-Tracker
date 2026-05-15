import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Analyze a sheet's first N rows to produce a field mapping with confidence scores.
 * @param {string} sheetName
 * @param {object[]} rows  – First 10 rows as JSON array (objects keyed by header name)
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzeSheetStructure(sheetName, rows) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[analyzeSheetStructure] GEMINI_API_KEY not set — using heuristic fallback');
    return heuristicAnalysis(rows);
  }

  const prompt = `
You are analyzing a spreadsheet sheet called "${sheetName}" that contains student attendance data.

The data snippet (up to 10 rows, JSON format) is:
${JSON.stringify(rows, null, 2)}

Your task is to identify the structure so we can parse it programmatically.

Rules:
1. Student identifier columns: look for USN, roll number, admission number, email, or name columns.
   The primary identifier should be USN (university serial number) or email.
2. Session/attendance columns: columns whose headers look like dates (in any format: DD/MM/YY, YYYY-MM-DD, DD-MM-YY, ISO timestamps, or descriptive labels like "Day 1", "Day 2").
   - For each, try to infer the YYYY-MM-DD date. If you cannot, set inferredDate to null.
   - Detect the date format used.
3. Presence/absence values: identify what values mean "present" (e.g. TRUE, 1, P, Yes, present) vs "absent" (FALSE, 0, A, No, empty string, absent).
4. Confidence scoring: for each column mapping, assign a 0–1 confidence score and provide a 1–2 sentence plain-English reasoning.
5. Flag columns that are NOT student identifiers AND NOT attendance sessions (e.g., score columns, links columns) as "ignoredColumns".

Return ONLY valid JSON matching exactly this structure — no markdown, no explanation:
{
  "studentIdentifiers": [
    {
      "columnName": "string",
      "dbField": "usn|email|name|admissionNumber",
      "confidence": 0.0,
      "reasoning": "string"
    }
  ],
  "sessionColumns": [
    {
      "columnName": "string",
      "inferredDate": "YYYY-MM-DD or null",
      "dateFormat": "DD/MM/YY | YYYY-MM-DD | DD-MM-YY | label | unknown",
      "confidence": 0.0,
      "needsUserDate": true,
      "reasoning": "string"
    }
  ],
  "presentValues": ["string"],
  "absentValues": ["string"],
  "ignoredColumns": ["string"],
  "overallConfidence": 0.0,
  "aiUsed": true
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Gemini response');
    const parsed = JSON.parse(jsonMatch[0]);
    parsed.aiUsed = true;
    return parsed;
  } catch (err) {
    console.error('[analyzeSheetStructure] Gemini call failed, using heuristic:', err.message);
    return heuristicAnalysis(rows);
  }
}

// ─── Heuristic fallback ────────────────────────────────────────────────────────
function heuristicAnalysis(rows) {
  if (!rows || rows.length === 0) {
    return {
      studentIdentifiers: [],
      sessionColumns: [],
      presentValues: ['TRUE', 'true', '1', 'P', 'Yes', 'present', true, 1],
      absentValues: ['FALSE', 'false', '0', 'A', 'No', 'absent', false, 0, ''],
      ignoredColumns: [],
      overallConfidence: 0.4,
      aiUsed: false,
    };
  }

  const keys = Object.keys(rows[0]);

  const ID_KEYWORDS = ['usn', 'email', 'name', 'roll', 'admission', 'id', 'sl', 'sno'];
  const IGNORE_KEYWORDS = ['link', 'url', 'n8n', 'score', 'knowledge', 'skill', 'marks', 'grade'];

  const studentIdentifiers = [];
  const sessionColumns = [];
  const ignoredColumns = [];

  for (const key of keys) {
    const lower = key.toLowerCase();

    if (IGNORE_KEYWORDS.some(k => lower.includes(k))) {
      ignoredColumns.push(key);
      continue;
    }

    if (ID_KEYWORDS.some(k => lower.includes(k))) {
      let dbField = 'name';
      if (lower.includes('usn')) dbField = 'usn';
      else if (lower.includes('email')) dbField = 'email';
      else if (lower.includes('admission')) dbField = 'admissionNumber';

      studentIdentifiers.push({
        columnName: key,
        dbField,
        confidence: 0.65,
        reasoning: `Heuristic: column name "${key}" contains keyword "${dbField}".`,
      });
      continue;
    }

    // Try to parse as a date
    const inferred = tryParseDate(key);
    sessionColumns.push({
      columnName: key,
      inferredDate: inferred?.date ?? null,
      dateFormat: inferred?.format ?? 'unknown',
      confidence: inferred ? 0.6 : 0.3,
      needsUserDate: !inferred,
      reasoning: inferred
        ? `Heuristic: column name "${key}" parsed as ${inferred.format}.`
        : `Heuristic: could not parse "${key}" as a date — user confirmation needed.`,
    });
  }

  return {
    studentIdentifiers,
    sessionColumns,
    presentValues: ['TRUE', 'true', '1', 'P', 'Yes', 'present', true, 1],
    absentValues: ['FALSE', 'false', '0', 'A', 'No', 'absent', false, 0, ''],
    ignoredColumns,
    overallConfidence: 0.45,
    aiUsed: false,
  };
}

/**
 * Attempts to parse a column header as a date.
 * Handles: DD/MM/YY, DD/MM/YYYY, YYYY-MM-DD, DD-MM-YY, DD-MM-YYYY
 */
function tryParseDate(str) {
  const s = String(str).trim();

  // YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return { date: s, format: 'YYYY-MM-DD' };
  }

  // DD/MM/YY or DD/MM/YYYY
  const dmy_slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (dmy_slash) {
    const [, d, m, y] = dmy_slash;
    const year = y.length === 2 ? (parseInt(y) <= 30 ? `20${y}` : `19${y}`) : y;
    return { date: `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, format: 'DD/MM/YY' };
  }

  // DD-MM-YY or DD-MM-YYYY
  const dmy_dash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (dmy_dash) {
    const [, d, m, y] = dmy_dash;
    const year = y.length === 2 ? (parseInt(y) <= 30 ? `20${y}` : `19${y}`) : y;
    return { date: `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`, format: 'DD-MM-YY' };
  }

  return null;
}
