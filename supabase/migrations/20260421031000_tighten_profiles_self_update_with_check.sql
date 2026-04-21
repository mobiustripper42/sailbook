-- Prevent self-elevation: students cannot change role or status flags on their own profile.
-- The "Admins can update all profiles" policy still permits admin-initiated flag changes.
--
-- Direct correlated subqueries on profiles within the policy cause infinite recursion
-- (the subquery itself triggers the same policy). A SECURITY DEFINER function bypasses
-- RLS for the old-value lookup, breaking the recursion.

CREATE OR REPLACE FUNCTION public.profile_role_flags_unchanged(
  p_id          uuid,
  p_is_member   boolean,
  p_is_admin    boolean,
  p_is_instructor boolean,
  p_is_student  boolean,
  p_is_active   boolean
) RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id            = p_id
      AND is_member     = p_is_member
      AND is_admin      = p_is_admin
      AND is_instructor = p_is_instructor
      AND is_student    = p_is_student
      AND is_active     = p_is_active
  );
$$;

-- Explicit grant — Postgres defaults EXECUTE to PUBLIC, but be explicit for SECURITY DEFINER functions.
GRANT EXECUTE ON FUNCTION public.profile_role_flags_unchanged(uuid, boolean, boolean, boolean, boolean, boolean) TO authenticated;

DROP POLICY "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND public.profile_role_flags_unchanged(
      id, is_member, is_admin, is_instructor, is_student, is_active
    )
  );
