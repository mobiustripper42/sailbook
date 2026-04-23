-- auth_source was not included in the self-update WITH CHECK guard, allowing
-- a student to change their own auth_source (e.g. 'admin_created' → 'self_registered').
-- Adds a SECURITY DEFINER function to check auth_source invariance and wires it
-- into the existing "Users can update own profile" policy.

CREATE OR REPLACE FUNCTION public.profile_auth_source_unchanged(p_id uuid, p_auth_source text)
RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_id AND auth_source = p_auth_source
  );
$$;

GRANT EXECUTE ON FUNCTION public.profile_auth_source_unchanged(uuid, text) TO authenticated;

DROP POLICY "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND public.profile_role_flags_unchanged(
      id, is_member, is_admin, is_instructor, is_student, is_active
    )
    AND public.profile_auth_source_unchanged(id, auth_source)
  );
