-- Phase 5.8 — low enrollment thresholds on course_types.
-- Replaces the hardcoded LOW_ENROLLMENT_RATIO / LOW_ENROLLMENT_DAYS_OUT
-- constants in src/lib/notifications/triggers.ts. Same fields drive both the
-- daily admin alert and the new admin dashboard tile.
--
-- minimum_enrollment       NULL  → "don't flag" (course type opts out of low-
--                                   enrollment alerts and dashboard surfacing).
--                          INT   → absolute number of confirmed enrollments
--                                   below which a course is "low".
-- low_enrollment_lead_days INT   → only flag a course if its first upcoming
--                                   session is within this many days.

ALTER TABLE public.course_types
  ADD COLUMN minimum_enrollment       integer,
  ADD COLUMN low_enrollment_lead_days integer NOT NULL DEFAULT 14;

ALTER TABLE public.course_types
  ADD CONSTRAINT course_types_minimum_enrollment_nonneg
    CHECK (minimum_enrollment IS NULL OR minimum_enrollment >= 0);

ALTER TABLE public.course_types
  ADD CONSTRAINT course_types_low_enrollment_lead_days_positive
    CHECK (low_enrollment_lead_days >= 0);
