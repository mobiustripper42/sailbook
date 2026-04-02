// Hand-written types matching docs/sailbook-schema.sql
// Regenerate with: npx supabase gen types typescript --local > src/lib/supabase/types.ts

export type Profile = {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string | null
  role: string
  experience_level: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CourseType = {
  id: string
  name: string
  short_code: string
  certification_body: string | null
  description: string | null
  min_hours: number | null
  max_students: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Course = {
  id: string
  course_type_id: string
  instructor_id: string
  title: string | null
  description: string | null
  capacity: number
  price: number | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string
}

export type Session = {
  id: string
  course_id: string
  instructor_id: string | null
  date: string
  start_time: string
  end_time: string
  location: string | null
  status: string
  cancel_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Enrollment = {
  id: string
  course_id: string
  student_id: string
  status: string
  enrolled_at: string
  updated_at: string
}

export type SessionAttendance = {
  id: string
  session_id: string
  enrollment_id: string
  status: string
  makeup_session_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
