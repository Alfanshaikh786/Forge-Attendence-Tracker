import { query } from '../db.js';

/**
 * Middleware to check if the authenticated faculty (mentor) has access to a specific subject.
 * Handles both Integer IDs (subjects, sessions) and UUIDs (faculty).
 */
export async function requireSubjectAccess(req, res, next) {
  try {
    const user = req.auth?.user;
    if (!user || user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor role required.' });
    }

    const facultyId = user.facultyId;
    if (!facultyId) {
      console.warn('[SubjectAuth] No facultyId found in session user object');
      return res.status(403).json({ error: 'Access denied. Faculty ID not found in session.' });
    }

    // Try to find subjectId or sessionId from any possible location
    const subjectId = req.params.subjectId || req.body.subjectId || req.query.subjectId;
    const sessionId = req.params.id || req.body.sessionId || req.query.sessionId;

    console.log(`[SubjectAuth] Request: ${req.method} ${req.originalUrl} | facultyId=${facultyId} | subjectId=${subjectId} | sessionId=${sessionId}`);

    if (!subjectId && !sessionId) {
      return next();
    }

    let targetSubjectId = subjectId;

    // Resolve subject from session if only sessionId is provided
    if (!targetSubjectId && sessionId) {
      // Check if it's a valid ID (integer or UUID)
      // Since our sessions use Integer IDs, we should allow numeric strings
      if (isNaN(parseInt(sessionId)) && !/^[0-9a-f]{8}-/i.test(sessionId)) {
         console.log(`[SubjectAuth] sessionId is not numeric or UUID: ${sessionId}`);
         return next();
      }

      const sessionRes = await query('SELECT subject_id FROM public.sessions WHERE id = $1', [sessionId]);
      if (sessionRes.rows.length === 0) {
        console.warn(`[SubjectAuth] Session ${sessionId} not found`);
        return res.status(404).json({ error: 'Session not found.' });
      }
      targetSubjectId = sessionRes.rows[0].subject_id;
    }

    if (!targetSubjectId) {
       console.log('[SubjectAuth] No subject linked (General/Skill Lab), allowing access');
       return next();
    }

    // Verify ownership
    // targetSubjectId is an Integer in DB, facultyId is a UUID in DB
    const result = await query(
      'SELECT id FROM public.subjects WHERE id = $1 AND assigned_faculty_id = $2',
      [targetSubjectId, facultyId]
    );

    if (result.rows.length === 0) {
      console.warn(`[SubjectAuth] DENIED: Faculty ${facultyId} does not own Subject ${targetSubjectId}`);
      return res.status(403).json({ 
        error: 'Unauthorized access to this subject.',
        details: 'You are not assigned as the faculty for this course.'
      });
    }

    console.log('[SubjectAuth] GRANTED');
    next();
  } catch (error) {
    console.error('[SubjectAuth] CRITICAL ERROR:', error);
    return res.status(500).json({ 
      error: 'Internal authorization failure.', 
      details: error.message 
    });
  }
}
