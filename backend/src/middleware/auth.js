import jwt from 'jsonwebtoken';
import { query } from '../db.js';

function getTokenFromHeader(header) {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export async function requireAuth(req, res, next) {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Missing authentication token.' });

    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'JWT_SECRET is not configured.' });

    const decoded = jwt.verify(token, secret);
    
    // SQL query to find user
    const userResult = await query('SELECT * FROM public.users WHERE id = $1', [decoded.sub]);
    const user = userResult.rows[0];

    if (!user) return res.status(401).json({ error: 'Account not found.' });

    // Map DB fields to what the app expects
    req.auth = { 
      user: {
        _id: user.id, // Keep _id for frontend compatibility if possible, or update frontend
        email: user.email,
        role: user.role,
        displayName: user.display_name,
        studentId: user.student_id
      }, 
      token 
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }
}

export function requireMentor(req, res, next) {
  if (!req.auth || req.auth.user.role !== 'mentor') {
    return res.status(403).json({ error: 'Forbidden. Mentor access required.' });
  }
  next();
}

export function requireStudent(req, res, next) {
  if (!req.auth || req.auth.user.role !== 'student') {
    return res.status(403).json({ error: 'Forbidden. Student access required.' });
  }
  next();
}
