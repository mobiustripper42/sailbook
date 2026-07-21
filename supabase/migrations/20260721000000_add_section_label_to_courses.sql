-- DEC-036: section_label as a first-class field on courses.
-- Formalizes the disambiguator operators were cramming into `title`
-- (e.g. "Open Sailing July 1st Boat 1") so two concurrent same-time
-- offerings become structurally distinct. Nullable; `title` stays for
-- genuinely custom names. No RLS change — inherits courses' existing
-- admin-write/all-read policies.

alter table "public"."courses"
  add column "section_label" character varying(50);

comment on column "public"."courses"."section_label" is
  'Optional structural disambiguator (e.g. "Boat 1"), rendered as a chip alongside the course type name. The schedule itself is derived from sessions, never denormalized here.';
