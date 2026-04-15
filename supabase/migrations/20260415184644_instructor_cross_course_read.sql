-- Allow instructors to read all student enrollment and attendance history.
-- Instructors need this to view any student's Experience page, not just
-- students from their own courses.
--
-- NOTE: Narrow baseline policies (scoped to own-course students/enrollments)
-- remain in place from the initial schema. These broader policies do NOT
-- replace them — Postgres evaluates all matching policies with OR semantics,
-- so the net effect is correct. The narrow policies are redundant but harmless.

CREATE POLICY "Instructors can read all enrollments"
  ON public.enrollments
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
  );

CREATE POLICY "Instructors can read all session attendance"
  ON public.session_attendance
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
  );

CREATE POLICY "Instructors can read all sessions"
  ON public.sessions
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
  );

CREATE POLICY "Instructors can read all courses"
  ON public.courses
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
  );

CREATE POLICY "Instructors can read all student profiles"
  ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_instructor') = 'true'
    AND is_student = true
  );
