import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function serializeUser(user) {
  return {
    id: user.id || user._id,
    email: user.email,
    role: user.role,
    name: user.display_name || user.displayName,
    student_id: user.student_id || user.studentId,
    profile_image: user.profile_image,
    must_change_password: user.must_change_password || false,
  };
}

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured.');

  return jwt.sign(
    {
      role: user.role,
      studentId: user.student_id || user.studentId,
    },
    secret,
    {
      subject: (user.id || user._id).toString(),
      expiresIn: '7d',
    }
  );
}

router.post('/login', async (req, res) => {
  const { role, identifier, password } = req.body ?? {};

  if (!role || !identifier || !password) {
    return res.status(400).json({ error: 'Role, identifier, and password are required.' });
  }

  const emailIdentifier = String(identifier).trim().toLowerCase();

  try {
    // SQL query to find user
    const userResult = await query(
      'SELECT * FROM public.users WHERE email = $1 AND role = $2',
      [emailIdentifier, role]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const matches = await bcrypt.compare(password, user.password_hash);

    if (!matches) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signToken(user);
    return res.json({ token, user: serializeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  return res.json({ user: serializeUser(req.auth.user) });
});

export default router;
