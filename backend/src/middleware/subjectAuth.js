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
      return res.status(403).json({ error: 'Access denied. Faculty ID not found in session.' });
    }

    // Identify subject or session context
    const subjectId = req.params.subjectId || req.body.subjectId || req.query.subjectId;
    const sessionId = req.params.id || req.body.sessionId || req.query.sessionId;

    // If no context provided, we can't perform subject-specific validation
    if (!subjectId && !sessionId) {
      return next();
    }

    let targetSubjectId = subjectId;

    // Resolve subject from session if only sessionId is provided
    if (!targetSubjectId && sessionId) {
      const sIdInt = parseInt(sessionId);
      if (!isNaN(sIdInt)) {
        const sessionRes = await query('SELECT subject_id FROM public.sessions WHERE id = $1', [sIdInt]);
        if (sessionRes.rows.length > 0) {
          targetSubjectId = sessionRes.rows[0].subject_id;
        } else {
          // Session not found - let the route handler deal with it
          return next();
        }
      } else {
        // Not a numeric session ID - likely a date format route
        return next();
      }
    }

    // If no subject linked (General/Skill Lab), allow access
    if (!targetSubjectId) {
       return next();
    }

    // Verify faculty owns this subject
    const subIdInt = parseInt(targetSubjectId);
    if (isNaN(subIdInt)) {
        // Not a numeric subject ID
        return next();
    }

    const result = await query(
      'SELECT id FROM public.subjects WHERE id = $1 AND assigned_faculty_id = $2',
      [subIdInt, facultyId]
    );

    if (result.rows.length === 0) {
      console.warn(`[SubjectAuth] DENIED: Faculty ${facultyId} -> Subject ${subIdInt}`);
      return res.status(403).json({ 
        error: 'Unauthorized access to this subject.',
        details: 'You are not assigned as the faculty for this course.'
      });
    }

    next();
  } catch (error) {
    console.error('[SubjectAuth] ERROR:', error);
    return res.status(500).json({ 
      error: 'Internal authorization failure.', 
      message: error.message,
      path: req.originalUrl 
    });
  }
}
