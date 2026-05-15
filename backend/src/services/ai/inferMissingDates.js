import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Infer the most probable dates for undated session columns using anchor sessions as reference.
 * @param {string[]} undatedColumns - Column names without a parseable date (e.g. ["Day 1", "Day 2"])
 * @param {{ date: string, label: string }[]} anchorSessions - Sessions with known dates from the same sheet
 * @param {string[]} daysOfWeek - User-confirmed class days e.g. ["Thursday", "Friday"]
 * @returns {Promise<{ suggestions: InferenceSuggestion[] }>}
 */
export async function inferMissingDates(undatedColumns, anchorSessions, daysOfWeek) {
  if (!process.env.GEMINI_API_KEY || undatedColumns.length === 0) {
    return {
      suggestions: undatedColumns.map(col => ({
        columnName: col,
        suggestedDate: null,
        confidence: 0,
        reasoning: 'AI unavailable — please enter the date manually.',
      })),
    };
  }

  const anchorList = anchorSessions.length > 0
    ? anchorSessions.map(s => `  - "${s.label}" → ${s.date}`).join('\n')
    : '  (none available)';

  const dayList = daysOfWeek.length > 0
    ? daysOfWeek.join(', ')
    : 'unknown (user has not specified class days yet)';

  const prompt = `
You are inferring the most probable session dates for unlabeled columns in a student attendance spreadsheet.

Known session dates (anchor points):
${anchorList}

The class is known to run on: ${dayList}

Columns that need date inference: ${JSON.stringify(undatedColumns)}

Instructions:
- Use the anchor sessions to establish a chronological sequence.
- Apply the known class days (${dayList}) to project forward or backward.
- Assign a confidence score (0–1) based on how certain you are.
- Provide 1–2 sentences of plain-English reasoning for each suggestion.
- If you truly cannot infer a date, set suggestedDate to null and confidence to 0.

Return ONLY valid JSON — no markdown, no explanation:
{
  "suggestions": [
    {
      "columnName": "string",
      "suggestedDate": "YYYY-MM-DD or null",
      "confidence": 0.0,
      "reasoning": "string"
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in Gemini response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[inferMissingDates] Gemini failed:', err.message);
    return {
      suggestions: undatedColumns.map(col => ({
        columnName: col,
        suggestedDate: null,
        confidence: 0,
        reasoning: 'AI inference failed — please enter the date manually.',
      })),
    };
  }
}
