-- #153 — track when an ASA course textbook was mailed to a student.
-- Nullable date on enrollments; null = not mailed. Surfaced only for ASA
-- courses in the admin roster, but the column itself is course-agnostic.
-- No RLS change: admins already have an update policy on enrollments.
alter table public.enrollments add column book_mailed_at date;
