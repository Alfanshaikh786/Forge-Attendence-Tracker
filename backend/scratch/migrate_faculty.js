import { query } from '../src/db.js';

async function migrateFaculty() {
  try {
    console.log('🚀 Starting Faculty Auth Migration...');

    // 1. Create Faculty table
    await query(`
      CREATE TABLE IF NOT EXISTS public.faculty (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        short_name TEXT,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Created faculty table.');

    // 2. Update users table to link to faculty
    await query(`
      ALTER TABLE public.users ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES public.faculty(id)
    `);
    console.log('✅ Linked users to faculty table.');

    // 3. Update subjects table to link to assigned faculty
    await query(`
      ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS assigned_faculty_id UUID REFERENCES public.faculty(id)
    `);
    console.log('✅ Linked subjects to assigned faculty.');

    // 4. Update role-based security policies for Faculty
    // We will use the 'mentor' role as 'faculty' for now, but ensure subject-wise isolation
    
    console.log('🎉 Database Schema Migration Completed!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    process.exit();
  }
}

migrateFaculty();
