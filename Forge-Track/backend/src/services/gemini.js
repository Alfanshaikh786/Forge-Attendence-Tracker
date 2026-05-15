import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function analyzeCSV(csvSnippet) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `
    Analyze the following CSV data snippet and provide a JSON mapping for ForgeTrack attendance import.
    ForgeTrack expects students to have fields: fullName, usn, department, batchYear.
    Attendance records need: status (present/absent), date (if in CSV).

    CSV Snippet:
    ${csvSnippet}

    Return ONLY a JSON object with this structure:
    {
      "columnMapping": {
        "fullName": "CSV_COLUMN_NAME",
        "usn": "CSV_COLUMN_NAME",
        "department": "CSV_COLUMN_NAME",
        "batchYear": "CSV_COLUMN_NAME",
        "status": "CSV_COLUMN_NAME",
        "date": "CSV_COLUMN_NAME" (optional)
      },
      "detectedDateFormat": "YYYY-MM-DD" (if applicable),
      "confidence": 0.95
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (Gemini sometimes adds markdown blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse Gemini response");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
