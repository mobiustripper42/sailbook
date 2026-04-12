-- Smoke test — verifies pgTAP is working and core tables exist.
-- Run with: supabase test db

BEGIN;
SELECT plan(7);

-- pgTAP is alive
SELECT pass('pgTAP is running');

-- Core tables exist
SELECT has_table('public', 'profiles',          'profiles table exists');
SELECT has_table('public', 'course_types',      'course_types table exists');
SELECT has_table('public', 'courses',           'courses table exists');
SELECT has_table('public', 'sessions',          'sessions table exists');
SELECT has_table('public', 'enrollments',       'enrollments table exists');
SELECT has_table('public', 'session_attendance','session_attendance table exists');

SELECT * FROM finish();
ROLLBACK;
