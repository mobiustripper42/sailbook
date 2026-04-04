-- Migration 004: Make courses.instructor_id nullable
-- Allows courses to be created without assigning an instructor upfront.
-- The "courses without instructors" admin dashboard stat (Phase 5) will surface these.

ALTER TABLE courses ALTER COLUMN instructor_id DROP NOT NULL;
