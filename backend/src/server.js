import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { connectDatabase, isDbConnected } from './db.js';
import authRouter from './routes/auth.js';
import mentorRouter from './routes/mentor.js';
import studentRouter from './routes/student.js';
import messagesRouter from './routes/messages.js';
import announcementsRouter from './routes/announcements.js';
import attendanceImportRouter from './routes/attendanceImport.js';
import attendanceManagementRouter from './routes/attendanceManagement.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN;

const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:5176', 'http://127.0.0.1:5176'];
const allowedOrigins = clientOrigin ? clientOrigin.split(',').map((v) => v.trim()) : defaultOrigins;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Middleware to check DB connection
app.use((req, res, next) => {
  if (req.url.startsWith('/api/health') || req.url === '/') {
    return next();
  }
  
  if (!isDbConnected()) {
    return res.status(503).json({ 
      error: 'Database Connection Error', 
      message: 'The server is running but cannot reach Supabase. Please check your DATABASE_URL.' 
    });
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: isDbConnected() ? 'connected' : 'disconnected' });
});

app.use('/api/auth', authRouter);
app.use('/api/mentor/attendance-import', attendanceImportRouter);
app.use('/api/mentor', mentorRouter);
app.use('/api/student', studentRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/attendance', attendanceManagementRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

async function start() {
  try {
    await connectDatabase();
  } catch (error) {
    console.error('CRITICAL: Failed to connect to Supabase on startup:', error.message);
  }

  app.listen(port, () => {
    console.log(`ForgeTrack API running on port ${port} (Supabase Mode)`);
  });
}

start().catch((error) => {
  console.error('FATAL ERROR during startup:', error);
  process.exit(1);
});
