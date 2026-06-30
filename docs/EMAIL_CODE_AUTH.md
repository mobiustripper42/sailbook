# Enabling email one-time-code sign-in (DEC-031)

The feature ships **dark**. Merging/deploying the code changes nothing — it stays
hidden and inert until these steps are done. Do them per Supabase project
(**staging and prod separately**).

> **Why this is required:** `signInWithOtp` emails whatever the Supabase **Magic
> Link** template contains. Supabase's default template is a clickable link
> (`{{ .ConfirmationURL }}`). To get a 6-digit **code**, the template must emit
> `{{ .Token }}`. The repo's `supabase/templates/magic_link.html` only configures
> **local** Supabase — it does **not** sync to remote projects. So with the flag on
> but the dashboard template untouched, users get a magic link, not a code.

## Steps (per project)

1. **Swap the email template.** Dashboard → **Authentication → Emails → Templates
   → Magic Link**:
   - Subject: `Your SailBook sign-in code`
   - Body: must contain `{{ .Token }}` and **no** `{{ .ConfirmationURL }}`. Minimum:
     ```html
     <p>Your sign-in code: <strong>{{ .Token }}</strong></p>
     <p>It expires shortly.</p>
     ```
     Or paste the branded version from `supabase/templates/magic_link.html`.
   - Save. Takes effect immediately — no redeploy.

2. **Raise the send rate limit.** Dashboard → Authentication → Rate Limits →
   `email_sent`. The built-in-sender default is **2/hr**, which walls real users.
   Raise it (custom SMTP required for anything meaningful).

3. **Confirm auth SMTP delivers.** Codes ride the same SMTP as confirmation /
   recovery emails. If those deliver in this project, codes will too.

4. **Flip the flag.** Vercel → Environment Variables → set
   `NEXT_PUBLIC_EMAIL_CODE_AUTH=true` for the matching environment (Production
   and/or Preview). **Redeploy** — `NEXT_PUBLIC_*` vars only apply to new builds.

## Verify

`/login` → "Email me a code" → enter a known account's email → you receive a
**6-digit code** (not a link) → enter it → lands on the role dashboard.

If you get a link instead, step 1 wasn't saved on that project (or you edited the
wrong template / wrong project).

## Notes

- Sign-in only for existing accounts (`shouldCreateUser: false`) — no signup, no
  profile capture. See [DEC-031](./DECISIONS.md).
- Turning the flag **off** (or unsetting it) instantly hides the feature again.
