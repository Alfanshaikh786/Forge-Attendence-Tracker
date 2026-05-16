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
      return res.status(403).json({ error: 'Access denied. Faculty ID not found in session.' });
    }

    // Try to find subjectId or sessionId
    const subjectId = req.params.subjectId || req.body.subjectId || req.query.subjectId;
    const sessionId = req.params.id || req.body.sessionId || req.query.sessionId;

    if (!subjectId && !sessionId) {
      return next();
    }

    let targetSubjectId = subjectId;

    // If we have a sessionId but no subjectId, lookup the subjectId
    if (!targetSubjectId && sessionId) {
      const sessionRes = await query('SELECT subject_id FROM public.sessions WHERE id = $1', [sessionId]);
      if (sessionRes.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found.' });
      }
      targetSubjectId = sessionRes.rows[0].subject_id;
    }

    if (!targetSubjectId) {
       // If it's a general session (no subject), for now let's allow it 
       // but we could also restrict it to super-admins.
       return next();
    }

    // Check if the subject is assigned to this faculty
    const result = await query(
      'SELECT id FROM public.subjects WHERE id = $1 AND assigned_faculty_id = $2',
      [targetSubjectId, facultyId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Unauthorized access to this subject.',
        details: 'You are not assigned as the faculty for this course.'
      });
    }

    next();
  } catch (error) {
    console.error('Subject authorization error:', error);
    return res.status(500).json({ error: 'Internal authorization failure.' });
  }
}
