import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../db.js';
import { requireAuth, requireMentor } from '../middleware/auth.js';
import { requireSubjectAccess } from '../middleware/subjectAuth.js';
import { analyzeAttendanceSheet } from '../services/geminiAttendance.js';

const router = express.Router();

// 1. Analyze sheets snippet
router.post('/analyze', requireAuth, requireMentor, async (req, res) => {
  try {
    const { sheets } = req.body; // [{ sheetName, rows }]
    if (!sheets || !Array.isArray(sheets)) {
      return res.status(400).json({ error: 'Sheets array required' });
    }

    const analyses = [];
    for (const sheet of sheets) {
      const analysis = await analyzeAttendanceSheet(sheet.sheetName, sheet.rows);
      
      // Map to frontend expectation
      analyses.push({
        sheetName: sheet.sheetName,
        analysis: {
          studentIdentifiers: analysis.studentIdColumns.map(col => ({
            columnName: col,
            dbField: col.toLowerCase().includes('usn') ? 'usn' : 'name',
            confidence: analysis.confidence,
            reasoning: 'Inferred by AI'
          })),
          sessionColumns: analysis.sessionColumns.map(col => ({
            ...col,
            confidence: analysis.confidence,
            reasoning: 'Inferred by AI'
          })),
          presentValues: analysis.presentValues,
          absentValues: analysis.absentValues,
          needsDateConfirmation: analysis.needsDateConfirmation
        }
      });
    }

    return res.json({ analyses });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return res.status(500).json({ error: 'AI analysis failed' });
  }
});

// 2. Dry-run: Validate data and detect conflicts
router.post('/dry-run', requireAuth, requireMentor, async (req, res) => {
  try {
    const { sheets } = req.body; // [{ sheetName, rows, mapping }]
    
    const summary = { totalRows: 0, validRecords: 0, conflicts: 0, unknownStudents: 0 };
    const conflicts = [];
    const unknownStudents = [];
    const normalizedRows = [];

    // Pre-fetch all active students for faster lookup
    const studentsRes = await query('SELECT id, usn, name FROM public.students WHERE is_active = true');
    const studentMap = {};
    studentsRes.rows.forEach(s => {
      studentMap[s.usn.toUpperCase()] = s.id;
    });

    for (const sheet of sheets) {
      const { mapping, rows, sheetName } = sheet;
      const idCol = mapping.studentIdentifier;
      const presentVals = mapping.presentValues || [];
      const sessionCols = mapping.sessionColumns || [];

      for (const row of rows) {
        summary.totalRows++;
        const rawId = row[idCol];
        if (!rawId) continue;

        const usn = String(rawId).trim().toUpperCase();
        const studentId = studentMap[usn];

        if (!studentId) {
          if (!unknownStudents.some(s => s.usn === usn)) {
            unknownStudents.push({ usn, name: row['Name'] || row['Student Name'] || 'Unknown' });
          }
          summary.unknownStudents++;
          continue;
        }

        // Process each session column in the row
        for (const session of sessionCols) {
          if (!session.date) continue;

          const rawStatus = row[session.columnName];
          const isPresent = presentVals.includes(String(rawStatus).trim()) || 
                            presentVals.includes(rawStatus);

          const record = {
            studentId,
            usn,
            date: session.date,
            present: isPresent,
            sheetName
          };

          // Check for conflicts
          const existing = await query(
            'SELECT a.id FROM public.attendance a JOIN public.sessions s ON a.session_id = s.id WHERE a.student_id = $1 AND s.date = $2',
            [studentId, session.date]
          );

          if (existing.rows.length > 0) {
            summary.conflicts++;
            conflicts.push({
              studentUsn: usn,
              date: session.date,
              type: 'overlap',
              message: `Attendance already exists for ${usn} on ${session.date}`
            });
          }

          normalizedRows.push(record);
          summary.validRecords++;
        }
      }
    }

    return res.json({
      batchDraftId: uuidv4(),
      summary,
      conflicts,
      unknownStudents,
      normalizedRows,
      gapReport: [],
      unmappedColumns: []
    });
  } catch (error) {
    console.error('Dry-run Error:', error);
    return res.status(500).json({ error: 'Dry-run validation failed' });
  }
});

// 3. Commit the import
router.post('/commit', requireAuth, requireMentor, async (req, res, next) => {
  if (!req.body.subjectId) {
    return res.status(400).json({ error: 'Subject ID is required for import. Please select a subject in the dropdown.' });
  }
  return next();
}, requireSubjectAccess, async (req, res) => {
  try {
    const { normalizedRows, conflictResolution, subjectId } = req.body;
    
    let written = 0;
    let overwritten = 0;
    let skipped = 0;
    
    // Cache sessions created during this import to avoid redundant lookups
    const sessionCache = {};

    for (const row of normalizedRows) {
      const { studentId, date, present } = row;
      const sessionDate = new Date(date).toISOString().split('T')[0];
      const cacheKey = `${sessionDate}_${subjectId || 'null'}`;

      let sessionId;
      if (sessionCache[cacheKey]) {
        sessionId = sessionCache[cacheKey];
      } else {
        // Find or create session
        const sessionRes = await query(
          'SELECT id FROM public.sessions WHERE date = $1 AND (subject_id = $2 OR (subject_id IS NULL AND $2 IS NULL))',
          [sessionDate, subjectId]
        );

        if (sessionRes.rows.length > 0) {
          sessionId = sessionRes.rows[0].id;
        } else {
          const newSession = await query(
            'INSERT INTO public.sessions (date, topic, month_number, subject_id) VALUES ($1, $2, $3, $4) RETURNING id',
            [sessionDate, 'Bulk Import', new Date(sessionDate).getMonth() + 1, subjectId]
          );
          sessionId = newSession.rows[0].id;
        }
        sessionCache[cacheKey] = sessionId;
      }

      // Handle conflict resolution
      if (conflictResolution === 'skip') {
        const existing = await query(
          'SELECT id FROM public.attendance WHERE student_id = $1 AND session_id = $2',
          [studentId, sessionId]
        );
        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }
      }

      // Insert or Update
      const result = await query(
        `INSERT INTO public.attendance (student_id, session_id, present, marked_by) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (student_id, session_id) 
         DO UPDATE SET present = EXCLUDED.present, marked_at = NOW()
         RETURNING (xmax = 0) AS inserted`,
        [studentId, sessionId, present, req.auth.user.displayName]
      );

      if (result.rows[0].inserted) {
        written++;
      } else {
        overwritten++;
      }
    }

    return res.json({
      success: true,
      written,
      overwritten,
      skipped,
      warnings: []
    });
  } catch (error) {
    console.error('Commit Error:', error);
    return res.status(500).json({ error: 'Failed to commit import' });
  }
});

export default router;
