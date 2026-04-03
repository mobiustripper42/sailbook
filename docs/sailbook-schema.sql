-- SailBook MVP Schema
-- Single school, Supabase-direct, Next.js + Vercel
-- Roles: boolean flags (is_admin, is_instructor, is_student) — multi-role capable
-- Students: self-register, Supabase Auth for all users

-- ============================================================
-- PROFILES
-- Extends Supabase Auth. Every authenticated user gets a profile.
-- Role flags: is_admin, is_instructor, is_student (not mutually exclusive)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_instructor BOOLEAN NOT NULL DEFAULT FALSE,
  is_student BOOLEAN NOT NULL DEFAULT FALSE,
  experience_level VARCHAR(20),                  -- students only: 'beginner', 'intermediate', 'advanced'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COURSE TYPES
-- Templates: ASA 101, ASA 103, Dinghy Sailing, Open Sailing, etc.
-- No dates, no schedule — just what the course IS.
-- ============================================================
CREATE TABLE course_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,              -- 'ASA 101 - Basic Keelboat Sailing'
  short_code VARCHAR(20) NOT NULL UNIQUE,  -- 'ASA101', 'OPEN', 'DINGHY'
  certification_body VARCHAR(100),          -- 'ASA' or NULL for non-cert courses
  description TEXT,
  min_hours INT,                            -- minimum required hours (NULL for open sailing)
  max_students INT DEFAULT 4,               -- default capacity (overridable per course)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COURSES
-- A specific offering: "ASA 101, May 17-18, with Captain Dave"
-- References a course_type. Has one or more sessions.
-- ============================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_type_id UUID NOT NULL REFERENCES course_types(id),
  instructor_id UUID NOT NULL REFERENCES profiles(id),
  title VARCHAR(255),                       -- optional override, e.g. 'ASA 101 — Weekend Intensive'
  description TEXT,                         -- optional override or additions
  capacity INT NOT NULL DEFAULT 4,
  price DECIMAL(10, 2),                     -- display only for MVP, no payment processing
  status VARCHAR(20) DEFAULT 'draft',       -- 'draft', 'active', 'completed', 'cancelled'
  notes TEXT,                               -- internal admin notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES profiles(id)
);

-- ============================================================
-- SESSIONS
-- Individual time blocks. A course has one or more sessions.
-- ASA 101 weekend: 2 sessions (Sat 8-4, Sun 8-4)
-- ASA 101 evenings: 4 sessions (Wed 4-8 x4)
-- Open Sailing: recurring sessions (every Wed 6-9)
-- ============================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES profiles(id),  -- NULL = use course default instructor
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'scheduled',   -- 'scheduled', 'completed', 'cancelled'
  cancel_reason TEXT,                        -- why it was cancelled (weather, etc.)
  notes TEXT,                                -- session-specific notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ENROLLMENTS
-- Student registered for a course (not individual sessions).
-- ============================================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'registered',  -- 'registered', 'confirmed', 'cancelled', 'completed'
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

-- ============================================================
-- SESSION ATTENDANCE
-- Per-student, per-session tracking.
-- Drives makeup logic: who missed what.
-- ============================================================
CREATE TABLE session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'expected',    -- 'expected', 'attended', 'missed', 'excused'
  makeup_session_id UUID REFERENCES sessions(id),  -- if missed, which session they made it up in
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, enrollment_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;
CREATE INDEX idx_profiles_is_instructor ON profiles(is_instructor) WHERE is_instructor = TRUE;
CREATE INDEX idx_profiles_is_student ON profiles(is_student) WHERE is_student = TRUE;
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_courses_type ON courses(course_type_id);
CREATE INDEX idx_courses_instructor ON courses(instructor_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_sessions_course ON sessions(course_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_attendance_session ON session_attendance(session_id);
CREATE INDEX idx_attendance_enrollment ON session_attendance(enrollment_id);
CREATE INDEX idx_attendance_makeup ON session_attendance(makeup_session_id);
