-- Course status expansion
-- Adds: draft, completed
-- Changes default from 'active' to 'draft' so new courses aren't immediately student-visible

ALTER TABLE courses ALTER COLUMN status SET DEFAULT 'draft';

-- Optional: backfill existing active courses (leave as-is, they're already published)
-- Existing rows keep status='active' which is correct.
