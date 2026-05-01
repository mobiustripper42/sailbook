-- Add slug to course_types for public URL routing (/courses/[slug])
-- Backfill from short_code (lowercased). Admin can override via the form.
-- Also opens SELECT to the anon role so unauthenticated LTSC visitors can
-- browse course types, active courses, and their sessions.

-- Slug column
ALTER TABLE public.course_types ADD COLUMN slug TEXT;

UPDATE public.course_types
  SET slug = lower(short_code);

ALTER TABLE public.course_types ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.course_types ADD CONSTRAINT course_types_slug_key UNIQUE (slug);

-- Anon read policies
CREATE POLICY "Public can read active course_types"
  ON public.course_types FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "Public can read active courses"
  ON public.courses FOR SELECT TO anon
  USING (status = 'active');

CREATE POLICY "Public can read sessions for active courses"
  ON public.sessions FOR SELECT TO anon
  USING (
    course_id IN (
      SELECT id FROM public.courses WHERE status = 'active'
    )
  );
