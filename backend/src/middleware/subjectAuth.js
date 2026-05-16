import { query } from '../db.js';

/**
 * Middleware to check if the authenticated faculty (mentor) has access to a specific subject.
 * Expected: req.auth.user.facultyId is present.
 * The subjectId can be in req.params.subjectId, req.body.subjectId, or req.query.subjectId.
 */
export async function requireSubjectAccess(req, res, next) {
  try {
    if (!req.auth || req.auth.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentor role required.' });
    }

    const facultyId = req.auth.user.facultyId;
    if (!facultyId) {
      console.warn('[SubjectAuth] No facultyId found in req.auth.user');
      return res.status(403).json({ error: 'Access denied. Faculty ID not found in session.' });
    }

    // Try to find subjectId or sessionId
    const subjectId = req.params.subjectId || req.body.subjectId || req.query.subjectId;
    const sessionId = req.params.id || req.body.sessionId || req.query.sessionId;

    console.log(`[SubjectAuth] Checking: facultyId=${facultyId}, subId=${subjectId}, sesId=${sessionId}`);

    if (!subjectId && !sessionId) {
      return next();
    }

    let targetSubjectId = subjectId;

    // UUID Validation
    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

    // Resolve subject from session
    if (!targetSubjectId && sessionId) {
      if (!isUUID(sessionId)) {
        console.log(`[SubjectAuth] Session ID is not a UUID (likely a date): ${sessionId}`);
        return next(); 
      }

      const sessionRes = await query('SELECT subject_id FROM public.sessions WHERE id = $1', [sessionId]);
      if (sessionRes.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found.' });
      }
      targetSubjectId = sessionRes.rows[0].subject_id;
    }

    if (!targetSubjectId) {
       console.log('[SubjectAuth] No subject linked, allowing as general');
       return next();
    }

    if (!isUUID(targetSubjectId)) {
        console.warn(`[SubjectAuth] Target subject ID is not a UUID: ${targetSubjectId}`);
        return next();
    }

    // Auth Check
    const result = await query(
      'SELECT id FROM public.subjects WHERE id = $1 AND assigned_faculty_id = $2',
      [targetSubjectId, facultyId]
    );

    if (result.rows.length === 0) {
      console.warn(`[SubjectAuth] DENIED: Faculty ${facultyId} -> Subject ${targetSubjectId}`);
      return res.status(403).json({ 
        error: 'Unauthorized access to this subject.',
        details: 'You are not assigned as the faculty for this course.'
      });
    }

    console.log('[SubjectAuth] GRANTED');
    next();
  } catch (error) {
    console.error('[SubjectAuth] ERROR:', error);
    return res.status(500).json({ error: 'Internal authorization failure.', message: error.message });
  }
}
