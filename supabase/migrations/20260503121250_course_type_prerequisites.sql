-- Prerequisite flagging (Task 5.4): course types can declare other course types
-- as recommended prereqs. The flag is informational — admins see it during
-- enrollment review, students see it during enrollment, but enrollment is not
-- blocked. AS-20 / ST-15.

CREATE TABLE public.course_type_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_type_id UUID NOT NULL REFERENCES public.course_types(id) ON DELETE CASCADE,
  required_course_type_id UUID NOT NULL REFERENCES public.course_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT course_type_prerequisites_unique UNIQUE (course_type_id, required_course_type_id),
  CONSTRAINT course_type_prerequisites_no_self CHECK (course_type_id <> required_course_type_id)
);

CREATE INDEX idx_course_type_prerequisites_course_type
  ON public.course_type_prerequisites(course_type_id);

ALTER TABLE public.course_type_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with course_type_prerequisites"
  ON public.course_type_prerequisites TO authenticated
  USING (((auth.jwt() -> 'user_metadata') ->> 'is_admin') = 'true')
  WITH CHECK (((auth.jwt() -> 'user_metadata') ->> 'is_admin') = 'true');

-- Authenticated users (students, instructors) can read all prereqs so the
-- student enrollment page can show the warning banner and admins / instructors
-- can see the requirements.
CREATE POLICY "Authenticated users can read course_type_prerequisites"
  ON public.course_type_prerequisites FOR SELECT TO authenticated
  USING (true);
