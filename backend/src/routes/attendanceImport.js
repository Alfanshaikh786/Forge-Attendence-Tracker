import express from 'express';
import { query } from '../db.js';
import { requireAuth, requireMentor } from '../middleware/auth.js';
import { analyzeCSV } from '../services/gemini.js';

const router = express.Router();

router.post('/analyze', requireAuth, requireMentor, async (req, res) => {
  try {
    const { csvSnippet } = req.body;
    if (!csvSnippet) return res.status(400).json({ error: 'CSV snippet required' });

    const analysis = await analyzeCSV(csvSnippet);
    return res.json({ analysis });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.post('/commit', requireAuth, requireMentor, async (req, res) => {
  try {
    const { students, sessionData, subjectId } = req.body;

    // 1. Get or Create Session
    const sessionDate = new Date(sessionData.date).toISOString().split('T')[0];
    let sessionResult = await query(
      'SELECT id FROM public.sessions WHERE date = $1 AND (subject_id = $2 OR (subject_id IS NULL AND $2 IS NULL))', 
      [sessionDate, subjectId]
    );
    let sessionId;

    if (sessionResult.rows.length === 0) {
      const newSession = await query(
        'INSERT INTO public.sessions (date, topic, month_number, subject_id) VALUES ($1, $2, $3, $4) RETURNING id',
        [sessionDate, sessionData.topic || 'Imported Session', new Date(sessionDate).getMonth() + 1, subjectId]
      );
      sessionId = newSession.rows[0].id;
    } else {
      sessionId = sessionResult.rows[0].id;
    }

    // 2. Process Attendance (Bulk)
    let successCount = 0;
    for (const s of students) {
      try {
        // Find student by USN
        const studentResult = await query('SELECT id FROM public.students WHERE usn = $1', [s.usn.toUpperCase()]);
        if (studentResult.rows.length > 0) {
          const studentId = studentResult.rows[0].id;
          
          await query(
            'INSERT INTO public.attendance (student_id, session_id, present, marked_by) VALUES ($1, $2, $3, $4) ON CONFLICT (student_id, session_id) DO UPDATE SET present = $3',
            [studentId, sessionId, s.status === 'present', req.auth.user.displayName]
          );
          successCount++;
        }
      } catch (e) {
        console.warn(`Failed to import attendance for ${s.usn}:`, e.message);
      }
    }

    return res.json({ 
      success: true, 
      message: `Imported ${successCount} attendance records`,
      sessionId 
    });
  } catch (error) {
    console.error('Commit Error:', error);
    return res.status(500).json({ error: 'Failed to commit import' });
  }
});

export default router;
