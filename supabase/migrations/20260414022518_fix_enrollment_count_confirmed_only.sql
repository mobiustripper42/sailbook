-- Fix capacity counting: only confirmed enrollments hold a spot.
-- Previously both functions counted status != 'cancelled', which included
-- 'registered' (pending admin review) enrollments against capacity.

CREATE OR REPLACE FUNCTION "public"."get_all_course_enrollment_counts"()
  RETURNS TABLE("course_id" "uuid", "active_count" integer)
  LANGUAGE "sql" STABLE SECURITY DEFINER
  SET "search_path" TO 'public'
  AS $$
  SELECT course_id, COUNT(*)::INTEGER AS active_count
  FROM enrollments
  WHERE status = 'confirmed'
  GROUP BY course_id;
$$;

CREATE OR REPLACE FUNCTION "public"."get_course_active_enrollment_count"("p_course_id" "uuid")
  RETURNS integer
  LANGUAGE "sql" STABLE SECURITY DEFINER
  SET "search_path" TO 'public'
  AS $$
  SELECT COUNT(*)::INTEGER
  FROM enrollments
  WHERE course_id = p_course_id AND status = 'confirmed';
$$;
