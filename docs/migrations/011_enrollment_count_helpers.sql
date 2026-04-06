-- Phase 5.17b — SECURITY DEFINER helpers for enrollment counts
--
-- Problem: enrollment count queries run as the student's session client.
-- Student RLS on enrollments filters to student_id = auth.uid(), so counts
-- return 0 (unenrolled) or 1 (their own row) instead of the real total.
-- This broke the "Full" badge, spots remaining display, and capacity enforcement.
--
-- Fix: two helpers that run as the definer (bypasses RLS) and return counts only.
-- No PII exposed — just integers and course UUIDs.

-- Single course: used by course detail page and enrollInCourse action
CREATE OR REPLACE FUNCTION get_course_active_enrollment_count(p_course_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM enrollments
  WHERE course_id = p_course_id AND status != 'cancelled';
$$;

-- All courses at once: used by the course browse page (one query, not N+1)
CREATE OR REPLACE FUNCTION get_all_course_enrollment_counts()
RETURNS TABLE(course_id UUID, active_count INTEGER)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT course_id, COUNT(*)::INTEGER AS active_count
  FROM enrollments
  WHERE status != 'cancelled'
  GROUP BY course_id;
$$;
