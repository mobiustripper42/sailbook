-- RLS + RPC tests for the events audit log (#144, DEC-038)
-- Policies under test:
--   events: admin SELECT only | no INSERT/UPDATE/DELETE for anyone,
--   including admin | writes only via log_event() SECURITY DEFINER
--   log_event: a signed-in caller is always the actor and cannot forge
--   actor_id; a service-role caller (no auth.uid()) supplies it explicitly
--
-- Run with: supabase test db

BEGIN;
SELECT plan(14);

CREATE SCHEMA IF NOT EXISTS tests;

CREATE OR REPLACE FUNCTION tests.authenticate(
  p_uid            uuid,
  p_is_admin       boolean DEFAULT false,
  p_is_instructor  boolean DEFAULT false,
  p_is_student     boolean DEFAULT false
) RETURNS void SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub',           p_uid::text,
    'role',          'authenticated',
    'user_metadata', json_build_object(
      'is_admin',      p_is_admin,
      'is_instructor', p_is_instructor,
      'is_student',    p_is_student
    )
  )::text, true);
END;
$$;

-- ============================================================
-- Seed reference (from seed.sql)
--   a1000000-...-0001 = Andy (admin)
--   a1000000-...-0002 = Mike (instructor)
--   a1000000-...-0005 = Sam  (student)
-- ============================================================

-- Two rows written as the table owner (bypasses RLS), standing in for what
-- log_event() would have inserted.
INSERT INTO public.events (id, actor_id, actor_kind, event_type, entity_type, entity_id, summary) VALUES
  ('e4000000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000001', 'user',
   'enrollment.cancelled', 'enrollment', 'e4000000-0000-0000-0000-0000000000aa',
   'Andy cancelled Sam''s enrollment'),
  ('e4000000-0000-0000-0000-000000000002',
   NULL, 'system',
   'enrollment.cancelled', 'enrollment', 'e4000000-0000-0000-0000-0000000000bb',
   'Hold expired');

-- ============================================================
-- Structural guarantees
-- ============================================================
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.events'::regclass),
  'events has RLS enabled'
);

-- SELECT is the only policy. Anything else would let a caller rewrite the log.
SELECT is(
  (SELECT count(*)::int FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'events' AND cmd <> 'SELECT'),
  0,
  'events has no INSERT/UPDATE/DELETE policy for any role'
);

SELECT is(
  (SELECT count(*)::int FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'events' AND cmd = 'SELECT'),
  1,
  'events has exactly one SELECT policy'
);

-- entity_id must NOT be a foreign key — deleting a course or enrollment has
-- to leave its audit trail behind.
SELECT is(
  (SELECT count(*)::int FROM pg_constraint
    WHERE conrelid = 'public.events'::regclass AND contype = 'f'
      AND 'entity_id' = ANY (
        SELECT attname FROM pg_attribute
         WHERE attrelid = 'public.events'::regclass AND attnum = ANY (conkey)
      )),
  0,
  'events.entity_id carries no foreign key'
);

SELECT ok(
  (SELECT prosecdef FROM pg_proc WHERE oid = 'public.log_event'::regproc),
  'log_event is SECURITY DEFINER'
);

-- ============================================================
-- Admin — reads everything, writes nothing
-- ============================================================
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000001'::uuid, true, false, false);
SET LOCAL ROLE authenticated;

SELECT is(
  (SELECT count(*)::int FROM public.events
    WHERE id IN ('e4000000-0000-0000-0000-000000000001',
                 'e4000000-0000-0000-0000-000000000002')),
  2,
  'admin reads all events, including system-actor rows'
);

-- UPDATE and DELETE do not raise: with no policy for those commands, RLS
-- simply exposes zero rows to modify, so they are silent no-ops. Immutability
-- is proven by the row surviving unchanged, not by an exception.
UPDATE public.events SET summary = 'rewritten'
  WHERE id = 'e4000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT summary FROM public.events
    WHERE id = 'e4000000-0000-0000-0000-000000000001'),
  'Andy cancelled Sam''s enrollment',
  'admin UPDATE is a no-op — the summary is unchanged'
);

DELETE FROM public.events
  WHERE id = 'e4000000-0000-0000-0000-000000000001';

SELECT is(
  (SELECT count(*)::int FROM public.events
    WHERE id = 'e4000000-0000-0000-0000-000000000001'),
  1,
  'admin DELETE is a no-op — the event survives'
);

SELECT throws_ok(
  $$ INSERT INTO public.events (actor_kind, event_type, entity_type, summary)
     VALUES ('system', 'enrollment.cancelled', 'enrollment', 'direct insert') $$,
  '42501',
  NULL,
  'admin cannot INSERT an event directly'
);

-- ============================================================
-- log_event — actor attribution
-- ============================================================
-- Called as the admin, trying to pin the event on Sam. The RPC must ignore
-- both forged parameters and record the caller.
SELECT lives_ok(
  $$ SELECT public.log_event(
       'enrollment.confirmed', 'enrollment',
       'e4000000-0000-0000-0000-0000000000cc'::uuid,
       'Admin emitted this',
       '{}'::jsonb,
       'system',
       'a1000000-0000-0000-0000-000000000005'::uuid) $$,
  'log_event is callable by an authenticated user'
);

SELECT is(
  (SELECT actor_id FROM public.events
    WHERE entity_id = 'e4000000-0000-0000-0000-0000000000cc'::uuid),
  'a1000000-0000-0000-0000-000000000001'::uuid,
  'log_event records the caller as actor, ignoring a forged actor_id'
);

SELECT is(
  (SELECT actor_kind FROM public.events
    WHERE entity_id = 'e4000000-0000-0000-0000-0000000000cc'::uuid),
  'user',
  'log_event forces actor_kind=user for a signed-in caller'
);

-- ============================================================
-- Non-admins — may emit, must not read
-- ============================================================
RESET ROLE;
SELECT tests.authenticate('a1000000-0000-0000-0000-000000000005'::uuid, false, false, true);
SET LOCAL ROLE authenticated;

-- Students cancel their own enrollments and join waitlists, so they have to
-- be able to emit. Reading stays admin-only, so this leaks nothing.
SELECT lives_ok(
  $$ SELECT public.log_event(
       'waitlist.joined', 'course',
       'e4000000-0000-0000-0000-0000000000dd'::uuid,
       'Sam joined a waitlist') $$,
  'a student can emit an event'
);

SELECT is(
  (SELECT count(*)::int FROM public.events),
  0,
  'a student reads no events, not even ones they caused'
);

RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
