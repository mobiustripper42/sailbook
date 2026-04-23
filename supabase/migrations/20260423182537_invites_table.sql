-- Phase 4.1: Instructor invite link (also prepares 4.2 admin invite).
-- Single shared reusable link per role. Admin regenerates to invalidate the
-- old link. Accepting a valid token grants the matching role flag to the
-- caller's profile.

CREATE TABLE public.invites (
  role text PRIMARY KEY CHECK (role IN ('instructor', 'admin')),
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_accepted_at timestamptz,
  last_accepted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do anything with invites" ON public.invites
  FOR ALL TO authenticated
  USING ((((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text))
  WITH CHECK ((((auth.jwt() -> 'user_metadata'::text) ->> 'is_admin'::text) = 'true'::text));

-- Accept an invite token. SECURITY DEFINER so the caller never reads the
-- invites table directly (only admins can). Returns true on success, false
-- if the token does not match the given role.
--
-- Intentionally bypasses the profiles self-update WITH CHECK guard
-- (profile_role_flags_unchanged, profile_auth_source_unchanged) — role
-- promotion via a vetted invite token is the whole point of this function,
-- and auth_source is orthogonal to role (an admin_created student can still
-- legitimately accept an instructor invite).
CREATE OR REPLACE FUNCTION public.accept_invite(p_role text, p_token text)
RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_matches boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  IF p_role NOT IN ('instructor', 'admin') THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.invites
    WHERE role = p_role AND token = p_token
  ) INTO v_matches;

  IF NOT v_matches THEN
    RETURN false;
  END IF;

  IF p_role = 'instructor' THEN
    UPDATE public.profiles SET is_instructor = true, updated_at = now() WHERE id = v_uid;
  ELSIF p_role = 'admin' THEN
    UPDATE public.profiles SET is_admin = true, updated_at = now() WHERE id = v_uid;
  END IF;

  UPDATE public.invites
     SET last_accepted_at = now(),
         last_accepted_by = v_uid
   WHERE role = p_role;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_invite(text, text) TO authenticated;
