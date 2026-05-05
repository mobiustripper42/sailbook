-- 2026 season seed: ASA 101 weekend courses, May through October.
--
-- This is NOT auto-run by `supabase db reset` (that uses seed.sql for test data).
-- Run manually against the target database:
--
--   Local dev:  psql "$(supabase status -o env | grep DB_URL | cut -d= -f2 | tr -d '\"')" \
--                 -f supabase/seeds/2026_season_courses.sql
--   Prod:       psql "<prod connection string>" -f supabase/seeds/2026_season_courses.sql
--
-- Idempotent: re-running is safe.
--   - course_type upserts on short_code
--   - courses dedupe on (course_type_id, title) — won't double-create
--
-- Before running against prod: change ADMIN_EMAIL below to a real admin profile email.

BEGIN;

-- 1. Course types — six ASA classes shown on /sailing-classes.
--    Slug is required (NOT NULL, no default) and drives the public URL /courses/<slug>.
--    Only ASA101 has scheduled sessions below; the others render "Coming soon"
--    on the public catalog until Andy adds courses for them.
INSERT INTO public.course_types (name, short_code, slug, certification_body, description, max_students)
VALUES
  (
    'ASA 101 - Sailing Made Easy',
    'ASA101', 'asa101',
    'American Sailing',
    'Learn to skipper a 20'' – 27'' sloop-rigged keelboat by day, in light to moderate winds and sea conditions. Learn basic sailing terminology, parts and functions, helm commands, basic sail trim, points of sail, buoyage, seamanship and safety including basic navigation rules to avoid collisions and hazards. 2 days.',
    4
  ),
  (
    'ASA 102 - Keelboat 2',
    'ASA102', 'asa102',
    'American Sailing',
    'Able to skipper and crew aboard a sloop-rigged keelboat of approximately 20 to 30 feet in length by day in winds up to 20 knots. Depart, sail, and return with control demonstrating teamwork. ASA 101 or equivalent sailing skills & experience.',
    4
  ),
  (
    'ASA 103 - Coastal Cruising Made Easy',
    'ASA103', 'asa103',
    'American Sailing',
    'Prerequisite: ASA 101. Learn to skipper a sloop-rigged auxiliary powered 25'' – 35'' keelboat by day in moderate winds and sea conditions. Covers cruising sailboat terminology, basic boat systems, auxiliary engine operation, docking procedures, intermediate sail trim, navigation rules, basic coastal navigation, anchoring, weather, safety and seamanship.',
    4
  ),
  (
    'ASA 104 - Bareboat Cruising Made Easy',
    'ASA104', 'asa104',
    'American Sailing',
    'Prerequisite: ASA 101, 103. Learn how to sail a sloop-rigged, auxiliary powered 30'' – 45'' sailboat during a multi-day cruise upon inland/coastal waters in moderate/heavy winds and sea conditions. Covers provisioning, boat systems, auxiliary engines, advanced sail trim, coastal navigation, anchoring/mooring, docking, emergency operations, weather, and more.',
    4
  ),
  (
    'ASA 105 - Coastal Navigation',
    'ASA105', 'asa105',
    'American Sailing',
    'Learn the navigational theory and practices for safe navigation of a sailing vessel in coastal and inland waters.',
    4
  ),
  (
    'ASA 118 - Docking Endorsement',
    'ASA118', 'asa118',
    'American Sailing',
    'Learn basic docking skills for boats with single inboard or outboard engines. Discover the basic theory and hands-on techniques needed to dock and undock boats in an efficient manner and without damage or injury.',
    4
  )
ON CONFLICT (short_code) DO UPDATE
  SET name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      certification_body = EXCLUDED.certification_body,
      description = EXCLUDED.description,
      max_students = EXCLUDED.max_students,
      updated_at = now();

-- 2. Courses + sessions for every weekend, May 2 – October 25, 2026
DO $$
DECLARE
  ADMIN_EMAIL constant text := 'andy@ltsc.test';
  LOCATION    constant text := 'Cleveland Sailing Center at 55th Street Marina';
  PRICE       constant numeric := 550.00;
  CAPACITY    constant integer := 4;

  v_course_type_id uuid;
  v_admin_id       uuid;
  v_sat            date;
  v_sun            date;
  v_title          text;
  v_course_id      uuid;
  v_inserted       integer := 0;
  v_skipped        integer := 0;
BEGIN
  SELECT id INTO v_course_type_id
  FROM public.course_types
  WHERE short_code = 'ASA101';

  IF v_course_type_id IS NULL THEN
    RAISE EXCEPTION 'course_type ASA101 not found (upsert above failed)';
  END IF;

  SELECT id INTO v_admin_id
  FROM public.profiles
  WHERE email = ADMIN_EMAIL AND is_admin = true;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'admin profile with email % not found — edit ADMIN_EMAIL at top of script', ADMIN_EMAIL;
  END IF;

  -- May 2 2026 is a Saturday; step 7 days through Oct 24 (last full weekend in October).
  FOR v_sat IN
    SELECT d::date
    FROM generate_series('2026-05-02'::date, '2026-10-24'::date, interval '7 days') AS d
  LOOP
    v_sun := v_sat + 1;

    -- Title format: "ASA 101 - May 2-3, 2026" (hyphens; GSM-7 safe for SMS)
    v_title := 'ASA 101 - '
            || to_char(v_sat, 'FMMon FMDD')
            || '-'
            || to_char(v_sun, 'FMDD')
            || ', '
            || to_char(v_sat, 'YYYY');

    IF EXISTS (
      SELECT 1 FROM public.courses
      WHERE course_type_id = v_course_type_id AND title = v_title
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    INSERT INTO public.courses (
      course_type_id, instructor_id, title, capacity, price, member_price, status, created_by
    )
    VALUES (
      v_course_type_id, NULL, v_title, CAPACITY, PRICE, PRICE, 'active', v_admin_id
    )
    RETURNING id INTO v_course_id;

    INSERT INTO public.sessions (course_id, instructor_id, date, start_time, end_time, location)
    VALUES
      (v_course_id, NULL, v_sat, '08:00', '16:00', LOCATION),
      (v_course_id, NULL, v_sun, '08:00', '16:00', LOCATION);

    v_inserted := v_inserted + 1;
  END LOOP;

  RAISE NOTICE '2026 season seed: % course(s) inserted, % already existed (skipped)', v_inserted, v_skipped;
END $$;

COMMIT;
