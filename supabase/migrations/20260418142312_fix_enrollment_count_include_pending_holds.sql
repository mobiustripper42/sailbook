-- Fix capacity counting: active pending_payment holds must occupy a seat.
-- Previously only 'confirmed' enrollments were counted, allowing multiple
-- students to reach the Stripe checkout for a single-seat course.

CREATE OR REPLACE FUNCTION "public"."get_all_course_enrollment_counts"()
  RETURNS TABLE("course_id" "uuid", "active_count" integer)
  LANGUAGE "sql" VOLATILE SECURITY DEFINER
  SET "search_path" TO 'public'
  AS $$
  SELECT course_id, COUNT(*)::INTEGER AS active_count
  FROM enrollments
  WHERE status = 'confirmed'
     OR (status = 'pending_payment' AND hold_expires_at > now())
  GROUP BY course_id;
$$;

CREATE OR REPLACE FUNCTION "public"."get_course_active_enrollment_count"("p_course_id" "uuid")
  RETURNS integer
  LANGUAGE "sql" VOLATILE SECURITY DEFINER
  SET "search_path" TO 'public'
  AS $$
  SELECT COUNT(*)::INTEGER
  FROM enrollments
  WHERE course_id = p_course_id
    AND (
      status = 'confirmed'
      OR (status = 'pending_payment' AND hold_expires_at > now())
    );
$$;
