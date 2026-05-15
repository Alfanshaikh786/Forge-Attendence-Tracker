-- Phase 1 - Schema creation

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  usn TEXT UNIQUE NOT NULL,
  admission_number TEXT,
  email TEXT,
  branch_code TEXT NOT NULL,
  batch TEXT DEFAULT '2024-2028',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  topic TEXT NOT NULL,
  month_number INTEGER NOT NULL,
  duration_hours NUMERIC(3,1) DEFAULT 2.0,
  session_type TEXT DEFAULT 'offline',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.import_log (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  total_rows INTEGER NOT NULL,
  imported_rows INTEGER NOT NULL,
  skipped_rows INTEGER NOT NULL,
  warnings TEXT,
  column_mapping TEXT,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES public.students(id),
  session_id INTEGER NOT NULL REFERENCES public.sessions(id),
  present BOOLEAN NOT NULL,
  marked_at TIMESTAMP DEFAULT NOW(),
  marked_by TEXT DEFAULT 'system',
  import_id INTEGER REFERENCES public.import_log(id),
  UNIQUE(student_id, session_id)
);

CREATE TABLE IF NOT EXISTS public.materials (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES public.sessions(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('mentor', 'student')),
  student_id INTEGER REFERENCES public.students(id),
  display_name TEXT NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id),
  is_pinned BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id SERIAL PRIMARY KEY,
  last_message TEXT,
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id INTEGER REFERENCES public.conversations(id),
  user_id UUID REFERENCES public.users(id),
  unread_count INTEGER DEFAULT 0,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES public.conversations(id),
  sender_id UUID REFERENCES public.users(id),
  content TEXT NOT NULL,
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Constraints (Spec §6.1)
-- CHECK constraint on attendance date not before 2025-08-04 and not in future
-- (Implemented via trigger function)
CREATE OR REPLACE FUNCTION check_attendance_date()
RETURNS TRIGGER AS $$
DECLARE
  session_date DATE;
BEGIN
  SELECT date INTO session_date FROM public.sessions WHERE id = NEW.session_id;
  
  IF session_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Cannot mark attendance for a future date';
  END IF;
  
  IF session_date < '2025-08-04' THEN
    RAISE EXCEPTION 'Cannot mark attendance for dates before program start (2025-08-04)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_attendance_date ON public.attendance;
CREATE TRIGGER trg_check_attendance_date
BEFORE INSERT OR UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION check_attendance_date();

-- Auth Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This will link Supabase Auth to our public.users table
  -- We assume students are created by mentors first, then they login/sign up
  -- Or auto-created user logic can be expanded here
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. RLS Enablement
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Mentors get full access to everything
DROP POLICY IF EXISTS "mentors_all_students" ON public.students;
CREATE POLICY "mentors_all_students" ON public.students AS PERMISSIVE FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' );
DROP POLICY IF EXISTS "mentors_all_sessions" ON public.sessions;
CREATE POLICY "mentors_all_sessions" ON public.sessions AS PERMISSIVE FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' );
DROP POLICY IF EXISTS "mentors_all_attendance" ON public.attendance;
CREATE POLICY "mentors_all_attendance" ON public.attendance AS PERMISSIVE FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' );
DROP POLICY IF EXISTS "mentors_all_materials" ON public.materials;
CREATE POLICY "mentors_all_materials" ON public.materials AS PERMISSIVE FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' );
DROP POLICY IF EXISTS "mentors_all_import_log" ON public.import_log;
CREATE POLICY "mentors_all_import_log" ON public.import_log AS PERMISSIVE FOR ALL USING ( (SELECT role FROM public.users WHERE id = auth.uid()) = 'mentor' );

-- Students access policies
DROP POLICY IF EXISTS "students_read_own_student_record" ON public.students;
CREATE POLICY "students_read_own_student_record" ON public.students FOR SELECT USING ( id = (SELECT student_id FROM public.users WHERE id = auth.uid()) );
DROP POLICY IF EXISTS "students_read_all_sessions" ON public.sessions;
CREATE POLICY "students_read_all_sessions" ON public.sessions FOR SELECT USING ( true );
DROP POLICY IF EXISTS "students_read_own_attendance" ON public.attendance;
CREATE POLICY "students_read_own_attendance" ON public.attendance FOR SELECT USING ( student_id = (SELECT student_id FROM public.users WHERE id = auth.uid()) );
DROP POLICY IF EXISTS "students_read_all_materials" ON public.materials;
CREATE POLICY "students_read_all_materials" ON public.materials FOR SELECT USING ( true );

-- Public read for users table (so policies can evaluate)
DROP POLICY IF EXISTS "read_own_user" ON public.users;
CREATE POLICY "read_own_user" ON public.users FOR SELECT USING ( id = auth.uid() );
