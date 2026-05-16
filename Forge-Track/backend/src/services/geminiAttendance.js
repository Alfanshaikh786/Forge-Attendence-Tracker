import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function analyzeAttendanceSheet(sheetName, sheetDataSnippet) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `
    Analyze the following JSON data snippet representing a spreadsheet sheet named "${sheetName}".
    This spreadsheet contains student attendance data. The format can be messy, with dates as columns, or dates in rows.
    
    Your goal is to understand how this sheet is structured so we can parse it programmatically.
    
    We need to extract for each student:
    - Identifying information (e.g., USN, Roll No, Student ID, Email, or Name)
    - Attendance records (Date of session, Status: present/absent)

    Identify:
    1. The column names/indexes that represent student identifiers (like "usn", "email", "name").
    2. The columns/rows that represent "Sessions" or "Dates". Provide the list of these session columns and try to infer the date they represent.
    3. The values used for Present (e.g., true, 1, "P", "Yes") and Absent (e.g., false, 0, "A", "No", empty).
    4. Are there any missing dates that you can infer? (e.g. if it says "Day 1", "Day 2", what might the dates be? If you can't infer, just leave it null and we will ask the user).

    Data Snippet (First few rows):
    ${JSON.stringify(sheetDataSnippet)}

    Return ONLY a valid JSON object matching this structure:
    {
      "studentIdColumns": ["usn_column_name_or_index", "name_column_name_or_index"],
      "sessionColumns": [
        { "columnName": "Header Name", "inferredDate": "YYYY-MM-DD" or null }
      ],
      "presentValues": ["true", "P", "1"],
      "absentValues": ["false", "A", "0", ""],
      "confidence": 0.95,
      "needsDateConfirmation": true_or_false
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse Gemini response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Analysis Error (Falling back to heuristic parser):", error);
    
    // Fallback heuristic parser if Gemini API is exhausted/fails
    try {
      const firstRow = sheetDataSnippet[0] || {};
      const keys = Object.keys(firstRow);
      
      const studentIdCols = keys.filter(k => 
        k.toLowerCase().includes('usn') || 
        k.toLowerCase().includes('name') || 
        k.toLowerCase().includes('email') ||
        k.toLowerCase().includes('id')
      );

      const sessionCols = keys
        .filter(k => !studentIdCols.includes(k) && k.toLowerCase() !== 'sl no' && k.toLowerCase() !== 'branch_code')
        .map(k => {
          let inferredDate = null;
          // Try to see if the column name looks like a date
          if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(k)) {
            // Very naive date conversion for fallback
            const parts = k.split(/[/-]/);
            inferredDate = `20${parts[2].length === 2 ? parts[2] : parts[2].slice(-2)}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
          return { columnName: k, inferredDate };
        });

      return {
        studentIdColumns: studentIdCols.length > 0 ? studentIdCols : [keys[0]],
        sessionColumns: sessionCols,
        presentValues: ["true", "1", "P", "Yes", "TRUE", "present", true, 1],
        absentValues: ["false", "0", "A", "No", "FALSE", "absent", false, 0, ""],
        confidence: 0.5,
        needsDateConfirmation: sessionCols.some(s => !s.inferredDate)
      };
    } catch (fallbackError) {
      throw new Error(`AI and Fallback Analysis failed: ${error.message}`);
    }
  }
}
