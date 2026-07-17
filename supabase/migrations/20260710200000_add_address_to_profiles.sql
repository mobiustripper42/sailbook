-- Mailing address for students (#129) — needed to ship ASA textbooks.
-- Nullable at the DB: existing rows are untouched and the requirement is
-- enforced form-side at the ASA-enrollment gate, not by a NOT NULL constraint.
-- No RLS change: address columns inherit the existing profiles policies
-- (a student can already read/update their own row).
ALTER TABLE public.profiles ADD COLUMN address_line1 VARCHAR(200);
ALTER TABLE public.profiles ADD COLUMN address_line2 VARCHAR(200);
ALTER TABLE public.profiles ADD COLUMN city VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN state VARCHAR(2);
ALTER TABLE public.profiles ADD COLUMN postal_code VARCHAR(20);
