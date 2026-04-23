-- Phase 4.4a: Admin-created student profiles (DEC-024)
-- Admin can create students via a passwordless auth.users row + profile.
-- auth_source discriminates self-registered from admin-created profiles.
-- profiles.id = auth.users.id invariant is preserved (no free-floating UUIDs).

ALTER TABLE public.profiles
  ADD COLUMN auth_source TEXT NOT NULL DEFAULT 'self_registered'
  CHECK (auth_source IN ('self_registered', 'admin_created'));
