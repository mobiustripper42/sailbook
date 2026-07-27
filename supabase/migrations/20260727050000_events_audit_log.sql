-- #144 / DEC-038: Audit / activity log.
-- Append-only record of "who did what, to which record, when". Follows the
-- DEC-035 credit_ledger shape: immutable rows, immutability enforced by RLS
-- rather than convention.
--
-- Why not DB triggers: a trigger can't attribute the actor. Under
-- SECURITY DEFINER or the service role, auth.uid() is NULL — the same gap
-- DEC-019 flagged. So writes are explicit calls from server actions,
-- webhook handlers, and cron jobs, funnelled through log_event() below.

CREATE TABLE public.events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- The user who caused this. NULL for system/stripe-originated events, and
    -- set to NULL if the profile is later deleted — the event survives.
  actor_kind   TEXT NOT NULL DEFAULT 'user',
  event_type   TEXT NOT NULL,
    -- Dotted '<entity>.<verb>', e.g. 'enrollment.cancelled'. Deliberately
    -- unconstrained: the vocabulary lives as a TS union in src/lib/events.ts,
    -- so adding an emitter is a code change, not a migration. Nothing joins
    -- to this column, so a CHECK would buy no integrity — only friction.
  entity_type  TEXT NOT NULL,
  entity_id    UUID,
    -- Bare uuid, NO foreign key, by design. Deleting a course or enrollment
    -- must not delete its audit trail — that's precisely when you need it.
  summary      TEXT NOT NULL,
    -- Human-readable one-liner rendered directly in the admin feed.
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT events_actor_kind_check CHECK (actor_kind IN ('user', 'system', 'stripe')),
  CONSTRAINT events_user_actor_has_id CHECK (actor_kind <> 'user' OR actor_id IS NOT NULL)
);

CREATE INDEX idx_events_occurred_at ON public.events(occurred_at DESC);
CREATE INDEX idx_events_entity      ON public.events(entity_type, entity_id);
CREATE INDEX idx_events_type        ON public.events(event_type);

-- ============================================================
-- RLS — EVENTS
-- ============================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Admins read the whole log. That is the ONLY policy on this table:
-- no INSERT, no UPDATE, no DELETE for anyone, including admins. Writes
-- arrive exclusively through log_event() (SECURITY DEFINER, below) or the
-- service role, which bypasses RLS. An audit log a user can rewrite is not
-- an audit log.
CREATE POLICY "Admin read all events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = TRUE
  );

-- ============================================================
-- log_event() — the only supported write path
-- ============================================================
-- Actor attribution rules:
--   * Called with a user session (auth.uid() present) — the caller IS the
--     actor. p_actor_id / p_actor_kind are IGNORED, so an authenticated
--     caller cannot forge an event as somebody else.
--   * Called with the service role (auth.uid() NULL — webhook, cron, or a
--     server action already writing via createAdminClient) — p_actor_kind
--     and p_actor_id are honored. The service role is trusted by definition;
--     app code is responsible for passing the right actor.
CREATE OR REPLACE FUNCTION public.log_event(
  p_event_type  TEXT,
  p_entity_type TEXT,
  p_entity_id   UUID,
  p_summary     TEXT,
  p_metadata    JSONB DEFAULT '{}'::jsonb,
  p_actor_kind  TEXT DEFAULT 'user',
  p_actor_id    UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller     UUID := auth.uid();
  v_actor_id   UUID;
  v_actor_kind TEXT;
  v_id         UUID;
BEGIN
  IF v_caller IS NOT NULL THEN
    v_actor_id   := v_caller;
    v_actor_kind := 'user';
  ELSE
    v_actor_kind := COALESCE(p_actor_kind, 'system');
    v_actor_id   := p_actor_id;
  END IF;

  INSERT INTO public.events (
    actor_id, actor_kind, event_type, entity_type, entity_id, summary, metadata
  ) VALUES (
    v_actor_id, v_actor_kind, p_event_type, p_entity_type, p_entity_id,
    p_summary, COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Any signed-in user may emit — students cancel their own enrollments and
-- join waitlists, and those belong in the log. Reading stays admin-only, so
-- emitting grants no visibility.
GRANT EXECUTE ON FUNCTION public.log_event(TEXT, TEXT, UUID, TEXT, JSONB, TEXT, UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.log_event(TEXT, TEXT, UUID, TEXT, JSONB, TEXT, UUID) FROM anon;
